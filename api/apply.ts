/// <reference path="../global.d.ts" />

import { clientIp, requireSubmitUser } from "./_lib/auth";
import { json } from "./_lib/http";
import { checkSubmitRateLimit } from "./_lib/ratelimit";
import {
  AppRecord, Proposal, Result,
  getUserRecord, githubAccountAgeDays, loadProgram, mirrorToLedger, previewTestUser, saveRecord, takeIntakeSlot,
} from "./_lib/store";

// ============================================================================
//  POST /api/apply   ·  GPU application (v3)
// ----------------------------------------------------------------------------
//  kind = "proposal": a new application, or a revision when the last review
//                     asked for changes (same id, up to max_revisions).
//  kind = "result":   results after a passed proposal, to unlock full quota.
//  Every accepted submission joins the review queue drained by the local
//  AI reviewer, and counts against the daily intake cap.
// ============================================================================

export const config = { runtime: "edge" };

const URL_RE = /https?:\/\/[^\s]+/i;

function str(b: Record<string, unknown>, k: string): string {
  return typeof b[k] === "string" ? (b[k] as string).trim() : "";
}

function between(v: string, min: number, max: number): boolean {
  return v.length >= min && v.length <= max;
}

function isGitHubUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && /^(www\.)?github\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}

function bypassed(login: string, id: string): boolean {
  const list = (process.env.SUBMIT_RATE_LIMIT_BYPASS_GITHUB_LOGINS || "")
    .split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  return list.includes(login.toLowerCase()) || list.includes(id);
}

async function newId(seed: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, { status: 405 });

  let user = previewTestUser(req);
  if (!user) {
    const auth = await requireSubmitUser(req);
    if (auth.ok === false) return json({ ok: false, error: auth.error }, { status: auth.status });
    if (!auth.user) return json({ ok: false, error: "github sign-in required" }, { status: 401 });
    user = auth.user;
  }
  const ip = clientIp(req);

  const limited = await checkSubmitRateLimit(user, ip);
  if (limited.ok === false) return json({ ok: false, error: limited.error }, { status: limited.status });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return json({ ok: false, error: "invalid JSON body" }, { status: 400 });

  const program = await loadProgram(req);
  const L = program.limits;
  const now = Math.floor(Date.now() / 1000);
  const isBypass = bypassed(user.login, user.id);

  if (!isBypass) {
    const age = await githubAccountAgeDays(user.id);
    if (age === null) return json({ ok: false, error: "github_lookup_failed" }, { status: 503 });
    if (age < L.min_github_account_age_days) {
      return json({ ok: false, error: "github_account_too_new", min_days: L.min_github_account_age_days }, { status: 403 });
    }
  }

  const existing = await getUserRecord(user.id);
  const kind = str(body, "kind") === "result" ? "result" : "proposal";
  const details: string[] = [];

  if (kind === "result") {
    if (!existing || !["pass", "result_revise"].includes(existing.status)) {
      return json({ ok: false, error: "no_passed_application" }, { status: 409 });
    }
    if (existing.status === "result_revise" && existing.result_revisions >= L.max_revisions) {
      return json({ ok: false, error: "revision_limit_reached" }, { status: 409 });
    }
    const result: Result = {
      repo: str(body, "repo"),
      log: str(body, "log"),
      numbers: str(body, "numbers"),
      note: str(body, "note"),
    };
    if (!isGitHubUrl(result.repo) || result.repo.length > 300) details.push("repo");
    if (!URL_RE.test(result.log) || result.log.length > 300) details.push("log");
    if (!between(result.numbers, 10, 800)) details.push("numbers");
    if (result.note.length > 800) details.push("note");
    if (details.length) return json({ ok: false, error: "invalid", details }, { status: 422 });
    if (!(await takeIntakeSlot(L.daily_intake))) return json({ ok: false, error: "daily_intake_full" }, { status: 429 });

    const rec: AppRecord = {
      ...existing,
      status: "result_pending",
      result,
      result_revisions: existing.status === "result_revise" ? existing.result_revisions + 1 : existing.result_revisions,
      updated_at: now,
    };
    await saveRecord(rec, true);
    await mirrorToLedger(rec);
    return json({ ok: true, id: rec.id, status: rec.status });
  }

  // ---- proposal (new or revision)
  const active = new Set(program.directions.filter((d) => d.active).map((d) => d.id));
  const p: Proposal = {
    direction: str(body, "direction"),
    question: str(body, "question"),
    baseline: str(body, "baseline"),
    evaluation: str(body, "evaluation"),
    plan: str(body, "plan"),
    gpu_trial: Math.floor(Number(body.gpu_trial)),
    gpu_full: Math.floor(Number(body.gpu_full)),
    portfolio: str(body, "portfolio"),
    contact: str(body, "contact"),
  };
  if (!active.has(p.direction)) details.push("direction");
  if (!between(p.question, 10, 300)) details.push("question");
  if (!between(p.baseline, 10, 600) || !URL_RE.test(p.baseline)) details.push("baseline");
  if (!between(p.evaluation, 10, 600)) details.push("evaluation");
  if (!between(p.plan, 20, 1000)) details.push("plan");
  if (!(p.gpu_trial >= 1 && p.gpu_trial <= L.trial_gpu_hours_max)) details.push("gpu_trial");
  if (!(p.gpu_full >= p.gpu_trial && p.gpu_full <= L.full_gpu_hours_max)) details.push("gpu_full");
  if (!URL_RE.test(p.portfolio) || p.portfolio.length > 300) details.push("portfolio");
  if (!between(p.contact, 3, 100)) details.push("contact");
  if (details.length) return json({ ok: false, error: "invalid", details }, { status: 422 });

  let rec: AppRecord;
  if (existing && existing.status === "revise") {
    if (existing.revisions >= L.max_revisions) return json({ ok: false, error: "revision_limit_reached" }, { status: 409 });
    rec = { ...existing, proposal: p, status: "pending", revisions: existing.revisions + 1, updated_at: now };
  } else {
    if (existing && ["pending", "result_pending"].includes(existing.status)) {
      return json({ ok: false, error: "already_in_review" }, { status: 409 });
    }
    if (existing && ["pass", "result_revise"].includes(existing.status)) {
      return json({ ok: false, error: "submit_results_instead" }, { status: 409 });
    }
    if (existing && !isBypass && now - existing.created_at < L.new_application_every_days * 86400) {
      return json({ ok: false, error: "too_soon", days: L.new_application_every_days }, { status: 429 });
    }
    rec = {
      id: await newId(`${user.id}:${now}:${p.question}`),
      kind: "gpu-proposal",
      user: { id: user.id, login: user.login },
      created_at: now,
      updated_at: now,
      status: "pending",
      revisions: 0,
      result_revisions: 0,
      proposal: p,
      result: null,
      reviews: [],
    };
  }

  if (!(await takeIntakeSlot(L.daily_intake))) return json({ ok: false, error: "daily_intake_full" }, { status: 429 });
  await saveRecord(rec, true);
  await mirrorToLedger(rec);
  console.info(JSON.stringify({ event: "apply_accepted", id: rec.id, login: user.login, revision: rec.revisions }));
  return json({ ok: true, id: rec.id, status: rec.status });
}
