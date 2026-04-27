/// <reference path="../../../global.d.ts" />

import { createStateCookie, randomState } from "../../_lib/auth";
import { redirect } from "../../_lib/http";

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const secret = process.env.GITHUB_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!clientId || !secret || !sessionSecret) {
    return new Response("GitHub auth is not configured", { status: 503 });
  }

  const state = randomState();
  const redirectUri = new URL("/api/auth/github/callback", req.url).toString();
  const auth = new URL("https://github.com/login/oauth/authorize");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("scope", "read:user");
  auth.searchParams.set("state", state);

  return redirect(auth.toString(), {
    "set-cookie": await createStateCookie(state),
  });
}

