/// <reference path="../../global.d.ts" />

export type SessionUser = {
  provider: "github";
  id: string;
  login: string;
  avatar_url?: string;
};

export type AuthCheck =
  | { ok: true; user: SessionUser | null; guardEnabled: boolean }
  | { ok: false; status: 401 | 403 | 503; error: string; guardEnabled: boolean };

const SESSION_COOKIE = "ti_session";
const STATE_COOKIE = "ti_oauth_state";
const SESSION_TTL_SEC = 60 * 60 * 24 * 30;
const STATE_TTL_SEC = 60 * 10;

function guardEnabled(): boolean {
  return process.env.SUBMIT_GUARD_ENABLED === "true";
}

function base64UrlEncode(bytes: Uint8Array): string {
  let raw = "";
  bytes.forEach((b) => (raw += String.fromCharCode(b)));
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function textBuffer(value: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(value);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

async function hmac(value: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("missing SESSION_SECRET");
  const key = await crypto.subtle.importKey(
    "raw",
    textBuffer(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, textBuffer(value));
  return base64UrlEncode(new Uint8Array(sig));
}

async function signed(value: string): Promise<string> {
  return `${value}.${await hmac(value)}`;
}

async function verifySigned(value: string): Promise<string | null> {
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return null;
  const body = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const expected = await hmac(body);
  return sig === expected ? body : null;
}

function cookieValue(req: Request, name: string): string | null {
  const cookie = req.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=") || "";
  }
  return null;
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function createSessionCookie(user: SessionUser): Promise<string> {
  const payload = {
    ...user,
    provider: "github",
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC,
  };
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const token = await signed(body);
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SEC}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const token = cookieValue(req, SESSION_COOKIE);
  if (!token) return null;
  const body = await verifySigned(decodeURIComponent(token)).catch(() => null);
  if (!body) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as SessionUser & { exp?: number };
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.provider !== "github" || !payload.id || !payload.login) return null;
    return {
      provider: "github",
      id: String(payload.id),
      login: String(payload.login),
      avatar_url: payload.avatar_url ? String(payload.avatar_url) : undefined,
    };
  } catch {
    return null;
  }
}

export async function requireSubmitUser(req: Request): Promise<AuthCheck> {
  const enabled = guardEnabled();
  if (!enabled) return { ok: true, user: null, guardEnabled: false };
  if (!process.env.SESSION_SECRET || !process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return { ok: false, status: 503, error: "submit guard not configured", guardEnabled: true };
  }
  const user = await getSessionUser(req);
  if (!user) return { ok: false, status: 401, error: "github sign-in required", guardEnabled: true };
  if (user.provider !== "github") return { ok: false, status: 403, error: "github identity required", guardEnabled: true };
  return { ok: true, user, guardEnabled: true };
}

export async function createStateCookie(state: string): Promise<string> {
  const token = await signed(state);
  return `${STATE_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_TTL_SEC}`;
}

export function clearStateCookie(): string {
  return `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function verifyState(req: Request, state: string): Promise<boolean> {
  const token = cookieValue(req, STATE_COOKIE);
  if (!token || !state) return false;
  const body = await verifySigned(decodeURIComponent(token)).catch(() => null);
  return body === state;
}

export function randomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return base64UrlEncode(bytes);
}
