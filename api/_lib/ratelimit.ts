/// <reference path="../../global.d.ts" />

import type { SessionUser } from "./auth";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; status: 429 | 503; error: string; dimension?: "user_minute" | "user_day" | "ip_minute" };

const USER_PER_MINUTE = 5;
const USER_PER_DAY = 30;
const IP_PER_MINUTE = 20;

type LimitSpec = {
  key: string;
  ttl: number;
  limit: number;
  dimension: "user_minute" | "user_day" | "ip_minute";
};

function redisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function redisPipeline(commands: Array<Array<string | number>>): Promise<Array<{ result?: unknown; error?: string }>> {
  const base = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) throw new Error("upstash redis not configured");
  const resp = await fetch(`${base}/pipeline`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!resp.ok) throw new Error(`upstash redis failed: ${resp.status}`);
  return resp.json();
}

function sanitizeKeyPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 160);
}

export async function checkSubmitRateLimit(user: SessionUser, ip: string): Promise<RateLimitResult> {
  if (!redisConfigured()) {
    return { ok: false, status: 503, error: "rate limit not configured" };
  }

  const now = Math.floor(Date.now() / 1000);
  const minute = Math.floor(now / 60);
  const day = new Date(now * 1000).toISOString().slice(0, 10);
  const uid = sanitizeKeyPart(user.id);
  const ipPart = sanitizeKeyPart(ip || "unknown");

  const specs: LimitSpec[] = [
    { key: `ti:submit:user:${uid}:m:${minute}`, ttl: 120, limit: USER_PER_MINUTE, dimension: "user_minute" },
    { key: `ti:submit:user:${uid}:d:${day}`, ttl: 172800, limit: USER_PER_DAY, dimension: "user_day" },
    { key: `ti:submit:ip:${ipPart}:m:${minute}`, ttl: 120, limit: IP_PER_MINUTE, dimension: "ip_minute" },
  ];

  const commands = specs.flatMap((spec) => [
    ["INCR", spec.key],
    ["EXPIRE", spec.key, spec.ttl],
  ]);

  let results: Array<{ result?: unknown; error?: string }>;
  try {
    results = await redisPipeline(commands);
  } catch {
    return { ok: false, status: 503, error: "rate limit unavailable" };
  }

  for (let i = 0; i < specs.length; i++) {
    const incr = results[i * 2];
    if (incr?.error) return { ok: false, status: 503, error: "rate limit unavailable" };
    const count = Number(incr?.result || 0);
    const spec = specs[i];
    if (count > spec.limit) {
      return { ok: false, status: 429, error: "rate limit exceeded", dimension: spec.dimension };
    }
  }

  return { ok: true };
}

