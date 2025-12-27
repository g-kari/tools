import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  // CI環境では並列実行を無効化（Vite SSRサーバーとの競合を回避）
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  // CI環境ではネットワーク不安定に対応するためリトライを有効化
  retries: process.env.CI ? 2 : 0,
  // CI環境ではシングルワーカーで実行
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  // CI環境ではタイムアウトを延長
  timeout: process.env.CI ? 30000 : 10000,
  // CI環境では5回連続失敗でテストを中断
  maxFailures: process.env.CI ? 5 : 0,
  use: {
    // CI環境では127.0.0.1を明示的に使用（localhost解決の問題を回避）
    baseURL: process.env.BASE_URL?.replace('localhost', '127.0.0.1') || 'http://localhost:8788',
    // ナビゲーションタイムアウトを延長
    navigationTimeout: process.env.CI ? 30000 : 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // CI環境でのChromium設定
        launchOptions: process.env.CI ? {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        } : undefined,
      },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npx wrangler pages dev dist --port 8788',
    url: 'http://localhost:8788',
    reuseExistingServer: !process.env.CI,
  },
});
