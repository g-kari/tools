import { test, expect } from "@playwright/test";

test.describe("JSON→TypeScript型変換 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/json-to-ts");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/JSON→TypeScript型変換/);
  });

  test("JSON入力エリアが存在する", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await expect(inputTextarea).toBeVisible();
  });

  test("型定義出力エリアが存在する", async ({ page }) => {
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

  test("変換ボタンが機能する", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"Alice","age":30}');

    const generateButton = page.locator("button", { hasText: "型変換" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("interface");
    await expect(outputArea).toContainText("name: string");
    await expect(outputArea).toContainText("age: number");
  });

  test("クリアボタンが機能する", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const clearButton = page.locator("button", { hasText: "クリア" });
    await clearButton.click();

    await expect(inputTextarea).toHaveValue("");
  });

  test("コピーボタンが存在する（出力前は無効）", async ({ page }) => {
    const copyButton = page.locator("button", { hasText: "型定義をコピー" });
    await expect(copyButton).toBeDisabled();
  });

  test("interface/type切り替えが機能する", async ({ page }) => {
    // typeラジオボタンを選択
    const typeRadio = page.locator('input[type="radio"][name="typeStyle"]').nth(1);
    await typeRadio.check();

    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const generateButton = page.locator("button", { hasText: "型変換" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("type");
  });

  test("ルート型名が変更できる", async ({ page }) => {
    const rootNameInput = page.locator("#jts-root-name");
    await rootNameInput.clear();
    await rootNameInput.fill("User");

    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const generateButton = page.locator("button", { hasText: "型変換" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("User");
  });

  test("オプションが存在する", async ({ page }) => {
    // オプショナルチェックボックス
    const optionalCheckbox = page.locator("label", { hasText: "オプショナル" });
    await expect(optionalCheckbox).toBeVisible();

    // null型チェックボックス
    const nullCheckbox = page.locator("label", { hasText: "null型を含む" });
    await expect(nullCheckbox).toBeVisible();

    // ルート型名入力
    const rootNameInput = page.locator("#jts-root-name");
    await expect(rootNameInput).toBeVisible();
  });
});
