"use server";

import { normalizedEmail } from "../../../lib/account/credentials";
import { getTransientSupabaseClient } from "../../../lib/server/supabase";

export interface VerificationState {
  status: "idle" | "invalid" | "sent" | "verified" | "unavailable";
  emailError?: string;
  codeError?: string;
  message?: string;
}

export async function verifyAccount(_previous: VerificationState, form: FormData): Promise<VerificationState> {
  const email = normalizedEmail(form.get("email"));
  const codeInput = form.get("code");
  const code = typeof codeInput === "string" ? codeInput.trim() : "";
  const resend = form.get("intent") === "resend";

  if (!email) {
    return { status: "invalid", emailError: "Escribe una dirección de correo válida." };
  }
  if (!resend && !/^\d{6}$/.test(code)) {
    return { status: "invalid", codeError: "Escribe el código de seis dígitos." };
  }

  const supabase = getTransientSupabaseClient();
  if (!supabase) return { status: "unavailable", message: "La verificación aún no está disponible en este entorno." };

  try {
    if (resend) {
      const { error } = await supabase.auth.resend({ email, type: "signup" });
      if (error?.status === 429) {
        return { status: "unavailable", message: "Espera antes de solicitar otro código." };
      }
      return { status: "sent", message: "Si el correo tiene una verificación pendiente, recibirás un código." };
    }

    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
    if (error?.status === 429) {
      return { status: "unavailable", message: "Se alcanzó el límite temporal de intentos. Vuelve a intentarlo más tarde." };
    }
    if (error || !data.user?.email_confirmed_at) {
      return { status: "invalid", codeError: "El código no es válido o ya venció. Revisa el correo o solicita uno nuevo." };
    }
    if (data.session) await supabase.auth.signOut({ scope: "local" });
    return { status: "verified" };
  } catch {
    return { status: "unavailable", message: "El servicio de verificación no está disponible. Intenta más tarde." };
  }
}
