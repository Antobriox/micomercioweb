import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("los componentes conservan semántica y reflow en móvil y escritorio", async ({ page }, testInfo) => {
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    const response = await page.goto("/diagnostico/componentes");
    expect(response?.ok()).toBeTruthy();
    expect(await page.locator("body").evaluate((body) => body.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.getByRole("button", { name: "Principal" })).toBeVisible();
    expect((await page.getByRole("button", { name: "Principal" }).boundingBox())?.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("button", { name: "Deshabilitada" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Cargando acción" })).toHaveAttribute("aria-busy", "true");
    const invalidField = page.getByRole("textbox", { name: "Correo de ejemplo" });
    await expect(invalidField).toHaveAttribute("aria-invalid", "true");
    await expect(invalidField).toHaveAccessibleDescription("Escribe un correo con un dominio válido.");
    await expect(page.getByRole("heading", { name: "Componentes de prueba" })).toHaveCSS("font-family", /Manrope Variable/);
    await expect(invalidField).toHaveCSS("font-family", /Inter Variable/);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    if (width !== 768) await page.screenshot({ path: testInfo.outputPath(`componentes-${width}.png`), fullPage: true });
  }
});

test("el diálogo gestiona el foco y respeta movimiento reducido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/diagnostico/componentes");
  const trigger = page.getByRole("button", { name: "Abrir diálogo" });
  await expect(trigger).toHaveCSS("transition-duration", "0s");
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Diálogo de prueba" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cerrar" })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
