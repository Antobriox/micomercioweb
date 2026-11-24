"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { allowedPassword, normalizedEmail, validNewPassword } from "../../../lib/account/credentials";
import { normalizeMobile, validName } from "../../../lib/account/registration";
import { getCurrentAccount } from "../../../lib/server/account";
import { getAppOrigin } from "../../../lib/server/app-origin";
import { clearSessionCookies } from "../../../lib/server/auth-cookies";
import { getSupabaseClient, getTransientSupabaseClient } from "../../../lib/server/supabase";

export type ProfileFeedback = { message: string; ok: boolean };
const expired = { message: "Tu sesión no está disponible. Vuelve a iniciar sesión.", ok: false };
const failed = { message: "No pudimos guardar el cambio. Revisa los datos e inténtalo de nuevo.", ok: false };
const wrongPassword = { message: "No pudimos verificar la contraseña actual.", ok: false };
const read = (input: FormData, field: string) => {
  const value = input.get(field);
  return typeof value === "string" ? value : "";
};

async function verifyPassword(email: string, password: string) {
  const temporary = getTransientSupabaseClient();
  if (!temporary) return null;
  const response = await temporary.auth.signInWithPassword({ email, password });
  return response.error ? null : temporary;
}

export async function updateContact(_last: ProfileFeedback | null, fields: FormData): Promise<ProfileFeedback> {
  const account = await getCurrentAccount();
  if (!account) return expired;
  if (fields.has("nationalId") || fields.has("userId")) return failed;

  const given = read(fields, "givenNames").trim();
  const family = read(fields, "familyNames").trim();
  const mobile = normalizeMobile(read(fields, "mobile"));
  const version = read(fields, "version");
  if (!validName(given) || !validName(family) || !mobile || !Number.isFinite(Date.parse(version))) return failed;

  const { data, error } = await account.client.rpc("update_my_contact", {
    given, family, phone: mobile, expected_version: version,
  });
  if (error) return failed;
  if (data !== true) return { ok: false, message: "El perfil cambió en otra sesión. Recarga la página y revisa los datos." };
  revalidatePath("/cuenta");
  return { ok: true, message: "Datos de contacto actualizados." };
}

export async function requestEmailUpdate(_last: ProfileFeedback | null, fields: FormData): Promise<ProfileFeedback> {
  const account = await getCurrentAccount();
  if (!account) return expired;
  const password = fields.get("password");
  const email = normalizedEmail(fields.get("newEmail"));
  const origin = getAppOrigin();
  if (!email || email === account.email || !allowedPassword(password) || !origin) return failed;

  const proof = await verifyPassword(account.email, password);
  if (!proof) return wrongPassword;
  await proof.auth.signOut({ scope: "local" });

  const client = await getSupabaseClient({ writeCookies: true });
  if (!client) return expired;
  const { error } = await client.auth.updateUser({ email }, { emailRedirectTo: `${origin}/auth/correo` });
  if (error) return { ok: false, message: "No se pudo solicitar el cambio. Usa un correo distinto que puedas verificar." };

  return { ok: true, message: "Confirma el cambio mediante los enlaces enviados al correo actual y al nuevo." };
}

export async function updatePassword(_last: ProfileFeedback | null, fields: FormData): Promise<ProfileFeedback> {
  const account = await getCurrentAccount();
  if (!account) return expired;
  const current = fields.get("currentPassword");
  const next = fields.get("newPassword");
  if (!allowedPassword(current) || !validNewPassword(next) || next !== fields.get("repeatPassword") || next === current) {
    return { ok: false, message: "Usa una contraseña nueva de al menos 12 caracteres y confirma que ambas copias coincidan." };
  }
  const proof = await verifyPassword(account.email, current);
  if (!proof) return wrongPassword;

  const { error } = await proof.auth.updateUser({ password: next });
  if (error) {
    await proof.auth.signOut({ scope: "local" });
    return failed;
  }
  await proof.auth.signOut({ scope: "global" });
  await clearSessionCookies();
  redirect("/acceso?restablecida=1");
}
