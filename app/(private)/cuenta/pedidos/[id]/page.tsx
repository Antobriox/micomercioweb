import { notFound } from "next/navigation";

import { AccountOrderPage } from "../../../../../components/storefront/account-order-page";
import { CancelOrderForm } from "../../../../../components/storefront/cancel-order-form";
import { OrderRefresh } from "../../../../../components/storefront/order-refresh";
import { Card, Notice } from "../../../../../components/ui/primitives";
import { lineEstimate } from "../../../../../lib/cart/estimate";
import { formatMoney } from "../../../../../lib/commercial/catalog";
import { isActiveOrder, orderIdPattern, orderInstant, pickupLabel } from "../../../../../lib/orders/display";
import { orderStatusLabel } from "../../../../../lib/orders/status";
import { requireAccount } from "../../../../../lib/server/account";
import { RepeatButton } from "./repeat-button";

export const metadata = { title: "Detalle de pedido" };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const account = await requireAccount();
  const { id } = await params;
  if (!orderIdPattern.test(id)) notFound();
  const { data: order, error } = await account.client.from("orders")
    .select("id,status,estimated_total_minor,currency,slot_id").eq("user_id", account.id).eq("id", id).maybeSingle();
  if (!order && !error) notFound();
  if (!order) return <AccountOrderPage title="Detalle de pedido" detail><Notice tone="error">No se pudo consultar el pedido.</Notice></AccountOrderPage>;

  const [lines, events, pickup] = await Promise.all([
    account.client.from("order_items").select("variant_id,product_name,presentation,quantity,unit_price_minor")
      .eq("order_id", order.id).order("product_name"),
    account.client.from("order_events").select("id,next_status,created_at").eq("order_id", order.id).order("id"),
    account.client.from("pickup_slots").select("service_date,starts_at").eq("id", order.slot_id).maybeSingle(),
  ]);
  return <AccountOrderPage title="Detalle de pedido" detail>
    <OrderRefresh active={isActiveOrder(order.status)} />
    <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <Card className="space-y-3">
        <div role="status" className="font-bold text-brand">Estado · {orderStatusLabel(order.status)}</div>
        <p>Pedido de prueba · {order.id.slice(0, 8).toUpperCase()}</p>
        <p>Retiro · {pickup.data ? pickupLabel(pickup.data.service_date, pickup.data.starts_at) : "Franja no disponible"}</p>
        {lines.error ? <Notice tone="error">No se pudieron consultar los artículos.</Notice> :
          <ul className="divide-y divide-slate-200">
            {lines.data?.map((item) => {
              const unitPrice = { amountInMinorUnits: item.unit_price_minor, currency: order.currency };
              return <li key={item.variant_id} className="py-3">
                <p className="font-semibold">{item.product_name}</p>
                <p>{item.presentation} · {item.quantity} × {formatMoney(unitPrice)}</p>
                <p>Subtotal · {formatMoney(lineEstimate(unitPrice, item.quantity))}</p>
              </li>;
            })}
          </ul>}
        <p className="font-bold">Total estimado · {formatMoney({ amountInMinorUnits: order.estimated_total_minor, currency: order.currency })}</p>
        <p>Pago y facturación exclusivamente en caja.</p>
        {(order.status === "pending" || order.status === "confirmed") && <CancelOrderForm id={id} status={order.status} />}
        {(order.status === "delivered" || order.status === "cancelled") && <RepeatButton id={id} />}
      </Card>
      <Card>
        <h2 className="mb-3 text-xl font-bold">Línea de tiempo</h2>
        {events.error ? <Notice tone="error">No se pudieron consultar los cambios de estado.</Notice> :
          events.data?.length ? <ol className="space-y-3 border-s-2 border-slate-200 ps-4">
            {events.data.map((event) => <li key={event.id}>
              <p className="font-semibold">{orderStatusLabel(event.next_status)}</p>
              <time className="text-sm text-muted" dateTime={event.created_at}>{orderInstant(event.created_at)}</time>
            </li>)}
          </ol> : <p>Aún no hay cambios registrados.</p>}
      </Card>
    </div>
  </AccountOrderPage>;
}
