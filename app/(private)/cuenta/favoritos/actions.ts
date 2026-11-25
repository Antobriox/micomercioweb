"use server";

import { revalidatePath } from "next/cache";

import { getCurrentAccount } from "../../../../lib/server/account";
import { getStorefrontCatalog } from "../../../../lib/server/commercial/storefront";

export async function setFavorite(_previous: string, fields: FormData) {
  const account = await getCurrentAccount();
  if (!account) return "Vuelve a iniciar sesión para modificar tus favoritos.";
  const product = fields.get("product");
  const intent = fields.get("intent");
  if (typeof product !== "string" || product.length < 1 || product.length > 100 ||
    (intent !== "remove" && intent !== "save")) return "Producto no disponible.";

  if (intent === "save") {
    const catalog = await getStorefrontCatalog();
    if (!("records" in catalog) || !catalog.records.some(({ id }) => id === product)) {
      return "El producto ya no está disponible para guardar.";
    }
  }

  const table = account.client.from("favorites");
  const { error } = intent === "remove"
    ? await table.delete().eq("user_id", account.id).eq("product_id", product)
    : await table.upsert({ user_id: account.id, product_id: product }, {
      onConflict: "user_id,product_id", ignoreDuplicates: true,
    });
  if (error) return "No se guardó el cambio. Intenta nuevamente.";
  revalidatePath("/cuenta/favoritos");
  revalidatePath("/producto/[slug]", "page");
  return "";
}
