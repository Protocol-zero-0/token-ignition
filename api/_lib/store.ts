/// <reference path="../../global.d.ts" />

import type { SessionUser } from "./auth";

// Private application store (Upstash Redis) + public ledger mirror.
// Proposal text, contact and reviews live only in Redis. The public ledger
// gets the id, direction and status so the page can show activity.

export type Gate = { id: string; status: "pass" | "fail"; evidence: string; fix: string };

export type Review = {
  stage: "proposal" | "result";
  at: number;
  model: string;
  verdict: "pass" | "revise" | "reject";
  value: "high" | "medium" | "low";
  summary: string;
  gates: Gate[];
};

export type Proposal = {
  direction: string;
  question: string;
  baseline: string;
  evaluation: string;
  plan: string;
  gpu_trial: number;
  gpu_full: number;
  portfolio: string;
  contact: string;
};

export type Result = { repo: string; log: string; numbers: string; note: string };

export type Status =
  | "pending" | "revise" | "pass" | "reject"
  | "result_pending" | "result_revise" | "full" | "result_reject";

export type AppRecord = {
  id: string;
  kind: "gpu-proposal";
  user: { id: string; login: string };
  created_at: number;
  updated_at: number;
  status: Status;
  revisions: number;
  result_revisions: number;
  proposal: Proposal;
  result: Result | null;
  reviews: Review[];
};

export type Program = {
  limits: {
    daily_intake: number;
    new_application_every_days: number;
    max_revisions: number;
    min_github_account_age_days: number;
    trial_gpu_hours_max: number;
    full_gpu_hours_max: number;
  };
  directions: Array<{ id: string; active: boolean; zh: { title: string }; en: { title: string } }>;
  review_gates: Array<{ id: string }>;
};

export function ns(): string {
  return process.env.VERCEL_ENV === "production" ? "ti:v3" : "ti:v3preview";
}

