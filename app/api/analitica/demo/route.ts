import { browserFunnelEvents } from "../../../../lib/analytics/demo-funnel";
import { orderIdPattern } from "../../../../lib/orders/display";
import { getCurrentAccount } from "../../../../lib/server/account";
import { getAppOrigin } from "../../../../lib/server/app-origin";
import { getOrderWriter } from "../../../../lib/server/supabase";

export async function POST(request: Request) {
  const writer = getOrderWriter();
  if (!writer) return new Response(null, { status: 204 });
  if (request.headers.get("origin") !== getAppOrigin()) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length")) > 256) return new Response(null, { status: 413 });
  let body: unknown;
  try {
    const payload = await request.text();
    if (payload.length > 256) return new Response(null, { status: 413 });
    body = JSON.parse(payload);
  } catch { return new Response(null, { status: 400 }); }
  if (!body || typeof body !== "object" || !("visit" in body) || typeof body.visit !== "string" || !orderIdPattern.test(body.visit)) {
    return new Response(null, { status: 400 });
  }
  const event = "kind" in body ? body.kind : null;
  const kind = browserFunnelEvents.find((entry) => entry === event);
  if (!kind) return new Response(null, { status: 400 });
  if (kind === "signin" && !await getCurrentAccount()) return new Response(null, { status: 401 });
  await writer.rpc("note_demo_funnel", { visit_id: body.visit, event_kind: kind }).abortSignal(AbortSignal.timeout(1500));
  return new Response(null, { status: 204 });
}
