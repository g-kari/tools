import { test, expect } from '@playwright/test';

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
