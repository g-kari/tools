import { test, expect } from '@playwright/test';

test.describe('MIME Types Reference - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mime-types');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toBe('undefined');
  });

  test('should display the correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/MIMEタイプ/);
  });

  test('should display the main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Web ツール集');
  });

  test('should display the section heading', async ({ page }) => {
    const sectionHeading = page.locator('h2');
    await expect(sectionHeading).toBeVisible();
    await expect(sectionHeading).toContainText('MIMEタイプ');
  });

  test('should display category filter buttons', async ({ page }) => {
    const filterButtons = page.locator('.mime-filter-btn');
    // all, application, text, image, audio, video, font, multipart = 8
    await expect(filterButtons).toHaveCount(8);
  });

  test('should have "all" category selected by default', async ({ page }) => {
    const allButton = page.locator('.mime-filter-btn.active');
    await expect(allButton).toContainText('すべて');
  });

  test('should display search input', async ({ page }) => {
    const searchInput = page.locator('#mime-search-input');
    await expect(searchInput).toBeVisible();
  });

  test('should display MIME type cards', async ({ page }) => {
    const cards = page.locator('.mime-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display count text', async ({ page }) => {
    const countText = page.locator('.mime-count');
    await expect(countText).toBeVisible();
    const text = await countText.textContent();
    expect(text).toContain('件');
  });

  test('should filter by image category', async ({ page }) => {
    const imageButton = page.locator('.mime-filter-btn', {
      hasText: 'image',
    });
    await imageButton.click();

    await expect(imageButton).toHaveClass(/active/);

    const badges = page.locator('.mime-badge');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const badgeText = await badges.nth(i).textContent();
      expect(badgeText).toBe('image');
    }
  });

  test('should filter by text category', async ({ page }) => {
    const textButton = page.locator('.mime-filter-btn', {
      hasText: 'text',
    });
    // exactで "text" のみ一致するボタンを選択
    const exactTextButton = page.locator('.mime-filter-btn').filter({ hasText: /^text$/ });
    await exactTextButton.click();

    const badges = page.locator('.mime-badge');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const badgeText = await badges.nth(i).textContent();
      expect(badgeText).toBe('text');
    }
  });

  test('should filter by font category', async ({ page }) => {
    const fontButton = page.locator('.mime-filter-btn').filter({ hasText: /^font$/ });
    await fontButton.click();

    const badges = page.locator('.mime-badge');
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const badgeText = await badges.nth(i).textContent();
      expect(badgeText).toBe('font');
    }
  });

  test('should search by MIME type name', async ({ page }) => {
    const searchInput = page.locator('#mime-search-input');
    await searchInput.fill('application/json');

    const cards = page.locator('.mime-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const firstTypeValue = await cards.first().locator('.mime-type-value').textContent();
    expect(firstTypeValue).toContain('json');
  });

  test('should search by file extension', async ({ page }) => {
    const searchInput = page.locator('#mime-search-input');
    await searchInput.fill('.mp3');

    const cards = page.locator('.mime-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // audio/mpegが含まれることを確認
    const allTypeTexts = await cards.allTextContents();
    const hasMp3 = allTypeTexts.some((text) => text.includes('mpeg') || text.includes('mp3'));
    expect(hasMp3).toBe(true);
  });

  test('should search by description', async ({ page }) => {
    const searchInput = page.locator('#mime-search-input');
    await searchInput.fill('ファイルアップロード');

    const cards = page.locator('.mime-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should show empty state when no results', async ({ page }) => {
    const searchInput = page.locator('#mime-search-input');
    await searchInput.fill('xyznotexistmimetype');

    const emptyState = page.locator('.mime-empty');
    await expect(emptyState).toBeVisible();
  });

  test('should have copy button on each card', async ({ page }) => {
    const firstCard = page.locator('.mime-card').first();
    const copyBtn = firstCard.locator('.mime-copy-btn');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toContainText('コピー');
  });

  test('should show toast on copy', async ({ page }) => {
    const firstCard = page.locator('.mime-card').first();
    const copyBtn = firstCard.locator('.mime-copy-btn');
    await copyBtn.click();

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible({ timeout: 3000 });
  });

  test('should display cards with type, description, and badge', async ({
    page,
  }) => {
    const firstCard = page.locator('.mime-card').first();

    const typeValue = firstCard.locator('.mime-type-value');
    const desc = firstCard.locator('.mime-desc');
    const badge = firstCard.locator('.mime-badge');

    await expect(typeValue).toBeVisible();
    await expect(desc).toBeVisible();
    await expect(badge).toBeVisible();

    const typeText = await typeValue.textContent();
    expect(typeText?.trim().length).toBeGreaterThan(0);
    expect(typeText).toContain('/');

    const descText = await desc.textContent();
    expect(descText?.trim().length).toBeGreaterThan(0);
  });

  test('should display application/json in the list', async ({ page }) => {
    const searchInput = page.locator('#mime-search-input');
    await searchInput.fill('application/json');

    const cards = page.locator('.mime-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const firstTypeValue = await cards.first().locator('.mime-type-value').textContent();
    expect(firstTypeValue).toContain('application/json');
  });

  test('should display font/woff2 in the list', async ({ page }) => {
    const searchInput = page.locator('#mime-search-input');
    await searchInput.fill('font/woff2');

    const cards = page.locator('.mime-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const firstTypeValue = await cards.first().locator('.mime-type-value').textContent();
    expect(firstTypeValue).toContain('woff2');
  });

  test('should be navigable via category dropdown', async ({ page }) => {
    await page.goto('/');
    const categoryBtn = page.locator('.nav-category-btn', {
      hasText: '検証',
    });
    await categoryBtn.hover();
    const dropdown = page.locator('.nav-dropdown');
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/mime-types"]');
    await link.click();
    await expect(page).toHaveURL(/mime-types/);
    await expect(page).toHaveTitle(/MIMEタイプ/);
  });

  test('should display TipsCard', async ({ page }) => {
    const tipsCard = page.locator('.tips-card');
    await expect(tipsCard).toBeVisible();
  });

  test('should show count update when filtering', async ({ page }) => {
    const countText = page.locator('.mime-count');
    const initialText = await countText.textContent();

    const imageButton = page.locator('.mime-filter-btn').filter({ hasText: /^image$/ });
    await imageButton.click();

    const filteredText = await countText.textContent();
    expect(filteredText).not.toBe(initialText);
  });

  test('should have accessible aria labels', async ({ page }) => {
    const filterGroup = page.locator('[aria-label="カテゴリフィルター"]');
    await expect(filterGroup).toBeVisible();

    const searchInput = page.locator('[aria-label="MIMEタイプを検索"]');
    await expect(searchInput).toBeVisible();

    const cardList = page.locator('[aria-label="MIMEタイプ一覧"]');
    await expect(cardList).toBeVisible();
  });

  test('should display extension tags for types with extensions', async ({
    page,
  }) => {
    // 拡張子を持つタイプ（image/jpegなど）を検索
    const searchInput = page.locator('#mime-search-input');
    await searchInput.fill('image/jpeg');

    const firstCard = page.locator('.mime-card').first();
    const extTags = firstCard.locator('.mime-ext-tag');
    const count = await extTags.count();
    expect(count).toBeGreaterThan(0);
  });
});
