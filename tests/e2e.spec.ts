import { test, expect } from '@playwright/test';

test.describe('Unicode Escape Converter - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

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
    const inputTextarea = page.locator('#inputText');
    const outputTextarea = page.locator('#outputText');
    const decodeButton = page.locator('button.btn-secondary').first();

    await inputTextarea.fill('\\u3053\\u3093\\u306b\\u3061\\u306f');
    await decodeButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).toHaveValue('こんにちは');
  });

  test('should clear both textareas', async ({ page }) => {
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
  test.describe.configure({ timeout: 10000 });

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
  test.describe.configure({ timeout: 10000 });

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

  test('should navigate from Unicode page to グローバルIP page', async ({ page }) => {
    await page.goto('/');
    await page.click('.nav-links a[href="/global-ip"]');
    await expect(page).toHaveURL('/global-ip');
  });

  test('should navigate from グローバルIP page to WHOIS page', async ({ page }) => {
    await page.goto('/global-ip');
    await page.click('.nav-links a[href="/whois"]');
    await expect(page).toHaveURL('/whois');
  });

  test('should show active state on グローバルIP link when on global-ip page', async ({ page }) => {
    await page.goto('/global-ip');
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('グローバルIP');
  });
});

test.describe('404 Not Found - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

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
    await page.goto('/missing-page');
    await expect(page.locator('[role="banner"]').first()).toBeVisible();
    await expect(page.locator('[role="main"]').first()).toBeVisible();
    const skipLink = page.locator('.skip-link').first();
    await expect(skipLink).toBeAttached();
  });
});

test.describe('IP Geolocation Lookup - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

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

test.describe('Global IP Lookup - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/global-ip');
    // Wait for React hydration
    await page.waitForLoadState('networkidle');
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

  test('should navigate to Unicode page when clicking the link', async ({ page }) => {
    await page.click('.nav-links a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should display either IP address or error message after loading', async ({ page }) => {
    // Wait for loading to complete (either success or error)
    // Use a longer timeout since server function may take time
    await Promise.race([
      page.waitForSelector('.ip-display', { timeout: 8000 }),
      page.waitForSelector('.error-message', { timeout: 8000 }),
    ]).catch(() => {
      // If neither appears, the test will fail below
    });

    // Verify that loading is complete - either IP or error should be visible
    const ipDisplay = page.locator('.ip-display');
    const errorMessage = page.locator('.error-message');
    const isIpVisible = await ipDisplay.isVisible();
    const isErrorVisible = await errorMessage.isVisible();

    // One of them must be visible (mutually exclusive states)
    expect(isIpVisible || isErrorVisible).toBe(true);
  });

  test('should have copy and refresh buttons when IP is displayed', async ({ page }) => {
    // Wait for loading to complete
    await Promise.race([
      page.waitForSelector('.ip-display', { timeout: 8000 }),
      page.waitForSelector('.error-message', { timeout: 8000 }),
    ]).catch(() => {});

    // Check buttons only if IP is displayed
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

test.describe('Accessibility - E2E Tests', () => {
  test.describe.configure({ timeout: 10000 });

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
