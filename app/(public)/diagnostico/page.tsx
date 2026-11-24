import Link from "next/link";
import { connection } from "next/server";

import { commercial } from "../../../lib/server/commercial";
import { getDeploymentEnvironment, operation } from "../../../lib/server/environment";

export default async function Diagnostics() {
  await connection();
  const environment = getDeploymentEnvironment();
  const catalog = await commercial.getCatalog();

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-bold">Entorno de prueba</h1>
      <dl className="my-6 space-y-3 rounded-2xl bg-white p-6">
        <div><dt className="font-semibold">Entorno</dt><dd>{environment.label}</dd></div>
        <div><dt className="font-semibold">Modo</dt><dd>{operation.label}</dd></div>
        <div><dt className="font-semibold">Pedidos comerciales</dt><dd>Deshabilitados</dd></div>
      </dl>
      <section aria-labelledby="sample-title" className="my-6 space-y-2 rounded-2xl bg-white p-6">
        <h2 id="sample-title" className="text-xl font-bold">Catálogo de prueba</h2>
        {catalog.state === "available" || catalog.state === "stale" ? (
          <>
            <p>{catalog.source === "simulated" ? "Fuente simulada" : "Fuente Picking"}</p>
            <p>Consultado: <time dateTime={catalog.observedAt}>{catalog.observedAt}</time></p>
            {catalog.state === "stale" && <p>Datos desactualizados.</p>}
            <ul className="list-disc ps-5">
              {catalog.records.map((product) => <li key={product.id}>{product.name}</li>)}
            </ul>
          </>
        ) : (
          <p>{catalog.state === "empty" ? "Sin productos de prueba." : "Catálogo no disponible."}</p>
        )}
      </section>
      <Link href="/diagnostico/componentes" className="ui-link me-6">Ver componentes de prueba</Link>
      <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">Volver al inicio</Link>
    </main>
  );
}
