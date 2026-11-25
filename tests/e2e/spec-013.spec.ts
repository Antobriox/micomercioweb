import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("las sugerencias se abren y seleccionan con teclado en una pantalla móvil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Buscar productos" });
  await input.fill("árr");
  const suggestion = page.getByRole("option", { name: /Arroz de prueba/ });
  await expect(suggestion).toBeVisible();
  await expect(suggestion.locator("img")).toBeVisible();
  await input.press("Escape");
  await expect(suggestion).toHaveCount(0);
  await input.press("ArrowDown");
  await expect(suggestion).toHaveAttribute("aria-selected", "true");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await input.press("Enter");
  await expect(page).toHaveURL(/\/producto\/arroz-de-prueba$/);
});

test("el total y el enlace de retorno conservan filtros combinados", async ({ page }) => {
  await page.goto("/buscar?q=de%20prueba");
  const form = page.getByRole("form", { name: "Filtros de productos" });
  await form.getByRole("combobox", { name: "Categoría" }).selectOption("despensa");
  await form.getByRole("combobox", { name: "Marca" }).selectOption("Marca de demostración");
  await form.getByRole("combobox", { name: "Disponibilidad" }).selectOption("disponible");
  await form.getByLabel("Precio mínimo (USD)").fill("10,00");
  await form.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByText("1 resultado", { exact: true })).toBeVisible();
  await expect(page.getByText("Bolsa de 5 kg · más presentaciones")).toBeVisible();
  await page.getByRole("link", { name: "Arroz de prueba" }).click();
  await expect(page.getByRole("heading", { name: "Arroz de prueba" })).toBeVisible();
  await page.getByRole("link", { name: "Volver a resultados" }).click();
  await expect(page).toHaveURL(/categoria=despensa/);
  await expect(page).toHaveURL(/disponibilidad=disponible/);
  await expect(page.getByText("1 resultado", { exact: true })).toBeVisible();
  await form.getByRole("link", { name: "Limpiar filtros" }).click();
  await expect(page.getByText("3 resultados", { exact: true })).toBeVisible();
  await page.goto("/buscar?q=%5B%3C%5D");
  await expect(page.getByText("0 resultados", { exact: true })).toBeVisible();
});
