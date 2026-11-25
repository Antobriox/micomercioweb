import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import type { CommercialRead, Product } from "../../commercial/contracts";
import type { CatalogPhoto } from "../../commercial/demo-editorial";
import { getTransientSupabaseClient } from "../supabase";
import { commercial } from "./index";

type EditorialRow = {
  product_id: string;
  visible: boolean;
  description: string | null;
  featured: boolean;
  category_slug: string | null;
  category_title: string | null;
  photos: { object_path: string; alt_text: string; variant_id: string | null }[];
};

export const getStorefrontCatalog = cache(async (): Promise<CommercialRead<Product>> => {
  const catalog = await commercial.getCatalog();
  const client = getTransientSupabaseClient();
  if (!client || !("records" in catalog) || !catalog.records.length) return catalog;
  await connection();

  const edits = new Map<string, EditorialRow>();
  for (let offset = 0; offset < catalog.records.length; offset += 100) {
    const ids = catalog.records.slice(offset, offset + 100).map(({ id }) => id);
    const { data, error } = await client.rpc("storefront_editorial", { product_ids: ids });
    if (error || !Array.isArray(data)) return { state: "unavailable", source: catalog.source } as const;
    for (const row of data as EditorialRow[]) edits.set(row.product_id, row);
  }

  const records = catalog.records.flatMap((product) => {
    const row = edits.get(product.id);
    if (!row) return [product];
    if (!row.visible) return [];
    const photos: CatalogPhoto[] = row.photos
      .filter((photo) => !photo.variant_id || product.variants.some(({ id }) => id === photo.variant_id))
      .map((photo) => ({ src: `/api/editorial/imagen/${encodeURIComponent(photo.object_path)}`, alt: photo.alt_text, variantId: photo.variant_id ?? undefined }));
    return [{
      ...product,
      categoryId: row.category_slug ? `editorial-${row.category_slug}` : product.categoryId,
      editorial: { categoryTitle: row.category_title, description: row.description, featured: row.featured, photos },
    }];
  });
  return { ...catalog, records, state: records.length ? catalog.state : "empty" as const };
});
