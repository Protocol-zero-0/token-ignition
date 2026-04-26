/// <reference path="../../global.d.ts" />

export const config = { runtime: "edge" };

const DEFAULT_LEDGER_REPO = "Protocol-zero-0/token-ignition-ledger";
const OLD_LEDGER_REPO = "billion-token-one-task/token-ignition-ledger";

function ledgerRepo(): string {
  const repo = process.env.LEDGER_REPO || DEFAULT_LEDGER_REPO;
  return repo === OLD_LEDGER_REPO ? DEFAULT_LEDGER_REPO : repo;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers || {}) },
  });
}

function isAuthed(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const cookie = req.headers.get("cookie") || "";
  return cookie.split(";").some((part) => {
    const [k, v] = part.trim().split("=");
    return k === "ti_admin" && decodeURIComponent(v || "") === token;
  });
}

function encodeBase64(input: string): string {
  return btoa(unescape(encodeURIComponent(input)));
}

function decodeBase64(input: string): string {
  return decodeURIComponent(escape(atob(input.replace(/\s/g, ""))));
}

function headers(): HeadersInit {
  const token = process.env.LEDGER_GITHUB_TOKEN;
  if (!token) throw new Error("missing LEDGER_GITHUB_TOKEN");
  return {
    "authorization": `Bearer ${token}`,
    "accept": "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "token-ignition-admin/0.2",
    "content-type": "application/json",
  };
}

async function getFile(path: string): Promise<{ sha?: string; json?: any }> {
  const branch = process.env.LEDGER_BRANCH || "main";
  const url = `https://api.github.com/repos/${ledgerRepo()}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const resp = await fetch(url, { headers: headers() });
  if (!resp.ok) throw new Error(`github GET failed: ${resp.status}`);
  const meta = await resp.json() as { sha?: string; content?: string };
  return { sha: meta.sha, json: meta.content ? JSON.parse(decodeBase64(meta.content)) : null };
}

async function putFile(path: string, value: unknown, message: string, sha?: string): Promise<void> {
  const branch = process.env.LEDGER_BRANCH || "main";
  const url = `https://api.github.com/repos/${ledgerRepo()}/contents/${path}`;
  const payload: Record<string, unknown> = {
    message,
    content: encodeBase64(JSON.stringify(value, null, 2) + "\n"),
    branch,
  };
  if (sha) payload.sha = sha;
  const resp = await fetch(url, { method: "PUT", headers: headers(), body: JSON.stringify(payload) });
  if (!resp.ok) throw new Error(`github PUT failed: ${resp.status}`);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, { status: 405 });
  if (!isAuthed(req)) return json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null) as { id?: string; status?: string; note?: string } | null;
  const id = String(body?.id || "").replace(/[^0-9a-f]/g, "");
  const status = String(body?.status || "");
  const allowed = new Set(["pending", "admitted", "verified", "rejected", "ignited"]);
  if (!id || !allowed.has(status)) return json({ ok: false, error: "invalid" }, { status: 422 });

  const now = Math.floor(Date.now() / 1000);
  const path = `submissions/${id}.json`;
  const current = await getFile(path);
  const record = current.json || {};
  record.status = status;
  record.verdict = status;
  record.updated_at = now;
  record.reasoning = body?.note || record.reasoning || `manual status: ${status}`;
  record.history = Array.isArray(record.history) ? record.history : [];
  record.history.push({ status, verdict: status, ts: now, source: "admin", note: body?.note || "" });
  await putFile(path, record, `${status} · ${id}`, current.sha);

  const idx = await getFile("submissions/index.json");
  const rows = Array.isArray(idx.json) ? idx.json : [];
  const next = rows.map((r: any) => r.submission_id === id
    ? { ...r, status, verdict: status, updated_at: now }
    : r);
  await putFile("submissions/index.json", next, `index · ${id}`, idx.sha);
  return json({ ok: true });
}
