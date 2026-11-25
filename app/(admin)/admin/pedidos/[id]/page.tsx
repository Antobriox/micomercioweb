import { notFound } from "next/navigation";
import { CancelOrderForm } from "../../../../../components/storefront/cancel-order-form";
import { StorePage } from "../../../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../../../components/ui/primitives";
import { formatMoney } from "../../../../../lib/commercial/catalog";
import { isActiveOrder, orderIdPattern, orderInstant, pickupLabel } from "../../../../../lib/orders/display";
import { orderStatusLabel } from "../../../../../lib/orders/status";
import { requireAdministrator } from "../../../../../lib/server/account";

import { AdvanceOrderForm } from "./advance-form";

type Event = { id: number; previous_status: string | null; next_status: string; reason: string | null; created_at: string };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { client } = await requireAdministrator();
  const { id } = await params;
  if (!orderIdPattern.test(id)) notFound();
  const { data: order, error } = await client.from("orders")
    .select("id,status,estimated_total_minor,currency,slot_id,user_id").eq("id", id).maybeSingle();
  if (!order && !error) notFound();
  const parents = [{ label: "Administración", href: "/admin" }, { label: "Pedidos", href: "/admin/pedidos" }];
  if (!order) return <StorePage title="Pedido" parents={parents}><Notice tone="error">No se pudo consultar el pedido.</Notice></StorePage>;

  const [slot, timeline, lines] = await Promise.all([
    client.from("pickup_slots").select("service_date,starts_at").eq("id", order.slot_id).maybeSingle(),
    client.rpc("admin_order_events", { target: id }),
    client.from("order_items").select("variant_id,product_name,presentation,unit,quantity").eq("order_id", id).order("product_name"),
  ]);
  const events = Array.isArray(timeline.data) ? timeline.data as Event[] : [];
  return <StorePage title="Pedido" parents={parents}>
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="space-y-3">
        <p role="status" className="font-bold text-brand">Estado · {orderStatusLabel(order.status)}</p>
        <p className="break-all">Pedido de prueba · {order.id}</p>
        <TextLink href={`/admin/clientes/${order.user_id}`}>Consultar cliente</TextLink>
        <p>Retiro · {slot.data ? pickupLabel(slot.data.service_date, slot.data.starts_at) : "Franja no disponible"}</p>
        <p>Total estimado · {formatMoney({ amountInMinorUnits: order.estimated_total_minor, currency: order.currency })}</p>
        <section aria-labelledby="order-lines">
          <h2 id="order-lines" className="font-bold">Artículos del pedido</h2>
          {lines.error ? <Notice tone="error">No se pudieron cargar los artículos.</Notice> :
            lines.data?.length ? <ul className="divide-y divide-slate-200">
              {lines.data.map((item) => <li key={item.variant_id} className="py-2">{item.quantity} × {item.product_name} · {item.presentation} ({item.unit})</li>)}
            </ul> : <p>Este pedido de prueba no tiene artículos registrados.</p>}
        </section>
        {(!lines.error || order.status === "ready") && <AdvanceOrderForm key={order.status} id={id} status={order.status} />}
        {isActiveOrder(order.status) && <CancelOrderForm id={id} status={order.status} admin />}
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-bold">Actividad</h2>
        {timeline.error ? <Notice tone="error">No se pudo cargar la actividad.</Notice> :
          events.length ? <ol className="space-y-3">{events.map((event) => <li key={event.id}>
            <p className="font-semibold">{event.previous_status && <>{orderStatusLabel(event.previous_status)} → </>}{orderStatusLabel(event.next_status)}</p>
            <time className="text-sm text-muted" dateTime={event.created_at}>{orderInstant(event.created_at)}</time>
            {event.reason && <p>{event.reason}</p>}
          </li>)}</ol> : <p>Aún no hay cambios registrados.</p>}
      </Card>
    </div>
  </StorePage>;
}
