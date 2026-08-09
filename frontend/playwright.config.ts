import { defineConfig, devices } from "@playwright/test";

const backendCommand =
  process.platform === "win32"
    ? "..\\backend\\.venv\\Scripts\\python.exe ..\\backend\\manage.py runserver 127.0.0.1:8000 --noreload"
    : "python ../backend/manage.py runserver 127.0.0.1:8000 --noreload";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 2,
  retries: 1,
  reporter: "list",
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://127.0.0.1:5175",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "chromium-mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5175",
      url: "http://127.0.0.1:5175",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: backendCommand,
      url: "http://127.0.0.1:8000/health/",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
