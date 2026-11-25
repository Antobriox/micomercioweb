import { AccountOrderPage } from "../../../../components/storefront/account-order-page";
import { OrderRefresh } from "../../../../components/storefront/order-refresh";
import { Card, Notice, TextLink } from "../../../../components/ui/primitives";
import { formatMoney } from "../../../../lib/commercial/catalog";
import { activeOrderStatuses, completedOrderStatuses, orderInstant } from "../../../../lib/orders/display";
import { orderStatusLabel } from "../../../../lib/orders/status";
import { requireAccount } from "../../../../lib/server/account";

export const metadata = { title: "Mis pedidos" };

type Summary = { id: string; status: string; created_at: string; estimated_total_minor: number; currency: string };

function OrderSummary({ order }: { order: Summary }) {
  return <Card>
    <p className="font-bold text-brand">{orderStatusLabel(order.status)}</p>
    <p className="text-sm text-muted"><time dateTime={order.created_at}>{orderInstant(order.created_at)}</time></p>
    <p className="mt-1">Total estimado · {formatMoney({ amountInMinorUnits: order.estimated_total_minor, currency: order.currency })}</p>
    <TextLink href={`/cuenta/pedidos/${order.id}`}>Ver pedido {order.id.slice(0, 8).toUpperCase()}</TextLink>
  </Card>;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ pagina?: string | string[] }> }) {
  const account = await requireAccount();
  const { pagina } = await searchParams;
  const page = typeof pagina === "string" && /^\d{1,5}$/.test(pagina) ? Math.max(1, Number(pagina)) : 1;
  const offset = (page - 1) * 12;
  const columns = "id,status,created_at,estimated_total_minor,currency";
  const [active, history] = await Promise.all([
    account.client.from("orders").select(columns).eq("user_id", account.id).in("status", [...activeOrderStatuses]).maybeSingle(),
    account.client.from("orders").select(columns, { count: "exact" }).eq("user_id", account.id)
      .in("status", [...completedOrderStatuses]).order("created_at", { ascending: false }).order("id").range(offset, offset + 11),
  ]);
  const pages = Math.max(1, Math.ceil((history.count ?? 0) / 12));
  return <AccountOrderPage title="Mis pedidos">
    <OrderRefresh />
    <div className="space-y-5">
      {(active.error || history.error) && <Notice tone="error">No pudimos consultar todos tus pedidos.</Notice>}
      <section aria-labelledby="active-order">
        <h2 id="active-order" className="mb-3 text-xl font-bold">Pedido activo</h2>
        {active.data ? <OrderSummary order={active.data} /> :
          !active.error && <Card><p>No tienes un pedido activo.</p><TextLink href="/catalogo">Explorar catálogo</TextLink></Card>}
      </section>
      <section aria-labelledby="order-history">
        <h2 id="order-history" className="mb-3 text-xl font-bold">Historial</h2>
        {history.data?.length ? <ul className="grid gap-3 sm:grid-cols-2">{history.data.map((order) =>
          <li key={order.id}><OrderSummary order={order} /></li>)}</ul> :
          !history.error && <Card><p>No hay pedidos en esta página del historial.</p></Card>}
        {(pages > 1 || page > 1) && <nav aria-label="Páginas del historial" className="flex items-center gap-3">
          {page > 1 && <TextLink href={`/cuenta/pedidos?pagina=${Math.min(pages, page - 1)}`}>Anterior</TextLink>}
          <span>Página {page} de {pages}</span>
          {page < pages && <TextLink href={`/cuenta/pedidos?pagina=${page + 1}`}>Siguiente</TextLink>}
        </nav>}
      </section>
    </div>
  </AccountOrderPage>;
}
