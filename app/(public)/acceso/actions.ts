"use server";

import { redirect } from "next/navigation";

import { allowedPassword, loginDestination, normalizedEmail } from "../../../lib/account/credentials";
import { clearSessionCookies } from "../../../lib/server/auth-cookies";
import { getSupabaseClient } from "../../../lib/server/supabase";

const denial = "No pudimos iniciar sesión. Revisa tus datos o verifica tu correo.";

export async function logIn(_last: string, fields: FormData): Promise<string> {
  const email = normalizedEmail(fields.get("email"));
  const password = fields.get("password");
  if (!email || !allowedPassword(password)) return denial;

  const client = await getSupabaseClient({ writeCookies: true });
  if (!client) return "El acceso de prueba aún no está disponible en este entorno.";

  try {
    const login = await client.auth.signInWithPassword({ email, password });
    if (login.error || !login.data.user?.email_confirmed_at || !login.data.session) return denial;

    const { data, error } = await client.rpc("is_active_customer");
    if (error || data !== true) {
      await client.auth.signOut({ scope: "local" });
      await clearSessionCookies();
      return denial;
    }
  } catch {
    await clearSessionCookies();
    return denial;
  }
  redirect(loginDestination(fields.get("volver")));
}

export async function logOut() {
  const client = await getSupabaseClient({ writeCookies: true });
  try {
    await client?.auth.signOut({ scope: "local" });
  } finally {
    await clearSessionCookies();
  }
  redirect("/acceso");
}
