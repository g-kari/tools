import { test, expect } from "@playwright/test";

test.describe("JSON Schema バリデーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/json-schema-validator");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/JSON Schema バリデーター/);
  });

  test("サンプル読込ボタンが機能する", async ({ page }) => {
    await page.getByRole("button", { name: "サンプル読込" }).click();
    const jsonArea = page.getByLabel("JSON データ入力欄");
    const schemaArea = page.getByLabel("JSON Schema 入力欄");
    await expect(jsonArea).not.toHaveValue("");
    await expect(schemaArea).not.toHaveValue("");
  });

  test("サンプルデータでバリデーション成功", async ({ page }) => {
    await page.getByRole("button", { name: "サンプル読込" }).click();
    await page.getByRole("button", { name: /バリデーション実行/ }).click();

    const banner = page.locator(".jsv-result-banner--valid");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("バリデーション成功");
  });

  test("無効なJSONデータでエラーが表示される", async ({ page }) => {
    await page.getByLabel("JSON データ入力欄").fill("{invalid json}");
    await page.getByLabel("JSON Schema 入力欄").fill('{"type": "object"}');
    await page.getByRole("button", { name: /バリデーション実行/ }).click();

    // パースエラーが表示される
    await expect(page.locator(".error-message, [role='alert']")).toBeVisible();
  });

  test("スキーマ違反でエラー一覧が表示される", async ({ page }) => {
    await page.getByLabel("JSON データ入力欄").fill('{"name": 123}');
    await page
      .getByLabel("JSON Schema 入力欄")
      .fill('{"type": "object", "properties": {"name": {"type": "string"}}}');
    await page.getByRole("button", { name: /バリデーション実行/ }).click();

    const banner = page.locator(".jsv-result-banner--invalid");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("バリデーション失敗");

    const errorList = page.locator(".jsv-error-list");
    await expect(errorList).toBeVisible();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.getByRole("button", { name: "サンプル読込" }).click();
    await page.getByRole("button", { name: "クリア" }).click();

    const jsonArea = page.getByLabel("JSON データ入力欄");
    await expect(jsonArea).toHaveValue("");
  });

  test("整形ボタンでJSONが整形される", async ({ page }) => {
    await page.getByLabel("JSON データ入力欄").fill('{"name":"Alice","age":30}');
    await page.getByRole("button", { name: "整形" }).first().click();

    const value = await page.getByLabel("JSON データ入力欄").inputValue();
    expect(value).toContain("\n");
  });

  test("Ctrl+Enter でバリデーションが実行される", async ({ page }) => {
    await page.getByRole("button", { name: "サンプル読込" }).click();
    await page.keyboard.press("Control+Enter");

    await expect(page.locator(".jsv-result-banner--valid")).toBeVisible();
  });

  test("空入力時に適切なメッセージが表示される", async ({ page }) => {
    const emptyState = page.locator(".jsv-result-empty");
    await expect(emptyState).toBeVisible();
  });
});
