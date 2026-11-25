import Form from "next/form";
import { StorePage } from "../../../../components/storefront/layout";
import { Button, Card, Field, Notice } from "../../../../components/ui/primitives";
import { formatMoney, purchaseLimit } from "../../../../lib/commercial/catalog";
import { inventoryOverview } from "../../../../lib/commercial/reporting";
import { orderInstant } from "../../../../lib/orders/display";
import { requireAdministrator } from "../../../../lib/server/account";
import { commercial } from "../../../../lib/server/commercial";
import { getStorefrontCatalog } from "../../../../lib/server/commercial/storefront";

export default async function InventoryPage({ searchParams }: {
  searchParams: Promise<{ sku?: string; existencia?: string; limite?: string }>;
}) {
  await requireAdministrator();
  const { sku, existencia, limite } = await searchParams;
  const query = typeof sku === "string" ? sku.trim().slice(0, 100) : "";
  const filter = ["agotado", "bajo", "desconocido"].find((value) => value === existencia);
  const threshold = typeof limite === "string" && /^\d{1,6}$/.test(limite) ? Number(limite) : null;
  const [inventory, rawCatalog, publishedCatalog] = await Promise.all([
    commercial.getInventory("administrator"), commercial.getCatalog(), getStorefrontCatalog(),
  ]);
  const available = "records" in inventory;
  const metrics = inventoryOverview(available ? inventory.records : []);
  const known = "records" in rawCatalog ? rawCatalog.records : [];
  const publicVariants = "records" in publishedCatalog ?
    new Map(publishedCatalog.records.flatMap((product) => product.variants.map((variant) => [variant.id, variant] as const))) : null;
  const labels = new Map(known.flatMap((product) => product.variants.map((variant) =>
    [variant.id, `${product.name} · ${variant.presentation}`] as const)));
  const valid = (amount: number | null): amount is number => amount !== null && Number.isSafeInteger(amount) && amount >= 0;
  const display = [
    ...metrics.distinct.map((row) => ({ ...row, duplicate: false })),
    ...metrics.bad.map((variantId) => ({ variantId, quantity: null, unitCost: null, duplicate: true })),
  ].filter((row) => {
    if (query && !`${row.variantId} ${labels.get(row.variantId) ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
    const quantity = row.quantity;
    if (filter === "agotado") return quantity === 0;
    if (filter === "desconocido") return !valid(quantity);
    if (filter === "bajo") return valid(quantity) && quantity > 0 && threshold !== null && quantity <= threshold;
    return true;
  });
  return <StorePage title="Inventario" parents={[{ label: "Administración", href: "/admin" }]}>
    <Card className="mb-4 space-y-3">
      <Notice tone={inventory.state === "available" ? "info" : "warning"}>Inventario simulado de demostración.</Notice>
      {available && <p>Última actualización · {orderInstant(inventory.observedAt)}</p>}
      {inventory.state === "stale" && <Notice tone="warning">Los datos están desactualizados.</Notice>}
      <p>Valoración total · {metrics.valuation ? formatMoney(metrics.valuation) : "No disponible con costos o existencias incompletos."}</p>
      <p>Rotación · No disponible sin historial de existencias y movimientos.</p>
    </Card>
    <Card className="mb-4">
      <Form action="/admin/inventario" className="flex flex-wrap items-end gap-3" aria-label="Filtros de inventario">
        <Field id="inventory-sku" name="sku" label="SKU o presentación" maxLength={100} defaultValue={query} />
        <label className="font-semibold">Existencia
          <select name="existencia" className="ui-field mt-1" defaultValue={filter ?? ""}>
            <option value="">Todas</option><option value="agotado">Agotado</option><option value="bajo">Bajo</option>
            <option value="desconocido">No confirmado</option>
          </select>
        </label>
        <Field id="stock-limit" name="limite" label="Límite para stock bajo" type="number" min={0} max={999999} defaultValue={threshold ?? undefined} />
        <Button type="submit">Aplicar</Button>
      </Form>
    </Card>
    {filter === "bajo" && threshold === null && <Notice tone="warning">Indica el límite de unidades para consultar stock bajo.</Notice>}
    {!available ? <Notice tone="error">La fuente de inventario no está disponible.</Notice> :
      display.length === 0 ? <p>Sin presentaciones para estos filtros.</p> :
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {display.map((row) => {
          const variant = publicVariants?.get(row.variantId);
          const published = !publicVariants ? "No disponible" : !variant ? "Sin publicación" :
            publishedCatalog.state !== "available" ? "Sin confirmar" : purchaseLimit(variant) > 0 ? "Disponible" : "Sin disponibilidad";
          return <li key={row.variantId}><Card className="space-y-2">
            <h2 className="font-bold">{labels.get(row.variantId) ?? row.variantId}</h2>
            <p className="break-all text-sm">SKU · {row.variantId}</p>
            <p>Existencia · {row.duplicate ? "No confirmada, SKU duplicado" :
              valid(row.quantity) ? row.quantity === 0 ? "0 · Agotado" : `${row.quantity}${threshold !== null && row.quantity <= threshold ? " · Bajo" : ""}` : "No confirmada"}</p>
            <p>Disponibilidad publicada · {published}</p>
          </Card></li>;
        })}
      </ul>}
  </StorePage>;
}
