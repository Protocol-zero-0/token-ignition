/// <reference path="../global.d.ts" />

import { triggerAudit } from "./_lib/audit";
import { clientIp, requireSubmitUser } from "./_lib/auth";
import { checkSubmitRateLimit } from "./_lib/ratelimit";

// ============================================================================
//  POST /api/submit   ·  Token-Ignition submission endpoint (Vercel Edge)
// ----------------------------------------------------------------------------
//  1. validate the v0.2 submission protocol
//  2. hash the submission -> 12-char hex submission_id
//  3. write submissions/<id>.json to the ledger repo with verdict=pending
//  4. update submissions/index.json for frontend/admin polling
//  5. fire-and-forget trigger to the nanobot audit service when configured
//  6. return { submission_id, ledger_url } immediately
//
//  Required env vars (set in the Vercel project, not in code):
//    LEDGER_REPO             defaults to Protocol-zero-0/token-ignition-ledger
//    LEDGER_BRANCH           default: main
//    LEDGER_GITHUB_TOKEN     PAT with Contents:write on the ledger repo
//    ADMIN_TOKEN             enables encrypted contact storage and /admin login
//    CONTACT_ENCRYPTION_SECRET overrides ADMIN_TOKEN for contact encryption
//    NANOBOT_PUBLIC_URL      optional, e.g. https://ti-audit.your-domain.com
//    NANOBOT_TRIGGER_SECRET  optional shared secret (matches backend config.yaml)
//    SUBMIT_GUARD_ENABLED    optional: "true" enables GitHub auth + rate limit
//    GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / SESSION_SECRET
//    UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// ============================================================================

export const config = { runtime: "edge" };

type SubmitBody = {
  task: string;
  criterion: string;
  axes: string[];
  plan: string;
  endpoint: string;
  repo: string;
  baselineEndpoint: string;
  baselineRepo: string;
  contact: string;
};

