"use server";

import { revalidatePath } from "next/cache";
import { orderIdPattern } from "../../../../lib/orders/display";
import { getCurrentAccount } from "../../../../lib/server/account";
import { commercial } from "../../../../lib/server/commercial";
import { mediaBucket, uploadEditorialImage } from "../../../../lib/server/editorial-media";

export type EditorialResult = { message: string; issues?: string[]; ok?: boolean };
const failure = (message: string): EditorialResult => ({ message });
const value = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

function refreshCatalog(id?: string) {
  revalidatePath("/");
  revalidatePath("/catalogo");
  revalidatePath("/promociones");
  revalidatePath("/admin/catalogo");
  revalidatePath("/producto/[slug]", "page");
  if (id) revalidatePath(`/admin/catalogo/${encodeURIComponent(id)}`);
}

export async function updateEditorial(_previous: EditorialResult, form: FormData): Promise<EditorialResult> {
  const account = await getCurrentAccount();
  const role = await account?.client.rpc("is_administrator");
  if (!account || role?.data !== true) return failure("La edición requiere acceso de administración.");
  const { client } = account;
  const intent = value(form, "intent");
  if (intent === "category") {
    const slug = value(form, "slug");
    const title = value(form, "title");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80 || !title || title.length > 100) return failure("Revisa el nombre y la URL corta de la categoría.");
    const { error } = await client.from("editorial_categories").upsert({ slug, title, visible: form.has("visible") }, { onConflict: "slug" });
    if (error) return failure("No se pudo guardar la categoría.");
    refreshCatalog();
    return { message: "Categoría guardada.", ok: true };
  }

  const id = value(form, "product");
  const catalog = await commercial.getCatalog();
  const product = catalog.state === "available" ? catalog.records.find((entry) => entry.id === id) : undefined;
  if (!product) return failure("El producto ya no está disponible en la fuente comercial.");
  if (intent === "details") {
    const description = value(form, "description");
    const category = value(form, "category");
    if (description.length > 4000 || (category && !orderIdPattern.test(category))) return failure("Revisa la descripción y la categoría.");
    const { error } = await client.from("product_editorial").upsert({
      product_id: id, category_id: category || null, description: description || null,
      visible: form.has("visible"), featured: form.has("featured"),
    });
    if (error) return failure("No se pudo guardar la ficha editorial.");
    refreshCatalog(id);
    return { message: "Ficha editorial guardada.", ok: true };
  }

  const variant = value(form, "variant");
  const mediaId = value(form, "media");
  if (variant && !product.variants.some((entry) => entry.id === variant)) return failure("La presentación ya no existe en la fuente comercial.");
  if (intent === "remove" || intent === "edit") {
    if (!orderIdPattern.test(mediaId)) return failure("No se encontró la imagen.");
    const { data: existing } = await client.from("editorial_images").select("object_path")
      .eq("id", mediaId).eq("product_id", id).maybeSingle();
    if (!existing) return failure("No se encontró la imagen.");
    if (intent === "remove") {
      const { error } = await client.from("editorial_images").delete().eq("id", mediaId).eq("product_id", id);
      if (error) return failure("No se pudo retirar la imagen.");
      await client.storage.from(mediaBucket).remove([existing.object_path]);
      refreshCatalog(id);
      return { message: "Imagen retirada.", ok: true };
    }
    const alt = value(form, "alt-0");
    const position = Number(value(form, "position"));
    if (!alt || alt.length > 240 || !Number.isInteger(position) || position < 0 || position > 32767) return failure("Revisa el texto alternativo y el orden.");
    const file = form.get("image");
    const updated = file instanceof File && file.size > 0 ? await uploadEditorialImage(client, file) : null;
    if (updated?.error) return failure(updated.error);
    const { error } = await client.from("editorial_images").update({
      alt_text: alt, position, variant_id: variant || null, ...(updated?.path ? { object_path: updated.path } : {}),
    }).eq("id", mediaId).eq("product_id", id).eq("object_path", existing.object_path).select("id").single();
    if (error) {
      if (updated?.path) await client.storage.from(mediaBucket).remove([updated.path]);
      return failure("No se pudo actualizar la imagen. Vuelve a cargar la ficha.");
    }
    if (updated?.path) await client.storage.from(mediaBucket).remove([existing.object_path]);
    refreshCatalog(id);
    return { message: "Imagen actualizada.", ok: true };
  }

  if (intent !== "upload") return failure("Acción editorial desconocida.");
  const images = form.getAll("images").filter((file): file is File => file instanceof File && file.size > 0);
  if (!images.length || images.length > 8) return failure("Selecciona entre 1 y 8 imágenes.");
  const { error: editorialError } = await client.from("product_editorial")
    .upsert({ product_id: id }, { onConflict: "product_id", ignoreDuplicates: true });
  if (editorialError) return failure("No se pudo preparar la galería.");
  const issues: string[] = [];
  for (const [index, image] of images.entries()) {
    const label = `Imagen ${index + 1} (${image.name.slice(0, 80)})`;
    const alt = value(form, `alt-${index}`);
    if (!alt || alt.length > 240) { issues.push(`${label} · Escribe un texto alternativo de hasta 240 caracteres.`); continue; }
    const result = await uploadEditorialImage(client, image);
    if (!result.path) { issues.push(`${label} · ${result.error}`); continue; }
    const { error } = await client.from("editorial_images").insert({ product_id: id, variant_id: variant || null, alt_text: alt, object_path: result.path });
    if (error) {
      await client.storage.from(mediaBucket).remove([result.path]);
      issues.push(`${label} · No se pudo agregar a la galería.`);
    }
  }
  const saved = images.length - issues.length;
  if (saved) refreshCatalog(id);
  return { message: `Imágenes guardadas · ${saved} de ${images.length}.`, issues, ok: !issues.length };
}
