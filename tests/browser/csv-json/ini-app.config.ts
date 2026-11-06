import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

/** Bounded real-shell/SSR INI validation using the already-built local application. */
export default defineConfig({
  testDir: "../../e2e",
  testMatch: "ini-parser.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 15000,
  outputDir: "../../../test-results/ini-app-browser",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../../test-results/ini-app-browser.json", import.meta.url),
        ),
      },
    ],
  ],
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:8788",
    serviceWorkers: "block",
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run preview -- --port 8788 --host 127.0.0.1",
    url: "http://127.0.0.1:8788/ini-parser",
    reuseExistingServer: false,
    timeout: 60000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
