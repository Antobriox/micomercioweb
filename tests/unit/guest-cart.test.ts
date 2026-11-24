import assert from "node:assert/strict";
import { test } from "node:test";

import { parseGuestCart } from "../../lib/cart/guest";

test("stored cart records are deduplicated and checked before counting", () => {
  assert.deepEqual(parseGuestCart(JSON.stringify([
    { variantId: "demo-1", quantity: 2 },
    { variantId: "demo-1", quantity: 3 },
    { variantId: "demo-2", quantity: -1 },
    { variantId: "demo-3", quantity: 1.5 },
    null,
    { variantId: "demo-4", quantity: 1 },
  ])), [{ variantId: "demo-1", quantity: 2 }, { variantId: "demo-4", quantity: 1 }]);
  assert.deepEqual(parseGuestCart("{"), []);
});
