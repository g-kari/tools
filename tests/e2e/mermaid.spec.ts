import { test, expect } from "@playwright/test";

test.describe("Mermaid Preview - E2E Tests", () => {
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
    await page.goto("/mermaid");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Mermaidプレビュー/);
  });

  test("should have a textarea for mermaid input", async ({ page }) => {
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
  });

  test("should display placeholder when input is empty", async ({ page }) => {
    const placeholder = page.locator(".mermaid-placeholder");
    await expect(placeholder).toBeVisible();
  });

  test("should show SVG preview when valid mermaid is entered", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("flowchart TD\n    A[開始] --> B[終了]");

    // SVGが描画されることを確認
    const svgWrapper = page.locator(".mermaid-svg-wrapper");
    await expect(svgWrapper).toBeVisible({ timeout: 10000 });
    const svgElement = svgWrapper.locator("svg");
    await expect(svgElement).toBeVisible({ timeout: 10000 });
  });

  test("should show error for invalid mermaid syntax", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("this is not valid mermaid syntax !!!");

    // エラー表示を確認
    const errorArea = page.locator(".mermaid-error");
    await expect(errorArea).toBeVisible({ timeout: 10000 });
    await expect(errorArea).toContainText("構文エラー");
  });

  test("should insert flowchart sample when button is clicked", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "フローチャート" });
    await sampleButton.click();

    const textarea = page.locator("textarea");
    const value = await textarea.inputValue();
    expect(value).toContain("flowchart");
  });

  test("should insert sequence diagram sample when button is clicked", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "シーケンス図" });
    await sampleButton.click();

    const textarea = page.locator("textarea");
    const value = await textarea.inputValue();
    expect(value).toContain("sequenceDiagram");
  });

  test("should insert gantt chart sample when button is clicked", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "ガントチャート" });
    await sampleButton.click();

    const textarea = page.locator("textarea");
    const value = await textarea.inputValue();
    expect(value).toContain("gantt");
  });

  test("should render SVG after inserting flowchart sample", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "フローチャート" });
    await sampleButton.click();

    const svgWrapper = page.locator(".mermaid-svg-wrapper");
    await expect(svgWrapper.locator("svg")).toBeVisible({ timeout: 10000 });
  });

  test("should clear content when clear button is clicked", async ({ page }) => {
    const textarea = page.locator("textarea");
    await textarea.fill("flowchart TD\n    A --> B");

    const clearButton = page.locator("button.btn-clear");
    await clearButton.click();

    await expect(textarea).toHaveValue("");

    // プレースホルダーが再表示されることを確認
    const placeholder = page.locator(".mermaid-placeholder");
    await expect(placeholder).toBeVisible();
  });

  test("should have export SVG button disabled when no diagram", async ({ page }) => {
    const exportButton = page.locator("button", { hasText: "SVGをエクスポート" });
    await expect(exportButton).toBeDisabled();
  });

  test("should have export SVG button enabled after rendering", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "フローチャート" });
    await sampleButton.click();

    // SVGが描画されるまで待機
    await page.locator(".mermaid-svg-wrapper svg").waitFor({ timeout: 10000 });

    const exportButton = page.locator("button", { hasText: "SVGをエクスポート" });
    await expect(exportButton).toBeEnabled();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();

    // プレビューエリアのrole属性確認
    const previewRegion = page.locator(
      '[role="region"][aria-label="Mermaidダイアグラムプレビュー表示エリア"]',
    );
    await expect(previewRegion).toBeVisible();
  });

  test("should navigate to mermaid page from other pages via category", async ({ page }) => {
    await page.goto("/");
    await navigateViaCategory(page, "テキスト", "/mermaid");
    await expect(page).toHaveURL("/mermaid");
  });

  test("should have all 6 sample buttons", async ({ page }) => {
    const sampleLabels = [
      "フローチャート",
      "シーケンス図",
      "クラス図",
      "ガントチャート",
      "状態図",
      "ER図",
    ];
    for (const label of sampleLabels) {
      const btn = page.locator("button", { hasText: label });
      await expect(btn).toBeVisible();
    }
  });
});
