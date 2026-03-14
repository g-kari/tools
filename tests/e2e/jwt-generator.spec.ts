import { test, expect } from '@playwright/test';

test.describe('JWT Generator - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jwt-generator');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/JWT生成/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Web ツール集');
  });

  test('should have algorithm tabs', async ({ page }) => {
    const hs256Tab = page.locator('[role="tab"]', { hasText: 'HS256' });
    const hs384Tab = page.locator('[role="tab"]', { hasText: 'HS384' });
    const hs512Tab = page.locator('[role="tab"]', { hasText: 'HS512' });

    await expect(hs256Tab).toBeVisible();
    await expect(hs384Tab).toBeVisible();
    await expect(hs512Tab).toBeVisible();
  });

  test('should have HS256 selected by default', async ({ page }) => {
    const hs256Tab = page.locator('[role="tab"]', { hasText: 'HS256' });
    await expect(hs256Tab).toHaveAttribute('aria-selected', 'true');
  });

  test('should have payload textarea, secret input and buttons', async ({ page }) => {
    const payloadTextarea = page.locator('#jwtPayload');
    const secretInput = page.locator('#jwtSecret');
    const generateButton = page.locator('button.btn-primary');
    const clearButton = page.locator('button.btn-clear');

    await expect(payloadTextarea).toBeVisible();
    await expect(secretInput).toBeVisible();
    await expect(generateButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test('should show sample payload pre-filled', async ({ page }) => {
    const payloadTextarea = page.locator('#jwtPayload');
    const payloadValue = await payloadTextarea.inputValue();
    expect(payloadValue).toContain('1234567890');
    expect(payloadValue).toContain('John Doe');
  });

  test('should generate JWT token with HS256', async ({ page }) => {
    const generateButton = page.locator('button.btn-primary');
    await generateButton.click();

    const outputToken = page.locator('#outputToken');
    await expect(outputToken).toBeVisible();
    const tokenText = await outputToken.textContent();
    expect(tokenText).toBeDefined();
    const parts = tokenText!.trim().split('.');
    expect(parts).toHaveLength(3);
  });

  test('should show header output after generating', async ({ page }) => {
    const generateButton = page.locator('button.btn-primary');
    await generateButton.click();

    const headerOutput = page.locator('#outputGenHeader');
    await expect(headerOutput).toBeVisible();
    const headerValue = await headerOutput.inputValue();
    expect(headerValue).toContain('HS256');
    expect(headerValue).toContain('JWT');
  });

  test('should show payload output with iat after generating', async ({ page }) => {
    const generateButton = page.locator('button.btn-primary');
    await generateButton.click();

    const payloadOutput = page.locator('#outputGenPayload');
    await expect(payloadOutput).toBeVisible();
    const payloadValue = await payloadOutput.inputValue();
    expect(payloadValue).toContain('iat');
    expect(payloadValue).toContain('John Doe');
  });

  test('should switch algorithm to HS384', async ({ page }) => {
    const hs384Tab = page.locator('[role="tab"]', { hasText: 'HS384' });
    await hs384Tab.click();
    await expect(hs384Tab).toHaveAttribute('aria-selected', 'true');

    const generateButton = page.locator('button.btn-primary');
    await generateButton.click();

    const headerOutput = page.locator('#outputGenHeader');
    await expect(headerOutput).toBeVisible();
    const headerValue = await headerOutput.inputValue();
    expect(headerValue).toContain('HS384');
  });

  test('should switch algorithm to HS512', async ({ page }) => {
    const hs512Tab = page.locator('[role="tab"]', { hasText: 'HS512' });
    await hs512Tab.click();
    await expect(hs512Tab).toHaveAttribute('aria-selected', 'true');

    const generateButton = page.locator('button.btn-primary');
    await generateButton.click();

    const headerOutput = page.locator('#outputGenHeader');
    await expect(headerOutput).toBeVisible();
    const headerValue = await headerOutput.inputValue();
    expect(headerValue).toContain('HS512');
  });

  test('should show error when payload is empty', async ({ page }) => {
    const payloadTextarea = page.locator('#jwtPayload');
    await payloadTextarea.clear();
    await payloadTextarea.fill('');

    const generateButton = page.locator('button.btn-primary');
    await generateButton.click();

    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('ペイロード');
  });

  test('should show error for invalid JSON payload', async ({ page }) => {
    const payloadTextarea = page.locator('#jwtPayload');
    await payloadTextarea.clear();
    await payloadTextarea.fill('not-valid-json');

    const generateButton = page.locator('button.btn-primary');
    await generateButton.click();

    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toBeVisible();
  });

  test('should toggle secret visibility', async ({ page }) => {
    const secretInput = page.locator('#jwtSecret');
    const toggleButton = page.locator('[aria-label="シークレットを表示"]');

    // Default is password type
    await expect(secretInput).toHaveAttribute('type', 'password');

    // Click toggle to show
    await toggleButton.click();
    await expect(secretInput).toHaveAttribute('type', 'text');

    // Click toggle to hide
    const hideButton = page.locator('[aria-label="シークレットを非表示"]');
    await hideButton.click();
    await expect(secretInput).toHaveAttribute('type', 'password');
  });

  test('should clear inputs and outputs', async ({ page }) => {
    const generateButton = page.locator('button.btn-primary');
    await generateButton.click();

    await expect(page.locator('#outputToken')).toBeVisible();

    const clearButton = page.locator('button.btn-clear');
    await clearButton.click();

    await expect(page.locator('#outputToken')).not.toBeVisible();
  });

  test('should have copy buttons after generating', async ({ page }) => {
    const generateButton = page.locator('button.btn-primary');
    await generateButton.click();

    await expect(page.locator('#outputToken')).toBeVisible();

    const copyButtons = page.locator('button.btn-secondary:has-text("コピー")');
    const count = await copyButtons.count();
    expect(count).toBeGreaterThanOrEqual(3); // Token, Header, Payload
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions', async ({ page }) => {
    const tipsCard = page.locator('.tips-card, .info-box').first();
    await expect(tipsCard).toBeVisible();

    const tipsText = await tipsCard.textContent();
    expect(tipsText).toContain('JWT');
    expect(tipsText).not.toContain('undefined');
  });

  test('should generate valid JWT token format (no invalid chars)', async ({ page }) => {
    const generateButton = page.locator('button.btn-primary');
    await generateButton.click();

    const outputToken = page.locator('#outputToken');
    await expect(outputToken).toBeVisible();
    const tokenText = await outputToken.textContent();
    // JWTトークンはBase64URL文字とドットのみで構成されるべき
    expect(tokenText!.trim()).toMatch(/^[A-Za-z0-9\-_.]+$/);
  });
});
