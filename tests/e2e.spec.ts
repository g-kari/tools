import { test, expect } from '@playwright/test';

test.describe('Unicode Escape Converter - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Unicode/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Web ツール集');
  });

  test('should have input and output textareas', async ({ page }) => {
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');

    await expect(inputTextarea).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test('should have all action buttons', async ({ page }) => {
    const encodeButton = page.locator('button.btn-primary').first();
    const decodeButton = page.locator('button.btn-secondary').first();
    const clearButton = page.locator('button.btn-clear');

    await expect(encodeButton).toBeVisible();
    await expect(decodeButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test('should encode text to Unicode escape', async ({ page }) => {
    test.setTimeout(10000);
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-primary').first();

    await inputTextarea.fill('こんにちは');
    await encodeButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).not.toHaveValue('');
    const output = await outputTextarea.inputValue();
    expect(output).toContain('\\u');
  });

  test('should decode Unicode escape to text', async ({ page }) => {
    test.setTimeout(10000);
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const decodeButton = page.locator('button.btn-secondary').first();

    await inputTextarea.fill('\\u3053\\u3093\\u306b\\u3061\\u306f');
    await decodeButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).toHaveValue('こんにちは');
  });

  test('should clear both textareas', async ({ page }) => {
    test.setTimeout(10000);
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const encodeButton = page.locator('button.btn-primary').first();
    const clearButton = page.locator('button.btn-clear');

    await inputTextarea.fill('テスト');
    await encodeButton.click();

    // Wait for output to have content
    await expect(outputTextarea).not.toHaveValue('');

    // Click clear
    await clearButton.click();

    // Both should be empty
    await expect(inputTextarea).toHaveValue('');
    await expect(outputTextarea).toHaveValue('');
  });

  test('should show alert when encoding empty input', async ({ page }) => {
    const encodeButton = page.locator('button.btn-primary').first();

    // Set up dialog handler
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('テキストを入力してください');
      await dialog.accept();
    });

    await encodeButton.click();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for ARIA roles
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Check for skip link
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
  });

  test('should display usage instructions with \\uXXXX format', async ({ page }) => {
    const usageSection = page.locator('.info-box');
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain('\\uXXXX');
    expect(usageText).not.toContain('undefined');
  });
});

test.describe('WHOIS Lookup - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/whois');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/WHOIS/);
  });

  test('should have domain input field', async ({ page }) => {
    const domainInput = page.locator('#domainInput');
    await expect(domainInput).toBeVisible();
  });

  test('should have search button', async ({ page }) => {
    const searchButton = page.locator('button.btn-primary');
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toContainText('検索');
  });

  test('should show alert when searching with empty input', async ({ page }) => {
    const searchButton = page.locator('button.btn-primary');

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('ドメイン名を入力してください');
      await dialog.accept();
    });

    await searchButton.click();
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
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation links', async ({ page }) => {
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    const unicodeLink = page.locator('.nav-links a[href="/"]');
    await expect(unicodeLink).toBeVisible();
    await expect(unicodeLink).toContainText('Unicode変換');

    const whoisLink = page.locator('.nav-links a[href="/whois"]');
    await expect(whoisLink).toBeVisible();
    await expect(whoisLink).toContainText('WHOIS検索');
  });

  test('should navigate to Unicode page when clicking the link', async ({ page }) => {
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should show error for invalid domain format', async ({ page }) => {
    test.setTimeout(10000);
    const domainInput = page.locator('#domainInput');
    const searchButton = page.locator('button.btn-primary');

    await domainInput.fill('invalid');
    await searchButton.click();

    // Wait for error message
    const errorSection = page.locator('.error-message');
    await expect(errorSection).toBeVisible();
    await expect(errorSection).toContainText('無効なドメイン形式です');
  });
});

