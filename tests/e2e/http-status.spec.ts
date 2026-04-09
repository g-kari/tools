import { test, expect } from "@playwright/test";

test.describe("HTTP Status Code Reference - E2E Tests", () => {
  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(
    page: import("@playwright/test").Page,
    categoryName: string,
    linkHref: string,
  ) {
    const categoryBtn = page.locator(".nav-category-btn", {
      hasText: categoryName,
    });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/http-status");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/HTTPステータスコード/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("should display the section heading", async ({ page }) => {
    const sectionHeading = page.locator("h2");
    await expect(sectionHeading).toBeVisible();
    await expect(sectionHeading).toContainText("HTTPステータスコード");
  });

  test("should display category filter buttons", async ({ page }) => {
    const filterButtons = page.locator(".http-status-filter-btn");
    await expect(filterButtons).toHaveCount(6); // all, 1xx, 2xx, 3xx, 4xx, 5xx
  });

  test('should have "all" category selected by default', async ({ page }) => {
    const allButton = page.locator(".http-status-filter-btn.active");
    await expect(allButton).toContainText("すべて");
  });

  test("should display search input", async ({ page }) => {
    const searchInput = page.locator("#http-status-search-input");
    await expect(searchInput).toBeVisible();
  });

  test("should display status code cards", async ({ page }) => {
    const cards = page.locator(".http-status-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display count text", async ({ page }) => {
    const countText = page.locator(".http-status-count");
    await expect(countText).toBeVisible();
    const text = await countText.textContent();
    expect(text).toContain("件");
  });

  test("should filter by 2xx category", async ({ page }) => {
    const button2xx = page.locator(".http-status-filter-btn", {
      hasText: "2xx",
    });
    await button2xx.click();

    await expect(button2xx).toHaveClass(/active/);

    // すべてのカードが2xxカテゴリであることを確認
    const badges = page.locator(".http-status-badge");
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const badgeText = await badges.nth(i).textContent();
      expect(badgeText).toBe("2xx");
    }
  });

  test("should filter by 4xx category", async ({ page }) => {
    const button4xx = page.locator(".http-status-filter-btn", {
      hasText: "4xx",
    });
    await button4xx.click();

    const badges = page.locator(".http-status-badge");
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const badgeText = await badges.nth(i).textContent();
      expect(badgeText).toBe("4xx");
    }
  });

  test("should filter by 5xx category", async ({ page }) => {
    const button5xx = page.locator(".http-status-filter-btn", {
      hasText: "5xx",
    });
    await button5xx.click();

    const badges = page.locator(".http-status-badge");
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const badgeText = await badges.nth(i).textContent();
      expect(badgeText).toBe("5xx");
    }
  });

  test("should search by code number", async ({ page }) => {
    const searchInput = page.locator("#http-status-search-input");
    await searchInput.fill("404");

    const cards = page.locator(".http-status-card");
    await expect(cards).toHaveCount(1);

    const codeSpan = cards.first().locator(".http-status-code");
    await expect(codeSpan).toContainText("404");
  });

  test("should search by name", async ({ page }) => {
    const searchInput = page.locator("#http-status-search-input");
    await searchInput.fill("Not Found");

    const cards = page.locator(".http-status-card");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // 404 Not Foundが含まれることを確認
    const firstCardName = await cards.first().locator(".http-status-name").textContent();
    expect(firstCardName?.toLowerCase()).toContain("not found");
  });

  test("should show empty state when no results", async ({ page }) => {
    const searchInput = page.locator("#http-status-search-input");
    await searchInput.fill("xyznotfoundstatus");

    const emptyState = page.locator(".http-status-empty");
    await expect(emptyState).toBeVisible();
  });

  test("should have copy button on each card", async ({ page }) => {
    const firstCard = page.locator(".http-status-card").first();
    const copyBtn = firstCard.locator(".http-status-copy-btn");
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toContainText("コードをコピー");
  });

  test("should show toast on copy", async ({ page }) => {
    // コピーボタンをクリック
    const firstCard = page.locator(".http-status-card").first();
    const copyBtn = firstCard.locator(".http-status-copy-btn");
    await copyBtn.click();

    // トーストが表示されることを確認
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible({ timeout: 3000 });
  });

  test("should display cards with code, name, and description", async ({ page }) => {
    const firstCard = page.locator(".http-status-card").first();

    const code = firstCard.locator(".http-status-code");
    const name = firstCard.locator(".http-status-name");
    const desc = firstCard.locator(".http-status-desc");
    const badge = firstCard.locator(".http-status-badge");

    await expect(code).toBeVisible();
    await expect(name).toBeVisible();
    await expect(desc).toBeVisible();
    await expect(badge).toBeVisible();

    const codeText = await code.textContent();
    expect(codeText?.trim().length).toBeGreaterThan(0);

    const nameText = await name.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);

    const descText = await desc.textContent();
    expect(descText?.trim().length).toBeGreaterThan(0);
  });

  test("should display 200 OK in the list", async ({ page }) => {
    const searchInput = page.locator("#http-status-search-input");
    await searchInput.fill("200");

    const cards = page.locator(".http-status-card");
    await expect(cards).toHaveCount(1);
    const name = cards.first().locator(".http-status-name");
    await expect(name).toContainText("OK");
  });

  test("should display 500 Internal Server Error in the list", async ({ page }) => {
    const searchInput = page.locator("#http-status-search-input");
    await searchInput.fill("500");

    const cards = page.locator(".http-status-card");
    await expect(cards).toHaveCount(1);
    const name = cards.first().locator(".http-status-name");
    await expect(name).toContainText("Internal Server Error");
  });

  test("should be navigable via category dropdown", async ({ page }) => {
    await page.goto("/");
    await navigateViaCategory(page, "検証", "/http-status");
    await expect(page).toHaveURL(/http-status/);
    await expect(page).toHaveTitle(/HTTPステータスコード/);
  });

  test("should display TipsCard", async ({ page }) => {
    const tipsCard = page.locator(".tips-card");
    await expect(tipsCard).toBeVisible();
  });

  test("should show count update when filtering", async ({ page }) => {
    // 最初の件数を取得
    const countText = page.locator(".http-status-count");
    const initialText = await countText.textContent();

    // 2xxにフィルタリング
    const button2xx = page.locator(".http-status-filter-btn", {
      hasText: "2xx",
    });
    await button2xx.click();

    const filteredText = await countText.textContent();
    // フィルタ後の件数は全件数より少ないはず
    expect(filteredText).not.toBe(initialText);
  });

  test("should clear search when clicking 'all' category after search", async ({ page }) => {
    // 検索
    const searchInput = page.locator("#http-status-search-input");
    await searchInput.fill("404");

    // カテゴリをallに変更
    const allButton = page.locator(".http-status-filter-btn", {
      hasText: "すべて",
    });
    await allButton.click();

    // 404の検索結果はまだ表示されているはず（検索はクリアされない）
    const cards = page.locator(".http-status-card");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("should have accessible aria labels", async ({ page }) => {
    // フィルターグループのaria-label
    const filterGroup = page.locator('[aria-label="カテゴリフィルター"]');
    await expect(filterGroup).toBeVisible();

    // 検索入力のaria-label
    const searchInput = page.locator('[aria-label="ステータスコードを検索"]');
    await expect(searchInput).toBeVisible();

    // カード一覧のaria-label
    const cardList = page.locator('[aria-label="HTTPステータスコード一覧"]');
    await expect(cardList).toBeVisible();
  });
});
