import { NextResponse, type NextRequest } from "next/server";

import { getCurrentAccount } from "../../../../lib/server/account";
import { getAppOrigin } from "../../../../lib/server/app-origin";
import { getAccountOrderReview } from "../../../../lib/server/order-review";
import { getOrderWriter } from "../../../../lib/server/supabase";

const keyPattern = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

function response(status: number, error: string) { return NextResponse.json({ error }, { status }); }
const found = (id: string, status = "pending") => NextResponse.json({ id, status, demo: true }, { headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return response(401, "Vuelve a iniciar sesión para consultar o enviar tu pedido.");
  if (request.headers.get("origin") !== getAppOrigin()) return response(403, "No se pudo verificar el origen de la solicitud.");

  let body: unknown;
  try { body = await request.json(); } catch { return response(400, "Solicitud inválida."); }
  if (typeof body !== "object" || body === null || !("key" in body) || typeof body.key !== "string" || !keyPattern.test(body.key)) {
    return response(400, "El intento de pedido no es válido.");
  }

  const { data: receipt, error: receiptError } = await account.client.from("orders").select("id,status")
    .eq("user_id", account.id).eq("request_key", body.key).maybeSingle();
  if (receiptError) return response(503, "No se pudo confirmar el estado del intento. Reintenta con el mismo pedido.");
  if (receipt) return found(receipt.id, receipt.status);
  if ("intent" in body && body.intent === "receipt") return response(404, "El intento aún no tiene un pedido registrado.");

  if (!("pickup" in body) || typeof body.pickup !== "string" || !("revision" in body) ||
    typeof body.revision !== "string" || !/^[a-f0-9]{64}$/.test(body.revision)) return response(400, "Revisa el total y selecciona una franja.");
  const pickup = /^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):(?:00|15|30|45))$/.exec(body.pickup);
  if (!pickup) return response(400, "Selecciona una franja del día.");

  const writer = getOrderWriter();
  if (!writer) return response(503, "El registro de pedidos de prueba no está disponible en este entorno.");
  const review = await getAccountOrderReview(account);
  if (review.state !== "available" || review.source !== "simulated") return response(503, "No se pudieron verificar los precios y existencias de demostración.");
  if (!review.valid || review.revision !== body.revision) {
    return response(409, "Tu carrito cambió. Vuelve a revisar el total antes de enviar.");
  }

  const { data, error } = await writer.rpc("submit_demo_order", {
    customer: account.id, operation: body.key, expected_revision: review.revision,
    requested_day: pickup[1], requested_time: pickup[2], current_quote: review.snapshot,
  });
  if (error?.code === "23505") return response(409, "Ya tienes un pedido activo.");
  if (error?.code === "42501") return response(401, "Tu cuenta no puede registrar el pedido.");
  if (error?.code === "23514") return response(409, error.message === "review_changed"
    ? "Tu carrito cambió. Vuelve a revisar el total antes de enviar."
    : "La franja ya no está disponible. El carrito sigue guardado.");
  if (error || typeof data !== "string") return response(503, "No se pudo confirmar el intento. Puedes reintentar sin duplicar el pedido.");
  return found(data);
}
