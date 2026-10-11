import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

/** Six existing scenarios against real components in pinned, sandboxed Chromium. */
export default defineConfig({
  testDir: ".",
  testMatch: "grapheme.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 15000,
  outputDir: "../../../test-results/grapheme-browser",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../../test-results/grapheme-browser.json", import.meta.url),
        ),
      },
    ],
  ],
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 800 },
    baseURL: "http://127.0.0.1:4199",
    serviceWorkers: "block",
    launchOptions: { chromiumSandbox: true },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node serve-fixture.mjs",
    url: "http://127.0.0.1:4199/",
    reuseExistingServer: false,
    timeout: 10000,
  },
});
