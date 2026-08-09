import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { enterThroughLaunch } from "./launch";

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

test("launch screen builds while data loads and waits for entry", async ({ page }, testInfo) => {
  await page.goto("/signin");

  const launchScreen = page.getByRole("status", { name: "Preparando Forge" });
  const enter = page.getByRole("button", { name: "Continuar para o Forge" });
  await expect(launchScreen).toBeVisible();
  await expect(launchScreen).toContainText("FORGE");
  await expect(launchScreen).toContainText("Performance se constrói.");
  await expect(enter).toBeDisabled();
  await expect(enter).toBeEnabled();
  await expect(page.getByRole("status", { name: "Forge pronto para entrar" })).toContainText(
    "ENTRAR",
  );
  await page.screenshot({ path: testInfo.outputPath("launch-ready.png"), fullPage: true });
  await enter.click();
  await expect(enter).toBeHidden();
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeEnabled();
});

test("sign-in is accessible and fits the viewport", async ({ page }) => {
  await page.goto("/signin");
  await enterThroughLaunch(page);
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeEnabled();
  await expectAccessiblePage(page);
});

test("Today is accessible and fits the viewport", async ({ page }, testInfo) => {
  await page.goto("/signin");
  await enterThroughLaunch(page);
  const submit = page.getByRole("button", { name: "Entrar", exact: true });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();

  await expectAccessiblePage(page);
  await page.screenshot({ path: testInfo.outputPath("today.png"), fullPage: true });
});
