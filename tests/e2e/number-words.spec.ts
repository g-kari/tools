import { test, expect } from '@playwright/test';

test.describe('Number to Words Converter - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/number-words');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/数値テキスト変換/);
  });

  test('should display the number input field', async ({ page }) => {
    const input = page.locator('#nw-input');
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test('should convert 123 to English cardinal', async ({ page }) => {
    const input = page.locator('#nw-input');
    await input.fill('123');

    const cardinalCard = page.locator('.nw-result-card').first();
    await expect(cardinalCard).toContainText('one hundred twenty-three');
  });

  test('should convert 21 to English ordinal "twenty-first"', async ({
    page,
  }) => {
    const input = page.locator('#nw-input');
    await input.fill('21');

    const ordinalCard = page.locator('.nw-result-card').nth(1);
    await expect(ordinalCard).toContainText('twenty-first');
  });

  test('should convert 12345 to Japanese kanji', async ({ page }) => {
    const input = page.locator('#nw-input');
    await input.fill('12345');

    const kanjiCard = page.locator('.nw-result-card').nth(2);
    await expect(kanjiCard).toContainText('一万二千三百四十五');
  });

  test('should convert 300 to Japanese reading "さんびゃく"', async ({
    page,
  }) => {
    const input = page.locator('#nw-input');
    await input.fill('300');

    const readingCard = page.locator('.nw-result-card').nth(3);
    await expect(readingCard).toContainText('さんびゃく');
  });

  test('should convert 0 correctly', async ({ page }) => {
    const input = page.locator('#nw-input');
    await input.fill('0');

    const cardinalCard = page.locator('.nw-result-card').first();
    await expect(cardinalCard).toContainText('zero');

    const kanjiCard = page.locator('.nw-result-card').nth(2);
    await expect(kanjiCard).toContainText('零');
  });

  test('should show empty state for ordinal when input is 0', async ({
    page,
  }) => {
    const input = page.locator('#nw-input');
    await input.fill('0');

    // Ordinal is not available for 0
    const ordinalCard = page.locator('.nw-result-card').nth(1);
    await expect(ordinalCard).toContainText('—');
  });

  test('should show error for non-integer input via button click', async ({
    page,
  }) => {
    const input = page.locator('#nw-input');
    const convertBtn = page.locator('button[aria-label="数値をテキストに変換"]');

    await input.fill('1.5');
    await convertBtn.click();

    const error = page.locator('.nw-error');
    await expect(error).toBeVisible();
  });

  test('should clear the input and results when clear button is clicked', async ({
    page,
  }) => {
    const input = page.locator('#nw-input');
    await input.fill('42');

    await expect(
      page.locator('.nw-result-card').first().locator('.nw-result-value')
    ).toBeVisible();

    const clearBtn = page.locator('button[aria-label="入力と結果をクリア"]');
    await clearBtn.click();

    await expect(input).toHaveValue('');
    // After clearing, result values should not be shown
    const resultValues = page.locator('.nw-result-value');
    await expect(resultValues).toHaveCount(0);
  });

  test('should have copy buttons enabled when result exists', async ({
    page,
  }) => {
    const input = page.locator('#nw-input');
    await input.fill('100');

    const copyButtons = page.locator('.nw-copy-button');
    const firstBtn = copyButtons.first();
    await expect(firstBtn).not.toBeDisabled();
  });

  test('should have copy buttons disabled when no result', async ({ page }) => {
    const copyButtons = page.locator('.nw-copy-button');
    const count = await copyButtons.count();
    for (let i = 0; i < count; i++) {
      await expect(copyButtons.nth(i)).toBeDisabled();
    }
  });

  test('should convert 1000000 to "one million"', async ({ page }) => {
    const input = page.locator('#nw-input');
    await input.fill('1000000');

    const cardinalCard = page.locator('.nw-result-card').first();
    await expect(cardinalCard).toContainText('one million');
  });

  test('should show section heading', async ({ page }) => {
    const heading = page.locator('#nw-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('数値テキスト変換');
  });

  test('should have proper accessibility landmarks', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test('should display tips card', async ({ page }) => {
    const tips = page.locator('.tips-card');
    await expect(tips).toBeVisible();
  });
});

test.describe('Top page - Number Words tool listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/top');
    await page.waitForLoadState('networkidle');
  });

  test('should display "数値テキスト変換" in the tool list', async ({
    page,
  }) => {
    const link = page.locator('a[href="/number-words"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('数値テキスト変換');
  });

  test('should navigate to /number-words when clicking the tool card', async ({
    page,
  }) => {
    const link = page.locator('a[href="/number-words"]');
    await link.click();
    await expect(page).toHaveURL('/number-words');
  });
});
