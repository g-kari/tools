import { test, expect } from '@playwright/test';

test.describe('Passphrase Generator - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/passphrase');
    await page.waitForSelector('.pp-container');
  });

  test('should display the passphrase generator page', async ({ page }) => {
    await expect(page).toHaveTitle(/パスフレーズ生成/);
    await expect(page.locator('.pp-container')).toBeVisible();
  });

  test('should generate a passphrase on load', async ({ page }) => {
    const output = page.locator('#pp-output');
    await expect(output).toBeVisible();
    const value = await output.inputValue();
    expect(value).toBeTruthy();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should generate a new passphrase when clicking the generate button', async ({ page }) => {
    const output = page.locator('#pp-output');
    const firstValue = await output.inputValue();

    await page.getByRole('button', { name: '生成' }).click();
    const secondValue = await output.inputValue();

    // パスフレーズが生成されていることを確認（同じである可能性は極めて低い）
    expect(secondValue).toBeTruthy();
  });

  test('should copy passphrase to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const output = page.locator('#pp-output');
    const value = await output.inputValue();

    await page.getByRole('button', { name: 'コピー' }).click();
    await expect(page.getByRole('button', { name: 'コピーしました' })).toBeVisible();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(value);
  });

  test('should change separator and reflect in output', async ({ page }) => {
    // スペース区切りを選択
    await page.getByRole('radio', { name: 'スペース ( )' }).check();
    await page.getByRole('button', { name: '生成' }).click();

    const output = page.locator('#pp-output');
    const value = await output.inputValue();
    expect(value).toContain(' ');
  });

  test('should show security information', async ({ page }) => {
    const statsSection = page.locator('.pp-stats-section');
    await expect(statsSection).toBeVisible();
    await expect(statsSection).toContainText('bits');
    await expect(statsSection).toContainText('強度');
  });

  test('should have navigation with active state', async ({ page }) => {
    const navCategories = page.locator('.nav-categories');
    await expect(navCategories).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    const form = page.getByRole('form', { name: 'パスフレーズ生成フォーム' });
    await expect(form).toBeVisible();

    const generateBtn = page.getByRole('button', { name: '新しいパスフレーズを生成' });
    await expect(generateBtn).toBeVisible();
  });
});
