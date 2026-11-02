import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

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
  // Exercise the shipped samples through the real lazy-loaded renderer, not a Mermaid mock.
  for (const { label, expectedLabels } of [
    { label: "フローチャート", expectedLabels: ["開始", "条件分岐", "処理A", "終了"] },
    { label: "シーケンス図", expectedLabels: ["ブラウザ", "サーバー", "DB", "HTTPリクエスト"] },
    { label: "クラス図", expectedLabels: ["Animal", "Dog", "name", "breed"] },
    { label: "ガントチャート", expectedLabels: ["プロジェクトスケジュール", "要件定義", "実装"] },
    { label: "状態図", expectedLabels: ["待機中", "処理中", "完了", "リトライ"] },
    { label: "ER図", expectedLabels: ["USER", "POST", "email", "投稿する"] },
  ]) {
    test(`should render and export the shipped ${label} sample as SVG`, async ({ page }) => {
      await page.getByRole("button", { name: `${label}のサンプルを挿入`, exact: true }).click();
      const preview = page.locator("#mermaid-output");
      const svg = preview.locator(".mermaid-svg-wrapper svg");
      await expect(svg).toBeVisible({ timeout: 10000 });
      await expect(preview).toHaveAttribute("aria-busy", "false");
      await expect(preview.getByRole("alert")).toHaveCount(0);
      for (const expectedLabel of expectedLabels) {
        await expect(svg).toContainText(expectedLabel);
      }
      const bounds = await svg.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds?.width).toBeGreaterThan(0);
      expect(bounds?.height).toBeGreaterThan(0);

      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "ダイアグラムをSVGとしてダウンロード", exact: true }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe("diagram.svg");
      expect(await download.failure()).toBeNull();
      const path = await download.path();
      if (!path) throw new Error("SVG download did not produce a local file");
      const exported = await readFile(path, "utf8");
      const parsed = await page.evaluate((text) => {
        const document = new DOMParser().parseFromString(text, "image/svg+xml");
        return {
          parseErrors: document.querySelectorAll("parsererror").length,
          rootName: document.documentElement.localName,
          namespace: document.documentElement.namespaceURI,
          text: document.documentElement.textContent,
        };
      }, exported);
      expect(parsed.parseErrors).toBe(0);
      expect(parsed.rootName).toBe("svg");
      expect(parsed.namespace).toBe("http://www.w3.org/2000/svg");
      for (const expectedLabel of expectedLabels) {
        expect(parsed.text).toContain(expectedLabel);
      }
    });
  }
});
