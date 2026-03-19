import { test, expect } from '@playwright/test';

test.describe('HTML/CSS/JS プレイグラウンド', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/html-playground');
  });

  test('ページタイトルが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/HTML\/CSS\/JS プレイグラウンド/);
  });

  test('エディタータブが 3 つ表示される', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'HTML' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'CSS' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'JavaScript' })).toBeVisible();
  });

  test('プレビュー iframe が表示される', async ({ page }) => {
    await expect(page.locator('.hp-iframe')).toBeVisible();
  });

  test('サンプルセレクターが表示される', async ({ page }) => {
    await expect(page.locator('#hp-sample-select')).toBeVisible();
  });

  test('タブをクリックで切り替えられる', async ({ page }) => {
    await page.getByRole('tab', { name: 'CSS' }).click();
    await expect(page.getByRole('tab', { name: 'CSS' })).toHaveClass(/active/);
  });

  test('HTML をコピーボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: /HTML をコピー/ })).toBeVisible();
  });

  test('クリアボタンが動作する', async ({ page }) => {
    await page.getByRole('button', { name: /クリア/ }).click();
    const textarea = page.locator('.hp-code-area');
    await expect(textarea).toHaveValue('');
  });

  test('コードを入力するとプレビューが更新される', async ({ page }) => {
    await page.getByRole('tab', { name: 'HTML' }).click();
    const textarea = page.locator('.hp-code-area');
    await textarea.fill('<h1 id="test-heading">Hello Playground</h1>');
    // iframe に srcdoc が設定されることを確認
    await expect(page.locator('.hp-iframe')).toHaveAttribute('srcdoc', /.+/);
  });
});
