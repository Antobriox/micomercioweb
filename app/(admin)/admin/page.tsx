import { StorePage } from "../../../components/storefront/layout";
import { OrderRefresh } from "../../../components/storefront/order-refresh";
import { Button, Card, Notice, TextLink } from "../../../components/ui/primitives";
import { orderInstant, pickupLabel } from "../../../lib/orders/display";
import { orderStatusLabel } from "../../../lib/orders/status";
import { commercial } from "../../../lib/server/commercial";
import { requireAdministrator } from "../../../lib/server/account";
import { logOut } from "../../(public)/acceso/actions";
import { OrderAlertSound } from "./order-alert-sound";

const statuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];
const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" });
const localTime = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Guayaquil", timeStyle: "medium", hourCycle: "h23" });

export default async function AdminPage() {
  const { client } = await requireAdministrator();
  const now = new Date();
  const today = localDate.format(now);
  const [summary, queue, slots, integration] = await Promise.all([
    client.rpc("daily_admin_orders", { target_day: today }),
    client.from("orders").select("id,created_at").eq("status", "pending")
      .order("created_at", { ascending: false }).order("id").limit(20),
    client.from("pickup_slots").select("id,service_date,starts_at,reserved,capacity,closed_reason")
      .eq("service_date", today).gte("starts_at", localTime.format(now)).order("starts_at"),
    commercial.getCatalog(),
  ]);
  const daily = Array.isArray(summary.data) ? summary.data as { status: string; amount: number }[] : [];
  const counts = new Map(daily.map(({ status, amount }) => [status, Number(amount)]));
  const upcoming = slots.data?.filter((slot) => slot.reserved > 0).slice(0, 6) ?? [];
  const full = slots.data?.filter((slot) => !slot.closed_reason && slot.capacity > 0 && slot.reserved === slot.capacity) ?? [];

  return <StorePage title="Administración">
    <OrderRefresh />
    <nav className="mb-5 flex flex-wrap gap-x-5" aria-label="Administración">
      <TextLink href="/admin/pedidos">Pedidos</TextLink>
      <TextLink href="/admin/clientes">Clientes</TextLink>
      <TextLink href="/admin/catalogo">Catálogo editorial</TextLink>
      <TextLink href="/admin/banners">Banners</TextLink>
      <TextLink href="/admin/contenido">Contenido del sitio</TextLink>
      <TextLink href="/admin/calendario">Calendario y horarios</TextLink>
    </nav>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Pedidos nuevos</h2>
        <p className="font-semibold" role="status">{queue.error ? "No se pudo consultar la cola de pedidos." :
          queue.data?.length === 1 ? "1 pendiente de confirmación" :
          queue.data?.length ? `${queue.data.length}${queue.data.length === 20 ? " o más" : ""} pendientes de confirmación` : "Sin pedidos nuevos."}</p>
        {!queue.error && <OrderAlertSound ids={queue.data?.map(({ id }) => id) ?? []} />}
        <ul className="divide-y divide-slate-200">
          {queue.data?.map(({ id, created_at }) => <li key={id} className="flex flex-wrap items-center justify-between gap-x-3">
            <TextLink href={`/admin/pedidos/${id}`}>Pedido {id.slice(0, 8).toUpperCase()}</TextLink>
            <time dateTime={created_at} className="text-sm text-muted">{orderInstant(created_at)}</time>
          </li>)}
        </ul>
        <TextLink href="/admin/pedidos?estado=pending">Ver cola de pedidos</TextLink>
      </Card>
      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 text-xl font-bold">Pedidos de hoy</h2>
          {summary.error ? <Notice tone="error">No se pudieron consultar los totales.</Notice> :
            <ul className="grid gap-2 sm:grid-cols-2">{statuses.map((status) => <li key={status}>
              <TextLink href={`/admin/pedidos?estado=${status}&fecha=${today}`}>{orderStatusLabel(status)} · {counts.get(status) ?? 0}</TextLink>
            </li>)}</ul>}
        </Card>
        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Próximos retiros</h2>
          {slots.error ? <Notice tone="error">No se pudieron consultar las franjas.</Notice> : <>
            {upcoming.length ? <ul className="space-y-2">{upcoming.map((slot) => <li key={slot.id}>
              {pickupLabel(slot.service_date, slot.starts_at)} · {slot.reserved} {slot.reserved === 1 ? "cupo ocupado" : "cupos ocupados"}
            </li>)}</ul> : <p>Sin retiros próximos registrados.</p>}
            <p>Próximas franjas completas · {full.length}</p>
          </>}
        </Card>
        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Integración, ventas e inventario</h2>
          <Notice tone="warning">Modo de demostración. Picking está pendiente de conexión. Pedidos comerciales deshabilitados.</Notice>
          <p>Catálogo de prueba · {integration.state === "available" ? "Vigente" : integration.state === "stale"
            ? "Desactualizado, envío suspendido" : integration.state === "empty" ? "Sin productos" : "No disponible"}.</p>
          {"observedAt" in integration && <p>Última lectura válida · {orderInstant(integration.observedAt)}</p>}
          <div className="flex flex-wrap gap-4">
            <TextLink href="/admin/analitica">Analítica de prueba</TextLink>
            <TextLink href="/admin/inventario">Inventario de prueba</TextLink>
          </div>
        </Card>
      </div>
    </div>
    <form action={logOut} className="mt-5"><Button type="submit" tone="secondary">Cerrar sesión</Button></form>
  </StorePage>;
}
