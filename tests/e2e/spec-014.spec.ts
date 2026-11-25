import { expect, test } from "@playwright/test";

import { guestCartKey } from "../../lib/cart/guest";

test("la oferta tiene comparación verificable y vigencia en la ficha", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto("/promociones");
  await expect(page.getByText("Ofertas de demostración.")).toBeVisible();
  await expect(page.getByText("16 % de descuento")).toBeVisible();
  await expect(page.locator("del")).toHaveCount(1);
  await page.getByRole("link", { name: "Arroz de prueba" }).click();
  await page.getByLabel("Presentación").selectOption("demo-arroz-1-kg");
  await expect(page.locator("time")).toHaveCount(2);
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByText(/Producto agregado/)).toBeVisible();
  await page.getByRole("link", { name: "Ver carrito", exact: true }).click();
  await expect(page).toHaveURL(/\/carrito$/);
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify([{
      variantId: "demo-arroz-1-kg", quantity: 1,
      observedUnitPrice: { currency: "USD", amountInMinorUnits: 250 },
    }]));
  }, guestCartKey);
  await page.reload();
  await expect(page.getByText(/Algún precio o promoción cambió/)).toBeVisible();
});
