import { test, expect } from '@playwright/test';

test.describe('TOML Formatter - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/toml-formatter');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/TOML/);
  });

  test('should have input and output textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');

    await expect(inputTextarea).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test('should have mode selection radio buttons', async ({ page }) => {
    const formatRadio = page.locator('input[name="mode"][value="format"]');
    const minifyRadio = page.locator('input[name="mode"][value="minify"]');
    const validateRadio = page.locator('input[name="mode"][value="validate"]');

    await expect(formatRadio).toBeVisible();
    await expect(minifyRadio).toBeVisible();
    await expect(validateRadio).toBeVisible();
  });

  test('should have action buttons', async ({ page }) => {
    const processButton = page.locator('button.btn-primary');
    const clearButton = page.locator('button.btn-clear');

    await expect(processButton).toBeVisible();
    await expect(processButton).toContainText('整形');
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toContainText('クリア');
  });

  test('should format TOML', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const processButton = page.locator('button.btn-primary');

    await inputTextarea.fill('[package]\nname = "my-app"\nversion = "1.0.0"');
    await processButton.click();

    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    expect(output).toContain('package');
    expect(output).toContain('my-app');
  });

  test('should minify TOML in minify mode', async ({ page }) => {
    const minifyRadio = page.locator('input[name="mode"][value="minify"]');
    await minifyRadio.click();

    const processButton = page.locator('button.btn-primary');
    await expect(processButton).toContainText('圧縮');

    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');

    await inputTextarea.fill('[a]\nx = 1\n\n[b]\ny = 2');
    await processButton.click();

    const output = await outputTextarea.inputValue();
    expect(output).not.toContain('\n\n');
    expect(output).toContain('x');
    expect(output).toContain('y');
  });

  test('should validate valid TOML', async ({ page }) => {
    const validateRadio = page.locator('input[name="mode"][value="validate"]');
    await validateRadio.click();

    const processButton = page.locator('button.btn-primary');
    await expect(processButton).toContainText('検証');

    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');

    await inputTextarea.fill('[package]\nname = "my-app"');
    await processButton.click();

    const output = await outputTextarea.inputValue();
    expect(output).toContain('有効なTOMLです');
  });

  test('should validate invalid TOML', async ({ page }) => {
    const validateRadio = page.locator('input[name="mode"][value="validate"]');
    await validateRadio.click();

    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const processButton = page.locator('button.btn-primary');

    await inputTextarea.fill('key = @invalid');
    await processButton.click();

    const output = await outputTextarea.inputValue();
    expect(output).toContain('✗ エラー:');
  });

  test('should clear both textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const processButton = page.locator('button.btn-primary');
    const clearButton = page.locator('button.btn-clear');

    await inputTextarea.fill('[package]\nname = "test"');
    await processButton.click();

    await expect(outputTextarea).not.toHaveValue('');

    await clearButton.click();

    await expect(inputTextarea).toHaveValue('');
    await expect(outputTextarea).toHaveValue('');
  });

  test('should show error when processing empty input', async ({ page }) => {
    const processButton = page.locator('button.btn-primary');
    await processButton.click();

    const toastOrError = page.locator('[role="alert"], .error-message, .toast');
    await expect(toastOrError.first()).toBeVisible({ timeout: 3000 });
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
    expect(usageText).toContain('使い方');
    expect(usageText).toContain('TOML');
    expect(usageText).not.toContain('undefined');
  });

  test('should change button label when switching modes', async ({ page }) => {
    const processButton = page.locator('button.btn-primary');

    await expect(processButton).toContainText('整形');

    const minifyRadio = page.locator('input[name="mode"][value="minify"]');
    await minifyRadio.click();
    await expect(processButton).toContainText('圧縮');

    const validateRadio = page.locator('input[name="mode"][value="validate"]');
    await validateRadio.click();
    await expect(processButton).toContainText('検証');
  });
});
