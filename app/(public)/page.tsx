import { ArrowRight, ShoppingBasket } from "lucide-react";
import Link from "next/link";

import { TextLink } from "../../components/ui/primitives";
import { operation } from "../../lib/server/environment";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 sm:py-12">
      <section aria-labelledby="home-title" className="grid items-center gap-5 rounded-3xl bg-white p-6 shadow-sm sm:p-12 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
        <div>
          <p className="font-semibold text-brand">{operation.label}</p>
          <h1 id="home-title" className="mt-3 text-4xl leading-tight font-extrabold tracking-tight sm:text-6xl">Comisariato Mi Comercio</h1>
          <p className="mt-4 text-lg text-muted">Portoviejo, Manabí, Ecuador</p>
          <p className="mt-5 max-w-prose text-muted">Este sitio utiliza datos de prueba. Los pedidos comerciales están deshabilitados.</p>
          <Link href="/catalogo" className="ui-action mt-6" data-tone="primary" data-size="large">
            Explorar catálogo <ArrowRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <div aria-hidden="true" className="hidden aspect-square max-h-80 place-items-center rounded-3xl bg-brand text-white md:grid">
          <ShoppingBasket size={106} strokeWidth={1.2} />
        </div>
      </section>
      <TextLink href="/diagnostico">Consultar entorno de prueba</TextLink>
    </main>
  );
}
