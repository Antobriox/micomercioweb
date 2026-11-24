"use server";

import { validateRegistration, type RegistrationState } from "../../../lib/account/registration";
import { getTransientSupabaseClient } from "../../../lib/server/supabase";

const registrationError = "No pudimos completar el registro con esos datos. Revisa los datos ingresados o inténtalo más tarde.";

export async function registerAccount(_previous: RegistrationState, form: FormData): Promise<RegistrationState> {
  const result = validateRegistration(form);
  if (!result.ok) return { status: "invalid", errors: result.errors };

  const supabase = getTransientSupabaseClient();
  if (!supabase) return { status: "unavailable", message: "El registro de prueba aún no está disponible en este entorno." };

  const { email, password, ...profile } = result.data;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { web_registration: profile } },
    });
    if (error || !data.user || data.user.identities?.length === 0 || data.session) {
      if (data.session) await supabase.auth.signOut({ scope: "local" });
      return { status: "unavailable", message: registrationError };
    }
  } catch {
    return { status: "unavailable", message: registrationError };
  }
  return { status: "pending" };
}
