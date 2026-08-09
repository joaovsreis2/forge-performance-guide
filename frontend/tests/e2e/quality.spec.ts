import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectAccessiblePage(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const seriousViolations = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(seriousViolations).toEqual([]);

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBeFalsy();
}

test("launch screen introduces the app and releases the interface", async ({ page }) => {
  await page.goto("/signin");

  const launchScreen = page.getByRole("status", { name: "Abrindo Forge" });
  await expect(launchScreen).toBeVisible();
  await expect(launchScreen).toContainText("FORGE");
  await expect(launchScreen).toContainText("Performance se constrói.");
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Playwright viewport is required for the launch interaction");
  await page.mouse.click(viewport.width / 2, viewport.height / 2);
  await expect(launchScreen).toBeHidden({ timeout: 300 });
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __forgeLaunchSkipped?: boolean }).__forgeLaunchSkipped,
      ),
    )
    .toBe(true);
  await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
});

test("sign-in is accessible and fits the viewport", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
  await expectAccessiblePage(page);
});

test("Today is accessible and fits the viewport", async ({ page }, testInfo) => {
  await page.goto("/signin");
  const submit = page.getByRole("button", { name: "Entrar" });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();

  await expectAccessiblePage(page);
  await page.screenshot({ path: testInfo.outputPath("today.png"), fullPage: true });
});
