import { test, expect } from "@playwright/test";

test.describe("XPath 評価器 (/xpath)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/xpath");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/XPath/);
  });

  test("サンプル XML 読み込みボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("サンプル XML を読み込む")).toBeVisible();
  });

  test("XML 入力エリアが表示される", async ({ page }) => {
    await expect(page.getByLabel("XML ドキュメント入力")).toBeVisible();
  });

  test("XPath 式入力フィールドが表示される", async ({ page }) => {
    await expect(page.getByLabel("XPath 式入力")).toBeVisible();
  });

  test("評価ボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("XPath 式を評価")).toBeVisible();
  });

  test("例選択セレクトボックスが表示される", async ({ page }) => {
    await expect(page.getByLabel("XPath 式の例を選択")).toBeVisible();
  });

  test("サンプル XML 読み込みボタンで XML が設定される", async ({ page }) => {
    await page.getByLabel("サンプル XML を読み込む").click();
    const xmlInput = page.getByLabel("XML ドキュメント入力");
    const value = await xmlInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
    expect(value).toContain("<");
  });

  test("サンプル XML 読み込み後に XPath 評価ができる", async ({ page }) => {
    await page.getByLabel("サンプル XML を読み込む").click();
    // //book/title/text() がデフォルトでセットされる
    const expressionInput = page.getByLabel("XPath 式入力");
    const expr = await expressionInput.inputValue();
    expect(expr).toContain("book");
    // 評価ボタンをクリック
    await page.getByLabel("XPath 式を評価").click();
    // 結果エリアに結果が表示される
    const resultArea = page.getByRole("region", { name: "XPath 評価結果" });
    await expect(resultArea).toBeVisible();
    await expect(resultArea).not.toContainText("XPath 式を入力して");
  });

  test("nodeset 結果が表示される", async ({ page }) => {
    await page.getByLabel("サンプル XML を読み込む").click();
    await page.getByLabel("XPath 式を評価").click();
    const resultArea = page.getByRole("region", { name: "XPath 評価結果" });
    // nodeset の場合、件数が表示される
    await expect(resultArea).toContainText("件");
  });

  test("不正な XPath 式でエラーが表示される", async ({ page }) => {
    await page.getByLabel("サンプル XML を読み込む").click();
    const expressionInput = page.getByLabel("XPath 式入力");
    await expressionInput.fill("///invalid/[[[");
    await page.getByLabel("XPath 式を評価").click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("例を選択すると XPath 式が変更される", async ({ page }) => {
    const select = page.getByLabel("XPath 式の例を選択");
    const options = select.locator("option");
    const count = await options.count();
    if (count > 1) {
      // 2番目のオプション（最初の実例）を選択
      await select.selectOption({ index: 1 });
      const expressionInput = page.getByLabel("XPath 式入力");
      const value = await expressionInput.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test("number 型の XPath 評価が動作する", async ({ page }) => {
    await page.getByLabel("サンプル XML を読み込む").click();
    const expressionInput = page.getByLabel("XPath 式入力");
    await expressionInput.fill("count(//book)");
    await page.getByLabel("XPath 式を評価").click();
    const resultArea = page.getByRole("region", { name: "XPath 評価結果" });
    // number 型バッジが表示される
    await expect(resultArea.locator(".xpath-result-type-number")).toBeVisible();
  });

  test("boolean 型の XPath 評価が動作する", async ({ page }) => {
    await page.getByLabel("サンプル XML を読み込む").click();
    const expressionInput = page.getByLabel("XPath 式入力");
    await expressionInput.fill("boolean(//book)");
    await page.getByLabel("XPath 式を評価").click();
    const resultArea = page.getByRole("region", { name: "XPath 評価結果" });
    await expect(resultArea.locator(".xpath-result-type-boolean")).toBeVisible();
  });

  test("初期状態ではプレースホルダーテキストが表示される", async ({ page }) => {
    const resultArea = page.getByRole("region", { name: "XPath 評価結果" });
    await expect(resultArea).toContainText("XPath 式を入力して「評価」ボタンを押してください");
  });
});
