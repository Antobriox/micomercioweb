import { connection } from "next/server";

import { StorePage } from "../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../components/ui/primitives";
import { operatingToday, operatingWeek, weekdays } from "../../../lib/server/operating";

export const metadata = { title: "Horarios" };

export default async function HoursPage() {
  await connection();
  const [today, week] = await Promise.all([operatingToday(), operatingWeek()]);
  return <StorePage title="Horarios">
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-xl font-bold">Horario habitual</h2>
        {week ? <dl className="divide-y divide-slate-200">{week.map((row) => <div key={row.day} className="py-2">
          <dt className="font-bold">{weekdays[row.day - 1]}</dt>
          <dd>Atención física · {row.store_open.slice(0, 5)}–{row.store_close.slice(0, 5)}</dd>
          <dd>Recepción web · {row.web_open.slice(0, 5)}–{row.web_close.slice(0, 5)}</dd>
        </div>)}</dl> : <Notice>El horario semanal publicado no se pudo consultar.</Notice>}
      </Card>
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Disponibilidad de hoy</h2>
        {today ? <>
          <Notice tone={today.accepting ? "info" : "warning"}>{today.accepting
            ? "La ventana de demostración está abierta."
            : "La recepción web está cerrada en este momento."}</Notice>
          {today.notice && <p>{today.notice}</p>}
          {today.web_open && today.web_close && <p>Ventana web de hoy · {today.web_open.slice(0, 5)}–{today.web_close.slice(0, 5)}</p>}
          {today.store_open && today.store_close && <p>Atención física · {today.store_open.slice(0, 5)}–{today.store_close.slice(0, 5)}</p>}
        </> : <Notice>La disponibilidad de hoy no se pudo consultar.</Notice>}
        <TextLink href="/catalogo">Explorar el catálogo</TextLink>
      </Card>
    </div>
  </StorePage>;
}
