import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

/** Run all YAML/JSON cases against the built shell and hydrated application. */
export default defineConfig({
  testDir: "../../e2e",
  testMatch: "yaml-json.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 15000,
  outputDir: "../../../test-results/yaml-json-app-browser",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../../test-results/yaml-json-app-browser.json", import.meta.url),
        ),
      },
    ],
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
    url: "http://127.0.0.1:8788/yaml-json",
    reuseExistingServer: false,
    timeout: 60000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
