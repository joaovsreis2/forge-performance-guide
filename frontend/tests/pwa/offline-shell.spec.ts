import { expect, test } from "@playwright/test";
import { enterThroughLaunch } from "../e2e/launch";

test("production build registers its service worker and reloads offline", async ({
  context,
  page,
}) => {
  await page.goto("/signin");
  await enterThroughLaunch(page);
  await expect(page.getByRole("heading", { name: "Bom te ver de novo" })).toBeVisible();

  const workerState = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active;
    if (worker && worker.state !== "activated") {
      await new Promise<void>((resolve) => {
        worker.addEventListener("statechange", () => {
          if (worker.state === "activated") resolve();
        });
      });
    }
    return worker?.state;
  });
  expect(workerState).toBe("activated");

  const proxiedSession = await page.evaluate(async () => {
    const csrfResponse = await fetch("/api/csrf/", { credentials: "include" });
    const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
    const loginResponse = await fetch("/api/auth/login/", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
      body: JSON.stringify({ email: "teste@forge.local", password: "Teste-Forge-2026" }),
    });
    const meResponse = await fetch("/api/me/", { credentials: "include" });
    const user = (await meResponse.json()) as { email?: string };
    return {
      csrfStatus: csrfResponse.status,
      loginStatus: loginResponse.status,
      meStatus: meResponse.status,
      email: user.email,
      cacheControl: meResponse.headers.get("Cache-Control"),
    };
  });
  expect(proxiedSession).toEqual({
    csrfStatus: 200,
    loginStatus: 200,
    meStatus: 200,
    email: "teste@forge.local",
    cacheControl: "no-store",
  });

  const manifest = await page.request.get("/site.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const manifestBody = (await manifest.json()) as {
    name: string;
    icons: Array<{ src: string; sizes: string }>;
  };
  expect(manifestBody.name).toBe("Forge Performance");
  expect(manifestBody.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: "/forge-icon-192.png", sizes: "192x192" }),
      expect.objectContaining({ src: "/forge-icon-512.png", sizes: "512x512" }),
    ]),
  );

  const brandmark = await page.request.get("/brand/brandmark.svg");
  const favicon = await page.request.get("/favicon.ico?v=8");
  expect(brandmark.ok()).toBeTruthy();
  expect(favicon.ok()).toBeTruthy();

  await context.setOffline(true);
  const offlineApiResult = await page.evaluate(async () => {
    try {
      await fetch("/api/csrf/", { credentials: "include" });
      return "resolved";
    } catch {
      return "rejected";
    }
  });
  expect(offlineApiResult).toBe("rejected");
  await page.reload();
  await enterThroughLaunch(page);
  await expect(page.getByRole("heading", { name: "Bom te ver de novo" })).toBeVisible();
});
