import { test, expect } from '@playwright/test';

test.describe('docker run → Compose 変換ツール', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docker-run-to-compose');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /docker run.*docker-compose/ })
    ).toBeVisible();
    await expect(page.getByLabel('docker run コマンドを入力')).toBeVisible();
  });

  test('docker run コマンドを入力すると docker-compose.yml が生成される', async ({
    page,
  }) => {
    const input = page.getByLabel('docker run コマンドを入力');
    await input.fill('docker run -d --name nginx -p 80:80 nginx:latest');

    const output = page.getByLabel('変換された docker-compose.yml');
    await expect(output).toContainText('services:');
    await expect(output).toContainText('nginx:latest');
    await expect(output).toContainText('80:80');
  });

  test('サンプルボタンをクリックするとサンプルが読み込まれる', async ({ page }) => {
    await page.getByLabel('Nginxのサンプルを読み込む').click();

    const input = page.getByLabel('docker run コマンドを入力');
    await expect(input).not.toHaveValue('');

    const output = page.getByLabel('変換された docker-compose.yml');
    await expect(output).toContainText('services:');
  });

  test('クリアボタンで入力がクリアされる', async ({ page }) => {
    const input = page.getByLabel('docker run コマンドを入力');
    await input.fill('docker run nginx');

    await page.getByLabel('入力をクリア').click();

    await expect(input).toHaveValue('');
  });

  test('コピーボタンでYAMLがコピーできる', async ({ page }) => {
    const input = page.getByLabel('docker run コマンドを入力');
    await input.fill('docker run nginx:latest');

    await page.getByLabel('YAMLをコピー').click();
  });

  test('イメージ名のないコマンドでは空の出力が表示される', async ({ page }) => {
    const input = page.getByLabel('docker run コマンドを入力');
    await input.fill('docker run -p 80:80');

    const output = page.getByLabel('変換された docker-compose.yml');
    await expect(output).toContainText('');
  });

  test('メタデータが正しく設定されている', async ({ page }) => {
    await expect(page).toHaveTitle(/docker run.*Compose/);
  });
});
