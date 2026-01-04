import { test, expect } from '@playwright/test';

test.describe('Dice Roll - E2E Tests', () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

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
    await page.goto('/dice-roll');
    // Wait for React hydration by checking for a key element
    await page.waitForSelector('.tool-container');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/ダイスロール/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('ダイスロール設定');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions', async ({ page }) => {
    const usageSection = page.locator('.info-box').first();
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('ダイスロールとは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have category navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();

    // ゲームカテゴリがアクティブであることを確認
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('ゲーム');
  });

  test('should show ダイスロール link in category dropdown', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: 'ゲーム' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const diceLink = dropdown.locator('a[href="/dice-roll"]');
    await expect(diceLink).toBeVisible();
    await expect(diceLink).toContainText('ダイスロール');
  });

  test('should have default settings (1d6)', async ({ page }) => {
    const countInput = page.locator('input#dice-count');
    await expect(countInput).toHaveValue('1');

    const sidesInput = page.locator('input#dice-sides');
    await expect(sidesInput).toHaveValue('6');

    const notation = page.locator('.notation-value');
    await expect(notation).toContainText('1d6');
  });

  test('should display all preset dice buttons', async ({ page }) => {
    const presets = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100'];

    for (const preset of presets) {
      const button = page.getByRole('button', { name: preset, exact: true });
      await expect(button).toBeVisible();
    }
  });

  test('should change dice sides when clicking preset button', async ({ page }) => {
    const d20Button = page.getByRole('button', { name: 'D20', exact: true });
    await d20Button.click();

    const sidesInput = page.locator('input#dice-sides');
    await expect(sidesInput).toHaveValue('20');

    const notation = page.locator('.notation-value');
    await expect(notation).toContainText('1d20');
  });

  test('should highlight active preset button', async ({ page }) => {
    const d6Button = page.getByRole('button', { name: 'D6', exact: true });
    await expect(d6Button).toHaveClass(/active/);

    const d12Button = page.getByRole('button', { name: 'D12', exact: true });
    await d12Button.click();
    await expect(d12Button).toHaveClass(/active/);
    await expect(d6Button).not.toHaveClass(/active/);
  });

  test('should update notation when changing dice count', async ({ page }) => {
    const countInput = page.locator('input#dice-count');
    await countInput.fill('3');

    const notation = page.locator('.notation-value');
    await expect(notation).toContainText('3d6');
  });

  test('should update notation when changing dice sides', async ({ page }) => {
    const sidesInput = page.locator('input#dice-sides');
    await sidesInput.fill('20');

    const notation = page.locator('.notation-value');
    await expect(notation).toContainText('1d20');
  });

  test('should roll dice and display results', async ({ page }) => {
    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const diceResult = page.locator('.dice-result');
    await expect(diceResult).toBeVisible();

    const diceValue = page.locator('.dice-value').first();
    await expect(diceValue).toBeVisible();

    const diceNumber = page.locator('.dice-number').first();
    const text = await diceNumber.textContent();
    const value = parseInt(text || '0');
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(6);
  });

  test('should display multiple dice when count is changed', async ({ page }) => {
    const countInput = page.locator('input#dice-count');
    await countInput.fill('3');

    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const diceValues = page.locator('.dice-value');
    await expect(diceValues).toHaveCount(3);
  });

  test('should display total when rolling multiple dice', async ({ page }) => {
    const countInput = page.locator('input#dice-count');
    await countInput.fill('2');

    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const diceTotal = page.locator('.dice-total');
    await expect(diceTotal).toBeVisible();

    const totalValue = page.locator('.total-value');
    await expect(totalValue).toBeVisible();
  });

  test('should not display total for single die', async ({ page }) => {
    const countInput = page.locator('input#dice-count');
    await countInput.fill('1');

    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const diceTotal = page.locator('.dice-total');
    await expect(diceTotal).not.toBeVisible();
  });

  test('should display dice expression', async ({ page }) => {
    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const expression = page.locator('.dice-expression code');
    await expect(expression).toBeVisible();

    const text = await expression.textContent();
    expect(text).toMatch(/^\d+$/); // Single die should just show the number
  });

  test('should display expression with addition for multiple dice', async ({ page }) => {
    const countInput = page.locator('input#dice-count');
    await countInput.fill('3');

    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const expression = page.locator('.dice-expression code');
    const text = await expression.textContent();
    expect(text).toMatch(/^\d+ \+ \d+ \+ \d+ = \d+$/);
  });

  test('should have copy result button', async ({ page }) => {
    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const copyButton = page.locator('button.btn-secondary:has-text("結果をコピー")');
    await expect(copyButton).toBeVisible();
  });

  test('should show "コピーしました" after clicking copy button', async ({ page }) => {
    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const copyButton = page.locator('button.btn-secondary');
    await expect(copyButton).toContainText('結果をコピー');
    await copyButton.click();

    // Wait for the button text to change after copy
    await expect(copyButton).toContainText('コピーしました', { timeout: 5000 });
  });

  test('should display roll history after rolling', async ({ page }) => {
    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const historySection = page.locator('.roll-history');
    await expect(historySection).toBeVisible();

    const historyItems = page.locator('.history-item');
    await expect(historyItems).toHaveCount(1);
  });

  test('should accumulate roll history', async ({ page }) => {
    const rollButton = page.locator('button.btn-primary:has-text("ロール")');

    // Roll 3 times
    await rollButton.click();
    await rollButton.click();
    await rollButton.click();

    const historyItems = page.locator('.history-item');
    await expect(historyItems).toHaveCount(3);
  });

  test('should display notation in history', async ({ page }) => {
    const countInput = page.locator('input#dice-count');
    await countInput.fill('2');

    const sidesInput = page.locator('input#dice-sides');
    await sidesInput.fill('8');

    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const historyNotation = page.locator('.history-notation').first();
    await expect(historyNotation).toContainText('2d8');
  });

  test('should have clear history button', async ({ page }) => {
    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const clearButton = page.locator('button.btn-clear:has-text("履歴をクリア")');
    await expect(clearButton).toBeVisible();
  });

  test('should clear history when clicking clear button', async ({ page }) => {
    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();
    await rollButton.click();

    const clearButton = page.locator('button.btn-clear:has-text("履歴をクリア")');
    await clearButton.click();

    const historySection = page.locator('.roll-history');
    await expect(historySection).not.toBeVisible();
  });

  test('should limit history to 10 entries', async ({ page }) => {
    const rollButton = page.locator('button.btn-primary:has-text("ロール")');

    // Roll 15 times
    for (let i = 0; i < 15; i++) {
      await rollButton.click();
    }

    const historyItems = page.locator('.history-item');
    await expect(historyItems).toHaveCount(10);
  });

  test('should enforce minimum dice count of 1', async ({ page }) => {
    const countInput = page.locator('input#dice-count');
    await countInput.fill('0');
    await countInput.blur();

    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    // Should still be able to roll (clamped to 1)
    const diceValues = page.locator('.dice-value');
    await expect(diceValues).toHaveCount(1);
  });

  test('should enforce maximum dice count of 100', async ({ page }) => {
    const countInput = page.locator('input#dice-count');
    await countInput.fill('150');

    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const diceValues = page.locator('.dice-value');
    await expect(diceValues).toHaveCount(100);
  });

  test('should enforce minimum dice sides of 2', async ({ page }) => {
    const sidesInput = page.locator('input#dice-sides');
    await sidesInput.fill('1');

    const rollButton = page.locator('button.btn-primary:has-text("ロール")');
    await rollButton.click();

    const diceNumber = page.locator('.dice-number').first();
    const text = await diceNumber.textContent();
    const value = parseInt(text || '0');
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(2); // Clamped to 2-sided die
  });

  test('should navigate to UUID page via category dropdown', async ({ page }) => {
    await navigateViaCategory(page, '生成', '/uuid');
    await expect(page).toHaveURL('/uuid');
  });
});
