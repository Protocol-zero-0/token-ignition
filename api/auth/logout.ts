/// <reference path="../../global.d.ts" />

import { clearSessionCookie } from "../_lib/auth";
import { json } from "../_lib/http";

export const config = { runtime: "edge" };

export default async function handler(): Promise<Response> {
  return json({ ok: true }, {
    headers: {
      "set-cookie": clearSessionCookie(),
    },
  });
}
