import { test, expect } from "@playwright/test";

test.describe("CSV → SQL INSERT文ジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/csv-sql");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/CSV.*SQL.*ジェネレーター/);
  });

  test("サンプルボタンで CSV データが読み込まれる", async ({ page }) => {
    await page.getByRole("button", { name: "サンプル" }).click();
    const textarea = page.getByLabel("CSV入力");
    await expect(textarea).not.toBeEmpty();
  });

  test("CSV 入力後に SQL が生成される", async ({ page }) => {
    const textarea = page.getByLabel("CSV入力");
    await textarea.fill("id,name\n1,Alice\n2,Bob");
    const output = page.getByLabel("生成されたSQL INSERT文");
    await expect(output).toHaveValue(/INSERT INTO/);
    await expect(output).toHaveValue(/Alice/);
  });

  test("テーブル名を変更すると SQL に反映される", async ({ page }) => {
    const textarea = page.getByLabel("CSV入力");
    await textarea.fill("id,name\n1,Alice");
    const tableInput = page.getByLabel("テーブル名");
    await tableInput.fill("users");
    const output = page.getByLabel("生成されたSQL INSERT文");
    await expect(output).toHaveValue(/users/);
  });

  test("SQLダイアレクトを PostgreSQL に変更できる", async ({ page }) => {
    const textarea = page.getByLabel("CSV入力");
    await textarea.fill("id,name\n1,Alice");
    await page.getByLabel("SQLダイアレクト").selectOption("postgresql");
    const output = page.getByLabel("生成されたSQL INSERT文");
    await expect(output).toHaveValue(/"my_table"/);
  });

  test("SQLダイアレクトを SQL Server に変更できる", async ({ page }) => {
    const textarea = page.getByLabel("CSV入力");
    await textarea.fill("id,name\n1,Alice");
    await page.getByLabel("SQLダイアレクト").selectOption("sqlserver");
    const output = page.getByLabel("生成されたSQL INSERT文");
    await expect(output).toHaveValue(/\[my_table\]/);
  });

  test("クリアボタンで入力が消える", async ({ page }) => {
    const textarea = page.getByLabel("CSV入力");
    await textarea.fill("id,name\n1,Alice");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(textarea).toBeEmpty();
  });

  test("SQL をコピーボタンが表示される", async ({ page }) => {
    const textarea = page.getByLabel("CSV入力");
    await textarea.fill("id,name\n1,Alice");
    await expect(page.getByRole("button", { name: "SQLをコピー", exact: true })).toBeEnabled();
  });

  test("統計バッジが表示される", async ({ page }) => {
    const textarea = page.getByLabel("CSV入力");
    await textarea.fill("id,name\n1,Alice\n2,Bob\n3,Carol");
    const meta = page.getByLabel("生成結果の統計");
    await expect(meta).toContainText("3 行");
    await expect(meta).toContainText("2 列");
  });

  test("空テーブル名でエラーが表示される", async ({ page }) => {
    const textarea = page.getByLabel("CSV入力");
    await textarea.fill("id,name\n1,Alice");
    const tableInput = page.getByLabel("テーブル名");
    await tableInput.fill("");
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("バッチサイズを変更できる", async ({ page }) => {
    const textarea = page.getByLabel("CSV入力");
    await textarea.fill("id,name\n1,Alice\n2,Bob\n3,Carol");
    const batchInput = page.getByLabel("バッチサイズ");
    await batchInput.fill("10");
    const output = page.getByLabel("生成されたSQL INSERT文");
    await expect(output).toHaveValue(/VALUES/);
  });

  test("余分な列のエラー後も入力を修正して再生成できる", async ({ page }) => {
    const input = page.getByLabel("CSV入力", { exact: true });
    const output = page.getByLabel("生成されたSQL INSERT文");
    const copy = page.getByRole("button", { name: "SQLをコピー", exact: true });
    await input.fill("id,name\n1,alpha");
    await expect(output).toHaveValue(/\(1, 'alpha'\)/);
    await expect(copy).toBeEnabled();

    const invalid = "id,name\n1,alpha\n2,beta,EXTRA";
    await input.fill(invalid);
    await expect(page.getByRole("alert")).toContainText("3番目のレコードは3列");
    await expect(input).toHaveValue(invalid);
    await expect(input).toBeFocused();
    await expect(output).toHaveCount(0);
    await expect(copy).toBeDisabled();
    await expect(page.getByLabel("生成結果の統計")).toHaveCount(0);

    await input.fill("id,name,note\n1,alpha\n2,beta,EXTRA");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(output).toHaveValue(/\(2, 'beta', 'EXTRA'\)/);
    await expect(copy).toBeEnabled();

    await page.getByRole("button", { name: "入力をクリア", exact: true }).click();
    await expect(input).toHaveValue("");
    await expect(output).toHaveCount(0);
    await expect(copy).toBeDisabled();
  });

  test("NULL 変換を無効にすると最後の空セルも空文字列になる", async ({ page }) => {
    await page.getByLabel("空値・NULLをSQL NULLに変換").uncheck();
    await page.getByLabel("CSV入力", { exact: true }).fill("id,name\n1,");
    const output = page.getByLabel("生成されたSQL INSERT文");
    await expect(output).toHaveValue(/\(1, ''\)/);
    await page.getByLabel("空値・NULLをSQL NULLに変換").check();
    await expect(output).toHaveValue(/\(1, NULL\)/);
  });

  test("ヘッダーなしのバッチ変換でも余分な末尾の空セルを拒否する", async ({ page }) => {
    await page.getByLabel("1行目をヘッダーとして使用").uncheck();
    await page.getByLabel("バッチサイズ", { exact: true }).fill("2");
    const input = page.getByLabel("CSV入力", { exact: true });
    await input.fill("1,alpha\n2,beta,");
    await expect(page.getByRole("alert")).toContainText("2番目のレコードは3列");
    await expect(page.getByRole("button", { name: "SQLをコピー", exact: true })).toBeDisabled();
    await input.fill("1,alpha\n2,beta");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByLabel("生成結果の統計")).toContainText("1 文");
    await expect(page.getByLabel("生成されたSQL INSERT文")).toHaveValue(/\(2, 'beta'\)/);
  });
});
