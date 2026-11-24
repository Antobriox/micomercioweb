"use server";

import { normalizedEmail } from "../../../lib/account/credentials";
import { getAppOrigin } from "../../../lib/server/app-origin";
import { getSupabaseClient } from "../../../lib/server/supabase";

export async function sendRecovery(_last: boolean, fields: FormData): Promise<boolean> {
  const email = normalizedEmail(fields.get("email"));
  const origin = getAppOrigin();
  const client = await getSupabaseClient({ writeCookies: true });
  if (email && origin && client) {
    try {
      await client.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/recuperar` });
    } catch {
      // Show the same result for all addresses, including unavailable accounts.
    }
  }
  return true;
}
