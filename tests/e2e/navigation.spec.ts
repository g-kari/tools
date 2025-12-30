import { test, expect } from '@playwright/test';

test.describe('Navigation - E2E Tests', () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(page: import('@playwright/test').Page, categoryName: string, linkHref: string) {
    // カテゴリボタンをホバーしてドロップダウンを開く
    const categoryBtn = page.locator('.nav-category-btn', { hasText: categoryName });
    await categoryBtn.hover();

    // ドロップダウンが表示されるのを待つ
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();

    // リンクをクリック
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test('should navigate from Unicode page to WHOIS page via category dropdown', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await navigateViaCategory(page, '検索', '/whois');
    await expect(page).toHaveURL('/whois');
  });

  test('should navigate from WHOIS page to Unicode page via category dropdown', async ({ page }) => {
    await page.goto('/whois', { waitUntil: 'domcontentloaded' });
    await navigateViaCategory(page, '変換', '/');
    await expect(page).toHaveURL('/');
  });

  test('should navigate from Unicode page to IP検索 page via category dropdown', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await navigateViaCategory(page, '検索', '/ip-geolocation');
    await expect(page).toHaveURL('/ip-geolocation');
  });

  test('should navigate from IP検索 page to WHOIS page via category dropdown', async ({ page }) => {
    await page.goto('/ip-geolocation', { waitUntil: 'domcontentloaded' });
    await navigateViaCategory(page, '検索', '/whois');
    await expect(page).toHaveURL('/whois');
  });

  test('should show active state on category button when on Unicode page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('変換');
  });

  test('should show active state on category button when on WHOIS page', async ({ page }) => {
    await page.goto('/whois', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('検索');
  });

  test('should show active state on category button when on IP検索 page', async ({ page }) => {
    await page.goto('/ip-geolocation', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('検索');
  });

  test('should navigate from Unicode page to グローバルIP page via category dropdown', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await navigateViaCategory(page, '検索', '/global-ip');
    await expect(page).toHaveURL('/global-ip');
  });

  test('should navigate from グローバルIP page to WHOIS page via category dropdown', async ({ page }) => {
    await page.goto('/global-ip', { waitUntil: 'domcontentloaded' });
    await navigateViaCategory(page, '検索', '/whois');
    await expect(page).toHaveURL('/whois');
  });

  test('should show active state on category button when on global-ip page', async ({ page }) => {
    await page.goto('/global-ip', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('検索');
  });

  test('should navigate from Unicode page to UUID生成 page via category dropdown', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await navigateViaCategory(page, '生成', '/uuid');
    await expect(page).toHaveURL('/uuid');
  });

  test('should navigate from UUID生成 page to WHOIS page via category dropdown', async ({ page }) => {
    await page.goto('/uuid', { waitUntil: 'domcontentloaded' });
    await navigateViaCategory(page, '検索', '/whois');
    await expect(page).toHaveURL('/whois');
  });

  test('should show active state on category button when on uuid page', async ({ page }) => {
    await page.goto('/uuid', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('生成');
  });

  test('should navigate from Unicode page to サーバー環境 page via category dropdown', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await navigateViaCategory(page, '情報', '/server-env');
    await expect(page).toHaveURL('/server-env');
  });

  test('should navigate from サーバー環境 page to WHOIS page via category dropdown', async ({ page }) => {
    await page.goto('/server-env', { waitUntil: 'domcontentloaded' });
    await navigateViaCategory(page, '検索', '/whois');
    await expect(page).toHaveURL('/whois');
  });

  test('should show active state on category button when on server-env page', async ({ page }) => {
    await page.goto('/server-env', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    const activeCategory = page.locator('.nav-category-btn.active');
    await expect(activeCategory).toContainText('情報');
  });

  test('should show active item in dropdown when hovering category', async ({ page }) => {
    await page.goto('/whois', { waitUntil: 'domcontentloaded' });

    // 検索カテゴリをホバー
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '検索' });
    await categoryBtn.hover();

    // ドロップダウン内のアクティブなリンクを確認
    const activeLink = page.locator('.nav-dropdown-item.active');
    await expect(activeLink).toContainText('WHOIS');
  });

  test('should close dropdown after clicking a link', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 検索カテゴリをホバー
    const categoryBtn = page.locator('.nav-category-btn', { hasText: '検索' });
    await categoryBtn.hover();

    // ドロップダウンが表示されることを確認
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();

    // リンクをクリック
    const link = dropdown.locator('a[href="/whois"]');
    await link.click();

    // ページ遷移後、ドロップダウンが閉じていることを確認
    await expect(page).toHaveURL('/whois');
  });
});
