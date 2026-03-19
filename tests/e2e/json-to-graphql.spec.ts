import { test, expect } from "@playwright/test";

test.describe("JSON→GraphQLスキーマ生成 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/json-to-graphql");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/JSON→GraphQLスキーマ生成/);
  });

  test("JSON入力エリアが存在する", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await expect(inputTextarea).toBeVisible();
  });

  test("スキーマ出力エリアが存在する", async ({ page }) => {
    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toBeVisible();
  });

  test("サンプル読込ボタンが機能する", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "サンプル読込" });
    await sampleButton.click();

    const inputTextarea = page.locator("#jsonInput");
    const value = await inputTextarea.inputValue();
    expect(value.trim()).not.toBe("");
    expect(() => JSON.parse(value)).not.toThrow();
  });

  test("スキーマ生成ボタンが機能する", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"Alice","age":30}');

    const generateButton = page.locator("button", { hasText: "スキーマ生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("type Root");
    await expect(outputArea).toContainText("String");
    await expect(outputArea).toContainText("Int");
  });

  test("クリアボタンが機能する", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const clearButton = page.locator("button", { hasText: "クリア" });
    await clearButton.click();

    await expect(inputTextarea).toHaveValue("");
  });

  test("コピーボタンが存在する（出力前は無効）", async ({ page }) => {
    const copyButton = page.locator("button", { hasText: "スキーマをコピー" });
    await expect(copyButton).toBeDisabled();
  });

  test("ルート型名が変更できる", async ({ page }) => {
    const rootNameInput = page.locator("#jtg-root-type-name");
    await rootNameInput.clear();
    await rootNameInput.fill("User");

    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const generateButton = page.locator("button", { hasText: "スキーマ生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("type User");
  });

  test("オプションが存在する", async ({ page }) => {
    const nonNullCheckbox = page.locator("label", {
      hasText: "Non-Null (!) を付与する",
    });
    await expect(nonNullCheckbox).toBeVisible();

    const interfaceCheckbox = page.locator("label", {
      hasText: "interface を使用する",
    });
    await expect(interfaceCheckbox).toBeVisible();

    const rootNameInput = page.locator("#jtg-root-type-name");
    await expect(rootNameInput).toBeVisible();
  });

  test("Non-Nullオプションが機能する", async ({ page }) => {
    const nonNullCheckbox = page
      .locator("label", { hasText: "Non-Null (!) を付与する" })
      .locator("input");
    await expect(nonNullCheckbox).toBeChecked();

    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"Alice"}');

    const generateButton = page.locator("button", { hasText: "スキーマ生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("String!");
  });

  test("無効なJSONでエラーが表示される", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill("invalid json");

    const generateButton = page.locator("button", { hasText: "スキーマ生成" });
    await generateButton.click();

    const errorArea = page.locator('[role="alert"]');
    await expect(errorArea).toBeVisible({ timeout: 3000 });
  });
});
