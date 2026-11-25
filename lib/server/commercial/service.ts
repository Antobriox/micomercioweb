import "server-only";

import type {
  CommercialAdapter, CommercialRead, CommercialSnapshot, Product, SalesPeriod,
} from "../../commercial/contracts";
import { getActivePromotions } from "../../commercial/promotions";
import { operation } from "../environment";

function uniqueCatalog(records: readonly Product[]) {
  const products = new Set<string>();
  const slugs = new Set<string>();
  const variants = new Set<string>();
  for (const product of records) {
    if (!product || !Array.isArray(product.variants) || !product.id || !product.slug || products.has(product.id) || slugs.has(product.slug)) return false;
    products.add(product.id);
    slugs.add(product.slug);
    for (const variant of product.variants) {
      if (!variant || !Array.isArray(variant.promotions) || !variant.id || variants.has(variant.id)) return false;
      variants.add(variant.id);
    }
  }
  return true;
}

export function createCommercialService(adapter: CommercialAdapter, now = () => new Date(), timeoutMs = 3500) {
  let verifiedCatalog: CommercialSnapshot<Product> | undefined;
  let acceptedObservation = -Infinity;

  async function read<T>(retrieve: (signal: AbortSignal) => Promise<CommercialSnapshot<T>>): Promise<CommercialRead<T>> {
    if (adapter.source === "picking" && !operation.realOrdersEnabled) return { state: "forbidden" };

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("Commercial timeout"));
        }, timeoutMs);
      });
      const snapshot = await Promise.race([retrieve(controller.signal), timeout]);
      const observed = Date.parse(snapshot.observedAt);
      const expires = Date.parse(snapshot.validUntil);
      const current = now().getTime();
      if (!Array.isArray(snapshot.records) || !Number.isFinite(observed) || !Number.isFinite(expires) || observed > current || expires <= observed) {
        return { state: "unavailable", source: adapter.source };
      }
      const state = expires <= current ? "stale" : snapshot.records.length > 0 ? "available" : "empty";
      return { ...snapshot, state, source: adapter.source };
    } catch {
      return { state: "unavailable", source: adapter.source };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async getCatalog(): Promise<CommercialRead<Product>> {
      const response = await read((signal) => adapter.readCatalog(signal));
      if (response.state === "forbidden") return response;

      const observed = "records" in response ? Date.parse(response.observedAt) : -Infinity;
      const usable = "records" in response && observed >= acceptedObservation && uniqueCatalog(response.records);
      if (usable && (response.state === "available" || response.state === "empty")) {
        acceptedObservation = observed;
        verifiedCatalog = response.state === "available" ? response : undefined;
      }
      const result = usable ? response : verifiedCatalog
        ? { ...verifiedCatalog, state: "stale" as const, source: adapter.source }
        : { state: "unavailable" as const, source: adapter.source };
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
      return read((signal) => adapter.readInventory(signal));
    },
    async getSales(actor: "administrator" | "customer" | "visitor", period: SalesPeriod) {
      if (actor !== "administrator") return { state: "forbidden" } as const;
      return read((signal) => adapter.readSales(period, signal));
    },
  };
}
