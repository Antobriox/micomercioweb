export const adminOrderStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"] as const;

export function parseAdminOrderFilters(input: { estado?: unknown; fecha?: unknown; franja?: unknown }) {
  return {
    status: adminOrderStatuses.find((status) => status === input.estado) ?? null,
    date: typeof input.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.fecha) ? input.fecha : null,
    time: typeof input.franja === "string" && /^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/.test(input.franja) ? input.franja : null,
  };
}
