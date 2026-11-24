import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { guestCartEvent, guestCartKey } from "../../lib/cart/guest";

test("la cabecera móvil conserva accesos, foco y destinos", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 680 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#contenido")).toBeFocused();
  const menu = page.getByText("Menú principal", { exact: true }).locator("..");
  await menu.focus();
  await page.keyboard.press("Enter");
  const navigation = page.getByRole("navigation", { name: "Menú móvil" });
  await expect(navigation).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(navigation).not.toBeVisible();
  await expect(menu).toBeFocused();
  await menu.press("Enter");
  await navigation.getByRole("link", { name: "Categorías" }).click();
  await expect(page.getByRole("heading", { name: "Categorías" })).toBeVisible();
  await page.getByRole("link", { name: "Despensa" }).click();
  await expect(page).toHaveURL(/categoria=despensa/);
  await expect(page.getByRole("heading", { name: "Arroz de prueba" })).toBeVisible();
  expect(await page.locator("body").evaluate((body) => body.scrollWidth)).toBeLessThanOrEqual(320);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
});

test("los accesos de escritorio, búsqueda y contador funcionan sin cuenta", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();
  await page.getByRole("searchbox", { name: "Buscar productos" }).fill("arroz");
  await page.getByRole("searchbox", { name: "Buscar productos" }).press("Enter");
  await expect(page).toHaveURL(/\/buscar\?q=arroz/);
  await expect(page.getByRole("heading", { name: "Arroz de prueba" })).toBeVisible();
  await page.evaluate(({ key, event }) => {
    localStorage.setItem(key, JSON.stringify([{ variantId: "demo-arroz-1-kg", quantity: 2 }]));
    window.dispatchEvent(new Event(event));
  }, { key: guestCartKey, event: guestCartEvent });
  await page.getByRole("link", { name: /Carrito, 2 artículos/ }).click();
  await expect(page.getByText("2 artículos en el carrito.")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/buscar\?q=arroz/);
  const missing = await request.get("/ruta-que-no-existe");
  expect(missing.status()).toBe(404);
  await page.goto("/servicio-no-disponible");
  await expect(page.getByRole("heading", { name: "Servicio no disponible" })).toBeVisible();
});
