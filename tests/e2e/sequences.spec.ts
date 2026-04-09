import { test, expect } from "@playwright/test";

test.describe("数列ジェネレーター - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sequences");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/数列ジェネレーター/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator(".section-title").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("数列ジェネレーター");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("should show sequence type list in sidebar", async ({ page }) => {
    const sidebar = page.locator(".sequences-sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator(".sequences-type-btn")).toHaveCount(
      await sidebar.locator(".sequences-type-btn").count(),
    );
    // フィボナッチが表示されている
    await expect(sidebar).toContainText("フィボナッチ数列");
  });

  test("should select fibonacci by default", async ({ page }) => {
    const activeBtn = page.locator(".sequences-type-btn.active");
    await expect(activeBtn).toBeVisible();
    await expect(activeBtn).toContainText("フィボナッチ数列");
  });

  test("should show fibonacci sequence output", async ({ page }) => {
    const output = page.locator(".sequences-output");
    await expect(output).toBeVisible();
    const text = await output.textContent();
    // フィボナッチ数列の先頭を確認
    expect(text).toContain("0");
    expect(text).toContain("1");
  });

  test("should switch to prime sequence", async ({ page }) => {
    const primeBtn = page.locator(".sequences-type-btn", { hasText: "素数列" });
    await primeBtn.click();
    await expect(primeBtn).toHaveClass(/active/);

    const output = page.locator(".sequences-output");
    const text = await output.textContent();
    expect(text).toContain("2");
    expect(text).toContain("3");
    expect(text).toContain("5");
  });

  test("should change count and update sequence", async ({ page }) => {
    const countInput = page.locator("#seq-count");
    await countInput.fill("5");

    const output = page.locator(".sequences-output");
    const text = await output.textContent();
    // 5項のフィボナッチ: 0, 1, 1, 2, 3
    expect(text).toContain("0");
  });

  test("should switch output format to newline", async ({ page }) => {
    const newlineBtn = page.locator(".sequences-format-btn", { hasText: "改行" });
    await newlineBtn.click();
    await expect(newlineBtn).toHaveClass(/active/);

    const output = page.locator(".sequences-output");
    const text = await output.textContent();
    expect(text).toContain("\n");
  });

  test("should switch output format to JSON", async ({ page }) => {
    const jsonBtn = page.locator(".sequences-format-btn", { hasText: "JSON" });
    await jsonBtn.click();

    const output = page.locator(".sequences-output");
    const text = await output.textContent();
    expect(text).toMatch(/^\[.*\]$/);
  });

  test("should switch to tag view", async ({ page }) => {
    const tagBtn = page.locator(".sequences-format-btn", { hasText: "タグ" });
    await tagBtn.click();

    const tags = page.locator(".sequences-tags");
    await expect(tags).toBeVisible();
    const tagItems = tags.locator(".sequences-tag");
    await expect(tagItems.first()).toBeVisible();
  });

  test("should show params for arithmetic sequence", async ({ page }) => {
    const arithmeticBtn = page.locator(".sequences-type-btn", { hasText: "等差数列" });
    await arithmeticBtn.click();

    // パラメーター入力が表示される
    const param0 = page.locator("#seq-param-0");
    const param1 = page.locator("#seq-param-1");
    await expect(param0).toBeVisible();
    await expect(param1).toBeVisible();
  });

  test("should show collatz sequence for start value", async ({ page }) => {
    const collatzBtn = page.locator(".sequences-type-btn", { hasText: "コラッツ数列" });
    await collatzBtn.click();

    const startInput = page.locator("#seq-param-0");
    await startInput.fill("6");

    const output = page.locator(".sequences-output");
    const text = await output.textContent();
    // 6→3→10→5→16→8→4→2→1
    expect(text).toContain("6");
    expect(text).toContain("1");
  });

  test("should display statistics", async ({ page }) => {
    const statsGrid = page.locator(".sequences-stats-grid");
    await expect(statsGrid).toBeVisible();
    await expect(statsGrid.locator(".sequences-stat-card").first()).toBeVisible();
  });

  test("should have copy button", async ({ page }) => {
    const copyBtn = page.locator("button.btn-primary", { hasText: "コピー" });
    await expect(copyBtn).toBeVisible();
  });

  test("should show tips card", async ({ page }) => {
    const tips = page.locator(".tips-card").first();
    await expect(tips).toBeVisible();
  });

  test("should have 生成 category active in navigation", async ({ page }) => {
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("生成");
  });
});
