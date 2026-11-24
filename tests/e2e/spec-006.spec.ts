import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("el registro muestra seis campos y asocia errores al recorrerlo con teclado", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 840 });
  await page.goto("/registro");
  const nationalId = page.getByRole("textbox", { name: /Cédula ecuatoriana/ });
  await expect(nationalId).toHaveAttribute("inputmode", "numeric");
  await expect(nationalId).toHaveAttribute("type", "text");
  await expect(page.locator('main input:not([type="checkbox"]):not([type="hidden"])')).toHaveCount(6);
  await page.getByRole("button", { name: "Crear cuenta de prueba" }).click();
  await expect(page.getByRole("textbox", { name: /Nombres/ })).toBeFocused();
  await expect(nationalId).toHaveAccessibleDescription(/cédula ecuatoriana válida de 10 dígitos/);
  await expect(page.getByRole("checkbox")).toHaveAccessibleDescription(/datos ficticios/);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
});

test("el servidor valida los seis campos sin depender de JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4173/registro");
    await page.getByRole("button", { name: "Crear cuenta de prueba" }).click();
    await expect(page.getByText("Escribe una cédula ecuatoriana válida de 10 dígitos.")).toBeVisible();
  } finally {
    await context.close();
  }
});
