import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["emoji-gif.spec.ts", "real-encode.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  outputDir: "../../../test-results/emoji-gif-browser",
  reporter: [["list"], ["json", { outputFile: "test-results/emoji-gif-browser.json" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4194",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node serve-fixture.mjs",
    url: "http://127.0.0.1:4194/shim/",
    reuseExistingServer: false,
    timeout: 10000,
  },
});
