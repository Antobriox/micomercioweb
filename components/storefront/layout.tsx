import { Search, Store, UserRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { helpNavigation, mainNavigation } from "../../lib/navigation";
import { CartCount } from "./cart-count";
import { MobileNavigation } from "./mobile-navigation";

export function StoreHeader() {
  return (
    <>
      <a href="#contenido" className="fixed top-3 left-3 z-50 -translate-y-24 rounded-lg bg-white px-4 py-3 font-semibold text-brand shadow focus:translate-y-0">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-3 py-2 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-8">
          <div className="flex min-w-0 items-center gap-1">
            <MobileNavigation />
            <Link href="/" className="flex min-h-11 items-center gap-2 text-brand">
              <Store size={23} aria-hidden="true" className="hidden shrink-0 sm:block" />
              <span className="font-display text-sm leading-tight font-extrabold sm:text-lg lg:text-xl">Comisariato<br className="sm:hidden" /> Mi Comercio</span>
            </Link>
          </div>
          <form action="/buscar" role="search" aria-label="Catálogo" className="col-span-3 flex items-center gap-1 rounded-xl border border-border bg-white px-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
            <label htmlFor="global-search" className="sr-only">Buscar productos</label>
            <input id="global-search" type="search" name="q" placeholder="Buscar productos" maxLength={100}
              className="min-h-11 min-w-0 flex-1 rounded-lg bg-transparent px-2" />
            <button type="submit" aria-label="Buscar" className="grid min-h-11 min-w-11 place-items-center rounded-lg text-brand hover:bg-canvas">
              <Search size={20} aria-hidden="true" />
            </button>
          </form>
          <div className="col-start-3 row-start-1 flex items-center gap-1">
            <Link href="/acceso" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-2 font-semibold text-brand">
              <UserRound size={19} aria-hidden="true" /><span className="sr-only md:not-sr-only">Cuenta</span>
            </Link>
            <CartCount />
          </div>
        </div>
        <nav aria-label="Navegación principal" className="mx-auto hidden max-w-7xl gap-6 px-6 text-sm font-semibold text-brand lg:flex">
          {mainNavigation.map(({ href, label }) => (
            <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-sm hover:underline">{label}</Link>
          ))}
        </nav>
      </header>
    </>
  );
}

export function StoreFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-start sm:justify-between sm:px-8">
        <div>
          <p className="font-display text-lg font-extrabold text-brand">Comisariato Mi Comercio</p>
          <p className="mt-1 text-sm text-muted">Portoviejo, Manabí, Ecuador</p>
        </div>
        <nav aria-label="Información y ayuda" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {helpNavigation.map(({ href, label }) => <Link key={href} href={href} className="ui-link">{label}</Link>)}
        </nav>
      </div>
    </footer>
  );
}

export function Breadcrumbs({ links }: { links: readonly { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-5 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-2">
        <li><Link href="/" className="ui-link">Inicio</Link></li>
        {links.map(({ label, href }) => (
          <li key={label} className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {href ? <Link href={href} className="ui-link">{label}</Link> : <span aria-current="page">{label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function StorePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-[55vh] max-w-7xl px-5 py-8 sm:px-8">
      <Breadcrumbs links={[{ label: title }]} />
      <h1 className="mb-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      {children}
    </main>
  );
}
