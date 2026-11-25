"use server";

import { parseAdminOrderFilters } from "../../../lib/orders/admin-filters";
import { getCurrentAccount } from "../../../lib/server/account";

export type Customer = { user_id: string; given_names: string; family_names: string; verified_at: string | null; disabled_at: string | null };
export type AdminOrder = { id: string; status: string; created_at: string; service_date: string; starts_at: string; customer_name: string };
export type SearchState<T> = { rows: T[]; page: number; error?: boolean };

function criteria(previous: number, form: FormData) {
  const raw = form.get("buscar");
  const needle = typeof raw === "string" ? raw.trim().slice(0, 254) : "";
  const direction = form.get("page");
  const page = direction === "next" ? previous + 1 : direction === "prev" ? Math.max(1, previous - 1) : 1;
  return { needle, page, page_offset: (page - 1) * 30 };
}

export async function searchCustomers(previous: SearchState<Customer>, form: FormData): Promise<SearchState<Customer>> {
  const account = await getCurrentAccount();
  if (!account) return { rows: [], page: 1, error: true };
  const { needle, page, page_offset } = criteria(previous.page, form);
  const { data, error } = await account.client.rpc("admin_search_customers", { needle, page_offset });
  return { rows: Array.isArray(data) ? data as Customer[] : [], page, error: Boolean(error) };
}

export async function searchOrders(previous: SearchState<AdminOrder>, form: FormData): Promise<SearchState<AdminOrder>> {
  const account = await getCurrentAccount();
  if (!account) return { rows: [], page: 1, error: true };
  const { needle, page, page_offset } = criteria(previous.page, form);
  const { status, date, time } = parseAdminOrderFilters({ estado: form.get("estado"), fecha: form.get("fecha"), franja: form.get("franja") });
  const { data, error } = await account.client.rpc("admin_search_orders", { needle, order_status: status, pickup_date: date, pickup_time: time, page_offset });
  return { rows: data ?? [], page, error: Boolean(error) };
}
