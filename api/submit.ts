// ============================================================================
//  POST /api/submit   ·  Token-Ignition submission endpoint (Vercel Edge)
// ----------------------------------------------------------------------------
//  1. validate the 5 required fields
//  2. hash the submission -> 12-char hex submission_id
//  3. write submissions/<id>.json to the ledger repo with verdict=pending
//  4. fire-and-forget trigger to the nanobot audit service
//  5. return { submission_id, ledger_url } immediately
//
//  Required env vars (set in the Vercel project, not in code):
//    LEDGER_REPO             e.g. billion-token-one-task/token-ignition-ledger
//    LEDGER_BRANCH           default: main
//    LEDGER_GITHUB_TOKEN     PAT with Contents:write on the ledger repo
//    NANOBOT_PUBLIC_URL      e.g. https://ti-audit.your-domain.com
//    NANOBOT_TRIGGER_SECRET  shared secret (matches backend config.yaml)
// ============================================================================

export const config = { runtime: "edge" };

type SubmitBody = {
  task: string;
  criterion: string;
  plan: string;
  endpoint: string;
  contact: string;
  artifact_url?: string;
};

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env: ${name}`);
  return v;
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

function isValidUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validate(body: unknown): { ok: true; body: SubmitBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "body must be JSON" };
  const b = body as Record<string, unknown>;

  for (const k of ["task", "criterion", "plan", "endpoint", "contact"] as const) {
    const v = b[k];
    if (typeof v !== "string" || !v.trim()) return { ok: false, error: `missing or empty: ${k}` };
  }
  if (!isValidUrl(b.endpoint as string)) return { ok: false, error: "endpoint must be http(s) URL" };
  if (b.artifact_url && !isValidUrl(b.artifact_url as string))
    return { ok: false, error: "artifact_url must be http(s) URL if provided" };

  if ((b.task as string).length > 2000) return { ok: false, error: "task too long (>2000)" };
  if ((b.criterion as string).length > 1500) return { ok: false, error: "criterion too long (>1500)" };
  if ((b.plan as string).length > 4000) return { ok: false, error: "plan too long (>4000)" };
  if ((b.endpoint as string).length > 500) return { ok: false, error: "endpoint too long" };
  if ((b.contact as string).length > 200) return { ok: false, error: "contact too long" };

  return {
    ok: true,
    body: {
      task: (b.task as string).trim(),
      criterion: (b.criterion as string).trim(),
      plan: (b.plan as string).trim(),
      endpoint: (b.endpoint as string).trim(),
      contact: (b.contact as string).trim(),
      artifact_url: b.artifact_url ? (b.artifact_url as string).trim() : undefined,
    },
  };
}

async function writePendingToLedger(
  submissionId: string,
  body: SubmitBody,
  receivedAt: number,
): Promise<{ ok: boolean; html_url?: string; error?: string }> {
  const repo = env("LEDGER_REPO");
  const branch = process.env.LEDGER_BRANCH || "main";
  const token = env("LEDGER_GITHUB_TOKEN");

  const path = `submissions/${submissionId}.json`;
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  const record = {
    submission_id: submissionId,
    verdict: "pending",
    gate: null,
    prompt_version: null,
    models_used: [],
    reasoning: "received, awaiting gate.1 audit",
    self_check: null,
    submission: body,
    evidence: {},
    ts: receivedAt,
    history: [{ verdict: "pending", gate: null, ts: receivedAt }],
  };

  const encoded = btoa(
    unescape(encodeURIComponent(JSON.stringify(record, null, 2))),
  );

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
  return { ok: true, html_url: data.content?.html_url };
}

async function triggerAudit(submissionId: string, body: SubmitBody): Promise<void> {
  const base = env("NANOBOT_PUBLIC_URL").replace(/\/+$/, "");
  const secret = env("NANOBOT_TRIGGER_SECRET");
  const url = `${base}/v1/audit/trigger`;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ submission_id: submissionId, submission: body }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  } catch {
    // Audit service may be warming up — a cron over pending records is a
    // planned safety net for v0.2.1.
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, { status: 405 });

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const v = validate(parsed);
  if (!v.ok) return json({ ok: false, error: v.error }, { status: 400 });

  const body = v.body;
  const now = Math.floor(Date.now() / 1000);

  const full = await sha256Hex(
    [body.task, body.criterion, body.plan, body.endpoint, body.contact, String(now)].join("\n"),
  );
  const submissionId = full.slice(0, 12);

  const wrote = await writePendingToLedger(submissionId, body, now);
  if (!wrote.ok) return json({ ok: false, error: wrote.error }, { status: 502 });

  void triggerAudit(submissionId, body);

  return json({
    ok: true,
    submission_id: submissionId,
    status: "pending",
    ledger_url: wrote.html_url,
    message: "Audit queued. Watch the ledger for state transitions.",
  });
}
