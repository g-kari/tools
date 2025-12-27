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

  test('should navigate from Unicode page to サーバー環境 page', async ({ page }) => {
    await page.goto('/');
    await page.click('.nav-links a[href="/server-env"]');
    await expect(page).toHaveURL('/server-env');
  });

  test('should navigate from サーバー環境 page to WHOIS page', async ({ page }) => {
    await page.goto('/server-env');
    await page.click('.nav-links a[href="/whois"]');
    await expect(page).toHaveURL('/whois');
  });

  test('should show active state on サーバー環境 link when on server-env page', async ({ page }) => {
    await page.goto('/server-env');
    const activeLink = page.locator('.nav-links a[data-active="true"]');
    await expect(activeLink).toContainText('サーバー環境');
  });
});
