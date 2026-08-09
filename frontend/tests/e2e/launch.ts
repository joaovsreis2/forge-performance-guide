import { expect, type Page } from "@playwright/test";

export async function enterThroughLaunch(page: Page) {
  const enter = page.getByRole("button", { name: "Continuar para o Forge" });
  await expect(enter).toBeEnabled();
  await enter.click();
  await expect(enter).toBeHidden();
}
