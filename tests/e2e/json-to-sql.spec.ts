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

  for (const dialect of ["postgresql", "mysql", "sqlite"]) {
    test(`${dialect}: 成功後の列名衝突を拒否し、入力修正で回復する`, async ({ page }) => {
      const input = page.getByLabel("JSON入力欄");
      const output = page.getByRole("region", { name: "生成されたCREATE TABLE文" });
      const copy = page.getByRole("button", {
        name: "生成されたSQL文をクリップボードにコピーする",
      });
      const generate = page.getByRole("button", { name: "CREATE TABLE文を生成する" });
      await page.getByLabel("SQLダイアレクト選択").selectOption(dialect);
      await input.fill('{"name":"demo"}');
      await generate.click();
      await expect(output).toContainText("CREATE TABLE");
      await expect(copy).toBeEnabled();

      const invalid = '{"userName":1,"user_name":2}';
      await input.fill(invalid);
      await generate.click();
      await expect(input).toHaveValue(invalid);
      await expect(output).not.toContainText("CREATE TABLE");
      await expect(copy).toBeDisabled();
      const error = page.locator('.error-message[role="alert"]');
      await expect(error).toContainText("userName");
      await expect(error).toContainText("user_name");
      await expect(error).toContainText("入力キーを変更");

      await input.fill('{"userName":1,"displayName":2}');
      await generate.click();
      await expect(error).toHaveCount(0);
      await expect(output).toContainText("user_name");
      await expect(output).toContainText("display_name");
      await expect(copy).toBeEnabled();
    });

    test(`${dialect}: サンプルのid衝突をオプション変更で回復する`, async ({ page }) => {
      const input = page.getByLabel("JSON入力欄");
      const output = page.getByRole("region", { name: "生成されたCREATE TABLE文" });
      const copy = page.getByRole("button", {
        name: "生成されたSQL文をクリップボードにコピーする",
      });
      const generate = page.getByRole("button", { name: "CREATE TABLE文を生成する" });
      await page.getByLabel("SQLダイアレクト選択").selectOption(dialect);
      await page.getByRole("button", { name: "サンプルJSONを読み込む" }).click();
      const sample = await input.inputValue();
      const addId = page.getByLabel("id カラムを追加する（AUTO INCREMENT）");
      await addId.check();
      await generate.click();
      await expect(input).toHaveValue(sample);
      await expect(output).not.toContainText("CREATE TABLE");
      await expect(copy).toBeDisabled();
      const error = page.locator('.error-message[role="alert"]');
      await expect(error).toContainText("id カラムを追加する");
      await expect(error).toContainText("オフ");

      await addId.uncheck();
      await generate.click();
      await expect(input).toHaveValue(sample);
      await expect(error).toHaveCount(0);
      await expect(output).toContainText("CREATE TABLE");
      await expect(output).not.toContainText("PRIMARY KEY");
      await expect(copy).toBeEnabled();
    });
  }

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
