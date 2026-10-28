/// <reference path="../../global.d.ts" />

import { json } from "../_lib/http";
import { adminAuthed, getRecord, queueIds } from "../_lib/store";

// GET /api/admin/queue · applications waiting for AI review (Bearer ADMIN_TOKEN).

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  if (!adminAuthed(req)) return json({ ok: false, error: "unauthorized" }, { status: 401 });
  const ids = await queueIds();
  const items = (await Promise.all(ids.slice(0, 100).map((id) => getRecord(id))))
    .filter((r) => r && ["pending", "result_pending"].includes(r.status))
    .sort((a, b) => a!.updated_at - b!.updated_at);
  return json({ ok: true, items });
}
