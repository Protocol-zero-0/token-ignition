/// <reference path="../global.d.ts" />

import { getSessionUser } from "./_lib/auth";
import { json } from "./_lib/http";
import { getUserRecord, previewTestUser } from "./_lib/store";

// GET /api/my · the signed-in applicant's latest application and its reviews.

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const user = previewTestUser(req) || await getSessionUser(req).catch(() => null);
  if (!user) return json({ ok: false, error: "github sign-in required" }, { status: 401 });
  const rec = await getUserRecord(user.id);
  return json({ ok: true, application: rec });
}
