"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAccount } from "../../../../lib/server/account";
import { getStorefrontCatalog } from "../../../../lib/server/commercial/storefront";
import { mediaBucket, uploadEditorialImage } from "../../../../lib/server/editorial-media";
import { bannerDestination, bannerInstant } from "../../../../lib/editorial/banner";
import { orderIdPattern } from "../../../../lib/orders/display";

export async function saveBanner(_state: string, form: FormData) {
  const account = await getCurrentAccount();
  const role = await account?.client.rpc("is_administrator");
  if (!account || role?.data !== true) return "La edición requiere acceso de administración.";
  const { client } = account;
  const read = (name: string) => String(form.get(name) ?? "").trim();
  const id = read("id");
  const version = read("version");
  const title = read("title");
  const body = read("body");
  const alt = read("alt");
  const location = read("location");
  const link = read("destination");
  const start = bannerInstant(read("starts"));
  const end = bannerInstant(read("ends"));
  const position = Number(read("position"));
  if (!title || title.length > 120 || body.length > 400 || !alt || alt.length > 240 ||
      (location !== "home" && location !== "promotions") || !start || !end || end <= start ||
      !Number.isInteger(position) || position < 0 || position > 32767 || (id && !orderIdPattern.test(id))) {
    return "Revisa el texto, vigencia y orden de la pieza.";
  }

  const existing = id ? await client.from("banners").select("desktop_path,mobile_path,updated_at,destination")
    .eq("id", id).maybeSingle() : null;
  if (id && (!existing?.data || existing.data.updated_at !== version)) return "La pieza cambió. Actualiza la página antes de guardar.";
  if (link && (form.has("enabled") || link !== existing?.data?.destination)) {
    const catalog = await getStorefrontCatalog();
    if (!("records" in catalog) || !bannerDestination(link, catalog.records)) return "Elige un destino disponible en el catálogo.";
  }
  const paths = [existing?.data?.desktop_path, existing?.data?.mobile_path];
  const uploaded: string[] = [];
  for (const [index, name] of ["desktop", "mobile"].entries()) {
    const file = form.get(name);
    if (!(file instanceof File) || !file.size) {
      if (paths[index]) continue;
      if (uploaded.length) await client.storage.from(mediaBucket).remove(uploaded);
      return "Selecciona una imagen para escritorio y otra para móvil.";
    }
    const result = await uploadEditorialImage(client, file);
    if (!result.path) {
      if (uploaded.length) await client.storage.from(mediaBucket).remove(uploaded);
      return `${name === "desktop" ? "Imagen de escritorio" : "Imagen móvil"} · ${result.error}`;
    }
    paths[index] = result.path;
    uploaded.push(result.path);
  }

  const row = {
    title, body: body || null, alt_text: alt, location, destination: link || null, starts_at: start, ends_at: end,
    desktop_path: paths[0], mobile_path: paths[1], position, enabled: form.has("enabled"), updated_at: new Date().toISOString(),
  };
  const query = id ? client.from("banners").update(row).eq("id", id).eq("updated_at", version) : client.from("banners").insert(row);
  const { error } = await query.select("id").single();
  if (error) {
    if (uploaded.length) await client.storage.from(mediaBucket).remove(uploaded);
    return "No se pudo guardar la pieza. Consulta su estado e inténtalo de nuevo.";
  }

  const obsolete = [existing?.data?.desktop_path, existing?.data?.mobile_path]
    .filter((path): path is string => typeof path === "string" && !paths.includes(path));
  if (obsolete.length) await client.storage.from(mediaBucket).remove(obsolete);

  revalidatePath("/admin/banners");
  revalidatePath("/");
  revalidatePath("/promociones");
  return "Pieza guardada.";
}
