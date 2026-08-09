import { expect, test } from "@playwright/test";
import { enterThroughLaunch } from "./launch";

test("demo user can sign in and see the assigned plan", async ({ page }) => {
  await page.goto("/signin");
  await enterThroughLaunch(page);
  const submit = page.getByRole("button", { name: "Entrar" });
  await page.getByLabel("E-mail").fill("teste@forge.local");
  await page.getByLabel("Senha", { exact: true }).fill("Teste-Forge-2026");
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
  await page.getByRole("link", { name: "Plano", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Forge Demo — Base de Força" })).toBeVisible();
});

test("a new account enters onboarding", async ({ page }, testInfo) => {
  const project = testInfo.project.name.replaceAll(/[^a-z0-9]/gi, "-");
  const email = `e2e-${project}-${Date.now()}@example.com`;
  await page.goto("/signup");
  await enterThroughLaunch(page);
  await expect(page.getByRole("button", { name: "Criar conta" })).toBeEnabled();
  await page.getByLabel("Nome").fill("Pessoa E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Cadastro-Forge-2026");
  await page.getByLabel("Confirmar senha").fill("Cadastro-Forge-2026");
  await page.getByLabel(/Aceito os termos/).check();
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Vamos configurar seu perfil" })).toBeVisible();
});
