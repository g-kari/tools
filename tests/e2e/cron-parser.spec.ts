import { test, expect } from "@playwright/test";

test.describe("Cron Parser - E2E Tests", () => {
  // タイムアウトはplaywright.config.tsで設定（CI: 30秒, ローカル: 10秒）

  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(
    page: import("@playwright/test").Page,
    categoryName: string,
    linkHref: string,
  ) {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: categoryName });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/cron-parser");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Cron/);
  });

  test("should have Cron expression input field", async ({ page }) => {
    const cronInput = page.locator("#cronInput");
    await expect(cronInput).toBeVisible();
  });

  test("should have parse and clear buttons", async ({ page }) => {
    const parseButton = page.locator("button.btn-primary");
    const clearButton = page.locator("button.btn-clear");
    await expect(parseButton).toBeVisible();
    await expect(parseButton).toContainText("解析");
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toContainText("クリア");
  });

  test("should display preset buttons", async ({ page }) => {
    const presetGroup = page.locator('[aria-label="Cronプリセット一覧"]');
    await expect(presetGroup).toBeVisible();

    const presetButtons = presetGroup.locator("button");
    const count = await presetButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("should fill input when clicking a preset button", async ({ page }) => {
    const cronInput = page.locator("#cronInput");

    // 「毎分」プリセットをクリック
    const presetButton = page.locator('[aria-label="Cronプリセット一覧"] button').first();
    await presetButton.click();

    const value = await cronInput.inputValue();
    expect(value.trim()).not.toBe("");
  });

  test("should show description when typing a valid cron expression", async ({ page }) => {
    const cronInput = page.locator("#cronInput");
    await cronInput.fill("* * * * *");

    // 説明が表示されること
    const description = page.locator("#cron-description");
    await expect(description).toBeVisible();
    await expect(description).toContainText("毎分実行");
  });

  test("should show validation error for invalid cron expression", async ({ page }) => {
    const cronInput = page.locator("#cronInput");
    await cronInput.fill("invalid expression here");

    const errorMessage = page.locator("#cron-error");
    await expect(errorMessage).toBeVisible();
  });

  test("should show validation error for wrong field count", async ({ page }) => {
    const cronInput = page.locator("#cronInput");
    await cronInput.fill("* * * *");

    const errorMessage = page.locator("#cron-error");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("フィールド数");
  });

  test("should show toast when submitting empty expression", async ({ page }) => {
    const parseButton = page.locator("button.btn-primary");
    await parseButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("Cron式を入力してください");
  });

  test("should show next execution times after parsing", async ({ page }) => {
    const cronInput = page.locator("#cronInput");
    await cronInput.fill("* * * * *");

    const parseButton = page.locator("button.btn-primary");
    await parseButton.click();

    const nextTimesSection = page.locator("#next-times-title");
    await expect(nextTimesSection).toBeVisible();
    await expect(nextTimesSection).toContainText("次回実行予定時刻");

    const timeItems = page.locator(".cron-next-time-item");
    const count = await timeItems.count();
    expect(count).toBe(10);
  });

  test("should clear input and results when clear button is clicked", async ({ page }) => {
    const cronInput = page.locator("#cronInput");
    await cronInput.fill("* * * * *");

    const parseButton = page.locator("button.btn-primary");
    await parseButton.click();

    await expect(page.locator("#next-times-title")).toBeVisible();

    const clearButton = page.locator("button.btn-clear");
    await clearButton.click();

    await expect(cronInput).toHaveValue("");
    await expect(page.locator("#next-times-title")).not.toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should have accessible form with aria-label", async ({ page }) => {
    const form = page.locator('[aria-label="Cronパーサーフォーム"]');
    await expect(form).toBeVisible();
  });

  test("should display usage instructions in tips card", async ({ page }) => {
    const allInfoBoxes = page.locator(".info-box");
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(" ");

    expect(combinedText).toContain("使い方");
    expect(combinedText).not.toContain("undefined");
  });

  test("should have navigation link to cron-parser in category dropdown", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "検証" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const cronLink = dropdown.locator('a[href="/cron-parser"]');
    await expect(cronLink).toBeVisible();
    await expect(cronLink).toContainText("Cron");
  });

  test("should navigate to cron-parser from other pages via category", async ({ page }) => {
    await page.goto("/");
    await navigateViaCategory(page, "検証", "/cron-parser");
    await expect(page).toHaveURL("/cron-parser");
  });

  test("should show active state on category button when on cron-parser page", async ({ page }) => {
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("検証");
  });

  test("should show description for preset after selection and parsing", async ({ page }) => {
    // 毎日9時のプリセットを選択
    const presetBtn = page.locator('[aria-label*="毎日9時0分"]');
    if ((await presetBtn.count()) > 0) {
      await presetBtn.click();
      const description = page.locator("#cron-description");
      await expect(description).toBeVisible();
    } else {
      // プリセットボタンをクリックして入力後に解析
      const cronInput = page.locator("#cronInput");
      await cronInput.fill("0 9 * * *");
      const description = page.locator("#cron-description");
      await expect(description).toBeVisible();
      await expect(description).toContainText("9時");
    }
  });
});
