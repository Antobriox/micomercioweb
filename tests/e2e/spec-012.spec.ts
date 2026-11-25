import { expect, test } from "@playwright/test";

import { guestCartKey, parseGuestCart } from "../../lib/cart/guest";
import { formatMoney } from "../../lib/commercial/catalog";

test("unidad y caja mantienen la identidad y aplican su existencia y límite propios", async ({ page }) => {
  await page.goto("/producto/arroz-de-prueba");
  const selector = page.getByRole("combobox", { name: "Presentación" });
  const quantity = page.getByRole("spinbutton", { name: "Cantidad" });
  const add = page.getByRole("button", { name: "Agregar al carrito" });
  await add.click();
  await expect(selector).toBeFocused();
  await expect(page.getByText(/Selecciona una presentación/)).toBeVisible();

  await selector.selectOption("demo-arroz-1-kg");
  await expect(page.getByText(/Existencia de prueba: 30/)).toBeVisible();
  await expect(page.getByText(formatMoney({ amountInMinorUnits: 210, currency: "USD" }), { exact: false })).toBeVisible();
  await quantity.fill("1.5");
  await add.click();
  await expect(quantity).toBeFocused();
  await expect(page.getByText(/Usa una cantidad entera/)).toBeVisible();
  await quantity.fill("1");
  await add.click();
  await expect(page.getByText(/Producto agregado/)).toBeVisible();

  await selector.selectOption("demo-arroz-caja");
  await expect(page.getByText(/Caja de 12 bolsas · por caja/)).toBeVisible();
  await expect(page.getByText(formatMoney({ amountInMinorUnits: 2400, currency: "USD" }), { exact: true })).toBeVisible();
  await expect(page.getByText(/Existencia de prueba: 3/)).toBeVisible();
  await expect(quantity).toHaveAttribute("max", "2");
  await quantity.fill("2");
  await add.click();
  await expect(page.getByText(/Producto agregado/)).toBeVisible();
  await quantity.fill("1");
  await add.click();
  await expect(page.getByText(/límite de esta presentación.*2/)).toBeVisible();
  const raw = await page.evaluate((key) => localStorage.getItem(key), guestCartKey);
  expect(parseGuestCart(raw).map(({ variantId, quantity }) => ({ variantId, quantity }))).toEqual([
    { variantId: "demo-arroz-1-kg", quantity: 1 },
    { variantId: "demo-arroz-caja", quantity: 2 },
  ]);
});
