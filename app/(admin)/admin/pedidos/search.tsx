"use client";

import { useActionState, useState } from "react";
import { Card, Field, Notice, TextLink } from "../../../../components/ui/primitives";
import { adminOrderStatuses, type parseAdminOrderFilters } from "../../../../lib/orders/admin-filters";
import { orderInstant, pickupLabel } from "../../../../lib/orders/display";
import { orderStatusLabel } from "../../../../lib/orders/status";
import { searchOrders, type AdminOrder, type SearchState } from "../search-actions";
import { SearchPager } from "../search-pager";

export function OrderSearch({ filters, initial }: {
  filters: ReturnType<typeof parseAdminOrderFilters>; initial: SearchState<AdminOrder>;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(filters.status ?? "");
  const [date, setDate] = useState(filters.date ?? "");
  const [slot, setSlot] = useState(filters.time ?? "");
  const [state, action, pending] = useActionState(searchOrders, initial);
  return <>
    <form action={action} className="mb-4 grid gap-3" role="search" aria-label="Búsqueda de pedidos">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field id="order-search" label="Pedido, cliente, cédula o correo" name="buscar" value={search}
          onChange={(event) => setSearch(event.target.value)} autoComplete="off" maxLength={254} />
        <label className="block font-semibold">Estado
          <select className="ui-field mt-1.5" name="estado" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>{adminOrderStatuses.map((name) => <option value={name} key={name}>{orderStatusLabel(name)}</option>)}
          </select>
        </label>
        <Field id="order-search-date" label="Fecha de retiro" type="date" name="fecha" value={date} onChange={(event) => setDate(event.target.value)} />
        <Field id="order-search-slot" label="Hora de retiro" type="time" step={900} name="franja" value={slot} onChange={(event) => setSlot(event.target.value)} />
      </div>
      <SearchPager page={state.page} hasNext={state.rows.length > 30} pending={pending} />
    </form>
    {state.error ? <Notice tone="error" announce>No se pudieron consultar los pedidos.</Notice> :
      <section aria-label="Resultados de pedidos" aria-busy={pending}>
        <p role="status" className="mb-3">{state.rows.length ? `Página ${state.page} · ${Math.min(30, state.rows.length)} pedidos` : "Sin pedidos para esta búsqueda."}</p>
        <ul className="grid gap-3 sm:grid-cols-2">{state.rows.slice(0, 30).map((order) => <li key={order.id}><Card className="space-y-2">
          <p className="font-bold">{orderStatusLabel(order.status)} · {order.customer_name}</p>
          <p>Retiro · {pickupLabel(order.service_date, order.starts_at)}</p>
          <p>Recibido · <time dateTime={order.created_at}>{orderInstant(order.created_at)}</time></p>
          <p><TextLink href={`/admin/pedidos/${order.id}`}>Ver pedido {order.id.slice(0, 8).toUpperCase()}</TextLink></p>
        </Card></li>)}</ul>
      </section>}
  </>;
}
