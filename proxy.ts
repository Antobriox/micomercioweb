import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName, sessionCookieOptions } from "./lib/server/auth-cookies";
import { getSupabaseConfig } from "./lib/server/supabase";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getSupabaseConfig();
  if (!config || !request.cookies.getAll().some(({ name }) => name === sessionCookieName ||
    name.startsWith(`${sessionCookieName}.`))) return response;

  const client = createServerClient(config.url, config.key, {
    cookieOptions: sessionCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) response.cookies.set(name, value, options);
      },
    },
  });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/cuenta/:path*", "/admin/:path*", "/acceso", "/carrito", "/pedido/:path*", "/producto/:path*", "/api/carrito/cuenta", "/api/pedidos/demo"] };
