/// <reference path="../../../global.d.ts" />

import { clearStateCookie, createSessionCookie, type SessionUser, verifyState } from "../../_lib/auth";
import { appendCookie, redirect } from "../../_lib/http";

export const config = { runtime: "edge" };

type GitHubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GitHubUserResponse = {
  id?: number;
  login?: string;
  avatar_url?: string;
};

async function exchangeCode(code: string, redirectUri: string): Promise<string> {
  const resp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = await resp.json().catch(() => ({})) as GitHubTokenResponse;
  if (!resp.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "github token exchange failed");
  }
  return data.access_token;
}

async function fetchGitHubUser(token: string): Promise<SessionUser> {
  const resp = await fetch("https://api.github.com/user", {
    headers: {
      "authorization": `Bearer ${token}`,
      "accept": "application/vnd.github+json",
      "user-agent": "token-ignition-auth/0.2",
    },
  });
  const data = await resp.json().catch(() => ({})) as GitHubUserResponse;
  if (!resp.ok || !data.id || !data.login) throw new Error("github user fetch failed");
  return {
    provider: "github",
    id: String(data.id),
    login: data.login,
    avatar_url: data.avatar_url,
  };
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";

  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET || !process.env.SESSION_SECRET) {
    const headers = new Headers();
    appendCookie(headers, clearStateCookie());
    return new Response("GitHub auth is not configured", { status: 503, headers });
  }
  if (!code || !(await verifyState(req, state))) {
    const headers = new Headers();
    appendCookie(headers, clearStateCookie());
    return new Response("Invalid GitHub auth state", { status: 400, headers });
  }

  try {
    const redirectUri = new URL("/api/auth/github/callback", req.url).toString();
    const token = await exchangeCode(code, redirectUri);
    const user = await fetchGitHubUser(token);
    const headers = new Headers();
    appendCookie(headers, await createSessionCookie(user));
    return redirect("/#submit", headers);
  } catch (err) {
    const headers = new Headers();
    appendCookie(headers, clearStateCookie());
    return new Response(err instanceof Error ? err.message : "GitHub auth failed", { status: 502, headers });
  }
}
