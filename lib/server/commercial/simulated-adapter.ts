import "server-only";

import type {
  CommercialAdapter, CommercialSnapshot, InventoryEntry, Money, Product, Sale,
} from "../../commercial/contracts";

const hour = 60 * 60 * 1000;
const money = (amountInMinorUnits: number): Money => ({ amountInMinorUnits, currency: "USD" });

export function createSimulatedAdapter(now = () => new Date()): CommercialAdapter {
  const seeded = now().getTime();
  const timestamp = (offset: number) => new Date(seeded + offset).toISOString();
  const catalog: readonly Product[] = [
    {
      id: "demo-arroz",
      slug: "arroz-de-prueba",
      name: "Arroz de prueba",
      brand: "Marca de demostración",
      categoryId: "despensa",
      variants: [
        {
          id: "demo-arroz-1-kg",
          presentation: "Bolsa de 1 kg",
          unit: "bolsa",
          price: money(250),
          availableQuantity: 30,
          maxPerOrder: 6,
          promotions: [{
            id: "demo-promo-arroz",
            price: money(210),
            previousPrice: money(250),
            startsAt: timestamp(-hour),
            endsAt: timestamp(168 * hour),
            conditions: null,
          }],
        },
        {
          id: "demo-arroz-5-kg",
          presentation: "Bolsa de 5 kg",
          unit: "bolsa",
          price: money(1090),
          availableQuantity: 12,
          maxPerOrder: 3,
          promotions: [],
        },
      ],
    },
    {
      id: "demo-avena",
      slug: "avena-de-prueba",
      name: "Avena de prueba",
      brand: "Marca de demostración",
      categoryId: "despensa",
      variants: [{
        id: "demo-avena-500-g",
        presentation: "Paquete de 500 g",
        unit: "paquete",
        price: money(180),
        availableQuantity: 0,
        maxPerOrder: 4,
        promotions: [],
      }],
    },
    {
      id: "demo-jugo",
      slug: "jugo-de-prueba",
      name: "Jugo de prueba",
      brand: "Marca de demostración",
      categoryId: "bebidas",
      variants: [{
        id: "demo-jugo-1-l",
        presentation: "Botella de 1 L",
        unit: "botella",
        price: null,
        availableQuantity: null,
        maxPerOrder: null,
        promotions: [],
      }],
    },
  ];

  const inventory: readonly InventoryEntry[] = catalog.flatMap((product) =>
    product.variants.map((variant) => ({
      variantId: variant.id,
      quantity: variant.availableQuantity,
      unitCost: null,
    })),
  );
  const sales: readonly Sale[] = [
    { id: "demo-venta-01", occursAt: timestamp(-48 * hour), total: money(480), register: null, cashier: null, kind: "sale" },
    { id: "demo-devolucion-01", occursAt: timestamp(-24 * hour), total: money(180), register: null, cashier: null, kind: "return" },
  ];

  function snapshot<T>(records: readonly T[]): CommercialSnapshot<T> {
    const observed = now().getTime();
    return {
      records,
      observedAt: new Date(observed).toISOString(),
      validUntil: new Date(observed + hour).toISOString(),
    };
  }

  return {
    source: "simulated",
    readCatalog: async () => snapshot(catalog),
    readInventory: async () => snapshot(inventory),
    readSales: async ({ from, before }) => snapshot(sales.filter(({ occursAt }) => {
      const time = Date.parse(occursAt);
      return Date.parse(from) <= time && time < Date.parse(before);
    })),
  };
}
