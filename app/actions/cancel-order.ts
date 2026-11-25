"use server";

import { revalidatePath } from "next/cache";
import { isActiveOrder, orderIdPattern } from "../../lib/orders/display";
import { getCurrentAccount } from "../../lib/server/account";

export async function cancelOrder(_last: string, form: FormData) {
  const account = await getCurrentAccount();
  const id = form.get("order");
  const status = form.get("status");
  const admin = form.get("admin") === "1";
  const rawReason = form.get("reason");
  const reason = typeof rawReason === "string" ? rawReason.trim() : "";
  if (!account || typeof id !== "string" || !orderIdPattern.test(id) ||
      typeof status !== "string" || !isActiveOrder(status)) return "No se pudo cancelar este pedido.";
  if (admin && (!reason || reason.length > 240)) return "Escribe un motivo de hasta 240 caracteres.";

  const { error } = await account.client.rpc("cancel_order", {
    target: id, expected: status, as_administrator: admin, rationale: admin ? reason : null,
  });
  if (error) return error.code === "40001"
    ? "El pedido cambió. Consulta el estado actual antes de intentar de nuevo."
    : "La cancelación no está disponible para este pedido.";
  revalidatePath(`/cuenta/pedidos/${id}`);
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
  return "";
}
