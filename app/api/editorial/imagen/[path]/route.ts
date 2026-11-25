import { getCurrentAccount } from "../../../../../lib/server/account";
import { editorialPath, mediaBucket } from "../../../../../lib/server/editorial-media";
import { getTransientSupabaseClient } from "../../../../../lib/server/supabase";

export async function GET(request: Request, context: { params: Promise<{ path: string }> }) {
  const { path } = await context.params;
  const client = getTransientSupabaseClient();
  if (!client || !editorialPath.test(path)) return new Response(null, { status: 404 });
  const adminPreview = new URL(request.url).searchParams.get("vista") === "administracion";
  const account = adminPreview ? await getCurrentAccount() : null;
  const role = await account?.client.rpc("is_administrator");
  const reader = role?.data === true && account ? account.client : client;
  const { data, error } = await reader.storage.from(mediaBucket).download(path);
  if (error || !data || data.size > 1_250_000) return new Response(null, { status: 404 });
  return new Response(data, {
    headers: { "Content-Type": "image/webp", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
