"use server";

import { revalidatePath } from "next/cache";
import { orderIdPattern } from "../../../../../lib/orders/display";
import { getCurrentAccount } from "../../../../../lib/server/account";

export async function advanceOrder(_previous: string, form: FormData) {
  const account = await getCurrentAccount();
  const id = form.get("order");
  const from = form.get("from");
  const to = form.get("to");
  if (!account || typeof id !== "string" || !orderIdPattern.test(id) ||
      typeof from !== "string" || typeof to !== "string") return "No se pudo actualizar el pedido.";
  const { error } = await account.client.rpc("advance_order", {
    target: id, expected: from, destination: to,
    demo_payment_checked: form.get("payment") === "on",
    demo_pickup_checked: form.get("pickup") === "on",
  });
  if (error) return error.code === "40001"
    ? "El pedido cambió en otra sesión. Actualiza la página y revisa su estado."
    : "No se pudo avanzar. Revisa el estado y las confirmaciones.";
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/cuenta/pedidos");
  revalidatePath(`/cuenta/pedidos/${id}`);
  return "";
}
