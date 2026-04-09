import { test, expect } from "@playwright/test";

test.describe("Mustache テンプレートエンジン - E2E テスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/template");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正常に表示される", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Mustache/);
  });

  test("サンプルボタンが表示される", async ({ page }) => {
    const sampleBtns = page.locator(".tmpl-sample-btn");
    expect(await sampleBtns.count()).toBeGreaterThan(0);
  });

  test("テンプレート入力エリアが表示される", async ({ page }) => {
    const templateInput = page.locator("#tmpl-template-input");
    await expect(templateInput).toBeVisible();
  });

  test("JSONデータ入力エリアが表示される", async ({ page }) => {
    const jsonInput = page.locator("#tmpl-json-input");
    await expect(jsonInput).toBeVisible();
  });

  test("デフォルトサンプルが選択されている", async ({ page }) => {
    const activeBtn = page.locator(".tmpl-sample-btn.active");
    await expect(activeBtn).toBeVisible();
  });

  test("テンプレートとJSONでレンダリング結果が表示される", async ({ page }) => {
    const templateInput = page.locator("#tmpl-template-input");
    const jsonInput = page.locator("#tmpl-json-input");

    await templateInput.fill("Hello, {{name}}!");
    await jsonInput.fill('{"name": "World"}');

    const output = page.locator(".tmpl-output");
    await expect(output).toContainText("Hello, World!");
  });

  test("ループ構文が機能する", async ({ page }) => {
    const templateInput = page.locator("#tmpl-template-input");
    const jsonInput = page.locator("#tmpl-json-input");

    await templateInput.fill("{{#items}}[{{.}}]{{/items}}");
    await jsonInput.fill('{"items": ["A", "B", "C"]}');

    const output = page.locator(".tmpl-output");
    await expect(output).toContainText("[A][B][C]");
  });

  test("無効なJSONでエラーが表示される", async ({ page }) => {
    const jsonInput = page.locator("#tmpl-json-input");
    await jsonInput.fill("invalid json{{{");

    const error = page.locator(".tmpl-error");
    await expect(error).toBeVisible();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("button.btn-secondary", { hasText: "クリア" }).click();
    const templateInput = page.locator("#tmpl-template-input");
    await expect(templateInput).toHaveValue("");
  });

  test("サンプル切替が機能する", async ({ page }) => {
    const btns = page.locator(".tmpl-sample-btn");
    const count = await btns.count();
    if (count > 1) {
      await btns.nth(1).click();
      await expect(btns.nth(1)).toHaveClass(/active/);
    }
  });

  test("アクセシビリティ: role属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("ナビゲーションの変換カテゴリにテンプレートリンクが表示される", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "変換" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/template"]');
    await expect(link).toBeVisible();
  });
});
