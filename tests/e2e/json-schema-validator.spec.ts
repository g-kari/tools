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

  for (const key of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
    test(`${key}の欠落・復帰・型違いをownキーとして検証する`, async ({ page }) => {
      const json = page.getByLabel("JSON データ入力欄", { exact: true });
      const schema = page.getByLabel("JSON Schema 入力欄", { exact: true });
      const run = page.getByRole("button", { name: "バリデーションを実行する（Ctrl+Enter）" });
      const name = JSON.stringify(key);

      await json.fill("{}");
      await schema.fill(`{"type":"object","required":[${name}]}`);
      await run.click();
      await expect(page.locator(".jsv-result-banner--invalid")).toBeVisible();
      await expect(page.locator(".jsv-error-list")).toContainText(`必須プロパティ "${key}"`);

      await schema.fill(`{"type":"object","properties":{${name}:{"type":"string"}}}`);
      await run.click();
      await expect(page.locator(".jsv-result-banner--valid")).toBeVisible();
      await expect(page.locator(".jsv-error-list")).toHaveCount(0);

      await json.fill(`{${name}:"sample"}`);
      await schema.fill(
        `{"type":"object","required":[${name}],"properties":{${name}:{"type":"string"}}}`,
      );
      await run.click();
      await expect(page.locator(".jsv-result-banner--valid")).toBeVisible();

      await json.fill(`{${name}:42}`);
      await run.click();
      await expect(page.locator(".jsv-result-banner--invalid")).toBeVisible();
      await expect(page.locator(".jsv-error-list")).toContainText("型が一致しません");
      await expect(page.locator(".jsv-error-list")).not.toContainText("必須プロパティ");
      await expect(json).toHaveValue(`{${name}:42}`);
    });
  }

  test("ネストと配列内のobject-valued __proto__の欠落と復帰を検証する", async ({ page }) => {
    const json = page.getByLabel("JSON データ入力欄", { exact: true });
    const schema = page.getByLabel("JSON Schema 入力欄", { exact: true });
    const run = page.getByRole("button", { name: "バリデーションを実行する（Ctrl+Enter）" });
    await schema.fill(
      '{"type":"object","properties":{"items":{"type":"array","items":{"type":"object","required":["__proto__"],"properties":{"__proto__":{"type":"object"}}}}}}',
    );
    await json.fill('{"items":[{}]}');
    await run.click();
    await expect(page.locator(".jsv-result-banner--invalid")).toBeVisible();
    await expect(page.locator(".jsv-error-list")).toContainText("/items/0");
    await expect(page.locator(".jsv-error-list")).toContainText("必須プロパティ");
    await json.fill('{"items":[{"__proto__":{}}]}');
    await run.click();
    await expect(page.locator(".jsv-result-banner--valid")).toBeVisible();
    await expect(page.locator(".jsv-error-list")).toHaveCount(0);
  });
});