const DEFAULT_LEDGER_REPO = "Protocol-zero-0/token-ignition-ledger";
const OLD_LEDGER_REPO = "billion-token-one-task/token-ignition-ledger";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env: ${name}`);
  return v;
}

function ledgerRepo(): string {
  const repo = process.env.LEDGER_REPO || DEFAULT_LEDGER_REPO;
  return repo === OLD_LEDGER_REPO ? DEFAULT_LEDGER_REPO : repo;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      ...(init.headers || {}),
    },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function encodeBase64(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

async function contactKey(): Promise<CryptoKey | null> {
  const secret = process.env.CONTACT_ENCRYPTION_SECRET || process.env.ADMIN_TOKEN;
  if (!secret) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt"]);
}

async function encryptContact(contact: string): Promise<string | undefined> {
  const key = await contactKey();
  if (!key) return undefined;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(contact)),
  );
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return bytesToBase64(packed);
}

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isGitHubRepo(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && /^(www\.)?github\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}

function validate(body: unknown): { ok: true; body: SubmitBody } | { ok: false; error: string; details?: string[] } {
  if (!body || typeof body !== "object") return { ok: false, error: "body must be JSON" };
  const b = body as Record<string, unknown>;
  const details: string[] = [];

  for (const k of ["task", "criterion", "plan", "endpoint", "repo", "baselineEndpoint", "baselineRepo", "contact"] as const) {
    const v = b[k];
    if (typeof v !== "string" || !v.trim()) details.push(`${k}_missing`);
  }
  const axes = Array.isArray(b.axes) ? b.axes.filter((x) => typeof x === "string") as string[] : [];
  const allowedAxes = new Set(["behavior", "knowledge", "scaffold"]);
  if (!axes.length) details.push("axes_missing");
  if (axes.some((x) => !allowedAxes.has(x))) details.push("axes_invalid");

  if (typeof b.endpoint === "string" && !isValidUrl(b.endpoint)) details.push("endpoint_invalid");
  if (typeof b.baselineEndpoint === "string" && !isValidUrl(b.baselineEndpoint)) details.push("baselineEndpoint_invalid");
  if (typeof b.repo === "string" && !isGitHubRepo(b.repo)) details.push("repo_not_github");
  if (typeof b.baselineRepo === "string" && !isGitHubRepo(b.baselineRepo)) details.push("baselineRepo_not_github");

  if (typeof b.task === "string" && b.task.length > 2000) details.push("task_too_long");
  if (typeof b.criterion === "string" && b.criterion.length > 1500) details.push("criterion_too_long");
  if (typeof b.plan === "string" && b.plan.length > 4000) details.push("plan_too_long");
  if (typeof b.endpoint === "string" && b.endpoint.length > 500) details.push("endpoint_too_long");
  if (typeof b.repo === "string" && b.repo.length > 500) details.push("repo_too_long");
  if (typeof b.baselineEndpoint === "string" && b.baselineEndpoint.length > 500) details.push("baselineEndpoint_too_long");
  if (typeof b.baselineRepo === "string" && b.baselineRepo.length > 500) details.push("baselineRepo_too_long");
  if (typeof b.contact === "string" && b.contact.length > 200) details.push("contact_too_long");

  if (details.length) return { ok: false, error: "invalid", details };

  return {
    ok: true,
    body: {
      task: (b.task as string).trim(),
      criterion: (b.criterion as string).trim(),
      axes: Array.from(new Set(axes.map((x) => x.trim()))),
      plan: (b.plan as string).trim(),
      endpoint: (b.endpoint as string).trim(),
      repo: (b.repo as string).trim(),
      baselineEndpoint: (b.baselineEndpoint as string).trim(),
      baselineRepo: (b.baselineRepo as string).trim(),
      contact: (b.contact as string).trim(),
    },
  };
}

async function writePendingToLedger(
  submissionId: string,
  body: SubmitBody,
  receivedAt: number,
): Promise<{ ok: boolean; html_url?: string; error?: string }> {
  const repo = ledgerRepo();
  const branch = process.env.LEDGER_BRANCH || "main";
  const token = env("LEDGER_GITHUB_TOKEN");

  const path = `submissions/${submissionId}.json`;
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
  const contactEncrypted = await encryptContact(body.contact);
  const { contact: _contact, ...publicSubmission } = body;

  const record = {
    submission_id: submissionId,
    hash: `0x${submissionId}`,
    status: "pending",
    verdict: "pending",
    gate: null,
    prompt_version: null,
    models_used: [],
    reasoning: "received, awaiting review",
    self_check: null,
    submission: {
      ...publicSubmission,
      contact_present: true,
      ...(contactEncrypted ? { contact_encrypted: contactEncrypted } : {}),
    },
    evidence: {},
    ts: receivedAt,
    updated_at: receivedAt,
    history: [{ status: "pending", verdict: "pending", gate: null, ts: receivedAt, source: "submit" }],
  };

  const encoded = encodeBase64(JSON.stringify(record, null, 2) + "\n");

  const headers = {
    "authorization": `Bearer ${token}`,
    "accept": "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "token-ignition-api/0.2",
    "content-type": "application/json",
  };

  const putBody = JSON.stringify({
    message: `pending · ${submissionId}`,
    content: encoded,
    branch,
  });

  const resp = await fetch(apiUrl, { method: "PUT", headers, body: putBody });
  if (resp.status !== 201 && resp.status !== 200) {
    return { ok: false, error: `github PUT failed: ${resp.status}` };
  }
  const data = (await resp.json()) as { content?: { html_url?: string } };
  await updateIndex(record, headers, branch, repo);
  return { ok: true, html_url: data.content?.html_url };
}

async function updateIndex(
  record: {
    submission_id: string;
    hash: string;
    status: string;
    verdict: string;
    ts: number;
    updated_at: number;
    submission: Omit<SubmitBody, "contact"> & { contact_present: boolean; contact_encrypted?: string };
  },
  headers: HeadersInit,
  branch: string,
  repo: string,
): Promise<void> {
  const path = "submissions/index.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
  const getResp = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });
  let sha: string | undefined;
  let rows: Array<Record<string, unknown>> = [];
  if (getResp.ok) {
    const meta = await getResp.json() as { sha?: string; content?: string };
    sha = meta.sha;
    if (meta.content) {
      try {
        rows = JSON.parse(decodeURIComponent(escape(atob(meta.content.replace(/\s/g, "")))));
      } catch {
        rows = [];
      }
    }
  }

  const row = {
    submission_id: record.submission_id,
    hash: record.hash,
    status: record.status,
    verdict: record.verdict,
    ts: record.ts,
    updated_at: record.updated_at,
    axes: record.submission.axes,
    repo: record.submission.repo,
    endpoint: record.submission.endpoint,
    baselineRepo: record.submission.baselineRepo,
    baselineEndpoint: record.submission.baselineEndpoint,
    task_excerpt: record.submission.task.slice(0, 180),
  };
  const next = [row, ...rows.filter((r) => r.submission_id !== record.submission_id)]
    .sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0));
  const payload: Record<string, unknown> = {
    message: `index · ${record.submission_id}`,
    content: encodeBase64(JSON.stringify(next, null, 2) + "\n"),
    branch,
  };
  if (sha) payload.sha = sha;
  const putResp = await fetch(apiUrl, { method: "PUT", headers, body: JSON.stringify(payload) });
  if (!putResp.ok) throw new Error(`github PUT ${path} failed: ${putResp.status}`);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, { status: 405 });

  const ip = clientIp(req);
  const auth = await requireSubmitUser(req);
  if (auth.ok === false) {
    console.info(JSON.stringify({
      event: "submit_blocked",
      reason: auth.error,
      ip,
      limited: false,
    }));
    return json({ ok: false, error: auth.error }, { status: auth.status });
  }

  if (auth.guardEnabled && auth.user) {
    const limited = await checkSubmitRateLimit(auth.user, ip);
    if (limited.ok === false) {
      console.info(JSON.stringify({
        event: "submit_rate_limited",
        userId: auth.user.id,
        ip,
        limited: limited.status === 429,
        dimension: limited.dimension,
      }));
      return json({ ok: false, error: limited.error }, { status: limited.status });
    }
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const v = validate(parsed);
  if (v.ok === false) return json({ ok: false, error: v.error, details: v.details || [] }, { status: 422 });

  const body = v.body;
  const now = Math.floor(Date.now() / 1000);

  const full = await sha256Hex(JSON.stringify({ ...body, ts: now }));
  const submissionId = full.slice(0, 12);

  let wrote: { ok: boolean; html_url?: string; error?: string };
  try {
    wrote = await writePendingToLedger(submissionId, body, now);
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : "ledger write failed" }, { status: 502 });
  }
  if (!wrote.ok) return json({ ok: false, error: wrote.error }, { status: 502 });

  const { contact: _contact, ...submission } = body;
  console.info(JSON.stringify({
    event: "submit_accepted",
    userId: auth.user?.id || null,
    ip,
    limited: false,
    submission_id: submissionId,
  }));
  void triggerAudit(submissionId, submission);

  return json({
    ok: true,
    submission_id: submissionId,
    hash: `0x${submissionId}`,
    status: "pending",
    ledger_url: wrote.html_url,
    message: "Audit queued. Watch the ledger for state transitions.",
  });
}
