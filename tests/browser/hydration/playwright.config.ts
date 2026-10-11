import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

// The pinned runner checks this guard before saving failure DOM/aria context.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = "1";

// No webServer: documents/resources are intercepted, including the single
// runtime-only public-owned live GET. Browser identity remains at its defaults.
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
    serviceWorkers: "block",
    navigationTimeout: 15000,
    actionTimeout: 10000,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
});
