import { test, expect } from '@playwright/test';

test.describe('Global IP Lookup - E2E Tests', () => {
  // Disable retries as requested (retry処理は不要)
  test.describe.configure({ timeout: 20000, retries: 0 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/global-ip');
    await page.waitForLoadState('load');

    // Wait for loading to complete by checking that the loading spinner is gone
    // The page initially shows a .loading div, then shows either .ip-display or .error-message
    await page.waitForSelector('.loading', { state: 'hidden', timeout: 10000 });
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/グローバルIP/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('グローバルIPアドレス');
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
    expect(usageText).toContain('グローバルIPアドレスとは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have heading with id for accessibility', async ({ page }) => {
    const aboutHeading = page.locator('#about-tool-title');
    await expect(aboutHeading).toBeVisible();
    await expect(aboutHeading).toContainText('このツールについて');
  });

  test('should have navigation links including グローバルIP', async ({ page }) => {
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    const globalIpLink = page.locator('.nav-links a[href="/global-ip"]');
    await expect(globalIpLink).toBeVisible();
    await expect(globalIpLink).toContainText('グローバルIP');
  });

  test('should navigate to home page when clicking the link', async ({ page }) => {
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should display either IP address or error message after loading', async ({ page }) => {
    // After loading completes (guaranteed by beforeEach), verify result state
    const ipDisplay = page.locator('.ip-display');
    const errorMessage = page.locator('.error-message');
    const isIpVisible = await ipDisplay.isVisible();
    const isErrorVisible = await errorMessage.isVisible();

    // One of them must be visible (mutually exclusive states)
    expect(isIpVisible || isErrorVisible).toBe(true);
  });

  test('should have copy and refresh buttons when IP is displayed', async ({ page }) => {
    // Check buttons only if IP is displayed (not in error state)
    const ipDisplay = page.locator('.ip-display');
    if (await ipDisplay.isVisible()) {
      const copyButton = page.locator('button.btn-primary');
      const refreshButton = page.locator('button.btn-secondary');

      await expect(copyButton).toBeVisible();
      await expect(copyButton).toContainText('コピー');
      await expect(refreshButton).toBeVisible();
      await expect(refreshButton).toContainText('再取得');
    }
    // If IP is not displayed (error case), test passes silently
  });
});
