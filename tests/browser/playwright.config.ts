import { defineConfig, devices } from "@playwright/test";

/** GitHubホスト環境で実コンポーネントの限定ブラウザ検証を実行する。 */
export default defineConfig({
  testDir: ".",
  testMatch: "json-lines.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 15000,
  outputDir: "../../test-results/json-lines-browser",
  reporter: [["list"], ["json", { outputFile: "test-results/json-lines-browser.json" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4193",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node serve-json-lines-fixture.mjs",
    url: "http://127.0.0.1:4193/",
    reuseExistingServer: false,
    timeout: 10000,
  },
});
