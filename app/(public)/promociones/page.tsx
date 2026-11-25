import Form from "next/form";

import { CatalogGrid } from "../../../components/storefront/catalog-grid";
import { StorePage } from "../../../components/storefront/layout";
import { Button, Card, Notice, TextLink } from "../../../components/ui/primitives";
import { categoryName, purchaseLimit } from "../../../lib/commercial/catalog";
import { variantPricing } from "../../../lib/commercial/pricing";
import { commercial } from "../../../lib/server/commercial";

export const metadata = { title: "Promociones" };

export default async function PromotionsPage({ searchParams }: {
  searchParams: Promise<{ categoria?: string | string[]; soloDisponibles?: string | string[] }>;
}) {
  const { categoria, soloDisponibles } = await searchParams;
  const catalog = await commercial.getCatalog();
  if (!("records" in catalog)) return (
    <StorePage title="Promociones"><Notice tone="error">No se pudieron consultar las promociones.</Notice></StorePage>
  );
  const now = new Date();
  const offers = catalog.records.flatMap((product) => {
    const promoted = product.variants.filter((variant) => variantPricing(variant, now).offer);
    const representative = promoted.find((variant) => soloDisponibles !== "1" || purchaseLimit(variant) > 0);
    return representative ? [{ ...product, variants: [representative, ...product.variants.filter(({ id }) => id !== representative.id)] }] : [];
  });
  const categories = [...new Set(offers.map(({ categoryId }) => categoryId))];
  const products = typeof categoria === "string" && categoria ? offers.filter(({ categoryId }) => categoryId === categoria) : offers;
  return (
    <StorePage title="Promociones">
      <div className="mb-4 rounded-2xl bg-brand p-6 text-white">
        <p className="font-semibold">
          {catalog.state === "stale" ? "Promociones con datos de prueba desactualizados." : "Ofertas de demostración."}
        </p>
      </div>
      <Card className="mb-4">
        <Form action="/promociones" aria-label="Filtros de promociones" className="flex flex-wrap items-end gap-4">
          <label className="grid gap-1 font-semibold">Categoría
            <select name="categoria" className="ui-field" defaultValue={typeof categoria === "string" ? categoria : ""}>
              <option value="">Todas</option>
              {categories.map((id) => <option key={id} value={id}>{categoryName(id)}</option>)}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="soloDisponibles" value="1" defaultChecked={soloDisponibles === "1"} /> Solo disponibles
          </label>
          <Button type="submit">Aplicar</Button>
        </Form>
      </Card>
      {products.length ? <CatalogGrid products={products} simulated={catalog.source === "simulated"} /> :
        <Card><p>No hay promociones vigentes con esta selección.</p><TextLink href="/catalogo">Ver el catálogo</TextLink></Card>}
    </StorePage>
  );
}
