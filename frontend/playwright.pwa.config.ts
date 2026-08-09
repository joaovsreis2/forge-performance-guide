import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/pwa",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command:
      "wrangler dev --config .output/server/wrangler.json --ip 127.0.0.1 --port 4173 --log-level error",
    url: "http://127.0.0.1:4173/signin",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
