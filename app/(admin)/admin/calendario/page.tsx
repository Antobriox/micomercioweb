import { StorePage } from "../../../../components/storefront/layout";
import { Card, Field, Notice } from "../../../../components/ui/primitives";
import { orderInstant } from "../../../../lib/orders/display";
import { weekdays } from "../../../../lib/server/operating";
import { requireAdministrator } from "../../../../lib/server/account";
import { ScheduleForm } from "./schedule-form";

const times = [
  ["store_open", "Apertura física"], ["store_close", "Cierre físico"],
  ["web_open", "Apertura web"], ["web_close", "Cierre web"],
] as const;

function TimeFields({ prefix, values }: { prefix: string; values?: Record<string, string> }) {
  return <div className="grid gap-3 sm:grid-cols-2">
    {times.map(([name, label]) => <Field key={name} id={`${prefix}-${name}`} name={name} type="time"
      label={label} defaultValue={values?.[name]?.slice(0, 5)} required={!!values} />)}
  </div>;
}

export default async function CalendarPage() {
  const { client } = await requireAdministrator();
  const [week, exceptions, status, audit] = await Promise.all([
    client.from("operating_weekdays").select("*").order("day"),
    client.from("operating_exceptions").select("*").order("day").limit(30),
    client.from("operating_switch").select("paused,notice,default_capacity").eq("id", true).single(),
    client.from("audit_log").select("id,entity,entity_id,action,occurred_at")
      .in("entity", ["operating_switch","operating_weekdays","operating_exceptions","pickup_slots"])
      .not("actor_id", "is", null).order("occurred_at", { ascending: false }).limit(20),
  ]);
  return <StorePage title="Calendario y horarios" parents={[{ label: "Administración", href: "/admin" }]}>
    {(week.error || exceptions.error || status.error) && <Notice tone="error">No se pudo cargar el calendario.</Notice>}
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-xl font-bold">Pausa de pedidos</h2>
        <ScheduleForm area="Pausa de pedidos">
          <input type="hidden" name="intent" value="pause" />
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="closed" defaultChecked={status.data?.paused} /> Pausar recepción web</label>
          <Field id="pause-notice" name="notice" label="Aviso al cliente" maxLength={240} defaultValue={status.data?.notice ?? ""} />
        </ScheduleForm>
      </Card>
      <Card>
        <h2 className="mb-3 text-xl font-bold">Fecha especial</h2>
        <ScheduleForm area="Fecha especial">
          <input type="hidden" name="intent" value="exception" />
          <Field id="exception-day" name="day" type="date" label="Fecha" required />
          <Field id="exception-notice" name="notice" label="Aviso al cliente" maxLength={240} required />
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="closed" defaultChecked /> Cierre todo el día</label>
          <TimeFields prefix="special" />
        </ScheduleForm>
      </Card>
      <Card>
        <h2 className="mb-3 text-xl font-bold">Horario semanal</h2>
        {week.data?.map((entry) => <details key={entry.day} className="border-t border-slate-200 py-2">
          <summary className="cursor-pointer py-2 font-semibold">{weekdays[entry.day - 1]}</summary>
          <ScheduleForm area={weekdays[entry.day - 1]}>
            <input type="hidden" name="intent" value="weekday" />
            <input type="hidden" name="day" value={entry.day} />
            <TimeFields prefix={`day-${entry.day}`} values={entry} />
          </ScheduleForm>
        </details>)}
      </Card>
      <Card>
        <h2 className="mb-3 text-xl font-bold">Excepciones registradas</h2>
        {!exceptions.data?.length ? <p>No hay fechas especiales registradas.</p> :
          <ul className="space-y-3">{exceptions.data.map((entry) => <li key={entry.day}><time dateTime={entry.day}>{entry.day}</time> · {entry.notice}</li>)}</ul>}
        <div className="mt-4">
          <ScheduleForm area="Quitar excepción">
            <input type="hidden" name="intent" value="remove" />
            <Field id="remove-day" name="day" type="date" label="Fecha de excepción para quitar" required />
          </ScheduleForm>
        </div>
      </Card>
      <Card>
        <h2 className="mb-3 text-xl font-bold">Capacidad de retiro</h2>
        <ScheduleForm area="Capacidad de retiro">
          <input type="hidden" name="intent" value="capacity" />
          <Field id="pickup-default" name="capacity" label="Cupos por franja nueva" type="number"
            min={0} max={10000} step={1} defaultValue={status.data?.default_capacity ?? 0} required />
        </ScheduleForm>
      </Card>
      <Card>
        <h2 className="mb-3 text-xl font-bold">Ajustar una franja</h2>
        <ScheduleForm area="Ajustar una franja">
          <input type="hidden" name="intent" value="slot" />
          <Field id="pickup-date" name="day" type="date" label="Fecha" required />
          <Field id="pickup-time" name="store_open" type="time" label="Inicio de la franja" step={900} required />
          <Field id="pickup-capacity" name="capacity" label="Capacidad" type="number" min={0} max={10000} step={1} required />
          <label className="flex min-h-11 items-center gap-2"><input name="closed" type="checkbox" /> Cerrar esta franja</label>
          <Field id="pickup-notice" name="notice" label="Motivo de cierre" maxLength={240} />
        </ScheduleForm>
      </Card>
      <Card className="lg:col-span-2">
        <h2 className="mb-3 text-xl font-bold">Cambios recientes</h2>
        {audit.error ? <Notice tone="error">No se pudo consultar el registro de cambios.</Notice> :
          audit.data?.length ? <ul className="space-y-2">{audit.data.map((entry) => <li key={entry.id}>
            <time dateTime={entry.occurred_at}>{orderInstant(entry.occurred_at)}</time>
            {" · "}{entry.action === "INSERT" ? "Creación" : entry.action === "DELETE" ? "Eliminación" : "Actualización"}
            {" · "}{entry.entity === "operating_switch" ? "Configuración general" : entry.entity === "operating_weekdays"
              ? "Horario semanal" : entry.entity === "operating_exceptions" ? "Fecha especial" : "Franja de retiro"}
          </li>)}</ul> : <p>No hay cambios de administración registrados.</p>}
      </Card>
    </div>
  </StorePage>;
}
