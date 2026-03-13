import { test, expect } from '@playwright/test';

test.describe('Lorem Ipsum Generator - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lorem-ipsum');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Lorem Ipsum生成/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('生成設定');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should show Lorem Ipsum link in generation category navigation', async ({ page }) => {
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '生成' });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const loremLink = dropdown.locator('a[href="/lorem-ipsum"]');
    await expect(loremLink).toBeVisible();
    await expect(loremLink).toContainText('Lorem Ipsum');
  });

  test('should have active state in navigation', async ({ page }) => {
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('生成');
  });

  test('should display mode select with correct options', async ({ page }) => {
    const modeSelect = page.locator('#lorem-mode');
    await expect(modeSelect).toBeVisible();
    await expect(modeSelect.locator('option[value="paragraphs"]')).toBeAttached();
    await expect(modeSelect.locator('option[value="words"]')).toBeAttached();
    await expect(modeSelect.locator('option[value="sentences"]')).toBeAttached();
  });

  test('should display language select', async ({ page }) => {
    const languageSelect = page.locator('#lorem-language');
    await expect(languageSelect).toBeVisible();
    await expect(languageSelect.locator('option[value="latin"]')).toBeAttached();
    await expect(languageSelect.locator('option[value="japanese"]')).toBeAttached();
  });

  test('should display paragraph count input by default', async ({ page }) => {
    const paragraphInput = page.locator('#lorem-paragraph-count');
    await expect(paragraphInput).toBeVisible();
    await expect(paragraphInput).toHaveValue('3');
  });

  test('should hide paragraph count when switching to words mode', async ({ page }) => {
    const modeSelect = page.locator('#lorem-mode');
    await modeSelect.selectOption('words');
    await expect(page.locator('#lorem-paragraph-count')).not.toBeVisible();
    await expect(page.locator('#lorem-word-count')).toBeVisible();
  });

  test('should hide paragraph count when switching to sentences mode', async ({ page }) => {
    const modeSelect = page.locator('#lorem-mode');
    await modeSelect.selectOption('sentences');
    await expect(page.locator('#lorem-paragraph-count')).not.toBeVisible();
    await expect(page.locator('#lorem-sentence-count')).toBeVisible();
  });

  test('should generate text when clicking the generate button', async ({ page }) => {
    const generateBtn = page.locator('[aria-label="Lorem Ipsumテキストを生成"]');
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();
    const output = page.locator('.lorem-ipsum-output-area');
    const text = await output.inputValue();
    expect(text.length).toBeGreaterThan(0);
  });

  test('should have disabled copy button before generation', async ({ page }) => {
    const copyBtn = page.locator('[aria-label="テキストをクリップボードにコピー"]');
    await expect(copyBtn).toBeDisabled();
  });

  test('should enable copy button after generation', async ({ page }) => {
    const generateBtn = page.locator('[aria-label="Lorem Ipsumテキストを生成"]');
    await generateBtn.click();
    const copyBtn = page.locator('[aria-label="テキストをクリップボードにコピー"]');
    await expect(copyBtn).toBeEnabled();
  });

  test('should show Lorem ipsum start checkbox for latin language', async ({ page }) => {
    const loremCheckbox = page.locator('[aria-label="先頭をLorem ipsum dolor sit amet...で始める"]');
    await expect(loremCheckbox).toBeVisible();
    await expect(loremCheckbox).toBeChecked();
  });

  test('should hide Lorem ipsum start checkbox for Japanese language', async ({ page }) => {
    const languageSelect = page.locator('#lorem-language');
    await languageSelect.selectOption('japanese');
    const loremCheckbox = page.locator('[aria-label="先頭をLorem ipsum dolor sit amet...で始める"]');
    await expect(loremCheckbox).not.toBeVisible();
  });

  test('should generate text starting with Lorem ipsum when option is checked', async ({ page }) => {
    const generateBtn = page.locator('[aria-label="Lorem Ipsumテキストを生成"]');
    await generateBtn.click();
    const output = page.locator('.lorem-ipsum-output-area');
    const text = await output.inputValue();
    expect(text).toMatch(/^Lorem ipsum dolor sit amet/);
  });

  test('should generate HTML-wrapped output when HTML option is checked', async ({ page }) => {
    const htmlCheckbox = page.locator('[aria-label="HTMLタグ付き出力（pタグ）"]');
    await htmlCheckbox.check();
    const generateBtn = page.locator('[aria-label="Lorem Ipsumテキストを生成"]');
    await generateBtn.click();
    const output = page.locator('.lorem-ipsum-output-area');
    const text = await output.inputValue();
    expect(text).toContain('<p>');
    expect(text).toContain('</p>');
  });
});
