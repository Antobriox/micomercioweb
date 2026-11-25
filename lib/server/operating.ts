import "server-only";

import { getTransientSupabaseClient } from "./supabase";

export type OperatingDay = {
  service_date: string;
  local_time: string;
  store_open: string | null;
  store_close: string | null;
  web_open: string | null;
  web_close: string | null;
  accepting: boolean;
  notice: string | null;
};

export async function operatingToday(): Promise<OperatingDay | null> {
  const client = getTransientSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc("operating_at").maybeSingle()
    .overrideTypes<OperatingDay | null, { merge: false }>();
  return error ? null : data;
}
