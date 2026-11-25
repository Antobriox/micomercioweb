"use server";

import { revalidatePath } from "next/cache";
import { orderIdPattern } from "../../../../../lib/orders/display";
import { getCurrentAccount } from "../../../../../lib/server/account";

export async function updateCustomer(_previous: string, form: FormData) {
  const target = form.get("customer");
  const version = form.get("version");
  const operation = form.get("operation");
  const account = await getCurrentAccount();
  if (!account || typeof target !== "string" || !orderIdPattern.test(target) || typeof version !== "string" ||
      !Number.isFinite(Date.parse(version)) || (operation !== "suspend" && operation !== "resume")) {
    return "No se pudo actualizar la cuenta.";
  }
  const { error } = await account.client.rpc("admin_set_customer_disabled", {
    target, expected_version: version, disable: operation === "suspend",
  });
  if (error) return error.code === "40001"
    ? "Otra sesión cambió esta cuenta. Actualiza la página antes de volver a intentarlo."
    : "No se pudo actualizar la cuenta.";
  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${target}`);
  return "";
}
