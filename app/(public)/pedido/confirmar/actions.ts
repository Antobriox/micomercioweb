"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAccount } from "../../../../lib/server/account";
import { getAccountOrderReview } from "../../../../lib/server/order-review";

export type ReviewFeedback = { state: "accepted" | "changed" | "unavailable"; message: string };

export async function acceptReview(_last: ReviewFeedback | null, fields: FormData): Promise<ReviewFeedback> {
  const revision = fields.get("revision");
  const account = await getCurrentAccount();
  if (!account || typeof revision !== "string" || !/^[0-9a-f]{64}$/.test(revision)) {
    return { state: "unavailable", message: "Tu sesión o revisión ya no están disponibles. Vuelve a abrir el carrito." };
  }
  const current = await getAccountOrderReview(account);
  if (current.state !== "available") return { state: "unavailable", message: "No pudimos confirmar los precios y existencias actuales." };
  if (!current.valid || current.revision !== revision) {
    revalidatePath("/pedido/confirmar");
    return { state: "changed", message: "Cambió el precio, la cantidad o la disponibilidad. Revisa el resumen actualizado." };
  }
  const { error } = await account.client.from("order_reviews").upsert({
    user_id: account.id, revision, snapshot: current.snapshot, accepted_at: new Date().toISOString(),
  });
  if (error) return { state: "unavailable", message: "No se pudo guardar tu revisión. Las líneas siguen en el carrito." };
  revalidatePath("/pedido/confirmar");
  return { state: "accepted", message: "Aceptaste el total estimado." };
}
