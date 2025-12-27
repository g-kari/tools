import { test, expect } from '@playwright/test';

test.describe('UUID Generator - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/uuid');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/UUID生成/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('.section-title').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('UUID生成設定');
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
    expect(usageText).toContain('UUIDとは');
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation links including UUID生成', async ({ page }) => {
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    const uuidLink = page.locator('.nav-links a[href="/uuid"]');
    await expect(uuidLink).toBeVisible();
    await expect(uuidLink).toContainText('UUID生成');
  });

  test('should show active state on UUID生成 link when on uuid page', async ({ page }) => {
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('UUID生成');
  });

  test('should generate a UUID on page load', async ({ page }) => {
    const uuidItem = page.locator('.uuid-item').first();
    await expect(uuidItem).toBeVisible();

    const uuidValue = page.locator('.uuid-value').first();
    const text = await uuidValue.textContent();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(text).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test('should generate new UUID when clicking generate button', async ({ page }) => {
    const firstUuid = await page.locator('.uuid-value').first().textContent();

    await page.click('button.btn-primary');
    // Wait for the UUID to change
    await expect(async () => {
      const secondUuid = await page.locator('.uuid-value').first().textContent();
      expect(secondUuid).not.toBe(firstUuid);
    }).toPass({ timeout: 5000 });
  });

  test('should generate multiple UUIDs when count is changed', async ({ page }) => {
    const countInput = page.locator('input#count');
    await countInput.fill('5');
    await page.click('button.btn-primary');

    const uuidItems = page.locator('.uuid-item');
    await expect(uuidItems).toHaveCount(5);
  });

  test('should convert to uppercase when checkbox is checked', async ({ page }) => {
    const uppercaseCheckbox = page.locator('label:has-text("大文字で表示") input[type="checkbox"]');
    await uppercaseCheckbox.check();
    await page.click('button.btn-primary');

    const uuidValue = await page.locator('.uuid-value').first().textContent();
    // Should be uppercase
    expect(uuidValue).toBe(uuidValue?.toUpperCase());
  });

  test('should remove hyphens when checkbox is checked', async ({ page }) => {
    const noHyphensCheckbox = page.locator('label:has-text("ハイフンなし") input[type="checkbox"]');
    await noHyphensCheckbox.check();
    await page.click('button.btn-primary');

    const uuidValue = await page.locator('.uuid-value').first().textContent();
    // Should not contain hyphens
    expect(uuidValue).not.toContain('-');
    // Should be 32 characters (no hyphens)
    expect(uuidValue).toHaveLength(32);
  });

  test('should clear UUIDs when clicking clear button', async ({ page }) => {
    // Ensure UUIDs are displayed
    await expect(page.locator('.uuid-item').first()).toBeVisible();

    await page.click('button.btn-clear');

    // UUIDs should be cleared
    await expect(page.locator('.uuid-item')).toHaveCount(0);
  });

  test('should have copy button for each UUID', async ({ page }) => {
    const copyButton = page.locator('.btn-copy').first();
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toContainText('コピー');
  });

  test('should show "すべてコピー" button when multiple UUIDs are generated', async ({ page }) => {
    const countInput = page.locator('input#count');
    await countInput.fill('3');
    await page.click('button.btn-primary');

    const copyAllButton = page.locator('button:has-text("すべてコピー")');
    await expect(copyAllButton).toBeVisible();
  });

  test('should navigate to Unicode page when clicking the link', async ({ page }) => {
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });
});
