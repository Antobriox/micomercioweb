import type { Metadata } from "next";

import { CatalogGrid } from "../../../components/storefront/catalog-grid";
import { StorePage } from "../../../components/storefront/layout";
import { Notice, TextLink } from "../../../components/ui/primitives";
import { paginateCatalog } from "../../../lib/commercial/catalog";
import { storefrontCategoryLabel } from "../../../lib/commercial/editorial-category";
import { getStorefrontCatalog } from "../../../lib/server/commercial/storefront";

export const metadata: Metadata = { title: "Catálogo" };

export default async function CatalogPage({ searchParams }: {
  searchParams: Promise<{ categoria?: string | string[]; pagina?: string | string[] }>;
}) {
  const query = await searchParams;
  const category = typeof query.categoria === "string" ? query.categoria : undefined;
  const catalog = await getStorefrontCatalog();
  if (!("records" in catalog)) return (
    <StorePage title="Catálogo"><Notice tone="error">El catálogo no está disponible.</Notice><TextLink href="/catalogo">Volver a intentar</TextLink></StorePage>
  );

  const products = category ? catalog.records.filter(({ categoryId }) => categoryId === category) : catalog.records;
  const categories = Array.from(new Set(catalog.records.map(({ categoryId }) => categoryId)));
  const { records, page, pages } = paginateCatalog(products, query.pagina);
  const pageHref = (index: number) => ({ pathname: "/catalogo", query: { ...(category ? { categoria: category } : {}), pagina: index } });
  return (
    <StorePage title={category && categories.includes(category) ? storefrontCategoryLabel(catalog.records, category) : "Catálogo"}>
      <Notice>{catalog.state === "stale" ? "Datos de prueba desactualizados." : "Datos simulados de demostración."}</Notice>
      <nav aria-label="Categorías del catálogo" className="my-4 flex flex-wrap gap-x-4">
        <TextLink href="/catalogo" aria-current={!category ? "page" : undefined}>Todos los productos</TextLink>
        {categories.map((id) => (
          <TextLink key={id} href={{ pathname: "/catalogo", query: { categoria: id } }} aria-current={id === category ? "page" : undefined}>{storefrontCategoryLabel(catalog.records, id)}</TextLink>
        ))}
      </nav>
      {records.length ? <CatalogGrid products={records} simulated={catalog.source === "simulated"} /> :
        <p>No se encontraron productos en esta categoría.</p>}
      {pages > 1 && <nav aria-label="Páginas del catálogo" className="mt-5 flex flex-wrap items-center gap-4">
        {page > 1 && <TextLink href={pageHref(page - 1)}>Anterior</TextLink>}
        <span>Página {page} de {pages}</span>
        {page < pages && <TextLink href={pageHref(page + 1)}>Siguiente</TextLink>}
      </nav>}
    </StorePage>
  );
}
