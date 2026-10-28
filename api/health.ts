/// <reference path="../global.d.ts" />

import { json } from "./_lib/http";
import { redis, storeEnv } from "./_lib/store";

// GET /api/health · is the application store reachable (no secrets returned).

export const config = { runtime: "edge" };

export default async function handler(): Promise<Response> {
  const { base } = storeEnv();
  let host = "";
  try { host = new URL(base).hostname.replace(/^[^.]+/, "*"); } catch { /* unset or invalid */ }
  try {
    await redis([["PING"]]);
    return json({ ok: true, store: "ok", host });
  } catch (err) {
    return json({ ok: false, store: err instanceof Error ? err.message.slice(0, 120) : "error", host }, { status: 503 });
  }
}
