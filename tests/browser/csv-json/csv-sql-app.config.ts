import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

/** Run the existing CSV SQL cases and quote recovery against the built shell/SSR application. */
export default defineConfig({
  testDir: "../../e2e",
  testMatch: ["csv-sql.spec.ts", "csv-sql-quotes.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 15000,
  outputDir: "../../../test-results/csv-sql-app-browser",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../../test-results/csv-sql-app-browser.json", import.meta.url),
        ),
      },
    ],
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
    url: "http://127.0.0.1:8788/csv-sql",
    reuseExistingServer: false,
    timeout: 60000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
