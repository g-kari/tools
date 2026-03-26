import { test, expect } from '@playwright/test';

test.describe('CSS 論理プロパティ変換', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/css-logical');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/CSS 論理プロパティ変換/);
    await expect(page.getByLabel('変換対象の CSS を入力')).toBeVisible();
    await expect(page.getByRole('region', { name: '変換結果' })).toBeVisible();
  });

  test('デフォルトのサンプルが読み込まれている', async ({ page }) => {
    const input = page.getByLabel('変換対象の CSS を入力');
    await expect(input).not.toBeEmpty();
  });

  test('CSS を入力すると変換結果が表示される', async ({ page }) => {
    const input = page.getByLabel('変換対象の CSS を入力');
    await input.clear();
    await input.fill('  margin-left: 16px;');
    await expect(page.getByRole('region', { name: '変換結果' })).toContainText(
      'margin-inline-start: 16px;',
    );
  });

  test('変換件数が表示される', async ({ page }) => {
    const input = page.getByLabel('変換対象の CSS を入力');
    await input.clear();
    await input.fill('margin-left: 16px;\npadding-top: 8px;');
    await expect(page.getByText(/2 件変換/)).toBeVisible();
  });

  test('サンプルボタンで切り替えられる', async ({ page }) => {
    await page.getByRole('button', { name: 'フォームレイアウト' }).click();
    const input = page.getByLabel('変換対象の CSS を入力');
    await expect(input).toContainText('form-field');
  });

  test('クリアボタンで入力がリセットされる', async ({ page }) => {
    await page.getByRole('button', { name: 'クリア' }).click();
    const input = page.getByLabel('変換対象の CSS を入力');
    await expect(input).toHaveValue('');
  });

  test('結果をコピーボタンが動作する', async ({ page }) => {
    const input = page.getByLabel('変換対象の CSS を入力');
    await input.clear();
    await input.fill('margin-left: 16px;');
    const copyBtn = page.getByRole('button', { name: '結果をコピー' });
    await expect(copyBtn).toBeEnabled();
  });

  test('プロパティ対応表のタブが切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: 'Padding' }).click();
    await expect(page.getByText('padding-top')).toBeVisible();
    await expect(page.getByText('padding-block-start')).toBeVisible();
  });

  test('対応表に margin のエントリが表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Margin' })).toBeVisible();
    await expect(page.getByText('margin-left')).toBeVisible();
    await expect(page.getByText('margin-inline-start')).toBeVisible();
  });

  test('変換なしのCSSは「変換なし」と表示される', async ({ page }) => {
    const input = page.getByLabel('変換対象の CSS を入力');
    await input.clear();
    await input.fill('color: red;');
    await expect(page.getByText('変換なし')).toBeVisible();
  });
});
