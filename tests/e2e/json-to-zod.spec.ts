import { test, expect } from "@playwright/test";

test.describe("JSON→Zodスキーマ生成 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/json-to-zod");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/JSON→Zodスキーマ生成/);
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
    await expect(outputArea).toContainText("z.object");
    await expect(outputArea).toContainText("z.string()");
    await expect(outputArea).toContainText("z.number()");
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

  test("ルート変数名が変更できる", async ({ page }) => {
    const rootNameInput = page.locator("#jtz-root-name");
    await rootNameInput.clear();
    await rootNameInput.fill("userSchema");

    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const generateButton = page.locator("button", { hasText: "スキーマ生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("userSchema");
  });

  test("オプションが存在する", async ({ page }) => {
    // import文チェックボックス
    const importCheckbox = page.locator("label", { hasText: "import文を追加" });
    await expect(importCheckbox).toBeVisible();

    // オプショナルチェックボックス
    const optionalCheckbox = page.locator("label", {
      hasText: "プロパティをオプショナルにする",
    });
    await expect(optionalCheckbox).toBeVisible();

    // nullableチェックボックス
    const nullableCheckbox = page.locator("label", {
      hasText: "nullをnullable()にする",
    });
    await expect(nullableCheckbox).toBeVisible();

    // ルート変数名入力
    const rootNameInput = page.locator("#jtz-root-name");
    await expect(rootNameInput).toBeVisible();
  });

  test("import文を追加オプションが機能する", async ({ page }) => {
    const importCheckbox = page.locator("label", { hasText: "import文を追加" }).locator("input");
    // デフォルトでチェック済みのはず
    await expect(importCheckbox).toBeChecked();

    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill('{"name":"test"}');

    const generateButton = page.locator("button", { hasText: "スキーマ生成" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText('import { z } from "zod"');
  });

  test("無効なJSONでエラートーストが表示される", async ({ page }) => {
    const inputTextarea = page.locator("#jsonInput");
    await inputTextarea.fill("invalid json");

    const generateButton = page.locator("button", { hasText: "スキーマ生成" });
    await generateButton.click();

    // エラーメッセージが表示されることを確認
    const errorArea = page.locator('[role="alert"]');
    await expect(errorArea).toBeVisible({ timeout: 3000 });
  });

  test("特殊キーを保持して表示したスキーマをコピーできる", async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            document.documentElement.dataset.copiedSchema = text;
          },
        },
      });
    });
    const json = '{"first-name":"A","quote\\\"key":1,"__proto__":true}';
    await page.locator("#jsonInput").fill(json);
    await page.getByRole("button", { name: "Zodスキーマを生成する", exact: true }).click();
    const output = page.getByRole("region", { name: "生成されたZodスキーマ", exact: true });
    await expect(output).toContainText('"first-name": z.string()');
    await expect(output).toContainText('"quote\\\"key": z.number()');
    await expect(output).toContainText('["__proto__"]: z.boolean()');
    await expect(page.locator("#jsonInput")).toHaveValue(json);
    await page
      .getByRole("button", {
        name: "生成されたZodスキーマをクリップボードにコピーする",
        exact: true,
      })
      .click();
    expect(await page.evaluate(() => document.documentElement.dataset.copiedSchema)).toBe(
      await output.textContent(),
    );
  });

  test("特殊キーの繰り返し生成で既存のoptionalとnullableを維持する", async ({ page }) => {
    const output = page.getByRole("region", { name: "生成されたZodスキーマ", exact: true });
    await page.locator("#jsonInput").fill('{"old-name":1}');
    const generate = page.getByRole("button", { name: "Zodスキーマを生成する", exact: true });
    await generate.click();
    await expect(output).toContainText('"old-name"');
    await page.getByLabel("プロパティをオプショナルにする", { exact: true }).check();
    await page.getByLabel("nullをnullable()にする", { exact: true }).check();
    await page.locator("#jsonInput").fill('{"rows":[{"line\\nbreak":null}]}');
    await generate.click();
    await expect(output).toContainText('"line\\nbreak": z.unknown().nullable().optional()');
    await expect(output).not.toContainText('"old-name"');
    await generate.click();
    await expect(output).toContainText('"line\\nbreak": z.unknown().nullable().optional()');
  });

  test("失敗後に特殊キーで復旧しクリアできる", async ({ page }) => {
    const input = page.locator("#jsonInput");
    const output = page.getByRole("region", { name: "生成されたZodスキーマ", exact: true });
    const generate = page.getByRole("button", { name: "Zodスキーマを生成する", exact: true });
    const copy = page.getByRole("button", {
      name: "生成されたZodスキーマをクリップボードにコピーする",
      exact: true,
    });
    await input.fill('{"name":"ok"}');
    await generate.click();
    await input.fill("{invalid");
    await generate.click();
    await expect(output).not.toContainText("export const");
    await expect(copy).toBeDisabled();
    await expect(input).toHaveValue("{invalid");
    await input.fill('{"first-name":"fixed"}');
    await generate.click();
    await expect(output).toContainText('"first-name": z.string()');
    await expect(copy).toBeEnabled();
    await page.getByRole("button", { name: "入力と結果をクリアする", exact: true }).click();
    await expect(input).toHaveValue("");
    await expect(copy).toBeDisabled();
  });
});
