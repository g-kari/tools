import { test, expect } from '@playwright/test';

test.describe('Unit Converter - E2E Tests', () => {
  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(page: import('@playwright/test').Page, categoryName: string, linkHref: string) {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: categoryName });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/unit-converter', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.unit-category-grid');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/単位変換/);
  });

  test('should have all 8 category buttons', async ({ page }) => {
    const categoryButtons = page.locator('.unit-category-btn');
    await expect(categoryButtons).toHaveCount(8);

    await expect(page.locator('.unit-category-btn', { hasText: '長さ' })).toBeVisible();
    await expect(page.locator('.unit-category-btn', { hasText: '重さ' })).toBeVisible();
    await expect(page.locator('.unit-category-btn', { hasText: '温度' })).toBeVisible();
    await expect(page.locator('.unit-category-btn', { hasText: 'データサイズ' })).toBeVisible();
    await expect(page.locator('.unit-category-btn', { hasText: '面積' })).toBeVisible();
    await expect(page.locator('.unit-category-btn', { hasText: '体積' })).toBeVisible();
    await expect(page.locator('.unit-category-btn', { hasText: '速度' })).toBeVisible();
    await expect(page.locator('.unit-category-btn', { hasText: '時間' })).toBeVisible();
  });

  test('should have length category active by default', async ({ page }) => {
    const lengthBtn = page.locator('.unit-category-btn', { hasText: '長さ' });
    await expect(lengthBtn).toHaveClass(/active/);
  });

  test('should have input field and unit selectors', async ({ page }) => {
    const inputField = page.locator('#unitInput');
    const fromUnitSelect = page.locator('#fromUnit');
    const toUnitSelect = page.locator('#toUnit');

    await expect(inputField).toBeVisible();
    await expect(fromUnitSelect).toBeVisible();
    await expect(toUnitSelect).toBeVisible();
  });

  test('should have history and clear buttons', async ({ page }) => {
    const historyButton = page.locator('button.unit-btn-primary');
    const clearButton = page.locator('button.unit-btn-secondary');

    await expect(historyButton).toBeVisible();
    await expect(historyButton).toContainText('履歴に追加');
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toContainText('クリア');
  });

  test('should have swap button in the middle', async ({ page }) => {
    const swapBtn = page.locator('.unit-swap-btn');
    await expect(swapBtn).toBeVisible();
  });

  test('should convert meters to kilometers', async ({ page }) => {
    const inputField = page.locator('#unitInput');
    const fromUnitSelect = page.locator('#fromUnit');
    const toUnitSelect = page.locator('#toUnit');
    const resultDiv = page.locator('.unit-result');

    await fromUnitSelect.selectOption('m');
    await toUnitSelect.selectOption('km');
    await inputField.fill('1000');

    const resultText = await resultDiv.textContent();
    expect(resultText).toContain('1');
  });

  test('should convert kilometers to meters', async ({ page }) => {
    const inputField = page.locator('#unitInput');
    const fromUnitSelect = page.locator('#fromUnit');
    const toUnitSelect = page.locator('#toUnit');
    const resultDiv = page.locator('.unit-result');

    await fromUnitSelect.selectOption('km');
    await toUnitSelect.selectOption('m');
    await inputField.fill('1');

    const resultText = await resultDiv.textContent();
    expect(resultText).toContain('1,000');
  });

  test('should show real-time conversion', async ({ page }) => {
    const inputField = page.locator('#unitInput');
    const fromUnitSelect = page.locator('#fromUnit');
    const toUnitSelect = page.locator('#toUnit');
    const resultDiv = page.locator('.unit-result');

    await fromUnitSelect.selectOption('m');
    await toUnitSelect.selectOption('cm');
    await inputField.fill('1');

    // Result should update automatically without clicking convert
    const resultText = await resultDiv.textContent();
    expect(resultText).toContain('100');
  });

  test('should swap units when swap button is clicked', async ({ page }) => {
    const fromUnitSelect = page.locator('#fromUnit');
    const toUnitSelect = page.locator('#toUnit');
    const swapBtn = page.locator('.unit-swap-btn');

    await fromUnitSelect.selectOption('m');
    await toUnitSelect.selectOption('km');

    const initialFromValue = await fromUnitSelect.inputValue();
    const initialToValue = await toUnitSelect.inputValue();

    await swapBtn.click();

    const swappedFromValue = await fromUnitSelect.inputValue();
    const swappedToValue = await toUnitSelect.inputValue();

    expect(swappedFromValue).toBe(initialToValue);
    expect(swappedToValue).toBe(initialFromValue);
  });

  test('should clear input when clear button is clicked', async ({ page }) => {
    const inputField = page.locator('#unitInput');
    const clearButton = page.locator('button.unit-btn-secondary');
    const resultDiv = page.locator('.unit-result');

    await inputField.fill('100');
    await clearButton.click();

    const inputValue = await inputField.inputValue();
    expect(inputValue).toBe('');

    const resultText = await resultDiv.textContent();
    expect(resultText).toContain('—');
  });

  test('should change category when category button is clicked', async ({ page }) => {
    const weightBtn = page.locator('.unit-category-btn', { hasText: '重さ' });
    const fromUnitSelect = page.locator('#fromUnit');

    await weightBtn.click();

    await expect(weightBtn).toHaveClass(/active/);

    // Unit options should change to weight units
    const options = await fromUnitSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('グラム'))).toBe(true);
    expect(options.some(opt => opt.includes('キログラム'))).toBe(true);
  });

  test('should convert temperature correctly', async ({ page }) => {
    const tempBtn = page.locator('.unit-category-btn', { hasText: '温度' });
    const inputField = page.locator('#unitInput');
    const fromUnitSelect = page.locator('#fromUnit');
    const toUnitSelect = page.locator('#toUnit');
    const resultDiv = page.locator('.unit-result');

    await tempBtn.click();
    await fromUnitSelect.selectOption('c');
    await toUnitSelect.selectOption('f');
    await inputField.fill('0');

    const resultText = await resultDiv.textContent();
    expect(resultText).toContain('32');
  });

  test('should show toast when trying to convert empty input', async ({ page }) => {
    const historyButton = page.locator('button.unit-btn-primary');
    const inputField = page.locator('#unitInput');

    await inputField.fill('');
    await historyButton.click();

    const toast = page.locator('.toast-error');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('数値を入力してください');
  });

  test('should add conversion to history', async ({ page }) => {
    const inputField = page.locator('#unitInput');
    const historyButton = page.locator('button.unit-btn-primary');

    await inputField.fill('100');
    await historyButton.click();

    const historySection = page.locator('.unit-history-list');
    await expect(historySection).toBeVisible();

    const historyItem = page.locator('.unit-history-item').first();
    await expect(historyItem).toBeVisible();
    await expect(historyItem).toContainText('長さ');
  });

  test('should limit history to 5 items', async ({ page }) => {
    const inputField = page.locator('#unitInput');
    const historyButton = page.locator('button.unit-btn-primary');

    // Perform more than 5 conversions
    for (let i = 1; i <= 7; i++) {
      await inputField.fill(String(i * 100));
      await historyButton.click();
    }

    const historyItems = page.locator('.unit-history-item');
    await expect(historyItems).toHaveCount(5);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();

    // Check radiogroup for category selection
    await expect(page.locator('[role="radiogroup"]')).toBeVisible();
  });

  test('should display usage instructions', async ({ page }) => {
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('使い方');
    expect(usageText).toContain('カテゴリを選択');
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation link to unit converter in category dropdown', async ({ page }) => {
    await page.goto('/');
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '変換' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const unitConverterLink = dropdown.locator('a[href="/unit-converter"]');
    await expect(unitConverterLink).toBeVisible();
    await expect(unitConverterLink).toContainText('単位変換');
  });

  test('should navigate to unit converter from other pages via category', async ({ page }) => {
    await page.goto('/');
    await navigateViaCategory(page, '変換', '/unit-converter');
    await expect(page).toHaveURL('/unit-converter');
  });

  test('should show active state on category button when on unit-converter page', async ({ page }) => {
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('変換');
  });

  test('should handle data size conversions', async ({ page }) => {
    const dataSizeBtn = page.locator('.unit-category-btn', { hasText: 'データサイズ' });
    const inputField = page.locator('#unitInput');
    const fromUnitSelect = page.locator('#fromUnit');
    const toUnitSelect = page.locator('#toUnit');
    const resultDiv = page.locator('.unit-result');

    await dataSizeBtn.click();
    await fromUnitSelect.selectOption('kb');
    await toUnitSelect.selectOption('b');
    await inputField.fill('1');

    const resultText = await resultDiv.textContent();
    expect(resultText).toContain('1,024');
  });

  test('should handle area conversions with Japanese units', async ({ page }) => {
    const areaBtn = page.locator('.unit-category-btn', { hasText: '面積' });
    const inputField = page.locator('#unitInput');
    const fromUnitSelect = page.locator('#fromUnit');
    const resultDiv = page.locator('.unit-result');

    await areaBtn.click();

    // Check that tsubo (坪) and jo (畳) are available
    const options = await fromUnitSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('坪'))).toBe(true);
    expect(options.some(opt => opt.includes('畳'))).toBe(true);

    await inputField.fill('1');
    const resultText = await resultDiv.textContent();
    expect(resultText).not.toContain('—');
  });

  test('should handle negative temperature conversion', async ({ page }) => {
    const tempBtn = page.locator('.unit-category-btn', { hasText: '温度' });
    const inputField = page.locator('#unitInput');
    const fromUnitSelect = page.locator('#fromUnit');
    const toUnitSelect = page.locator('#toUnit');
    const resultDiv = page.locator('.unit-result');

    await tempBtn.click();
    await fromUnitSelect.selectOption('c');
    await toUnitSelect.selectOption('f');
    await inputField.fill('-40');

    // -40°C = -40°F
    const resultText = await resultDiv.textContent();
    expect(resultText).toContain('-40');
  });

  test('should use keyboard shortcut Ctrl+Enter for conversion', async ({ page }) => {
    const inputField = page.locator('#unitInput');
    const historySection = page.locator('.unit-history-list');

    await inputField.fill('500');
    await page.keyboard.press('Control+Enter');

    await expect(historySection).toBeVisible();
  });
});
