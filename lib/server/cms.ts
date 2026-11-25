import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { decodeCmsContent, type CmsSlug } from "../editorial/cms";
import { getTransientSupabaseClient } from "./supabase";

export const publishedPage = cache(async (slug: CmsSlug) => {
  const client = getTransientSupabaseClient();
  if (!client) return null;
  await connection();
  const { data, error } = await client.rpc("published_cms_page", { target: slug });
  return error ? null : decodeCmsContent(data);
});
