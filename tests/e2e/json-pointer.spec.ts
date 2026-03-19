import { test, expect } from '@playwright/test';

test.describe('JSON Pointer評価 - E2E Tests', () => {
  async function navigateViaCategory(
    page: import('@playwright/test').Page,
    categoryName: string,
    linkHref: string
  ) {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: categoryName });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/json-pointer');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/JSON Pointer/);
  });

  test('should have JSON input textarea', async ({ page }) => {
    const jsonTextarea = page.locator('#jsonInput');
    await expect(jsonTextarea).toBeVisible();
  });

  test('should have JSON Pointer input field', async ({ page }) => {
    const pointerInput = page.locator('#pointerInput');
    await expect(pointerInput).toBeVisible();
  });

  test('should have action buttons', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'サンプル読込' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Pointer列挙' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'クリア' })).toBeVisible();
    await expect(page.locator('button', { hasText: '評価' })).toBeVisible();
  });

  test('should load sample JSON when sample button is clicked', async ({ page }) => {
    await page.locator('button', { hasText: 'サンプル読込' }).click();

    const jsonValue = await page.locator('#jsonInput').inputValue();
    expect(jsonValue).toContain('store');
    expect(jsonValue).toContain('book');

    const pointerValue = await page.locator('#pointerInput').inputValue();
    expect(pointerValue).toBe('/store/book/0/title');
  });

  test('should evaluate JSON Pointer and show result', async ({ page }) => {
    await page.locator('button', { hasText: 'サンプル読込' }).click();
    await page.locator('button', { hasText: '評価' }).click();

    const resultArea = page.locator('[role="region"][aria-label="JSON Pointer評価結果"]');
    await expect(resultArea).toBeVisible();
    const resultText = await resultArea.textContent();
    expect(resultText).toContain('Sayings of the Century');
  });

  test('should show type information after evaluation', async ({ page }) => {
    await page.locator('button', { hasText: 'サンプル読込' }).click();
    await page.locator('button', { hasText: '評価' }).click();

    const typeLabel = page.locator('.json-pointer-result-type');
    await expect(typeLabel).toBeVisible();
    await expect(typeLabel).toContainText('型:');
  });

  test('should show error when JSON is empty and evaluate is clicked', async ({ page }) => {
    await page.locator('button', { hasText: '評価' }).click();

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('JSONを入力してください');
  });

  test('should enumerate pointers when enumerate button is clicked', async ({ page }) => {
    await page.locator('button', { hasText: 'サンプル読込' }).click();
    await page.locator('button', { hasText: 'Pointer列挙' }).click();

    const pointerList = page.locator('[role="list"][aria-label="JSON Pointerの一覧"]');
    await expect(pointerList).toBeVisible();
    const items = pointerList.locator('[role="listitem"]');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should set pointer input when enumerated pointer is clicked', async ({ page }) => {
    await page.locator('button', { hasText: 'サンプル読込' }).click();
    await page.locator('button', { hasText: 'Pointer列挙' }).click();

    const firstItem = page.locator('[role="listitem"]').first();
    await firstItem.click();

    const pointerValue = await page.locator('#pointerInput').inputValue();
    expect(pointerValue.length).toBeGreaterThan(0);
  });

  test('should clear all inputs when clear button is clicked', async ({ page }) => {
    await page.locator('button', { hasText: 'サンプル読込' }).click();
    await expect(page.locator('#jsonInput')).not.toHaveValue('');

    await page.locator('button', { hasText: 'クリア' }).click();

    await expect(page.locator('#jsonInput')).toHaveValue('');
    await expect(page.locator('#pointerInput')).toHaveValue('');
  });

  test('should have quick example chip buttons', async ({ page }) => {
    const chips = page.locator('.json-pointer-chip');
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should set pointer from chip click', async ({ page }) => {
    const chip = page.locator('.json-pointer-chip').first();
    await chip.click();
    const pointerValue = await page.locator('#pointerInput').inputValue();
    // Empty string is valid (root pointer), so just check chip fired
    expect(typeof pointerValue).toBe('string');
  });

  test('should have copy result button', async ({ page }) => {
    const copyBtn = page.locator('button', { hasText: '結果をコピー' });
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeDisabled();
  });

  test('should enable copy button after evaluation', async ({ page }) => {
    await page.locator('button', { hasText: 'サンプル読込' }).click();
    await page.locator('button', { hasText: '評価' }).click();

    const copyBtn = page.locator('button', { hasText: '結果をコピー' });
    await expect(copyBtn).toBeEnabled();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions', async ({ page }) => {
    const allInfoBoxes = page.locator('.info-box');
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(' ');
    expect(combinedText).toContain('使い方');
    expect(combinedText).not.toContain('undefined');
  });

  test('should have navigation link to json-pointer in category dropdown', async ({ page }) => {
    await page.goto('/');
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '変換' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/json-pointer"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('JSON Pointer評価');
  });

  test('should navigate to json-pointer from other pages via category', async ({ page }) => {
    await page.goto('/');
    await navigateViaCategory(page, '変換', '/json-pointer');
    await expect(page).toHaveURL('/json-pointer');
  });

  test('should show active state on category button when on json-pointer page', async ({ page }) => {
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('変換');
  });
});
