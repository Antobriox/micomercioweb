"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { completedOrderStatuses, orderIdPattern } from "../../../../../lib/orders/display";
import { planRepeat } from "../../../../../lib/orders/repeat";
import { getCurrentAccount } from "../../../../../lib/server/account";
import { getStorefrontCatalog } from "../../../../../lib/server/commercial/storefront";

export async function repeatOrder(_previous: { ok: boolean; message: string } | null, fields: FormData) {
  const account = await getCurrentAccount();
  const id = fields.get("order");
  if (!account || typeof id !== "string" || !orderIdPattern.test(id)) return { ok: false, message: "El pedido no está disponible." };
  const { data: original } = await account.client.from("orders").select("id").eq("id", id)
    .eq("user_id", account.id).in("status", [...completedOrderStatuses]).maybeSingle();
  if (!original) return { ok: false, message: "El pedido no está disponible." };

  const [{ data: previous, error }, catalog] = await Promise.all([
    account.client.from("order_items").select("variant_id,quantity,product_name").eq("order_id", original.id),
    getStorefrontCatalog(),
  ]);
  if (error || !previous || catalog.state !== "available") return { ok: false, message: "No se pudo verificar el catálogo. Tu carrito sigue guardado." };
  const plan = planRepeat(previous, catalog.records);
  const lines = plan.flatMap(({ item }) => item ? [item] : []);
  const unavailable = plan.filter(({ item }) => !item).map(({ name }) => name).join(", ");
  if (!lines.length) return { ok: false, message: unavailable
    ? `No se pudieron incorporar las cantidades anteriores de ${unavailable}. Tu carrito sigue guardado.`
    : "Este pedido no tiene líneas que puedan repetirse." };

  const { error: writeError } = await account.client.rpc("repeat_order_into_cart", {
    original: original.id, operation: randomUUID(), incoming: lines,
  });
  if (writeError) return { ok: false, message: writeError.message === "active_order"
    ? "Ya tienes un pedido activo. Podrás repetir este pedido cuando termine."
    : "No pudimos preparar el carrito. Las líneas anteriores no se borraron." };
  revalidatePath("/carrito");
  return { ok: true, message: unavailable
    ? `Revisa tu carrito. No pudimos incorporar las cantidades anteriores de ${unavailable}.`
    : "Revisa tu carrito con los precios vigentes. Todavía no se ha enviado otro pedido." };
}
