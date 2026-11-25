"use server";

import { revalidatePath } from "next/cache";
import { orderIdPattern } from "../../../../lib/orders/display";
import { getCurrentAccount } from "../../../../lib/server/account";

export async function readNotification(_previous: string, form: FormData) {
  const id = form.get("notification");
  const account = await getCurrentAccount();
  if (!account || typeof id !== "string" || !orderIdPattern.test(id)) return "No se pudo marcar el aviso.";
  const { data, error } = await account.client.rpc("mark_order_notification_read", { target: id });
  if (error || data !== true) return "No se pudo marcar el aviso. Intenta nuevamente.";
  revalidatePath("/cuenta/notificaciones");
  revalidatePath("/cuenta");
  revalidatePath("/cuenta/pedidos");
  return "";
}
