import { test, expect } from "../browser/csv-json/url-app-test";

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

  test("特殊キーを保持してinterface・typeへ変換できる", async ({ page }) => {
    const json = JSON.stringify({
      "user-name": "Alice",
      'quote"key': true,
      "line\nbreak": 1,
      "": { "123": { value: true } },
    });
    const input = page.locator("#jsonInput");
    const output = page.locator('[role="region"][aria-live="polite"]');
    await input.fill(json);
    await page.getByRole("button", { name: "TypeScript型定義を生成する", exact: true }).click();
    await expect(output).toContainText('"user-name": string;');
    await expect(output).toContainText('"quote\\"key": boolean;');
    await expect(output).toContainText('"line\\nbreak": number;');
    await expect(output).toContainText('"": Value;');
    await expect(output).toContainText("interface Type123");
    await expect(input).toHaveValue(json);
    await page.locator('input[type="radio"][name="typeStyle"]').nth(1).check();
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole("button", { name: "TypeScript型定義を生成する", exact: true }).click();
    await expect(output).toContainText("type Root =");
    await expect(output).toContainText('"user-name"?: string;');
    await expect(output).toContainText('"line\\nbreak"?: number;');
    await expect(input).toHaveValue(json);
    await page.getByRole("button", { name: "入力と結果をクリアする", exact: true }).click();
    await expect(input).toHaveValue("");
    await expect(
      page.getByRole("button", { name: "生成された型定義をクリップボードにコピーする" }),
    ).toBeDisabled();
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
