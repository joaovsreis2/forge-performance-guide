import { expect, test } from "@playwright/test";

test("production build registers its service worker and reloads offline", async ({
  context,
  page,
}) => {
  await page.goto("/signin");
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

  const manifest = await page.request.get("/site.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).name).toBe("Forge Performance");

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Bom te ver de novo" })).toBeVisible();
});
