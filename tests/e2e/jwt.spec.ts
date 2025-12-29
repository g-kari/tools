import { test, expect } from '@playwright/test';

test.describe('JWT Decoder - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jwt');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/JWT/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Web ツール集');
  });

  test('should have input textarea and buttons', async ({ page }) => {
    const inputTextarea = page.locator('#inputToken');
    const decodeButton = page.locator('button.btn-primary');
    const clearButton = page.locator('button.btn-clear');

    await expect(inputTextarea).toBeVisible();
    await expect(decodeButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test('should decode a valid JWT token', async ({ page }) => {
    const inputTextarea = page.locator('#inputToken');
    const decodeButton = page.locator('button.btn-primary');

    // Valid JWT token (example from jwt.io)
    const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    await inputTextarea.fill(validJwt);
    await decodeButton.click();

    // Check if header output is visible
    const headerOutput = page.locator('#outputHeader');
    await expect(headerOutput).toBeVisible();
    const headerValue = await headerOutput.inputValue();
    expect(headerValue).toContain('HS256');
    expect(headerValue).toContain('JWT');

    // Check if payload output is visible
    const payloadOutput = page.locator('#outputPayload');
    await expect(payloadOutput).toBeVisible();
    const payloadValue = await payloadOutput.inputValue();
    expect(payloadValue).toContain('John Doe');
    expect(payloadValue).toContain('1234567890');

    // Check if signature output is visible
    const signatureOutput = page.locator('#outputSignature');
    await expect(signatureOutput).toBeVisible();
    const signatureValue = await signatureOutput.inputValue();
    expect(signatureValue).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  });

  test('should show error for invalid JWT format', async ({ page }) => {
    const inputTextarea = page.locator('#inputToken');
    const decodeButton = page.locator('button.btn-primary');

    await inputTextarea.fill('invalid.jwt');
    await decodeButton.click();

    // Check for error message
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('3つのパート');
  });

  test('should show error for malformed JWT parts', async ({ page }) => {
    const inputTextarea = page.locator('#inputToken');
    const decodeButton = page.locator('button.btn-primary');

    await inputTextarea.fill('invalid.base64.data');
    await decodeButton.click();

    // Check for error message
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
  });

  test('should clear input and output', async ({ page }) => {
    const inputTextarea = page.locator('#inputToken');
    const decodeButton = page.locator('button.btn-primary');
    const clearButton = page.locator('button.btn-clear');

    const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    await inputTextarea.fill(validJwt);
    await decodeButton.click();

    // Wait for output to appear
    await expect(page.locator('#outputHeader')).toBeVisible();

    // Click clear
    await clearButton.click();

    // Input should be empty
    await expect(inputTextarea).toHaveValue('');

    // Outputs should not be visible
    await expect(page.locator('#outputHeader')).not.toBeVisible();
  });

  test('should show error message when decoding empty input', async ({ page }) => {
    const decodeButton = page.locator('button.btn-primary');

    await decodeButton.click();

    // Check for error message
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('JWTトークンを入力してください');
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for ARIA roles
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Check for skip link
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions', async ({ page }) => {
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('JWT');
    expect(usageText).not.toContain('undefined');
  });

  test('should have copy buttons for each section after decoding', async ({ page }) => {
    const inputTextarea = page.locator('#inputToken');
    const decodeButton = page.locator('button.btn-primary');

    const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    await inputTextarea.fill(validJwt);
    await decodeButton.click();

    // Wait for outputs to appear
    await expect(page.locator('#outputHeader')).toBeVisible();

    // Check for copy buttons
    const copyButtons = page.locator('button.btn-secondary:has-text("コピー")');
    const count = await copyButtons.count();
    expect(count).toBe(3); // Header, Payload, Signature
  });
});
