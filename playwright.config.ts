import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  // CI環境では並列実行を無効化（Vite SSRサーバーとの競合を回避）
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // CI環境ではシングルワーカーで実行
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  timeout: 10000,
  // CI環境では3回連続失敗でテストを中断
  maxFailures: process.env.CI ? 3 : 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8788',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npx wrangler pages dev dist --port 8788',
    url: 'http://localhost:8788',
    reuseExistingServer: !process.env.CI,
  },
});
