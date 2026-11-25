"use client";

import { useActionState, useState } from "react";
import { Card, Field, Notice, TextLink } from "../../../../components/ui/primitives";
import { searchCustomers, type Customer, type SearchState } from "../search-actions";
import { SearchPager } from "../search-pager";

export function CustomerSearch({ initial }: { initial: SearchState<Customer> }) {
  const [query, setQuery] = useState("");
  const [state, action, pending] = useActionState(searchCustomers, initial);
  return <>
    <form action={action} className="mb-4 grid max-w-xl gap-3" role="search" aria-label="Búsqueda de clientes">
      <Field id="customer-search" name="buscar" label="Nombre, cédula o correo" value={query}
        onChange={(event) => setQuery(event.target.value)} autoComplete="off" maxLength={254} />
      <SearchPager page={state.page} hasNext={state.rows.length > 30} pending={pending} />
    </form>
    {state.error ? <Notice tone="error" announce>No se pudo consultar la lista.</Notice> :
      <section aria-label="Resultados de clientes" aria-busy={pending}>
        <p role="status" className="mb-3">{state.rows.length ? `Página ${state.page} · ${Math.min(30, state.rows.length)} clientes` : "Sin clientes para esta búsqueda."}</p>
        <ul className="grid gap-3 sm:grid-cols-2">{state.rows.slice(0, 30).map((row) => <li key={row.user_id}><Card>
          <TextLink href={`/admin/clientes/${row.user_id}`}>{row.given_names} {row.family_names}</TextLink>
          <p>{row.disabled_at ? "Suspendida" : row.verified_at ? "Verificada" : "Pendiente de verificación"}</p>
        </Card></li>)}</ul>
      </section>}
  </>;
}