test.describe('Navigation - E2E Tests', () => {
  test('should navigate from Unicode page to WHOIS page', async ({ page }) => {
    await page.goto('/');
    await page.click('.nav-links a[href="/whois"]');
    await expect(page).toHaveURL('/whois');
  });

  test('should navigate from WHOIS page to Unicode page', async ({ page }) => {
    await page.goto('/whois');
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should navigate from Unicode page to IP検索 page', async ({ page }) => {
    await page.goto('/');
    await page.click('.nav-links a[href="/ip-geolocation"]');
    await expect(page).toHaveURL('/ip-geolocation');
  });

  test('should navigate from IP検索 page to WHOIS page', async ({ page }) => {
    await page.goto('/ip-geolocation');
    await page.click('.nav-links a[href="/whois"]');
    await expect(page).toHaveURL('/whois');
  });

  test('should show active state on Unicode link when on main page', async ({ page }) => {
    await page.goto('/');
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('Unicode変換');
  });

  test('should show active state on WHOIS link when on whois page', async ({ page }) => {
    await page.goto('/whois');
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('WHOIS検索');
  });

  test('should show active state on IP検索 link when on ip-geolocation page', async ({ page }) => {
    await page.goto('/ip-geolocation');
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('IP検索');
  });
});

test.describe('404 Not Found - E2E Tests', () => {
  test('should display 404 page for undefined routes', async ({ page }) => {
    await page.goto('/nonexistent-route');
    const heading = page.locator('.not-found-heading');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('404');
  });

  test('should display Japanese error message on 404 page', async ({ page }) => {
    await page.goto('/invalid-path');
    const title = page.locator('.not-found-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('ページが見つかりません');
  });

  test('should display explanation text on 404 page', async ({ page }) => {
    await page.goto('/missing');
    const message = page.locator('.not-found-message');
    await expect(message).toBeVisible();
    await expect(message).toContainText('お探しのページは存在しないか');
  });

  test('should have link back to home on 404 page', async ({ page }) => {
    await page.goto('/wrong-path');
    const homeLink = page.locator('.not-found-link');
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toContainText('ホームに戻る');
  });

  test('should navigate to home when clicking the link on 404 page', async ({ page }) => {
    await page.goto('/some/deep/path');
    await page.click('.not-found-link');
    await expect(page).toHaveURL('/');
  });

  test('should have proper language attribute on 404 page', async ({ page }) => {
    await page.goto('/not-here');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ja');
  });

  test('should include accessibility features on 404 page', async ({ page }) => {
    test.setTimeout(10000);
    await page.goto('/missing-page');
    await expect(page.locator('[role="banner"]').first()).toBeVisible();
    await expect(page.locator('[role="main"]').first()).toBeVisible();
    const skipLink = page.locator('.skip-link').first();
    await expect(skipLink).toBeAttached();
  });
});

test.describe('IP Geolocation Lookup - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ip-geolocation');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/IP/);
  });

  test('should have IP input field', async ({ page }) => {
    const ipInput = page.locator('#ipInput');
    await expect(ipInput).toBeVisible();
  });

  test('should have search button', async ({ page }) => {
    const searchButton = page.locator('button.btn-primary');
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toContainText('検索');
  });

  test('should show alert when searching with empty input', async ({ page }) => {
    const searchButton = page.locator('button.btn-primary');

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('IPアドレスを入力してください');
      await dialog.accept();
    });

    await searchButton.click();
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
    expect(usageText).not.toContain('undefined');
  });

  test('should have navigation links including IP検索', async ({ page }) => {
    const navLinks = page.locator('.nav-links');
    await expect(navLinks).toBeVisible();

    const ipLink = page.locator('.nav-links a[href="/ip-geolocation"]');
    await expect(ipLink).toBeVisible();
    await expect(ipLink).toContainText('IP検索');
  });

  test('should navigate to Unicode page when clicking the link', async ({ page }) => {
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Accessibility - E2E Tests', () => {
  test('should have aria-live status element on main page', async ({ page }) => {
    await page.goto('/');
    const statusElement = page.locator('#status-message');
    await expect(statusElement).toBeAttached();
  });

  test('should have aria-live status element on WHOIS page', async ({ page }) => {
    await page.goto('/whois');
    const statusElement = page.locator('#status-message');
    await expect(statusElement).toBeAttached();
  });

  test('should have proper ARIA labels on input fields', async ({ page }) => {
    await page.goto('/');
    const inputTextarea = page.locator('#inputText');
    await expect(inputTextarea).toHaveAttribute('aria-label');
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');
    const label = page.locator('label[for="inputText"]');
    await expect(label).toBeVisible();
  });

  test('should have navigation with aria-label', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav[aria-label]');
    await expect(nav).toBeVisible();
  });

  test('should have skip link for keyboard navigation', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('should have main content target for skip link', async ({ page }) => {
    await page.goto('/');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
  });
});
