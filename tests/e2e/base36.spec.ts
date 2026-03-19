import { test, expect } from '@playwright/test';

test.describe('Base36 Converter - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/base36');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Base36/);
  });

  test('should display encode/decode tabs', async ({ page }) => {
    const encodeTab = page.locator('[role="tab"]', { hasText: 'エンコード' });
    const decodeTab = page.locator('[role="tab"]', { hasText: 'デコード' });
    await expect(encodeTab).toBeVisible();
    await expect(decodeTab).toBeVisible();
  });

  test('should display text/number mode buttons', async ({ page }) => {
    const textBtn = page.locator('button[aria-pressed]', { hasText: 'テキスト' });
    const numberBtn = page.locator('button[aria-pressed]', { hasText: '整数' });
    await expect(textBtn).toBeVisible();
    await expect(numberBtn).toBeVisible();
  });

  test('should display case selection options', async ({ page }) => {
    const lowerRadio = page.locator('input[value="lower"]');
    const upperRadio = page.locator('input[value="upper"]');
    await expect(lowerRadio).toBeVisible();
    await expect(upperRadio).toBeVisible();
  });

  test('should encode text to Base36', async ({ page }) => {
    const input = page.locator('#b36-input');
    await input.fill('Hello');

    const output = page.locator('.b36-textarea-output');
    await expect(output).toBeVisible();

    const outputValue = await output.inputValue();
    expect(outputValue.length).toBeGreaterThan(0);
    // Base36 出力には特殊文字が含まれない
    expect(outputValue).not.toContain('=');
    expect(outputValue).not.toContain('+');
    expect(outputValue).not.toContain('/');
  });

  test('should produce lowercase output by default', async ({ page }) => {
    const input = page.locator('#b36-input');
    await input.fill('Hello');

    const output = page.locator('.b36-textarea-output');
    await output.waitFor({ state: 'visible' });
    const outputValue = await output.inputValue();

    // 小文字モードのデフォルト出力
    expect(outputValue).toMatch(/^[0-9a-z]+$/);
  });

  test('should produce uppercase output when upper option selected', async ({ page }) => {
    const upperRadio = page.locator('input[value="upper"]');
    await upperRadio.click();

    const input = page.locator('#b36-input');
    await input.fill('Hello');

    const output = page.locator('.b36-textarea-output');
    await output.waitFor({ state: 'visible' });
    const outputValue = await output.inputValue();

    expect(outputValue).toMatch(/^[0-9A-Z]+$/);
  });

  test('should switch to decode mode', async ({ page }) => {
    const decodeTab = page.locator('[role="tab"]', { hasText: 'デコード' });
    await decodeTab.click();
    await expect(decodeTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should decode valid Base36 string', async ({ page }) => {
    // エンコードして値を取得
    const input = page.locator('#b36-input');
    await input.fill('Hello');
    const output = page.locator('.b36-textarea-output');
    await output.waitFor({ state: 'visible' });
    const encoded = await output.inputValue();

    // デコードモードに切り替えて試す
    await page.locator('[role="tab"]', { hasText: 'デコード' }).click();
    await input.fill(encoded);

    await output.waitFor({ state: 'visible' });
    const decoded = await output.inputValue();
    expect(decoded).toBe('Hello');
  });

  test('should show error for invalid Base36 in decode mode', async ({ page }) => {
    await page.locator('[role="tab"]', { hasText: 'デコード' }).click();

    const input = page.locator('#b36-input');
    await input.fill('hello+world!');

    const error = page.locator('.b36-error');
    await expect(error).toBeVisible();
  });

  test('should switch to number mode and encode integer', async ({ page }) => {
    const numberBtn = page.locator('button[aria-pressed]', { hasText: '整数' });
    await numberBtn.click();

    const input = page.locator('#b36-input');
    await input.fill('255');

    const result = page.locator('.b36-number-result');
    await expect(result).toBeVisible();

    const text = await result.textContent();
    // 255 in base36 = "73"
    expect(text?.trim()).toBe('73');
  });

  test('should swap input/output when swap button is clicked', async ({ page }) => {
    const input = page.locator('#b36-input');
    await input.fill('test');

    await page.locator('.b36-textarea-output').waitFor({ state: 'visible' });

    const swapBtn = page.locator('button[aria-label="入出力を入れ替える"]');
    await swapBtn.click();

    const decodeTab = page.locator('[role="tab"]', { hasText: 'デコード' });
    await expect(decodeTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should clear input when clear button is clicked', async ({ page }) => {
    const input = page.locator('#b36-input');
    await input.fill('test text');

    const clearBtn = page.locator('button[aria-label="入力をクリア"]');
    await clearBtn.click();

    await expect(input).toHaveValue('');
  });

  test('should show byte count in encode output', async ({ page }) => {
    const input = page.locator('#b36-input');
    await input.fill('Hello');

    await page.locator('.b36-textarea-output').waitFor({ state: 'visible' });

    const meta = page.locator('.b36-output-meta');
    await expect(meta).toBeVisible();
    await expect(meta).toContainText('バイト');
  });

  test('should have proper accessibility landmarks', async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });
});

test.describe('Top page - Base36 tool listing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/top');
    await page.waitForLoadState('networkidle');
  });

  test('should display "Base36変換" in the tool list', async ({ page }) => {
    const link = page.locator('a[href="/base36"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Base36');
  });

  test('should navigate to /base36 when clicking the tool card', async ({ page }) => {
    const link = page.locator('a[href="/base36"]');
    await link.click();
    await expect(page).toHaveURL('/base36');
  });
});
