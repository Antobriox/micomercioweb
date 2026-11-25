import { expect, test } from "@playwright/test";

test("el carrito de visitante conserva sus líneas al recargar y permite editar y quitar", async ({ page }) => {
  await page.goto("/producto/arroz-de-prueba");
  await page.getByLabel("Presentación").selectOption("demo-arroz-1-kg");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("link", { name: "Ver carrito", exact: true }).click();
  await expect(page).toHaveURL(/\/carrito$/);
  await page.reload();
  await expect(page.getByText(/Total estimado.*2,10/)).toBeVisible();
  const quantity = page.getByRole("spinbutton", { name: "Cantidad" });
  await quantity.fill("7");
  await page.getByRole("button", { name: "Actualizar" }).click();
  await expect(page.getByText(/Usa una cantidad entera/)).toBeVisible();
  await expect(page.getByText("1 artículo en el carrito.")).toBeVisible();
  await quantity.fill("2");
  await page.getByRole("button", { name: "Actualizar" }).click();
  await expect(page.getByText(/Total estimado.*4,20/)).toBeVisible();
  await page.getByRole("button", { name: "Quitar" }).click();
  await expect(page.getByText("El carrito está vacío.")).toBeVisible();
});

test("un fallo de cotización conserva la línea y permite recuperarla al recargar", async ({ page }) => {
  await page.goto("/producto/arroz-de-prueba");
  await page.getByLabel("Presentación").selectOption("demo-arroz-caja");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.route("**/api/carrito/cotizar", (route) => route.abort());
  await page.goto("/carrito");
  await expect(page.getByText("No pudimos volver a verificar los precios del carrito.")).toBeVisible();
  await expect(page.getByText("1 artículo en el carrito.")).toBeVisible();
  await page.unroute("**/api/carrito/cotizar");
  await page.reload();
  await expect(page.getByText("Caja de 12 bolsas", { exact: true })).toBeVisible();
  await expect(page.getByText(/Total estimado.*24,00/)).toBeVisible();
});
