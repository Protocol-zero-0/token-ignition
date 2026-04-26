export const config = { runtime: "edge" };

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      ...(init.headers || {}),
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ ok: false, error: "method not allowed" }, { status: 405 });
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return json({ ok: false, error: "ADMIN_TOKEN is not configured" }, { status: 503 });

  const body = await req.json().catch(() => null) as { token?: string } | null;
  if (!body?.token || body.token !== expected) {
    return json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return json({ ok: true }, {
    headers: {
      "set-cookie": `ti_admin=${encodeURIComponent(body.token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
    },
  });
}
