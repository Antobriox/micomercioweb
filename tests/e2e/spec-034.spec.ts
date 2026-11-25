import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test } from "@playwright/test";

test("SPEC-034 keeps demo browsing protected and unindexed", async ({ page, request }) => {
  const response = await page.goto("/");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await expect(page.locator("html")).toHaveAttribute("lang", "es-EC");
  await expect(page.getByText("Portoviejo, Manabí, Ecuador", { exact: true }).first()).toBeVisible();
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
});

test("SPEC-034 preserves public navigation with narrow touch layouts and slow product images", async ({ browser, baseURL }) => {
  for (const device of [devices["Pixel 7"], devices["iPhone 13"]]) {
    const context = await browser.newContext({ ...device, baseURL });
    try {
      const page = await context.newPage();
      await page.route("**/_next/image?**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        await route.continue();
      });
      await page.goto("/producto/arroz-de-prueba");
      await expect(page.getByRole("heading", { name: "Arroz de prueba", exact: true })).toBeVisible();
      await expect(page.getByRole("img", { name: "Foto ilustrativa de una bolsa de arroz de 1 kg" })).toBeVisible();
      expect(await page.locator("body").evaluate((body) => body.scrollWidth)).toBeLessThanOrEqual(device.viewport.width);
      expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    } finally {
      await context.close();
    }
  }
});
