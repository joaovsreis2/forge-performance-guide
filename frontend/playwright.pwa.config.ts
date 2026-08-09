import { defineConfig, devices } from "@playwright/test";

const backendCommand =
  process.platform === "win32"
    ? "..\\backend\\.venv\\Scripts\\python.exe ..\\backend\\manage.py runserver 127.0.0.1:8001 --noreload"
    : "python ../backend/manage.py runserver 127.0.0.1:8001 --noreload";

export default defineConfig({
  testDir: "./tests/pwa",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command:
        "wrangler dev --config .output/server/wrangler.json --ip 127.0.0.1 --port 4173 --var FORGE_API_ORIGIN:http://127.0.0.1:8001 --log-level error",
      url: "http://127.0.0.1:4173/signin",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: backendCommand,
      url: "http://127.0.0.1:8001/health/",
      env: {
        ...process.env,
        DJANGO_CSRF_TRUSTED_ORIGINS: "http://127.0.0.1:4173",
        FORGE_FRONTEND_ORIGIN: "http://127.0.0.1:4173",
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
