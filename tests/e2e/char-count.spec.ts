import { test, expect } from '@playwright/test';

test.describe('Character Count - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/char-count');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/文字数カウント/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('テキスト入力');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions', async ({ page }) => {
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('文字数カウントとは');
    expect(usageText).not.toContain('undefined');
  });

  test('should display all count results', async ({ page }) => {
    await expect(page.getByTestId('char-count')).toBeVisible();
    await expect(page.getByTestId('char-count-no-space')).toBeVisible();
    await expect(page.getByTestId('byte-count')).toBeVisible();
    await expect(page.getByTestId('line-count')).toBeVisible();
    await expect(page.getByTestId('word-count')).toBeVisible();
    await expect(page.getByTestId('paragraph-count')).toBeVisible();
  });

  test('should show 0 for empty text', async ({ page }) => {
    await expect(page.getByTestId('char-count')).toHaveText('0');
    await expect(page.getByTestId('char-count-no-space')).toHaveText('0');
    await expect(page.getByTestId('byte-count')).toHaveText('0');
    await expect(page.getByTestId('line-count')).toHaveText('0');
    await expect(page.getByTestId('word-count')).toHaveText('0');
    await expect(page.getByTestId('paragraph-count')).toHaveText('0');
  });

  test('should count characters correctly', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Hello World');

    await expect(page.getByTestId('char-count')).toHaveText('11');
    await expect(page.getByTestId('char-count-no-space')).toHaveText('10');
    await expect(page.getByTestId('byte-count')).toHaveText('11');
    await expect(page.getByTestId('line-count')).toHaveText('1');
    await expect(page.getByTestId('word-count')).toHaveText('2');
  });

  test('should count Japanese characters correctly', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('こんにちは世界');

    await expect(page.getByTestId('char-count')).toHaveText('7');
    await expect(page.getByTestId('char-count-no-space')).toHaveText('7');
    // UTF-8: Japanese characters are 3 bytes each
    await expect(page.getByTestId('byte-count')).toHaveText('21');
    await expect(page.getByTestId('line-count')).toHaveText('1');
  });

  test('should count lines correctly', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Line 1\nLine 2\nLine 3');

    await expect(page.getByTestId('line-count')).toHaveText('3');
  });

  test('should count paragraphs correctly', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Paragraph 1\n\nParagraph 2\n\nParagraph 3');

    await expect(page.getByTestId('paragraph-count')).toHaveText('3');
  });

  test('should count emoji correctly', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('👍🎉🚀');

    // Each emoji is 1 character
    await expect(page.getByTestId('char-count')).toHaveText('3');
  });

  test('should clear text when clicking clear button', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Some text');

    await expect(page.getByTestId('char-count')).not.toHaveText('0');

    await page.click('button.btn-clear');

    await expect(textarea).toHaveValue('');
    await expect(page.getByTestId('char-count')).toHaveText('0');
  });

  test('should have disabled clear button when textarea is empty', async ({ page }) => {
    const clearButton = page.locator('button.btn-clear');
    await expect(clearButton).toBeDisabled();
  });

  test('should enable clear button when textarea has content', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('text');

    const clearButton = page.locator('button.btn-clear');
    await expect(clearButton).toBeEnabled();
  });
});
