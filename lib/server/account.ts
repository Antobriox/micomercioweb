import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { getSupabaseClient, getSupabaseConfig } from "./supabase";

export const getCurrentAccount = cache(async () => {
  const client = await getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email || !data.user.email_confirmed_at) return null;

  const { data: active, error: policyError } = await client.rpc("is_active_customer");
  if (policyError || active !== true) return null;
  return { client, id: data.user.id, email: data.user.email };
});

export async function requireAccount(returnTo = "/cuenta") {
  await connection();
  if (!getSupabaseConfig()) notFound();
  const account = await getCurrentAccount();
  if (!account) redirect(`/acceso?volver=${encodeURIComponent(returnTo)}`);
  return account;
}

export async function requireAdministrator() {
  const account = await requireAccount("/admin");
  const { data, error } = await account.client.rpc("is_administrator");
  if (error || data !== true) notFound();
  return account;
}
