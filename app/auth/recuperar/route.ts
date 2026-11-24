import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { getAppOrigin } from "../../../lib/server/app-origin";
import { recoveryCookieName, recoveryCookieOptions } from "../../../lib/server/auth-cookies";
import { getSupabaseClient } from "../../../lib/server/supabase";

export async function GET(request: NextRequest) {
  const origin = getAppOrigin();
  if (!origin) return new NextResponse("Recuperación no disponible", { status: 503 });
  const code = request.nextUrl.searchParams.get("code");
  const client = await getSupabaseClient({ writeCookies: true, verifierOnly: true });
  let destination = "/recuperar?enlace=invalido";

  if (client && code && /^[a-zA-Z0-9_-]{16,200}$/.test(code)) {
    try {
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (!error && "redirectType" in data && data.redirectType === "recovery" && data.session?.refresh_token) {
        const store = await cookies();
        store.set(recoveryCookieName, data.session.refresh_token, recoveryCookieOptions());
        destination = "/restablecer";
      }
    } catch {
      // The generic invalid-link page covers an unavailable provider.
    }
  }

  const response = NextResponse.redirect(new URL(destination, origin));
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
