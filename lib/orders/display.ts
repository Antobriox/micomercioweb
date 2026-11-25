const localTime = new Intl.DateTimeFormat("es-EC", {
  timeZone: "America/Guayaquil", dateStyle: "medium", timeStyle: "short",
});
const localDay = new Intl.DateTimeFormat("es-EC", { timeZone: "UTC", dateStyle: "medium" });

export const activeOrderStatuses = ["pending", "confirmed", "preparing", "ready"] as const;
export const completedOrderStatuses = ["delivered", "cancelled"] as const;
export const orderIdPattern = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

export function isActiveOrder(status: string) {
  return (activeOrderStatuses as readonly string[]).includes(status);
}

export function orderInstant(value: string) {
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) ? localTime.format(instant) : "Fecha no disponible";
}

export function pickupLabel(date: string, time: string) {
  const day = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(day.getTime()) ? `${localDay.format(day)}, ${time.slice(0, 5)}` : "Franja no disponible";
}
