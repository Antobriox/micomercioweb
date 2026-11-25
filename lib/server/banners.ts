import "server-only";

import { connection } from "next/server";
import type { Banner } from "../editorial/banner";
import { getTransientSupabaseClient } from "./supabase";

export async function activeBanners(location: Banner["location"]): Promise<Banner[]> {
  const client = getTransientSupabaseClient();
  if (!client) return [];
  await connection();
  const { data } = await client.rpc("active_banners", { placement: location });
  return Array.isArray(data) ? data as Banner[] : [];
}
