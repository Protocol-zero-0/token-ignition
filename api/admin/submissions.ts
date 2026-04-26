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
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
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

function base64ToBytes(value: string): Uint8Array {
  const raw = atob(value);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function contactKey(): Promise<CryptoKey | null> {
  const secret = process.env.CONTACT_ENCRYPTION_SECRET || process.env.ADMIN_TOKEN;
  if (!secret) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["decrypt"]);
}

async function decryptContact(value?: string): Promise<string> {
  if (!value) return "";
  const key = await contactKey();
  if (!key) return "";
  const packed = base64ToBytes(value);
  const iv = packed.slice(0, 12);
  const cipher = packed.slice(12);
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch {
    return "";
  }
}

async function fetchJson(path: string): Promise<unknown | null> {
  const url = `https://raw.githubusercontent.com/${ledgerRepo()}/${process.env.LEDGER_BRANCH || "main"}/${path}`;
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) return null;
  return resp.json().catch(() => null);
}

export default async function handler(req: Request): Promise<Response> {
  if (!isAuthed(req)) return json({ ok: false, error: "unauthorized" }, { status: 401 });
  const index = await fetchJson("submissions/index.json");
  const rows = Array.isArray(index) ? index.slice(0, 200) as Array<Record<string, unknown>> : [];
  const items = await Promise.all(rows.map(async (row) => {
    const id = String(row.submission_id || "").replace(/[^0-9a-f]/g, "");
    const full = id ? await fetchJson(`submissions/${id}.json`) as Record<string, any> | null : null;
    const sub = full?.submission || {};
    return {
      ...row,
      id,
      contact: await decryptContact(sub.contact_encrypted),
      task: sub.task || row.task_excerpt || "",
      criterion: sub.criterion || "",
      plan: sub.plan || "",
      endpoint: sub.endpoint || row.endpoint || "",
      repo: sub.repo || row.repo || "",
      baselineEndpoint: sub.baselineEndpoint || row.baselineEndpoint || "",
      baselineRepo: sub.baselineRepo || row.baselineRepo || "",
      reasoning: full?.reasoning || "",
      history: full?.history || [],
    };
  }));
  return json({ ok: true, items });
}
