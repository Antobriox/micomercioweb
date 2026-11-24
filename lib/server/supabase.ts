import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { sessionCookieName, sessionCookieOptions } from "./auth-cookies";

function isPublishableKey(key: string) {
  if (key.startsWith("sb_publishable_") && key.length > 20) return true;
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  try {
    const claims: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof claims === "object" && claims !== null && "role" in claims && claims.role === "anon";
  } catch {
    return false;
  }
}

export function getSupabaseConfig() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!key || !isPublishableKey(key)) return null;
  try {
    const url = new URL(process.env.SUPABASE_URL ?? "");
    const local = url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "[::1]";
    if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    return { key, url: url.origin };
  } catch {
    return null;
  }
}

export function getTransientSupabaseClient() {
  const config = getSupabaseConfig();
  return config ? createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }) : null;
}

export async function getSupabaseClient({ writeCookies = false, verifierOnly = false }: {
  writeCookies?: boolean;
  verifierOnly?: boolean;
} = {}) {
  const config = getSupabaseConfig();
  if (!config) return null;

  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: sessionCookieOptions(),
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (entries) => {
        if (!writeCookies) return;
        for (const { name, value, options } of entries) {
          if (verifierOnly && !name.startsWith(`${sessionCookieName}-code-verifier`)) continue;
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
