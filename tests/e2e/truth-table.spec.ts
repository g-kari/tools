import { test, expect } from '@playwright/test';

test.describe('論理式真理値表ジェネレーター', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/truth-table');
  });

  test('ページタイトルが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '論理式真理値表' })).toBeVisible();
  });

  test('初期値 "A AND B" の真理値表が表示される', async ({ page }) => {
    await expect(page.locator('.truth-table')).toBeVisible();
    // 4行（thead除く）
    const rows = page.locator('.truth-table tbody tr');
    await expect(rows).toHaveCount(4);
  });

  test('式を入力すると真理値表が更新される', async ({ page }) => {
    const input = page.locator('#truth-input');
    await input.fill('A OR B OR C');
    const rows = page.locator('.truth-table tbody tr');
    await expect(rows).toHaveCount(8);
  });

  test('不正な式でエラーメッセージが表示される', async ({ page }) => {
    const input = page.locator('#truth-input');
    await input.fill('A AND @');
    await expect(page.locator('.truth-table-error')).toBeVisible();
  });

  test('サンプルボタンクリックで式が変わる', async ({ page }) => {
    await page.getByRole('button', { name: 'NOT A' }).click();
    const rows = page.locator('.truth-table tbody tr');
    await expect(rows).toHaveCount(2);
  });

  test('CSV ダウンロードボタンが存在する', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'CSV ダウンロード' })
    ).toBeVisible();
  });
});
