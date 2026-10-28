/// <reference path="../../global.d.ts" />

import { json } from "../_lib/http";
import { Gate, Review, Status, adminAuthed, getRecord, mirrorToLedger, saveRecord } from "../_lib/store";

// POST /api/admin/review · the AI reviewer writes its verdict back (Bearer ADMIN_TOKEN).
// body: { id, stage, verdict, value, summary, gates[], model }

export const config = { runtime: "edge" };

const NEXT: Record<"proposal" | "result", Record<Review["verdict"], Status>> = {
  proposal: { pass: "pass", revise: "revise", reject: "reject" },
  result: { pass: "full", revise: "result_revise", reject: "result_reject" },
};

function clip(v: unknown, n: number): string {
  return typeof v === "string" ? v.trim().slice(0, n) : "";
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, { status: 405 });
  if (!adminAuthed(req)) return json({ ok: false, error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null) as Record<string, any> | null;
  const id = String(b?.id || "").replace(/[^0-9a-f]/g, "");
  const stage = b?.stage === "result" ? "result" : "proposal";
  const verdict = ["pass", "revise", "reject"].includes(b?.verdict) ? b!.verdict as Review["verdict"] : null;
  const value = ["high", "medium", "low"].includes(b?.value) ? b!.value as Review["value"] : null;
  if (!id || !verdict || !value || !Array.isArray(b?.gates)) return json({ ok: false, error: "invalid" }, { status: 422 });

  const rec = await getRecord(id);
  if (!rec) return json({ ok: false, error: "not found" }, { status: 404 });
  const expected = stage === "result" ? "result_pending" : "pending";
  if (rec.status !== expected) return json({ ok: false, error: `status is ${rec.status}` }, { status: 409 });

  const gates: Gate[] = b!.gates.slice(0, 8).map((g: any) => ({
    id: clip(g?.id, 40),
    status: g?.status === "pass" ? "pass" : "fail",
    evidence: clip(g?.evidence, 400),
    fix: clip(g?.fix, 400),
  }));
  const now = Math.floor(Date.now() / 1000);
  const review: Review = { stage, at: now, model: clip(b?.model, 60), verdict, value, summary: clip(b?.summary, 600), gates };
  const next = { ...rec, status: NEXT[stage][verdict], reviews: [...rec.reviews, review], updated_at: now };
  await saveRecord(next, false);
  await mirrorToLedger(next);
  return json({ ok: true, status: next.status });
}
