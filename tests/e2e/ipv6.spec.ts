import { test, expect } from '@playwright/test';

test.describe('IPv6アドレス解析・変換', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ipv6');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /IPv6/ })).toBeVisible();
    await expect(page.getByLabel('IPv6アドレス入力')).toBeVisible();
  });

  test('サンプルボタンでループバックを入力できる', async ({ page }) => {
    await page.getByRole('button', { name: /ループバック/ }).click();
    await expect(page.getByLabel('IPv6アドレス入力')).toHaveValue('::1');
    await expect(page.getByRole('status')).toContainText('ループバックアドレス');
  });

  test('ループバックアドレスを解析する', async ({ page }) => {
    await page.getByLabel('IPv6アドレス入力').fill('::1');
    await expect(page.getByRole('status')).toContainText('ループバックアドレス');
    await expect(page.getByText('::1')).toBeVisible();
    await expect(page.getByText('0000:0000:0000:0000:0000:0000:0000:0001')).toBeVisible();
  });

  test('IPv4射影アドレスを解析する', async ({ page }) => {
    await page.getByLabel('IPv6アドレス入力').fill('::ffff:192.168.1.1');
    await expect(page.getByRole('status')).toContainText('IPv4射影アドレス');
    await expect(page.getByText('192.168.1.1')).toBeVisible();
  });

  test('グローバルユニキャストを解析する', async ({ page }) => {
    await page.getByLabel('IPv6アドレス入力').fill('2001:db8::1');
    await expect(page.getByRole('status')).toContainText('ドキュメント用アドレス');
  });

  test('無効なアドレスでエラーを表示する', async ({ page }) => {
    await page.getByLabel('IPv6アドレス入力').fill('not-valid');
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('クリアボタンで入力をクリアする', async ({ page }) => {
    await page.getByLabel('IPv6アドレス入力').fill('::1');
    await page.getByLabel('入力をクリア').click();
    await expect(page.getByLabel('IPv6アドレス入力')).toHaveValue('');
  });

  test('コピーボタンが機能する', async ({ page }) => {
    await page.getByLabel('IPv6アドレス入力').fill('::1');
    await page.getByRole('button', { name: /圧縮形式をコピー/ }).first().click();
    await expect(page.getByText('コピーしました')).toBeVisible();
  });

  test('8グループのビジュアライザーが表示される', async ({ page }) => {
    await page.getByLabel('IPv6アドレス入力').fill('::1');
    const grid = page.getByLabel('グループ分割');
    await expect(grid).toBeVisible();
    const items = grid.getByRole('listitem');
    await expect(items).toHaveCount(8);
  });

  test('2進数表示が表示される', async ({ page }) => {
    await page.getByLabel('IPv6アドレス入力').fill('::1');
    await expect(page.getByLabel('128ビット2進数表現')).toBeVisible();
  });
});
