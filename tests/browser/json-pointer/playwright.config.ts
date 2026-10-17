import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";

/** GitHubホスト環境で実コンポーネントの限定ブラウザ検証を実行する。 */
export default defineConfig({
  testDir: ".",
  testMatch: "json-pointer.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 15000,
  outputDir: "../../../test-results/json-pointer-browser",
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL("../../../test-results/json-pointer-browser.json", import.meta.url),
        ),
      },
    ],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4197",
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
    url: "http://127.0.0.1:4197/",
    reuseExistingServer: false,
    timeout: 10000,
  },
});
