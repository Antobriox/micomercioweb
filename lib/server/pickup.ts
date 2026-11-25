import "server-only";

import type { getCurrentAccount } from "./account";

export type PickupTime = { service_date: string; starts_at: string; remaining: number };
type Account = NonNullable<Awaited<ReturnType<typeof getCurrentAccount>>>;

export async function availablePickups(account: Account): Promise<PickupTime[] | null> {
  const { data, error } = await account.client.rpc("available_pickup_times");
  if (error || !Array.isArray(data)) return null;
  return data.filter((entry: unknown): entry is PickupTime =>
    typeof entry === "object" && entry !== null &&
    "service_date" in entry && typeof entry.service_date === "string" &&
    "starts_at" in entry && typeof entry.starts_at === "string" &&
    "remaining" in entry && typeof entry.remaining === "number");
}
