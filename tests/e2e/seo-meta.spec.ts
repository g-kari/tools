import { test, expect } from '@playwright/test';

test.describe('SEOメタタグ生成 (/seo-meta)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seo-meta');
  });

  test('ページが正しく表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/SEOメタタグ生成/);
  });

  test('タブが5つ表示される', async ({ page }) => {
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(5);
  });

  test('基本SEOタブでタイトルを入力するとコード出力タブに反映される', async ({
    page,
  }) => {
    await page.getByLabel('ページタイトル入力（推奨60文字以内）').fill('テストページタイトル');
    await page.getByRole('tab', { name: 'コード出力' }).click();
    await expect(page.locator('.seo-meta-output')).toContainText(
      '<title>テストページタイトル</title>'
    );
  });

  test('Open Graphタブで入力したタイトルがコードに反映される', async ({ page }) => {
    await page.getByRole('tab', { name: 'Open Graph' }).click();
    await page.getByLabel('og:title入力').fill('OGタイトル');
    await page.getByRole('tab', { name: 'コード出力' }).click();
    await expect(page.locator('.seo-meta-output')).toContainText(
      'og:title'
    );
    await expect(page.locator('.seo-meta-output')).toContainText('OGタイトル');
  });

  test('プレビュータブで検索結果プレビューが表示される', async ({ page }) => {
    await page.getByRole('tab', { name: 'プレビュー' }).click();
    await expect(page.locator('.seo-search-preview')).toBeVisible();
  });

  test('コード出力タブのコピーボタンが機能する', async ({ page }) => {
    await page.getByLabel('ページタイトル入力（推奨60文字以内）').fill('コピーテスト');
    await page.getByRole('tab', { name: 'コード出力' }).click();
    const copyBtn = page.getByRole('button', { name: 'コピー' });
    await expect(copyBtn).not.toBeDisabled();
  });

  test('基本SEOから反映ボタンがOpen GraphタブとTwitterタブに表示される', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: 'Open Graph' }).click();
    await expect(
      page.getByRole('button', { name: '基本SEOから反映' })
    ).toBeVisible();

    await page.getByRole('tab', { name: 'Twitter Card' }).click();
    await expect(
      page.getByRole('button', { name: '基本SEOから反映' })
    ).toBeVisible();
  });

  test('リセットボタンで入力がクリアされる', async ({ page }) => {
    await page.getByLabel('ページタイトル入力（推奨60文字以内）').fill('テスト');
    await page.getByRole('tab', { name: 'コード出力' }).click();
    await page.getByRole('button', { name: 'リセット' }).click();
    await page.getByRole('tab', { name: '基本 SEO' }).click();
    await expect(
      page.getByLabel('ページタイトル入力（推奨60文字以内）')
    ).toHaveValue('');
  });
});
