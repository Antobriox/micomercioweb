import type { InventoryEntry, Money, Sale } from "./contracts";
import { knownPrice } from "./pricing";

const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Guayaquil" });
const localHour = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Guayaquil", hour: "2-digit", hourCycle: "h23" });
export const reportWindows = { dia: "Día", semana: "Semana", mes: "Mes", anio: "Año" } as const;
type Window = keyof typeof reportWindows;

export function reportPeriod(anchor: unknown, scale: unknown, now = new Date()) {
  const parsed = typeof anchor === "string" && /^\d{4}-\d\d-\d\d$/.test(anchor) ? Date.parse(anchor) : NaN;
  const date = typeof anchor === "string" && Number(anchor.slice(0, 4)) >= 1900 && Number(anchor.slice(0, 4)) <= 9998 && Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === anchor ? anchor as string : localDate.format(now);
  const window = typeof scale === "string" && Object.hasOwn(reportWindows, scale) ? scale as Window : "mes";
  const [year, month, day] = date.split("-").map(Number);
  const weekday = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  const data = (shift: number) => {
    const next = window === "anio" ? Date.UTC(year + shift, 0, 1) :
      window === "mes" ? Date.UTC(year, month - 1 + shift, 1) :
      Date.UTC(year, month - 1, day + (window === "semana" ? 7 * shift - weekday : shift));
    return new Date(next).toISOString().slice(0, 10);
  };
  const localStart = (day: string) => `${day}T05:00:00.000Z`;
  const [previous, from, before] = [-1, 0, 1].map(data);
  return { date, window, from, before,
    selection: { from: localStart(from), before: localStart(before) },
    comparison: { from: localStart(previous), before: localStart(from) },
  };
}

export function salesOverview(records: readonly Sale[]) {
  let gross = 0;
  let refunds = 0;
  const currency = records[0]?.total?.currency;
  let known = !!currency;
  const hours = new Map<string, number>();
  const products = new Map<string, number>();
  const sales = records.filter((record) => record.kind === "sale");
  for (const record of records) {
    if (!knownPrice(record.total) || record.total.currency !== currency) known = false;
    else if (record.kind === "return") refunds += record.total.amountInMinorUnits;
    else gross += record.total.amountInMinorUnits;
    if (record.kind === "sale") {
      const time = Date.parse(record.occursAt);
      if (Number.isFinite(time)) {
        const hour = localHour.format(time);
        hours.set(hour, (hours.get(hour) ?? 0) + 1);
      }
      for (const line of record.lines ?? []) products.set(line.variantId, (products.get(line.variantId) ?? 0) + line.quantity);
    }
  }
  const sum = (amount: number): Money | null => known && currency && Number.isSafeInteger(amount) ?
    { currency, amountInMinorUnits: amount } : null;
  const ranked = (list: Map<string, number>) => [...list].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return { sales: sales.length, returns: records.length - sales.length, gross: sum(gross), refunds: sum(refunds),
    net: sum(gross - refunds), ticket: sales.length ? sum(Math.round((gross - refunds) / sales.length)) : null,
    peak: ranked(hours)[0]?.[0] ?? null,
    top: sales.length && sales.every((record) => record.lines?.length) ? ranked(products).slice(0, 5) : null,
  };
}

export function inventoryOverview(records: readonly InventoryEntry[]) {
  const counts = new Map<string, number>();
  for (const row of records) counts.set(row.variantId, (counts.get(row.variantId) ?? 0) + 1);
  const bad = new Set([...counts].filter(([, count]) => count !== 1).map(([id]) => id));
  const distinct = records.filter((row) => !bad.has(row.variantId));
  const currency = distinct[0]?.unitCost?.currency;
  let total = 0;
  let complete = !!currency && bad.size === 0;
  for (const row of distinct) {
    if (row.quantity === null || !Number.isSafeInteger(row.quantity) || row.quantity < 0 ||
        !knownPrice(row.unitCost) || row.unitCost.currency !== currency) complete = false;
    else total += row.quantity * row.unitCost.amountInMinorUnits;
  }
  const valuation = currency && complete && Number.isSafeInteger(total) ? { currency, amountInMinorUnits: total } : null;
  return { distinct, bad: Array.from(bad), valuation };
}