export function isProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export async function redis(commands: Array<Array<string | number>>): Promise<Array<{ result?: unknown; error?: string }>> {
  const base = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) throw new Error("store not configured");
  const resp = await fetch(`${base}/pipeline`, {
    method: "POST",
    headers: { "authorization": `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(commands),
  });
  if (!resp.ok) throw new Error(`store http_${resp.status}`);
  const out = await resp.json() as Array<{ result?: unknown; error?: string }>;
  const err = out.find((r) => r.error);
  if (err) throw new Error(`store ${String(err.error).slice(0, 80)}`);
  return out;
}

export async function getRecord(id: string): Promise<AppRecord | null> {
  const [r] = await redis([["GET", `${ns()}:app:${id}`]]);
  return typeof r.result === "string" ? JSON.parse(r.result) as AppRecord : null;
}

export async function getUserRecord(userId: string): Promise<AppRecord | null> {
  const [r] = await redis([["GET", `${ns()}:user:${userId}`]]);
  return typeof r.result === "string" && r.result ? getRecord(r.result) : null;
}

export async function saveRecord(rec: AppRecord, queued: boolean): Promise<void> {
  const cmds: Array<Array<string | number>> = [
    ["SET", `${ns()}:app:${rec.id}`, JSON.stringify(rec)],
    ["SET", `${ns()}:user:${rec.user.id}`, rec.id],
  ];
  cmds.push(queued ? ["SADD", `${ns()}:queue`, rec.id] : ["SREM", `${ns()}:queue`, rec.id]);
  await redis(cmds);
}

export async function queueIds(): Promise<string[]> {
  const [r] = await redis([["SMEMBERS", `${ns()}:queue`]]);
  return Array.isArray(r.result) ? r.result.map(String) : [];
}

// Counts every accepted submission (new, revision or result) against the
// daily intake cap, because each one costs one AI review.
export async function takeIntakeSlot(limit: number): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${ns()}:intake:${day}`;
  const [incr] = await redis([["INCR", key], ["EXPIRE", key, 172800]]);
  return Number(incr.result || 0) <= limit;
}

export async function loadProgram(req: Request): Promise<Program> {
  const resp = await fetch(new URL("/config/program.json", req.url).toString(), { cache: "no-store" });
  if (!resp.ok) throw new Error(`program config http_${resp.status}`);
  return resp.json() as Promise<Program>;
}

function reviewerAuthed(req: Request): boolean {
  const token = process.env.REVIEWER_TOKEN;
  return Boolean(token) && (req.headers.get("authorization") || "") === `Bearer ${token}`;
}

// Preview-only: the reviewer token can act as a test applicant
// (header x-ti-test-user: "<github id>:<login>") so the flow can be tested
// end to end without GitHub OAuth. Never active in production.
export function previewTestUser(req: Request): SessionUser | null {
  if (isProduction() || !reviewerAuthed(req)) return null;
  const raw = req.headers.get("x-ti-test-user") || "";
  const [id, login] = raw.split(":");
  if (!/^\d+$/.test(id || "") || !login) return null;
  return { provider: "github", id, login };
}

export function adminAuthed(req: Request): boolean {
  if (reviewerAuthed(req)) return true;
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${token}`) return true;
  const cookie = req.headers.get("cookie") || "";
  return cookie.split(";").some((part) => {
    const [k, v] = part.trim().split("=");
    return k === "ti_admin" && decodeURIComponent(v || "") === token;
  });
}

// ---------------------------------------------------------------- ledger

const DEFAULT_LEDGER_REPO = "Protocol-zero-0/token-ignition-ledger";
const OLD_LEDGER_REPO = "billion-token-one-task/token-ignition-ledger";

function ledgerRepo(): string {
  const repo = process.env.LEDGER_REPO || DEFAULT_LEDGER_REPO;
  return repo === OLD_LEDGER_REPO ? DEFAULT_LEDGER_REPO : repo;
}

function encodeBase64(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

function decodeBase64(input: string): string {
  return decodeURIComponent(escape(atob(input.replace(/\s/g, ""))));
}

function ghHeaders(): HeadersInit {
  const token = process.env.LEDGER_GITHUB_TOKEN;
  if (!token) throw new Error("missing LEDGER_GITHUB_TOKEN");
  return {
    "authorization": `Bearer ${token}`,
    "accept": "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "token-ignition-api/0.3",
    "content-type": "application/json",
  };
}

async function getFile(path: string): Promise<{ sha?: string; json?: any }> {
  const branch = process.env.LEDGER_BRANCH || "main";
  const url = `https://api.github.com/repos/${ledgerRepo()}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const resp = await fetch(url, { headers: ghHeaders() });
  if (resp.status === 404) return {};
  if (!resp.ok) throw new Error(`github GET ${path} failed: ${resp.status}`);
  const meta = await resp.json() as { sha?: string; content?: string };
  return { sha: meta.sha, json: meta.content ? JSON.parse(decodeBase64(meta.content)) : null };
}

async function putFile(path: string, value: unknown, message: string, sha?: string): Promise<void> {
  const branch = process.env.LEDGER_BRANCH || "main";
  const url = `https://api.github.com/repos/${ledgerRepo()}/contents/${path}`;
  const payload: Record<string, unknown> = { message, content: encodeBase64(JSON.stringify(value, null, 2) + "\n"), branch };
  if (sha) payload.sha = sha;
  const resp = await fetch(url, { method: "PUT", headers: ghHeaders(), body: JSON.stringify(payload) });
  if (!resp.ok) throw new Error(`github PUT ${path} failed: ${resp.status}`);
}

// Best effort: Redis is the source of truth, the ledger is a public mirror.
// Only production writes to it, so previews never pollute the real ledger.
export async function mirrorToLedger(rec: AppRecord): Promise<void> {
  if (!isProduction()) return;
  try {
    const path = `submissions/${rec.id}.json`;
    const current = await getFile(path);
    const history = Array.isArray(current.json?.history) ? current.json.history : [];
    if (!history.length || history[history.length - 1].status !== rec.status) {
      history.push({ status: rec.status, ts: rec.updated_at });
    }
    const row = {
      submission_id: rec.id,
      hash: `0x${rec.id}`,
      kind: rec.kind,
      direction: rec.proposal.direction,
      status: rec.status,
      verdict: rec.status,
      ts: rec.created_at,
      updated_at: rec.updated_at,
    };
    await putFile(path, { ...row, history }, `${rec.status} · ${rec.id}`, current.sha);
    const idx = await getFile("submissions/index.json");
    const rows = Array.isArray(idx.json) ? idx.json : [];
    const next = [row, ...rows.filter((r: any) => r.submission_id !== rec.id)]
      .sort((a: any, b: any) => Number(b.ts || 0) - Number(a.ts || 0));
    await putFile("submissions/index.json", next, `index · ${rec.id}`, idx.sha);
  } catch (err) {
    console.error(JSON.stringify({ event: "ledger_mirror_failed", id: rec.id, error: err instanceof Error ? err.message : String(err) }));
  }
}

export async function githubAccountAgeDays(userId: string): Promise<number | null> {
  const resp = await fetch(`https://api.github.com/user/${encodeURIComponent(userId)}`, { headers: ghHeaders() });
  if (!resp.ok) return null;
  const data = await resp.json() as { created_at?: string };
  if (!data.created_at) return null;
  return (Date.now() - Date.parse(data.created_at)) / 86400000;
}
