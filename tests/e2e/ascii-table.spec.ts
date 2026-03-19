import { test, expect } from '@playwright/test';

test.describe('ASCII テーブル - E2E テスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ascii-table');
    await page.waitForLoadState('networkidle');
  });

  test('ページが正常に表示される', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
  });

  test('正しいページタイトルが表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/ASCII/);
  });

  test('テーブルが表示される', async ({ page }) => {
    const table = page.locator('.asc-table');
    await expect(table).toBeVisible();
  });

  test('128件のエントリが表示される', async ({ page }) => {
    const count = page.locator('.asc-count');
    await expect(count).toContainText('128');
  });

  test('フィルターボタンが3つ表示される', async ({ page }) => {
    const allBtn = page.locator('.asc-filter-btn', { hasText: 'すべて' });
    const controlBtn = page.locator('.asc-filter-btn', { hasText: '制御文字' });
    const printableBtn = page.locator('.asc-filter-btn', { hasText: '印刷可能' });
    await expect(allBtn).toBeVisible();
    await expect(controlBtn).toBeVisible();
    await expect(printableBtn).toBeVisible();
  });

  test('デフォルトで「すべて」フィルターがアクティブ', async ({ page }) => {
    const allBtn = page.locator('.asc-filter-btn', { hasText: 'すべて' });
    await expect(allBtn).toHaveClass(/active/);
  });

  test('制御文字フィルターが機能する', async ({ page }) => {
    await page.locator('.asc-filter-btn', { hasText: '制御文字' }).click();
    const count = page.locator('.asc-count');
    await expect(count).toContainText('33');
  });

  test('印刷可能フィルターが機能する', async ({ page }) => {
    await page.locator('.asc-filter-btn', { hasText: '印刷可能' }).click();
    const count = page.locator('.asc-count');
    await expect(count).toContainText('95');
  });

  test('検索機能: "NUL" で検索できる', async ({ page }) => {
    await page.locator('#asc-search').fill('NUL');
    const rows = page.locator('.asc-row');
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  });

  test('検索クリアボタンが機能する', async ({ page }) => {
    await page.locator('#asc-search').fill('test');
    const clearBtn = page.locator('.asc-search-clear');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(page.locator('#asc-search')).toHaveValue('');
    const count = page.locator('.asc-count');
    await expect(count).toContainText('128');
  });

  test('コピーボタンが各行に表示される', async ({ page }) => {
    const copyBtns = page.locator('.asc-copy-btn');
    expect(await copyBtns.count()).toBeGreaterThan(0);
  });

  test('テーブルにヘッダー列が表示される', async ({ page }) => {
    const headerText = await page.locator('.asc-table thead').textContent();
    expect(headerText).toContain('Dec');
    expect(headerText).toContain('Hex');
    expect(headerText).toContain('Bin');
    expect(headerText).toContain('HTML');
  });

  test('アクセシビリティ: role属性が正しく設定されている', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test('ナビゲーションの変換カテゴリにASCIIテーブルリンクが表示される', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '変換' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/ascii-table"]');
    await expect(link).toBeVisible();
  });
});
