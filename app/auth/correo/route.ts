import { NextResponse, type NextRequest } from "next/server";

import { getAppOrigin } from "../../../lib/server/app-origin";
import { getSupabaseClient } from "../../../lib/server/supabase";

export async function GET(request: NextRequest) {
  const origin = getAppOrigin();
  if (!origin) return new NextResponse("Confirmación no disponible", { status: 503 });

  const code = request.nextUrl.searchParams.get("code");
  const hasError = request.nextUrl.searchParams.has("error");
  let status = hasError ? "invalido" : "pendiente";
  if (!hasError && code && /^[a-zA-Z0-9_-]{16,200}$/.test(code)) {
    const client = await getSupabaseClient({ writeCookies: true });
    const exchange = await client?.auth.exchangeCodeForSession(code);
    status = exchange?.data.session ? "confirmado" : "invalido";
  }
  const response = NextResponse.redirect(new URL(`/cuenta?correo=${status}`, origin));
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
