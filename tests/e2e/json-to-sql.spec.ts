import { test, expect } from "@playwright/test";

test.describe("JSON→SQL CREATE TABLE生成 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/json-to-sql");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/JSON→SQL CREATE TABLE生成/);
  });

  test("JSON入力エリアが存在する", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await expect(inputTextarea).toBeVisible();
  });

  test("SQL出力エリアが存在する", async ({ page }) => {
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

  test("SQL生成ボタンが機能する", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"Alice","age":30}');

    const generateButton = page.locator("button", { hasText: "SQL生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("CREATE TABLE");
    await expect(outputArea).toContainText("TEXT");
    await expect(outputArea).toContainText("INTEGER");
  });

  test("クリアボタンが機能する", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const clearButton = page.locator("button", { hasText: "クリア" });
    await clearButton.click();

    await expect(inputTextarea).toHaveValue("");
  });

  test("コピーボタンが存在する（出力前は無効）", async ({ page }) => {
    const copyButton = page.locator("button", { hasText: "SQL文をコピー" });
    await expect(copyButton).toBeDisabled();
  });

  test("テーブル名が変更できる", async ({ page }) => {
    const tableNameInput = page.locator("#jtsql-table-name");
    await tableNameInput.clear();
    await tableNameInput.fill("users");

    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const generateButton = page.locator("button", { hasText: "SQL生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText('"users"');
  });

  test("ダイアレクト選択が存在する", async ({ page }) => {
    const dialectSelect = page.locator("#jtsql-dialect");
    await expect(dialectSelect).toBeVisible();
  });

  test("MySQLダイアレクトが選択できる", async ({ page }) => {
    const dialectSelect = page.locator("#jtsql-dialect");
    await dialectSelect.selectOption("mysql");

    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"Alice"}');

    const generateButton = page.locator("button", { hasText: "SQL生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("-- MySQL");
    await expect(outputArea).toContainText("VARCHAR(255)");
  });

  test("SQLiteダイアレクトが選択できる", async ({ page }) => {
    const dialectSelect = page.locator("#jtsql-dialect");
    await dialectSelect.selectOption("sqlite");

    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"score":3.14}');

    const generateButton = page.locator("button", { hasText: "SQL生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("-- SQLite");
    await expect(outputArea).toContainText("REAL");
  });

  test("オプションが存在する", async ({ page }) => {
    const notNullCheckbox = page.locator("label", {
      hasText: "NOT NULL を付与する",
    });
    await expect(notNullCheckbox).toBeVisible();

    const addIdCheckbox = page.locator("label", {
      hasText: "id カラムを追加する",
    });
    await expect(addIdCheckbox).toBeVisible();
  });

  test("NOT NULLオプションが機能する", async ({ page }) => {
    const notNullCheckbox = page
      .locator("label", { hasText: "NOT NULL を付与する" })
      .locator("input");
    await expect(notNullCheckbox).toBeChecked();

    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"Alice"}');

    const generateButton = page.locator("button", { hasText: "SQL生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("NOT NULL");
  });

  test("無効なJSONでエラーが表示される", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill("invalid json");

    const generateButton = page.locator("button", { hasText: "SQL生成" });
    await generateButton.click();

    const errorArea = page.locator('[role="alert"]');
    await expect(errorArea).toBeVisible({ timeout: 3000 });
  });
});
