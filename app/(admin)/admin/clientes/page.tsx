import { StorePage } from "../../../../components/storefront/layout";
import { requireAdministrator } from "../../../../lib/server/account";
import type { Customer } from "../search-actions";
import { CustomerSearch } from "./search";

export default async function AdminCustomersPage() {
  const { client } = await requireAdministrator();
  const { data, error } = await client.rpc("admin_search_customers");
  const rows = Array.isArray(data) ? data as Customer[] : [];
  return <StorePage title="Clientes" parents={[{ label: "Administración", href: "/admin" }]}>
    <CustomerSearch initial={{ rows, page: 1, error: Boolean(error) }} />
  </StorePage>;
}
