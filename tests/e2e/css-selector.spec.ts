import { test, expect } from "@playwright/test";

test.describe("CSS Selectorテスター - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-selector");
    await page.waitForLoadState("networkidle");
  });

  test("undefinedを含まないページが表示される", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/CSS Selector/);
  });

  test("セレクター入力欄が表示される", async ({ page }) => {
    const selectorInput = page.locator("#selectorInput");
    await expect(selectorInput).toBeVisible();
  });

  test("HTML入力欄が表示される", async ({ page }) => {
    const htmlInput = page.locator("#htmlInput");
    await expect(htmlInput).toBeVisible();
  });

  test("テスト・クリアボタンが表示される", async ({ page }) => {
    await expect(page.locator("button.btn-primary")).toBeVisible();
    await expect(page.locator("button.btn-primary")).toContainText("テスト");
    await expect(page.locator("button.btn-clear")).toBeVisible();
    await expect(page.locator("button.btn-clear")).toContainText("クリア");
  });

  test("セレクタープリセットボタンが表示される", async ({ page }) => {
    const presets = page.locator(".css-selector-preset-btn");
    await expect(presets.first()).toBeVisible();
    const count = await presets.count();
    expect(count).toBeGreaterThan(0);
  });

  test("サンプルを使うボタンが表示される", async ({ page }) => {
    const sampleBtn = page.locator(".css-selector-sample-btn");
    await expect(sampleBtn).toBeVisible();
    await expect(sampleBtn).toContainText("サンプルを使う");
  });

  test("サンプルデータでテストが実行できる", async ({ page }) => {
    // サンプルが既に読み込まれた状態でテスト実行
    const selectorInput = page.locator("#selectorInput");
    await selectorInput.fill(".nav-link");

    const testButton = page.locator("button.btn-primary");
    await testButton.click();

    const resultTitle = page.locator("#result-title");
    await expect(resultTitle).toBeVisible();
    await expect(resultTitle).toContainText("テスト結果");
  });

  test("マッチ数が表示される", async ({ page }) => {
    const selectorInput = page.locator("#selectorInput");
    await selectorInput.fill(".nav-link");

    await page.locator("button.btn-primary").click();

    const resultCard = page.locator(".result-card");
    await expect(resultCard).toBeVisible();
    await expect(resultCard).toContainText("マッチ数");
  });

  test("セレクターがマッチしない場合に0件と表示される", async ({ page }) => {
    const selectorInput = page.locator("#selectorInput");
    await selectorInput.fill(".nonexistent-class-xyz");

    await page.locator("button.btn-primary").click();

    const resultCard = page.locator(".result-card");
    await expect(resultCard).toBeVisible();
    await expect(resultCard).toContainText("0件");
  });

  test("無効なセレクターでエラーが表示される", async ({ page }) => {
    const selectorInput = page.locator("#selectorInput");
    // 無効なCSSセレクターを入力
    await selectorInput.fill(":::");

    await page.locator("button.btn-primary").click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
  });

  test("空のセレクターでトースト通知が表示される", async ({ page }) => {
    const selectorInput = page.locator("#selectorInput");
    await selectorInput.fill("");

    await page.locator("button.btn-primary").click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("CSSセレクターを入力してください");
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    const selectorInput = page.locator("#selectorInput");
    await selectorInput.fill(".test-selector");

    await page.locator("button.btn-clear").click();

    await expect(selectorInput).toHaveValue("");
  });

  test("サンプルを使うボタンでHTMLが読み込まれる", async ({ page }) => {
    // 先にクリアしてHTMLを空にする
    await page.locator("button.btn-clear").click();
    const htmlTextarea = page.locator("#htmlInput");
    await expect(htmlTextarea).toHaveValue("");

    // サンプルボタンをクリック
    await page.locator(".css-selector-sample-btn").click();
    const value = await htmlTextarea.inputValue();
    expect(value.length).toBeGreaterThan(0);
    expect(value).toContain("<div");
  });

  test("プリセットボタンでセレクターが設定される", async ({ page }) => {
    const selectorInput = page.locator("#selectorInput");
    const firstPreset = page.locator(".css-selector-preset-btn").first();
    await firstPreset.click();
    const value = await selectorInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("使い方のヒントが表示される", async ({ page }) => {
    const allInfoBoxes = page.locator(".info-box");
    const allText = await allInfoBoxes.allTextContents();
    const combinedText = allText.join(" ");
    expect(combinedText).toContain("使い方");
    expect(combinedText).not.toContain("undefined");
  });

  test("アクセシビリティ属性が設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("ナビゲーションの検証カテゴリにリンクがある", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "検証" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/css-selector"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("CSS Selector");
  });

  test("検証カテゴリ経由でページに遷移できる", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "検証" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    await dropdown.locator('a[href="/css-selector"]').click();
    await expect(page).toHaveURL("/css-selector");
  });
});
