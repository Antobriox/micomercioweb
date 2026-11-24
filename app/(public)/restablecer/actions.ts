"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { validNewPassword } from "../../../lib/account/credentials";
import { clearSessionCookies, recoveryCookieName, recoveryCookieOptions } from "../../../lib/server/auth-cookies";
import { getTransientSupabaseClient } from "../../../lib/server/supabase";

export async function changeRecoveredPassword(_last: string, fields: FormData): Promise<string> {
  const password = fields.get("password");
  if (!validNewPassword(password)) return "Usa al menos 12 caracteres y una contraseña que no supere 72 bytes.";
  if (password !== fields.get("repeatPassword")) return "Las contraseñas deben coincidir.";

  const store = await cookies();
  const token = store.get(recoveryCookieName)?.value;
  const client = getTransientSupabaseClient();
  if (!token || !client) return "La recuperación venció. Solicita otro enlace.";

  const refresh = await client.auth.refreshSession({ refresh_token: token });
  if (refresh.error || !refresh.data.session) return "La recuperación venció. Solicita otro enlace.";
  store.set(recoveryCookieName, refresh.data.session.refresh_token, recoveryCookieOptions());

  const { error } = await client.auth.updateUser({ password });
  if (error) return "No pudimos guardar la contraseña. Revisa los requisitos o solicita otro enlace.";

  await client.auth.signOut({ scope: "global" });
  store.set(recoveryCookieName, "", { ...recoveryCookieOptions(), maxAge: 0 });
  await clearSessionCookies();
  redirect("/acceso?restablecida=1");
}
