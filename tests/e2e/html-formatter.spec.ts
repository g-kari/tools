import { test, expect } from '@playwright/test';

test.describe('HTML フォーマッター', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/html-formatter');
  });

  test('ページが正常に表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/HTML フォーマッター/);
    await expect(page.getByLabel('整形対象の HTML テキスト')).toBeVisible();
  });

  test('インデントオプションが表示される', async ({ page }) => {
    await expect(page.getByRole('radio', { name: '2スペース' })).toBeVisible();
    await expect(page.getByRole('radio', { name: '4スペース' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'タブ' })).toBeVisible();
  });

  test('HTML を整形できる', async ({ page }) => {
    const input = page.getByLabel('整形対象の HTML テキスト');
    await input.fill('<div><p>Hello</p></div>');
    await page.getByRole('button', { name: 'HTML を整形' }).click();
    const output = page.getByLabel('HTML 整形結果の出力欄');
    const value = await output.inputValue();
    expect(value).toContain('<div>');
    expect(value).toContain('<p>');
    expect(value).toContain('Hello');
  });

  test('サンプルボタンが動作する', async ({ page }) => {
    await page.getByRole('button', { name: 'サンプル HTML をセット' }).click();
    const input = page.getByLabel('整形対象の HTML テキスト');
    await expect(input).not.toHaveValue('');
  });

  test('サンプルを整形すると統計が表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'サンプル HTML をセット' }).click();
    await page.getByRole('button', { name: 'HTML を整形' }).click();
    await expect(page.getByText('要素数')).toBeVisible();
    await expect(page.getByText('トークン数')).toBeVisible();
  });

  test('空入力でエラートーストが表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'HTML を整形' }).click();
    await expect(page.getByText('HTML を入力してください')).toBeVisible();
  });

  test('クリアボタンが動作する', async ({ page }) => {
    const input = page.getByLabel('整形対象の HTML テキスト');
    await input.fill('<div></div>');
    await page.getByRole('button', { name: '入力と出力をクリア' }).click();
    await expect(input).toHaveValue('');
  });

  test('4スペースオプションで整形できる', async ({ page }) => {
    await page.getByRole('radio', { name: '4スペース' }).click();
    const input = page.getByLabel('整形対象の HTML テキスト');
    await input.fill('<div><p>text</p></div>');
    await page.getByRole('button', { name: 'HTML を整形' }).click();
    const output = page.getByLabel('HTML 整形結果の出力欄');
    const value = await output.inputValue();
    expect(value).toContain('    <p>');
  });

  test('TipsCard が表示される', async ({ page }) => {
    await expect(page.getByText('使い方')).toBeVisible();
    await expect(page.getByText('対応している機能')).toBeVisible();
  });
});
