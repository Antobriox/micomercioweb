import Form from "next/form";

import { CatalogGrid } from "../../../components/storefront/catalog-grid";
import { StorePage } from "../../../components/storefront/layout";
import { Button, Card, Field, Notice, TextLink } from "../../../components/ui/primitives";
import { categoryName, paginateCatalog } from "../../../lib/commercial/catalog";
import { parseFilters, searchAvailability, searchProducts, searchReturnUrl, type SearchParameters } from "../../../lib/commercial/search";
import { commercial } from "../../../lib/server/commercial";

export const metadata = { title: "Resultados de búsqueda" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParameters> }) {
  const params = await searchParams;
  const query = parseFilters(params);
  const catalog = await commercial.getCatalog();
  if (!("records" in catalog)) return (
    <StorePage title="Resultados de búsqueda"><Notice tone="error">La búsqueda no está disponible. Intenta más tarde.</Notice></StorePage>
  );
  const { matches, invalidRange } = searchProducts(catalog.records, query);
  const { page, pages, records } = paginateCatalog(matches, params.pagina);
  const categories = [...new Set(catalog.records.map(({ categoryId }) => categoryId))];
  const brands = [...new Set(catalog.records.map(({ brand }) => brand))];
  const linkFor = (index: number) => ({ pathname: "/buscar", query: { ...query, pagina: index } });
  return (
    <StorePage title="Resultados de búsqueda">
      <Notice>{catalog.state === "stale" ? "Datos de prueba desactualizados." : "Datos simulados de demostración."}</Notice>
      <Card className="my-5">
        <Form action="/buscar" aria-label="Filtros de productos" className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field id="results-query" name="q" label="Búsqueda" defaultValue={query.q} maxLength={100} />
          <label className="grid gap-1 font-semibold">Categoría
            <select name="categoria" className="ui-field font-normal" defaultValue={query.categoria}>
              <option value="">Todas</option>
              {categories.map((id) => <option key={id} value={id}>{categoryName(id)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 font-semibold">Marca
            <select name="marca" className="ui-field font-normal" defaultValue={query.marca}>
              <option value="">Todas</option>
              {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
            </select>
          </label>
          <label className="grid gap-1 font-semibold">Disponibilidad
            <select name="disponibilidad" className="ui-field font-normal" defaultValue={query.disponibilidad}>
              <option value="">Cualquiera</option>
              {searchAvailability.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <Field id="results-min" name="minimo" label="Precio mínimo (USD)" inputMode="decimal" defaultValue={query.minimo} maxLength={9} />
          <Field id="results-max" name="maximo" label="Precio máximo (USD)" inputMode="decimal" defaultValue={query.maximo} maxLength={9}
            error={invalidRange ? "Escribe un precio máximo mayor o igual al mínimo." : undefined} />
          <label className="grid gap-1 font-semibold">Ordenar
            <select name="orden" className="ui-field font-normal" defaultValue={query.orden}>
              <option value="relevancia">Relevancia</option>
              <option value="precio-asc">Menor precio</option>
              <option value="precio-desc">Mayor precio</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-x-3">
            <Button type="submit">Aplicar filtros</Button>
            <TextLink href={query.q ? { pathname: "/buscar", query: { q: query.q } } : "/buscar"}>Limpiar filtros</TextLink>
          </div>
        </Form>
      </Card>
      <p id="resultados" className="mb-4 scroll-mt-36 font-semibold">{matches.length} {matches.length === 1 ? "resultado" : "resultados"}</p>
      {records.length ? <CatalogGrid products={records} simulated={catalog.source === "simulated"} returnUrl={searchReturnUrl({ ...query, pagina: String(page) })} /> :
        <Card><p>No se encontraron productos para esta selección.</p><TextLink href="/catalogo">Ver todo el catálogo</TextLink></Card>}
      {pages > 1 && <nav aria-label="Páginas de resultados" className="mt-4 flex items-center gap-4">
        {page > 1 && <TextLink href={linkFor(page - 1)}>Anterior</TextLink>}
        <span>Página {page} de {pages}</span>
        {page < pages && <TextLink href={linkFor(page + 1)}>Siguiente</TextLink>}
      </nav>}
    </StorePage>
  );
}

