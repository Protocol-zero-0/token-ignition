/// <reference path="../../global.d.ts" />

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

export function redirect(location: string, headers: HeadersInit = {}): Response {
  const next = new Headers(headers);
  next.set("location", location);
  next.set("cache-control", "no-store");
  return new Response(null, {
    status: 302,
    headers: next,
  });
}

export function appendCookie(headers: Headers, value: string): void {
  headers.append("set-cookie", value);
}
