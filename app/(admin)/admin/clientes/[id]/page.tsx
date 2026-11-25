import { notFound } from "next/navigation";
import { StorePage } from "../../../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../../../components/ui/primitives";
import { orderIdPattern, orderInstant } from "../../../../../lib/orders/display";
import { orderStatusLabel } from "../../../../../lib/orders/status";
import { requireAdministrator } from "../../../../../lib/server/account";
import type { Customer } from "../../search-actions";
import { AccountStateForm } from "./account-state-form";

type CustomerDetail = Customer & { masked_id: string; email: string; mobile: string; updated_at: string; administrator: boolean };

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { client } = await requireAdministrator();
  const { id } = await params;
  if (!orderIdPattern.test(id)) notFound();
  const [profile, orders] = await Promise.all([
    client.rpc("admin_customer_detail", { target: id }),
    client.from("orders").select("id,status,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
  ]);
  const customer = Array.isArray(profile.data) ? profile.data[0] as CustomerDetail | undefined : undefined;
  if (!customer && !profile.error) notFound();
  return <StorePage title="Detalle de cliente" parents={[{ label: "Administración", href: "/admin" }, { label: "Clientes", href: "/admin/clientes" }]}>
    {!customer ? <Notice tone="error">No se pudo consultar la cuenta.</Notice> :
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-xl font-bold">{customer.given_names} {customer.family_names}</h2>
          <p role="status" className="font-semibold">{customer.disabled_at ? "Cuenta suspendida" : customer.verified_at ? "Cuenta verificada" : "Verificación pendiente"}</p>
          <dl className="space-y-2">
            <div><dt className="font-semibold">Cédula</dt><dd>{customer.masked_id}</dd></div>
            <div><dt className="font-semibold">Correo</dt><dd className="break-all">{customer.email}</dd></div>
            <div><dt className="font-semibold">Celular</dt><dd>{customer.mobile}</dd></div>
          </dl>
          {!customer.administrator && <AccountStateForm key={customer.updated_at} id={id} version={customer.updated_at} suspended={!!customer.disabled_at} />}
        </Card>
        <Card className="space-y-3">
          <h2 className="text-xl font-bold">Pedidos recientes</h2>
          {orders.error ? <Notice tone="error">No se pudo consultar el historial.</Notice> :
            orders.data?.length ? <ul className="space-y-3">{orders.data.map((order) => <li key={order.id}>
              <TextLink href={`/admin/pedidos/${order.id}`}>Ver pedido {order.id.slice(0, 8).toUpperCase()}</TextLink>
              <p>{orderStatusLabel(order.status)} · <time dateTime={order.created_at}>{orderInstant(order.created_at)}</time></p>
            </li>)}</ul> : <p>Esta cuenta no tiene pedidos.</p>}
        </Card>
      </div>}
  </StorePage>;
}
