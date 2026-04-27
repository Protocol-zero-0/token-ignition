/// <reference path="../../global.d.ts" />

import { getSessionUser } from "../_lib/auth";
import { json } from "../_lib/http";

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const guardEnabled = process.env.SUBMIT_GUARD_ENABLED === "true";
  const configured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.SESSION_SECRET);
  const user = await getSessionUser(req).catch(() => null);
  return json({
    ok: true,
    guard_enabled: guardEnabled,
    configured,
    user: user ? { provider: user.provider, id: user.id, login: user.login, avatar_url: user.avatar_url } : null,
  });
}

