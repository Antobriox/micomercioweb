import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("un visitante abre una ficha, ve la foto de prueba y agrega una presentación con teclado", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto("/catalogo?categoria=despensa");
  const product = page.getByRole("link", { name: "Arroz de prueba" });
  await page.evaluate(() => window.scrollTo(0, 240));
  await product.focus();
  const position = await page.evaluate(() => window.scrollY);
  expect(position).toBeGreaterThan(0);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Arroz de prueba" })).toBeVisible();
  await expect(page.getByRole("img", { name: /bolsa de arroz de 1 kg/ })).toBeVisible();
  await expect.poll(() => page.getByRole("img", { name: /bolsa de arroz de 1 kg/ })
    .evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("combobox", { name: "Presentación" }).selectOption("demo-arroz-1-kg");
  await page.getByRole("button", { name: "Agregar al carrito" }).press("Enter");
  await expect(page.getByText("Producto agregado al carrito de prueba.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Carrito, 1 artículo" })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.goBack();
  await expect(page).toHaveURL(/catalogo\?categoria=despensa$/);
  await expect(product).toBeVisible();
  await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - position)).toBeLessThan(8);
});

test("agotados y datos incompletos se muestran sin ofrecer una compra", async ({ page }) => {
  await page.goto("/producto/avena-de-prueba");
  await expect(page.getByText("Sin foto disponible")).toBeVisible();
  await expect(page.getByText("Agotado", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Agregar al carrito" })).toBeDisabled();
  await page.goto("/producto/jugo-de-prueba");
  await expect(page.getByText("Precio no disponible", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Agregar al carrito" })).toBeDisabled();
  await page.goto("/catalogo?categoria=inexistente");
  await expect(page.getByText("No se encontraron productos en esta categoría.")).toBeVisible();
});
