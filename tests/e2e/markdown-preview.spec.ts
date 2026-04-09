import { test, expect } from "@playwright/test";

test.describe("Markdown Preview - E2E Tests", () => {
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
    await page.goto("/markdown-preview");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Markdownプレビュー/);
  });

  test("should have a textarea for markdown input", async ({ page }) => {
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
  });

  test("should show preview when markdown is entered", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("# テスト見出し\n\nこれはテストです。");

    // プレビューエリアにh1が表示されることを確認
    const previewArea = page.locator(".markdown-preview-content");
    await expect(previewArea).toBeVisible();
    await expect(previewArea.locator("h1")).toContainText("テスト見出し");
  });

  test("should insert sample markdown when sample button is clicked", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "サンプルを挿入" });
    await sampleButton.click();

    const textarea = page.locator("textarea");
    const value = await textarea.inputValue();
    expect(value).toContain("# Markdownサンプル");
  });

  test("should show preview after inserting sample", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "サンプルを挿入" });
    await sampleButton.click();

    const previewArea = page.locator(".markdown-preview-content");
    await expect(previewArea.locator("h1")).toBeVisible();
    await expect(previewArea.locator("table")).toBeVisible();
  });

  test("should clear content when clear button is clicked", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("# テスト");

    const clearButton = page.locator("button.btn-clear");
    await clearButton.click();

    await expect(textarea).toHaveValue("");

    // プレビューエリアにプレースホルダーが表示されることを確認
    const placeholder = page.locator(".markdown-preview-placeholder");
    await expect(placeholder).toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();

    // プレビューエリアのrole属性確認
    const previewRegion = page.locator(
      '[role="region"][aria-label="Markdownプレビュー表示エリア"]',
    );
    await expect(previewRegion).toBeVisible();
  });

  test("should navigate to markdown-preview page from other pages via category", async ({
    page,
  }) => {
    await page.goto("/");
    await navigateViaCategory(page, "テキスト", "/markdown-preview");
    await expect(page).toHaveURL("/markdown-preview");
  });

  test("should display placeholder when input is empty", async ({ page }) => {
    const placeholder = page.locator(".markdown-preview-placeholder");
    await expect(placeholder).toBeVisible();
  });

  test("should render bold text correctly", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("**太字テキスト**");

    const previewArea = page.locator(".markdown-preview-content");
    await expect(previewArea.locator("strong")).toContainText("太字テキスト");
  });

  test("should render list items correctly", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("- 項目1\n- 項目2\n- 項目3");

    const previewArea = page.locator(".markdown-preview-content");
    await expect(previewArea.locator("ul li")).toHaveCount(3);
  });
});
