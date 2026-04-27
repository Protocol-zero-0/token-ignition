/// <reference path="../../global.d.ts" />

export async function triggerAudit(submissionId: string, submission: unknown): Promise<void> {
  const base = process.env.NANOBOT_PUBLIC_URL?.replace(/\/+$/, "");
  const secret = process.env.NANOBOT_TRIGGER_SECRET;
  if (!base || !secret) return;
  const url = `${base}/v1/audit/trigger`;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ submission_id: submissionId, submission }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  } catch {
    // Backend may be warming up. The audit receiver's pending sweep is the
    // safety net, so submit durability remains tied to the ledger write.
  }
}
