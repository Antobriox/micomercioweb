import Form from "next/form";
import { StorePage } from "../../../../components/storefront/layout";
import { Button, Card, Field, Notice, TextLink } from "../../../../components/ui/primitives";
import { formatMoney } from "../../../../lib/commercial/catalog";
import type { Money } from "../../../../lib/commercial/contracts";
import { reportPeriod, reportWindows, salesOverview } from "../../../../lib/commercial/reporting";
import { adminOrderStatuses } from "../../../../lib/orders/admin-filters";
import { orderInstant } from "../../../../lib/orders/display";
import { orderStatusLabel } from "../../../../lib/orders/status";
import { requireAdministrator } from "../../../../lib/server/account";
import { commercial } from "../../../../lib/server/commercial";

function displayMoney(value: Money | null) {
  if (!value) return "No disponible";
  if (value.amountInMinorUnits >= 0) return formatMoney(value);
  return `−${formatMoney({ ...value, amountInMinorUnits: -value.amountInMinorUnits })}`;
}

export default async function AnalyticsPage({ searchParams }: {
  searchParams: Promise<{ fecha?: string; periodo?: string; caja?: string; cajero?: string }>;
}) {
  const { client } = await requireAdministrator();
  const { fecha, periodo, caja, cajero } = await searchParams;
  const period = reportPeriod(fecha, periodo);
  const [orders, metrics, funnelData, sales, comparison] = await Promise.all([
    client.rpc("web_order_report", { period_start: period.selection.from, period_end: period.selection.before }),
    client.rpc("web_order_metrics", { period_start: period.selection.from, period_end: period.selection.before }),
    client.rpc("demo_funnel_report", { period_start: period.selection.from, period_end: period.selection.before }),
    commercial.getSales("administrator", period.selection),
    commercial.getSales("administrator", period.comparison),
  ]);
  const dateRange = `${period.from} hasta antes del ${period.before}`;
  const orderRows = Array.isArray(orders.data) ? orders.data as { status: string; amount: number }[] : [];
  const count = new Map(orderRows.map(({ status, amount }) => [status, Number(amount)]));
  const total = orderRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const journey = Array.isArray(metrics.data) ? metrics.data[0] as {
    attempts: number; accepted: number; preparation_count: number; preparation_median: number | null; preparation_p90: number | null;
  } | undefined : undefined;
  const funnel = Array.isArray(funnelData.data) ? funnelData.data[0] as {
    visits: number; carts: number; authenticated: number; accepted: number;
  } | undefined : undefined;
  const proportion = (count: number, total: number) => total ? `${count} de ${total}` : "Sin visitas en esta etapa";
  const percentage = (numerator: number, denominator: number) => `${Math.round(numerator * 100 / denominator)} %`;
  const records = "records" in sales ? sales.records : [];
  const registers = [...new Set(records.flatMap(({ register }) => register ? [register] : []))].sort();
  const cashiers = [...new Set(records.flatMap(({ cashier }) => cashier ? [cashier] : []))].sort();
  const register = registers.find((option) => caja === option);
  const cashier = cashiers.find((option) => cajero === option);
  const filters = (record: { register: string | null; cashier: string | null }) =>
    (!register || record.register === register) && (!cashier || record.cashier === cashier);
  const filtered = records.filter(filters);
  const current = salesOverview(filtered);
  const previous = "records" in comparison ? salesOverview(comparison.records.filter(filters)) : null;

  return <StorePage title="Analítica" parents={[{ label: "Administración", href: "/admin" }]}>
    <Card className="mb-4">
      <Form action="/admin/analitica" className="flex flex-wrap items-end gap-3" aria-label="Filtros de analítica">
        <Field id="period-date" name="fecha" label="Fecha de referencia" type="date" defaultValue={period.date} />
        <label className="font-semibold">Período
          <select name="periodo" className="ui-field mt-1" defaultValue={period.window}>
            {Object.entries(reportWindows).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="font-semibold">Caja
          <select name="caja" className="ui-field mt-1" defaultValue={register ?? ""} disabled={!registers.length}>
            <option value="">{registers.length ? "Todas" : "Dato no disponible"}</option>
            {registers.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="font-semibold">Cajero
          <select name="cajero" className="ui-field mt-1" defaultValue={cashier ?? ""} disabled={!cashiers.length}>
            <option value="">{cashiers.length ? "Todos" : "Dato no disponible"}</option>
            {cashiers.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <Button type="submit">Aplicar</Button>
      </Form>
      <p className="mt-3 text-sm text-muted">{dateRange} · Hora de Guayaquil</p>
    </Card>
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Pedidos web</h2>
        <p>Fuente · Registros web de demostración</p>
        {orders.error ? <Notice tone="error">No se pudieron consultar los pedidos.</Notice> :
          <dl className="grid grid-cols-2 gap-2">
            <dt>Total de pedidos</dt><dd className="font-bold">{total}</dd>
            {adminOrderStatuses.map((status) => <div key={status} className="contents">
              <dt>{orderStatusLabel(status)}</dt><dd>{count.get(status) ?? 0}</dd>
            </div>)}
            <dt>Tasa de entrega</dt><dd>{total ? percentage(count.get("delivered") ?? 0, total) : "Sin pedidos"}</dd>
            <dt>Tasa de cancelación</dt><dd>{total ? percentage(count.get("cancelled") ?? 0, total) : "Sin pedidos"}</dd>
            <dt>Conversión de envío</dt><dd>{journey?.attempts
              ? `${percentage(journey.accepted, journey.attempts)} · ${journey.accepted} aceptados / ${journey.attempts} intentos válidos`
              : metrics.error ? "No disponible" : "Sin intentos válidos"}</dd>
            <dt>Mediana y percentil 90 de preparación</dt><dd>{journey?.preparation_count
              ? `${journey.preparation_median} min / ${journey.preparation_p90} min · ${journey.preparation_count} pedidos`
              : metrics.error ? "No disponible" : "Sin preparaciones completas"}</dd>
          </dl>}
        <h3 className="font-bold">Conversión por visita de prueba</h3>
        {funnelData.error || !funnel ? <Notice tone="warning">No se pudo consultar la conversión por visita.</Notice> :
          <dl className="grid grid-cols-2 gap-2">
            <dt>Visita a carrito</dt><dd>{proportion(funnel.carts, funnel.visits)}</dd>
            <dt>Carrito a sesión verificada</dt><dd>{proportion(funnel.authenticated, funnel.carts)}</dd>
            <dt>Sesión a pedido enviado</dt><dd>{proportion(funnel.accepted, funnel.authenticated)}</dd>
          </dl>}
        <TextLink href="/admin/pedidos">Consultar pedidos</TextLink>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Ventas de caja</h2>
        <Notice tone={sales.state === "available" ? "info" : "warning"}>Datos simulados de demostración.</Notice>
        {"observedAt" in sales && <p>Última actualización · {orderInstant(sales.observedAt)}</p>}
        {sales.state === "stale" ? <Notice tone="warning">Datos desactualizados.</Notice> :
          sales.state === "unavailable" || sales.state === "forbidden" ? <Notice tone="error">La fuente de ventas no está disponible.</Notice> : null}
        {filtered.length ? <dl className="grid grid-cols-2 gap-2">
          <dt>Ventas registradas</dt><dd>{current.sales}</dd><dt>Devoluciones registradas</dt><dd>{current.returns}</dd>
          <dt>Venta bruta</dt><dd>{displayMoney(current.gross)}</dd>
          <dt>Devoluciones</dt><dd>{displayMoney(current.refunds)}</dd>
          <dt>Ventas netas</dt><dd className="font-bold">{displayMoney(current.net)}</dd>
          <dt>Ventas netas del período anterior</dt><dd>{displayMoney(previous?.net ?? null)}</dd>
          <dt>Ticket promedio</dt><dd>{displayMoney(current.ticket)}</dd>
          <dt>Hora pico</dt><dd>{current.peak === null ? "No disponible" : `${current.peak}:00`}</dd>
        </dl> : <p>Sin movimientos comerciales para el período y filtros seleccionados.</p>}
        <h3 className="font-bold">Presentaciones más vendidas</h3>
        {current.top ? <ul className="space-y-1">{current.top.map(([sku, quantity]) => <li key={sku}>{sku} · {quantity} unidades</li>)}</ul> :
          <p>Detalle por presentación no disponible.</p>}
      </Card>
    </div>
  </StorePage>;
}
