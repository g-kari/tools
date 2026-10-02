import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

// No webServer: every document/resource response is fulfilled from memory.
// Browser execution is intended for hosted CI, not the restricted local shell.
export default defineConfig({
  testDir: ".",
  testMatch: "hydration.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  outputDir: "../../../test-results/hydration-browser",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../../test-results/hydration-browser.json", import.meta.url),
        ),
      },
    ],
  ],
  use: {
    ...devices["Desktop Chrome"],
    serviceWorkers: "block",
    navigationTimeout: 15000,
    actionTimeout: 10000,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
