import { test, expect } from "@playwright/test";

test.describe("タイポグラフィスケール生成 - E2Eテスト", () => {
  test.describe.configure({ timeout: 15000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/typography-scale");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正常にロードされる（undefinedが表示されない）", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/タイポグラフィスケール/);
  });

  test("設定パネルが表示される", async ({ page }) => {
    await expect(page.locator("#base-size")).toBeVisible();
    await expect(page.locator("#root-size")).toBeVisible();
    await expect(page.locator("#steps-up")).toBeVisible();
    await expect(page.locator("#steps-down")).toBeVisible();
  });

  test("デフォルトで基準フォントサイズが16pxになっている", async ({ page }) => {
    const baseSizeInput = page.locator("#base-size");
    await expect(baseSizeInput).toHaveValue("16");
  });

  test("スケール比率ボタンが8つ表示される", async ({ page }) => {
    const ratioButtons = page.locator(".type-scale-ratio-btn");
    await expect(ratioButtons).toHaveCount(8);
  });

  test("プレビューリストが表示される", async ({ page }) => {
    const previewList = page.locator(".type-scale-preview-list");
    await expect(previewList).toBeVisible();
  });

  test("スケールプレビューに base ステップが含まれる", async ({ page }) => {
    const baseRow = page.locator(".type-scale-preview-row.is-base");
    await expect(baseRow).toBeVisible();
    await expect(baseRow).toContainText("base");
  });

  test("出力フォーマットタブが4つ表示される", async ({ page }) => {
    const formatTabs = page.locator(".type-scale-format-tab");
    await expect(formatTabs).toHaveCount(4);
  });

  test("CSS変数フォーマットでコードが生成される", async ({ page }) => {
    const output = page.locator("[data-testid='output-code']");
    await expect(output).toBeVisible();
    const value = await output.inputValue();
    expect(value).toContain(":root {");
    expect(value).toContain("--type-base");
  });

  test("SCSSタブをクリックするとSCSS形式に切り替わる", async ({ page }) => {
    const scssTab = page.locator(".type-scale-format-tab", { hasText: "SCSS" });
    await scssTab.click();

    const output = page.locator("[data-testid='output-code']");
    const value = await output.inputValue();
    expect(value).toContain("$type-base:");
    expect(value).not.toContain(":root {");
  });

  test("JSONタブをクリックするとJSON形式に切り替わる", async ({ page }) => {
    const jsonTab = page.locator(".type-scale-format-tab", { hasText: "JSON" });
    await jsonTab.click();

    const output = page.locator("[data-testid='output-code']");
    const value = await output.inputValue();
    const parsed = JSON.parse(value);
    expect(parsed).toHaveProperty("typography");
  });

  test("Tailwindタブをクリックするとtailwind形式に切り替わる", async ({ page }) => {
    const tailwindTab = page.locator(".type-scale-format-tab", {
      hasText: "Tailwind",
    });
    await tailwindTab.click();

    const output = page.locator("[data-testid='output-code']");
    const value = await output.inputValue();
    expect(value).toContain("tailwind.config.js");
    expect(value).toContain("fontSize:");
  });

  test("比率ボタンをクリックすると active 状態になる", async ({ page }) => {
    const goldenRatioBtn = page.locator(".type-scale-ratio-btn", {
      hasText: "Golden Ratio",
    });
    await goldenRatioBtn.click();
    await expect(goldenRatioBtn).toHaveClass(/active/);
  });

  test("比率を変更するとプレビューが更新される", async ({ page }) => {
    // 初期状態の出力を取得
    const output = page.locator("[data-testid='output-code']");
    const initialValue = await output.inputValue();

    // Minor Second (最小比率) に変更
    const minorSecondBtn = page.locator(".type-scale-ratio-btn", {
      hasText: "Minor Second",
    });
    await minorSecondBtn.click();

    // Golden Ratio (最大比率) に変更
    const goldenRatioBtn = page.locator(".type-scale-ratio-btn", {
      hasText: "Golden Ratio",
    });
    await goldenRatioBtn.click();

    const newValue = await output.inputValue();
    // 比率が変わると値が変わる（Perfect Fourth vs Golden Ratioで差がある）
    expect(newValue).not.toBe(initialValue);
  });

  test("基準フォントサイズを変更するとプレビューが更新される", async ({ page }) => {
    const output = page.locator("[data-testid='output-code']");
    const initialValue = await output.inputValue();

    const baseSizeInput = page.locator("#base-size");
    await baseSizeInput.fill("20");

    const newValue = await output.inputValue();
    expect(newValue).not.toBe(initialValue);
    expect(newValue).toContain("--type-base");
  });

  test("コピーボタンが表示される", async ({ page }) => {
    const copyBtn = page.locator(".btn-copy");
    await expect(copyBtn).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tipsCard = page.locator(".info-box, .tips-card").first();
    await expect(tipsCard).toBeVisible();
  });

  test("アクセシビリティ: main ランドマークが存在する", async ({ page }) => {
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("アクセシビリティ: カスタム比率チェックボックスが動作する", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]', {
      hasText: "",
    });
    await checkbox.check();

    // カスタム比率入力が表示される
    const customInput = page.locator('input[type="number"][step="0.001"]');
    await expect(customInput).toBeVisible();
  });
});
