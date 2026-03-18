import { test, expect } from '@playwright/test';

test.describe('HTTP Basic Auth Tool - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/basic-auth');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/HTTP Basic Auth/);
  });

  test('should display encode/decode tabs', async ({ page }) => {
    const encodeTab = page.locator('[role="tab"]', { hasText: 'エンコード' });
    const decodeTab = page.locator('[role="tab"]', { hasText: 'デコード' });
    await expect(encodeTab).toBeVisible();
    await expect(decodeTab).toBeVisible();
  });

  test('should encode username and password', async ({ page }) => {
    const usernameInput = page.locator('#basic-auth-username');
    const passwordInput = page.locator('#basic-auth-password');

    await usernameInput.fill('admin');
    await passwordInput.fill('password');

    const results = page.locator('.basic-auth-results');
    await expect(results).toBeVisible();

    const resultText = await results.textContent();
    expect(resultText).toContain('YWRtaW46cGFzc3dvcmQ=');
  });

  test('should show Authorization header in encode result', async ({ page }) => {
    await page.locator('#basic-auth-username').fill('user');
    await page.locator('#basic-auth-password').fill('secret');

    const results = page.locator('.basic-auth-results');
    await expect(results).toContainText('Authorization: Basic');
    await expect(results).toContainText('dXNlcjpzZWNyZXQ=');
  });

  test('should switch to decode tab and decode token', async ({ page }) => {
    await page.locator('[role="tab"]', { hasText: 'デコード' }).click();

    const decodeInput = page.locator('#basic-auth-decode-input');
    await decodeInput.fill('YWRtaW46cGFzc3dvcmQ=');

    const results = page.locator('.basic-auth-results');
    await expect(results).toBeVisible();
    await expect(results).toContainText('admin');
    await expect(results).toContainText('password');
  });

  test('should show error for invalid token in decode tab', async ({ page }) => {
    await page.locator('[role="tab"]', { hasText: 'デコード' }).click();

    const decodeInput = page.locator('#basic-auth-decode-input');
    await decodeInput.fill('not-valid-base64!!!');

    const error = page.locator('.basic-auth-decode-error');
    await expect(error).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('#basic-auth-password');
    const toggleBtn = page.locator('.basic-auth-toggle-password');

    await expect(passwordInput).toHaveAttribute('type', 'password');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should clear encode fields when clear button is clicked', async ({ page }) => {
    await page.locator('#basic-auth-username').fill('admin');
    await page.locator('#basic-auth-password').fill('password');

    const clearBtn = page.locator('button[aria-label="入力をクリア"]');
    await clearBtn.click();

    await expect(page.locator('#basic-auth-username')).toHaveValue('');
    await expect(page.locator('#basic-auth-password')).toHaveValue('');
    await expect(page.locator('.basic-auth-results')).not.toBeVisible();
  });

  test('should show copy buttons when token is generated', async ({ page }) => {
    await page.locator('#basic-auth-username').fill('user');
    await page.locator('#basic-auth-password').fill('pass');

    const copyHeaderBtn = page.locator('button[aria-label="Authorizationヘッダーをコピー"]');
    await expect(copyHeaderBtn).toBeVisible();
    await expect(copyHeaderBtn).toBeEnabled();
  });

  test('should have proper accessibility landmarks', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });
});

test.describe('Top page - Basic Auth tool listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/top');
    await page.waitForLoadState('networkidle');
  });

  test('should display "HTTP Basic Auth" in the tool list', async ({ page }) => {
    const link = page.locator('a[href="/basic-auth"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('HTTP Basic Auth');
  });

  test('should navigate to /basic-auth when clicking the tool card', async ({ page }) => {
    const link = page.locator('a[href="/basic-auth"]');
    await link.click();
    await expect(page).toHaveURL('/basic-auth');
  });
});
