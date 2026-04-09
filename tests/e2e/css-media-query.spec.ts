import { test, expect } from "@playwright/test";

test.describe("CSSメディアクエリビルダー - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/css-media-query");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/CSSメディアクエリビルダー/);
  });

  test("should display media type selection buttons", async ({ page }) => {
    const allBtn = page.locator(".cmq-media-type-btn", { hasText: "all" });
    const screenBtn = page.locator(".cmq-media-type-btn", {
      hasText: "screen",
    });
    const printBtn = page.locator(".cmq-media-type-btn", { hasText: "print" });
    await expect(allBtn).toBeVisible();
    await expect(screenBtn).toBeVisible();
    await expect(printBtn).toBeVisible();
  });

  test("should have screen selected by default", async ({ page }) => {
    const screenBtn = page.locator(".cmq-media-type-btn", {
      hasText: "screen",
    });
    await expect(screenBtn).toHaveClass(/active/);
  });

  test("should display query conditions section", async ({ page }) => {
    const conditionCard = page.locator(".cmq-condition-card").first();
    await expect(conditionCard).toBeVisible();
  });

  test("should show output panel with @media content", async ({ page }) => {
    const outputPre = page.locator(".cmq-output-pre");
    await expect(outputPre).toBeVisible();
    const content = await outputPre.textContent();
    expect(content).toContain("@media");
    expect(content).toContain("screen");
  });

  test("should switch media type to print", async ({ page }) => {
    const printBtn = page.locator(".cmq-media-type-btn", { hasText: "print" });
    await printBtn.click();
    await expect(printBtn).toHaveClass(/active/);
    const outputPre = page.locator(".cmq-output-pre");
    const content = await outputPre.textContent();
    expect(content).toContain("print");
  });

  test("should switch media type to all", async ({ page }) => {
    const allBtn = page.locator(".cmq-media-type-btn", { hasText: "all" });
    await allBtn.click();
    await expect(allBtn).toHaveClass(/active/);
    const outputPre = page.locator(".cmq-output-pre");
    const content = await outputPre.textContent();
    expect(content).toContain("@media all");
  });

  test("should change feature to max-width", async ({ page }) => {
    const featureSelect = page.locator(".cmq-condition-type-select").first();
    await featureSelect.selectOption("max-width");
    const outputPre = page.locator(".cmq-output-pre");
    const content = await outputPre.textContent();
    expect(content).toContain("max-width");
  });

  test("should add a new condition", async ({ page }) => {
    const addBtn = page.locator(".cmq-add-condition");
    await addBtn.click();
    const cards = page.locator(".cmq-condition-card");
    await expect(cards).toHaveCount(2);
  });

  test("should remove a condition when 2 conditions exist", async ({ page }) => {
    // まず条件を追加
    await page.locator(".cmq-add-condition").click();
    const cards = page.locator(".cmq-condition-card");
    await expect(cards).toHaveCount(2);

    // 2番目の条件を削除
    const removeBtn = page.locator(".cmq-condition-remove").nth(1);
    await removeBtn.click();
    await expect(cards).toHaveCount(1);
  });

  test("should disable remove button when only 1 condition exists", async ({ page }) => {
    const removeBtn = page.locator(".cmq-condition-remove").first();
    await expect(removeBtn).toBeDisabled();
  });

  test("should show condition preview text", async ({ page }) => {
    const preview = page.locator(".cmq-condition-preview").first();
    await expect(preview).toBeVisible();
    const text = await preview.textContent();
    expect(text).toMatch(/\(min-width:/);
  });

  test("should apply breakpoint from quick access list", async ({ page }) => {
    // md (768px) ブレイクポイントを適用
    const mdBtn = page.locator(".cmq-bp-item").filter({ hasText: "md (768px)" });
    await mdBtn.click();
    const preview = page.locator(".cmq-condition-preview").first();
    const text = await preview.textContent();
    expect(text).toContain("768px");
  });

  test("should update output when target selector is changed", async ({ page }) => {
    const selectorInput = page.locator("#cmq-target-selector");
    await selectorInput.fill(".wrapper");
    const outputPre = page.locator(".cmq-output-pre");
    const content = await outputPre.textContent();
    expect(content).toContain(".wrapper");
  });

  test("should switch to SCSS output format", async ({ page }) => {
    const scssTab = page.locator(".cmq-output-tab", { hasText: "SCSS" });
    await scssTab.click();
    await expect(scssTab).toHaveClass(/active/);
    const outputPre = page.locator(".cmq-output-pre");
    const content = await outputPre.textContent();
    expect(content).toContain("Generated with CSS Media Query Builder");
    expect(content).toContain("@media");
  });

  test("should switch to JSON output format", async ({ page }) => {
    const jsonTab = page.locator(".cmq-output-tab", { hasText: "JSON" });
    await jsonTab.click();
    await expect(jsonTab).toHaveClass(/active/);
    const outputPre = page.locator(".cmq-output-pre");
    const content = await outputPre.textContent();
    const parsed = JSON.parse(content ?? "{}");
    expect(parsed.mediaType).toBe("screen");
    expect(Array.isArray(parsed.conditions)).toBe(true);
  });

  test("should display copy button", async ({ page }) => {
    const copyBtn = page.locator(".btn-primary");
    await expect(copyBtn.first()).toBeVisible();
  });

  test("should display preview slider", async ({ page }) => {
    const slider = page.locator(".cmq-preview-slider");
    await expect(slider).toBeVisible();
  });

  test("should display width badge next to slider", async ({ page }) => {
    const badge = page.locator(".cmq-preview-width-badge");
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text).toMatch(/\d+px/);
  });

  test("should display preview status indicator", async ({ page }) => {
    const status = page.locator('[role="status"]');
    await expect(status).toBeVisible();
  });

  test("should reset to default state", async ({ page }) => {
    // 変更
    const printBtn = page.locator(".cmq-media-type-btn", { hasText: "print" });
    await printBtn.click();

    // リセット
    const resetBtn = page.locator(".btn-clear");
    await resetBtn.click();

    // screen に戻ることを確認
    const screenBtn = page.locator(".cmq-media-type-btn", {
      hasText: "screen",
    });
    await expect(screenBtn).toHaveClass(/active/);
  });

  test("should display tips card", async ({ page }) => {
    const tips = page.locator(".tips-card, .info-box");
    await expect(tips.first()).toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible();
  });

  test("should have navigation link in top page dropdown", async ({ page }) => {
    await page.goto("/");
    // ナビゲーションにリンクが存在するか確認
    const link = page.locator('a[href="/css-media-query"]');
    await expect(link.first()).toBeVisible();
  });
});
