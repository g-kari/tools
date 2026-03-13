import { expect, test } from '@playwright/test';

test.describe('テキストケース変換ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/text-case');
  });

  test('ページが正しく読み込まれる', async ({ page }) => {
    await expect(page).toHaveTitle(/テキストケース変換/);
  });

  test('ページタイトルが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'テキストケース変換' })).toBeVisible();
  });

  test('入力欄が存在する', async ({ page }) => {
    await expect(page.locator('#text-case-input')).toBeVisible();
  });

  test('入力なし時にエンプティステートが表示される', async ({ page }) => {
    await expect(page.locator('.text-case-empty-state')).toBeVisible();
  });

  test('テキスト入力後に変換結果グリッドが表示される', async ({ page }) => {
    await page.locator('#text-case-input').fill('helloWorld');
    await expect(page.locator('.text-case-results-grid')).toBeVisible();
  });

  test('11種類の変換結果が表示される', async ({ page }) => {
    await page.locator('#text-case-input').fill('helloWorld');
    const items = page.locator('.text-case-result-item');
    await expect(items).toHaveCount(11);
  });

  test('camelCaseラベルが表示される', async ({ page }) => {
    await page.locator('#text-case-input').fill('helloWorld');
    await expect(page.getByText('camelCase')).toBeVisible();
  });

  test('snake_caseラベルが表示される', async ({ page }) => {
    await page.locator('#text-case-input').fill('helloWorld');
    await expect(page.getByText('snake_case')).toBeVisible();
  });

  test('コピーボタンが各結果に存在する', async ({ page }) => {
    await page.locator('#text-case-input').fill('helloWorld');
    const copyButtons = page.locator('.text-case-copy-btn');
    await expect(copyButtons).toHaveCount(11);
  });

  test('入力クリアでエンプティステートに戻る', async ({ page }) => {
    await page.locator('#text-case-input').fill('helloWorld');
    await page.locator('#text-case-input').fill('');
    await expect(page.locator('.text-case-empty-state')).toBeVisible();
  });
});
