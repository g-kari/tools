import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

/** Run .env YAML cases against the built shell and hydrated application. */
export default defineConfig({
  testDir: "../../e2e",
  testMatch: "env-parser.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 15000,
  outputDir: "../../../test-results/env-parser-app-browser",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../../test-results/env-parser-app-browser.json", import.meta.url),
        ),
      },
    ],
  ],
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 900 } } },
    { name: "narrow", use: { viewport: { width: 390, height: 844 } } },
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:8788",
    serviceWorkers: "block",
    permissions: ["clipboard-read", "clipboard-write"],
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run preview -- --port 8788 --host 127.0.0.1",
    url: "http://127.0.0.1:8788/env-parser",
    reuseExistingServer: false,
    timeout: 60000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
