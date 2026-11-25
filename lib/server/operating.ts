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

export const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

type OperatingHours = { day: number; store_open: string; store_close: string; web_open: string; web_close: string };
export async function operatingWeek(): Promise<OperatingHours[] | null> {
  const client = getTransientSupabaseClient();
  if (!client) return weekdays.map((_, index) => ({
    day: index + 1, store_open: index < 5 ? "06:00" : index === 5 ? "05:30" : "05:00",
    store_close: index === 6 ? "14:00" : "18:00", web_open: "07:00", web_close: index === 6 ? "13:00" : "17:00",
  }));
  const { data, error } = await client.rpc("public_operating_week");
  return !error && Array.isArray(data) ? data as OperatingHours[] : null;
}

export async function operatingToday(): Promise<OperatingDay | null> {
  const client = getTransientSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc("operating_at").maybeSingle()
    .overrideTypes<OperatingDay | null, { merge: false }>();
  return error ? null : data;
}
