import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

/** Run isolated Chromium regressions without clipboard permission grants. */
export default defineConfig({
  testDir: ".",
  testMatch: "clipboard.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 15000,
  outputDir: "../../../test-results/clipboard-browser",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../../test-results/clipboard-browser.json", import.meta.url),
        ),
      },
    ],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4195",
    serviceWorkers: "block",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "mobile-width", use: { viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: "node serve-fixture.mjs",
    url: "http://127.0.0.1:4195/",
    reuseExistingServer: false,
    timeout: 10000,
  },
});
