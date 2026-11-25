import Link from "next/link";

import { availability } from "../../lib/commercial/catalog";
import type { Product } from "../../lib/commercial/contracts";
import { demoEditorial } from "../../lib/commercial/demo-editorial";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";

export function CatalogGrid({ products, simulated, returnUrl, headingLevel = 2 }: {
  products: readonly Product[];
  simulated: boolean;
  returnUrl?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const first = product.variants[0];
        const photo = product.editorial?.photos[0] ?? (simulated ? demoEditorial(product.id)?.photos[0] : undefined);
        return (
          <li key={product.id}>
            <article className="h-full rounded-2xl bg-white p-4 shadow-sm">
              <ProductImage photo={photo} sizes="(min-width: 1280px) 260px, (min-width: 640px) 42vw, 85vw" />
              <p className="mt-3 text-sm text-muted">{product.brand}</p>
              <Heading className="text-xl font-bold">
                <Link className="ui-link" href={{
                  pathname: `/producto/${encodeURIComponent(product.slug)}`,
                  query: returnUrl ? { volver: returnUrl } : {},
                }}>{product.name}</Link>
              </Heading>
              {first && <p className="text-sm text-muted">{first.presentation}{product.variants.length > 1 ? " · más presentaciones" : ""}</p>}
              <ProductPrice variant={first} className="mt-2" />
              <p className="text-sm text-muted">{first ? availability(first) : "Presentación no disponible"}</p>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
