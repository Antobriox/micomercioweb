import "server-only";

import type {
  CommercialAdapter, CommercialRead, CommercialSnapshot, SalesPeriod,
} from "../../commercial/contracts";
import { getActivePromotions } from "../../commercial/promotions";
import { operation } from "../environment";

export function createCommercialService(adapter: CommercialAdapter, now = () => new Date()) {
  async function read<T>(retrieve: () => Promise<CommercialSnapshot<T>>): Promise<CommercialRead<T>> {
    if (adapter.source === "picking" && !operation.realOrdersEnabled) {
      return { state: "forbidden" };
    }

    try {
      const snapshot = await retrieve();
      const observed = Date.parse(snapshot.observedAt);
      const expires = Date.parse(snapshot.validUntil);
      const current = now().getTime();
      if (!Number.isFinite(observed) || !Number.isFinite(expires) || observed > current || expires <= observed) {
        return { state: "unavailable", source: adapter.source };
      }

      const state = expires <= current ? "stale" : snapshot.records.length > 0 ? "available" : "empty";
      return { ...snapshot, state, source: adapter.source };
    } catch {
      return { state: "unavailable", source: adapter.source };
    }
  }

  return {
    async getCatalog() {
      const result = await read(() => adapter.readCatalog());
      if (!("records" in result)) return result;

      const current = now();
      return {
        ...result,
        records: result.records.map((product) => ({
          ...product,
          variants: product.variants.map((variant) => ({
            ...variant,
            promotions: getActivePromotions(variant.promotions, current),
          })),
        })),
      };
    },
    async getInventory(actor: "administrator" | "customer" | "visitor") {
      if (actor !== "administrator") return { state: "forbidden" } as const;
      return read(() => adapter.readInventory());
    },
    async getSales(actor: "administrator" | "customer" | "visitor", period: SalesPeriod) {
      if (actor !== "administrator") return { state: "forbidden" } as const;
      return read(() => adapter.readSales(period));
    },
  };
}
