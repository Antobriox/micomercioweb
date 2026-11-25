import { expect, test } from "@playwright/test";

test("las recomendaciones solo aparecen en la ficha cuando hay alternativas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto("/producto/avena-de-prueba");
  const section = page.getByRole("region", { name: "Productos relacionados" });
  await expect(section).toBeVisible();
  await section.getByRole("link", { name: "Arroz de prueba" }).click();
  await expect(page).toHaveURL(/arroz-de-prueba$/);
  await expect(section).toHaveCount(0);
  await page.goto("/carrito");
  await expect(section).toHaveCount(0);
});
