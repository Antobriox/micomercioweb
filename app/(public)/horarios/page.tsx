import { connection } from "next/server";

import { StorePage } from "../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../components/ui/primitives";
import { operatingToday } from "../../../lib/server/operating";

export const metadata = { title: "Horarios" };

export default async function HoursPage() {
  await connection();
  const today = await operatingToday();
  return <StorePage title="Horarios">
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-xl font-bold">Horario habitual</h2>
        <ul className="space-y-2">
          <li>Lunes a viernes · 06:00–18:00</li>
          <li>Sábado · 05:30–18:00</li>
          <li>Domingo · 05:00–14:00</li>
        </ul>
        <p className="mt-3">Recepción web de lunes a sábado · 07:00–17:00. Domingo · 07:00–13:00.</p>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Disponibilidad de hoy</h2>
        {today ? <>
          <Notice tone={today.accepting ? "info" : "warning"}>{today.accepting
            ? "La ventana de demostración está abierta."
            : "La recepción web está cerrada en este momento."}</Notice>
          {today.notice && <p>{today.notice}</p>}
          {today.store_open && today.store_close && <p>Atención física · {today.store_open.slice(0, 5)}–{today.store_close.slice(0, 5)}</p>}
        </> : <Notice>La disponibilidad de hoy no se pudo consultar.</Notice>}
        <TextLink href="/catalogo">Explorar el catálogo</TextLink>
      </Card>
    </div>
  </StorePage>;
}
