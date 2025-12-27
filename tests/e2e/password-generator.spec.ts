import { test, expect } from '@playwright/test';

test.describe('Password Generator - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/password-generator');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/パスワード/);
  });

  test('should have password length slider', async ({ page }) => {
    const slider = page.locator('#passwordLength');
    await expect(slider).toBeVisible();
  });

  test('should have character type checkboxes', async ({ page }) => {
    const uppercaseCheckbox = page.locator('input[aria-label="大文字を含める"]');
    const lowercaseCheckbox = page.locator('input[aria-label="小文字を含める"]');
    const numbersCheckbox = page.locator('input[aria-label="数字を含める"]');
    const symbolsCheckbox = page.locator('input[aria-label="記号を含める"]');

    await expect(uppercaseCheckbox).toBeVisible();
    await expect(lowercaseCheckbox).toBeVisible();
    await expect(numbersCheckbox).toBeVisible();
    await expect(symbolsCheckbox).toBeVisible();
  });

  test('should have generate, copy, and clear buttons', async ({ page }) => {
    const generateButton = page.locator('button.btn-primary');
    const copyButton = page.locator('button.btn-secondary');
    const clearButton = page.locator('button.btn-clear');

    await expect(generateButton).toBeVisible();
    await expect(generateButton).toContainText('生成');
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toContainText('コピー');
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toContainText('クリア');
  });

  test('should generate password on page load', async ({ page }) => {
    const passwordOutput = page.locator('#passwordOutput');
    await expect(passwordOutput).toBeVisible();
    const value = await passwordOutput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should generate new password when generate button is clicked', async ({ page }) => {
    const passwordOutput = page.locator('#passwordOutput');
    const generateButton = page.locator('button.btn-primary');

    const firstPassword = await passwordOutput.inputValue();
    expect(firstPassword.length).toBeGreaterThan(0);

    await generateButton.click();
    const secondPassword = await passwordOutput.inputValue();

    // Verify a new password was generated
    expect(secondPassword.length).toBeGreaterThan(0);
    // Passwords should be different (extremely unlikely to be the same with 16 chars)
    expect(secondPassword).not.toBe(firstPassword);
  });

  test('should clear password when clear button is clicked', async ({ page }) => {
    const passwordOutput = page.locator('#passwordOutput');
    const clearButton = page.locator('button.btn-clear');

    // Make sure there's a password first
    const initialValue = await passwordOutput.inputValue();
    expect(initialValue.length).toBeGreaterThan(0);

    await clearButton.click();
    const clearedValue = await passwordOutput.inputValue();
    expect(clearedValue).toBe('');
  });

  test('should change password length when slider is adjusted', async ({ page }) => {
    const slider = page.locator('#passwordLength');
    const generateButton = page.locator('button.btn-primary');
    const passwordOutput = page.locator('#passwordOutput');

    // Set to minimum length (4)
    await slider.fill('4');
    await generateButton.click();
    const shortPassword = await passwordOutput.inputValue();
    expect(shortPassword.length).toBe(4);

    // Set to a longer length
    await slider.fill('32');
    await generateButton.click();
    const longPassword = await passwordOutput.inputValue();
    expect(longPassword.length).toBe(32);
  });

  test('should show alert when no character type is selected', async ({ page }) => {
    const uppercaseCheckbox = page.locator('input[aria-label="大文字を含める"]');
    const lowercaseCheckbox = page.locator('input[aria-label="小文字を含める"]');
    const numbersCheckbox = page.locator('input[aria-label="数字を含める"]');
    const generateButton = page.locator('button.btn-primary');

    // Uncheck all default checked boxes
    await uppercaseCheckbox.uncheck();
    await lowercaseCheckbox.uncheck();
    await numbersCheckbox.uncheck();

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('少なくとも1つの文字種を選択してください');
      await dialog.accept();
    });

    await generateButton.click();
  });

  test('should generate password with only uppercase when only uppercase is selected', async ({ page }) => {
    const uppercaseCheckbox = page.locator('input[aria-label="大文字を含める"]');
    const lowercaseCheckbox = page.locator('input[aria-label="小文字を含める"]');
    const numbersCheckbox = page.locator('input[aria-label="数字を含める"]');
    const generateButton = page.locator('button.btn-primary');
    const passwordOutput = page.locator('#passwordOutput');

    // Keep only uppercase checked
    await lowercaseCheckbox.uncheck();
    await numbersCheckbox.uncheck();
    await generateButton.click();

    const password = await passwordOutput.inputValue();
    expect(/^[A-Z]+$/.test(password)).toBe(true);
  });

  test('should display password strength indicator', async ({ page }) => {
    const strengthSection = page.locator('#strength-title');
    await expect(strengthSection).toBeVisible();
    await expect(strengthSection).toContainText('パスワード強度');
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
    expect(usageText).toContain('セキュリティのヒント');
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation link to password generator', async ({ page }) => {
    await page.goto('/');
    const passwordLink = page.locator('.nav-links a[href="/password-generator"]');
    await expect(passwordLink).toBeVisible();
    await expect(passwordLink).toContainText('パスワード生成');
  });

  test('should navigate to password generator from other pages', async ({ page }) => {
    await page.goto('/');
    await page.click('.nav-links a[href="/password-generator"]');
    await expect(page).toHaveURL('/password-generator');
  });

  test('should show active state on password link when on password-generator page', async ({ page }) => {
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('パスワード生成');
  });

  test('should copy password text changes when copy is successful', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const copyButton = page.locator('button.btn-secondary');
    const passwordOutput = page.locator('#passwordOutput');

    // Make sure there's a password
    const password = await passwordOutput.inputValue();
    expect(password.length).toBeGreaterThan(0);

    await copyButton.click();

    // Check button text changes to indicate success
    await expect(copyButton).toContainText('コピーしました');
  });
});
