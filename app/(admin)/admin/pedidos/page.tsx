import { StorePage } from "../../../../components/storefront/layout";
import { parseAdminOrderFilters } from "../../../../lib/orders/admin-filters";
import { requireAdministrator } from "../../../../lib/server/account";
import type { AdminOrder } from "../search-actions";
import { OrderSearch } from "./search";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ estado?: string; fecha?: string; franja?: string }> }) {
  const { client } = await requireAdministrator();
  const filters = parseAdminOrderFilters(await searchParams);
  const { data, error } = await client.rpc("admin_search_orders", {
    order_status: filters.status, pickup_date: filters.date, pickup_time: filters.time,
  });
  const rows = Array.isArray(data) ? data as AdminOrder[] : [];
  return <StorePage title="Pedidos" parents={[{ label: "Administración", href: "/admin" }]}>
    <OrderSearch filters={filters} initial={{ rows, page: 1, error: Boolean(error) }} />
  </StorePage>;
}
