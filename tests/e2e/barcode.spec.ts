import { test, expect } from '@playwright/test';

test.describe('バーコード生成ページ - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/barcode');
    await page.waitForLoadState('networkidle');
  });

  test('ページタイトルにバーコード生成が含まれる', async ({ page }) => {
    await expect(page).toHaveTitle(/バーコード生成/);
  });

  test('undefinedコンテンツが含まれない', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('アクセシビリティ属性が正しく設定されている', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('フォーマット選択が表示される', async ({ page }) => {
    const select = page.locator('select#barcode-format');
    await expect(select).toBeVisible();
  });

  test('入力フィールドが表示される', async ({ page }) => {
    const input = page.locator('input#barcode-value');
    await expect(input).toBeVisible();
  });

  test('高さ選択が表示される', async ({ page }) => {
    const heightSelect = page.locator('select#barcode-height');
    await expect(heightSelect).toBeVisible();
  });

  test('線幅選択が表示される', async ({ page }) => {
    const lineWidthSelect = page.locator('select#barcode-linewidth');
    await expect(lineWidthSelect).toBeVisible();
  });

  test('前景色入力が表示される', async ({ page }) => {
    const fgColorInput = page.locator('input#barcode-fg-color');
    await expect(fgColorInput).toBeVisible();
  });

  test('背景色入力が表示される', async ({ page }) => {
    const bgColorInput = page.locator('input#barcode-bg-color');
    await expect(bgColorInput).toBeVisible();
  });

  test('PNGダウンロードボタンが表示される', async ({ page }) => {
    const downloadBtn = page.locator('button:has-text("PNGでダウンロード")');
    await expect(downloadBtn).toBeVisible();
  });

  test('クリップボードコピーボタンが表示される', async ({ page }) => {
    const copyBtn = page.locator('button:has-text("クリップボードにコピー")');
    await expect(copyBtn).toBeVisible();
  });

  test('デフォルト値でバーコードが生成される', async ({ page }) => {
    const svg = page.locator('svg[role="img"]');
    await expect(svg).toBeVisible();
  });

  test('デフォルト値でダウンロードボタンが有効になっている', async ({ page }) => {
    const downloadBtn = page.locator('button:has-text("PNGでダウンロード")');
    await expect(downloadBtn).not.toBeDisabled();
  });

  test('入力値を変更するとバーコードが更新される', async ({ page }) => {
    const input = page.locator('input#barcode-value');
    await input.fill('NewValue123');
    const svg = page.locator('svg[role="img"]');
    await expect(svg).toBeVisible();
  });

  test('入力値をクリアするとプレースホルダーテキストが表示される', async ({ page }) => {
    const input = page.locator('input#barcode-value');
    await input.fill('');
    const placeholder = page.locator('.barcode-placeholder-text');
    await expect(placeholder).toBeVisible();
  });

  test('入力値をクリアするとダウンロードボタンが無効になる', async ({ page }) => {
    const input = page.locator('input#barcode-value');
    await input.fill('');
    const downloadBtn = page.locator('button:has-text("PNGでダウンロード")');
    await expect(downloadBtn).toBeDisabled();
  });

  test('無効な入力値でエラーメッセージが表示される（EAN13）', async ({ page }) => {
    const formatSelect = page.locator('select#barcode-format');
    await formatSelect.selectOption('EAN13');
    const input = page.locator('input#barcode-value');
    await input.fill('invalid');
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });

  test('設定セクションの見出しが表示される', async ({ page }) => {
    const headings = page.locator('.section-title');
    await expect(headings.first()).toBeVisible();
    await expect(headings.first()).toContainText('バーコード設定');
  });

  test('プレビューセクションの見出しが表示される', async ({ page }) => {
    const headings = page.locator('.section-title');
    await expect(headings.nth(1)).toBeVisible();
    await expect(headings.nth(1)).toContainText('プレビュー');
  });

  test('TipsCardが表示される', async ({ page }) => {
    const tipsCard = page.locator('.info-box').first();
    await expect(tipsCard).toBeVisible();
    const tipsText = await tipsCard.textContent();
    expect(tipsText).not.toContain('undefined');
  });

  test('ナビゲーションに生成カテゴリが表示される', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '生成' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const barcodeLink = dropdown.locator('a[href="/barcode"]');
    await expect(barcodeLink).toBeVisible();
    await expect(barcodeLink).toContainText('バーコード');
  });
});
