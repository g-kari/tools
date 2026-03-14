import { test, expect } from '@playwright/test';

test.describe('TOTP Generator - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/totp');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/TOTP/);
  });

  test('should display the tool heading', async ({ page }) => {
    const heading = page.locator('.tool-title');
    await expect(heading).toBeVisible();
  });

  test('should display the tool description', async ({ page }) => {
    const description = page.locator('.tool-description');
    await expect(description).toBeVisible();
  });

  test('should display the secret key input', async ({ page }) => {
    const secretInput = page.locator('#secretInput');
    await expect(secretInput).toBeVisible();
  });

  test('should display the TOTP code display area', async ({ page }) => {
    const codeDisplay = page.locator('.tp-code-display');
    await expect(codeDisplay).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    const buttons = page.locator('.tp-btn');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should display TOTP options', async ({ page }) => {
    const options = page.locator('.tp-options');
    await expect(options).toBeVisible();
  });

  test('should have correct main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Web ツール集');
  });
});
