export type DatumSource = "simulated" | "picking";

export interface Money {
  amountInMinorUnits: number;
  currency: string;
}

export interface Promotion {
  id: string;
  price: Money;
  previousPrice: Money | null;
  startsAt: string;
  endsAt: string | null;
  conditions: string | null;
}

export interface Variant {
  id: string;
  presentation: string;
  unit: string;
  price: Money | null;
  availableQuantity: number | null;
  maxPerOrder: number | null;
  promotions: readonly Promotion[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  variants: readonly Variant[];
}

export interface InventoryEntry {
  variantId: string;
  quantity: number | null;
  unitCost: Money | null;
}

export interface Sale {
  id: string;
  occursAt: string;
  total: Money | null;
  register: string | null;
  cashier: string | null;
  kind: "sale" | "return";
}

export interface SalesPeriod {
  from: string;
  before: string;
}

export interface CommercialSnapshot<T> {
  records: readonly T[];
  observedAt: string;
  validUntil: string;
}

export interface CommercialAdapter {
  source: DatumSource;
  readCatalog(): Promise<CommercialSnapshot<Product>>;
  readInventory(): Promise<CommercialSnapshot<InventoryEntry>>;
  readSales(period: SalesPeriod): Promise<CommercialSnapshot<Sale>>;
}

export type CommercialRead<T> =
  | (CommercialSnapshot<T> & {
    state: "available" | "empty" | "stale";
    source: DatumSource;
  })
  | { state: "unavailable"; source: DatumSource }
  | { state: "forbidden" };
