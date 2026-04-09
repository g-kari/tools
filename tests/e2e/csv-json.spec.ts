import { test, expect } from "@playwright/test";

test.describe("CSV/JSON変換 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/csv-json");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しく読み込まれる", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/CSV\/JSON変換/);
  });

  test("変換モード選択のラジオボタンが表示される", async ({ page }) => {
    const csvToJsonRadio = page.locator('input[value="csv-to-json"]');
    const jsonToCsvRadio = page.locator('input[value="json-to-csv"]');
    await expect(csvToJsonRadio).toBeVisible();
    await expect(jsonToCsvRadio).toBeVisible();
    await expect(csvToJsonRadio).toBeChecked();
  });

  test("区切り文字セレクトが表示される", async ({ page }) => {
    const delimiter = page.locator("#delimiter");
    await expect(delimiter).toBeVisible();
    await expect(delimiter).toHaveValue(",");
  });

  test("CSV→JSONモードでヘッダーチェックボックスが表示される", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeChecked();
  });

  test("JSON→CSVモードに切り替えるとヘッダーチェックボックスが非表示になる", async ({ page }) => {
    await page.locator('input[value="json-to-csv"]').click();
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeVisible();
  });

  test("入力テキストエリアと出力テキストエリアが表示される", async ({ page }) => {
    await expect(page.locator("#inputText")).toBeVisible();
    await expect(page.locator("#outputText")).toBeVisible();
  });

  test("変換ボタンとクリアボタンが表示される", async ({ page }) => {
    await expect(page.locator("button.btn-primary")).toBeVisible();
    await expect(page.locator("button.btn-clear")).toBeVisible();
  });

  test("CSV → JSON 変換（ヘッダーあり）が正しく動作する", async ({ page }) => {
    await page.locator("#inputText").fill("name,age\n田中,30\n佐藤,25");
    await page.locator("button.btn-primary").click();

    const output = await page.locator("#outputText").inputValue();
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({ name: "田中", age: "30" });
    expect(parsed[1]).toEqual({ name: "佐藤", age: "25" });
  });

  test("JSON → CSV 変換が正しく動作する", async ({ page }) => {
    await page.locator('input[value="json-to-csv"]').click();
    await page
      .locator("#inputText")
      .fill('[{"name":"田中","age":"30"},{"name":"佐藤","age":"25"}]');
    await page.locator("button.btn-primary").click();

    const output = await page.locator("#outputText").inputValue();
    const lines = output.split("\n");
    expect(lines[0]).toBe("name,age");
    expect(lines[1]).toBe("田中,30");
    expect(lines[2]).toBe("佐藤,25");
  });

  test("空入力で変換するとToastエラーが表示される", async ({ page }) => {
    await page.locator("button.btn-primary").click();
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("テキストを入力してください");
  });

  test("クリアボタンで入力と出力がクリアされる", async ({ page }) => {
    await page.locator("#inputText").fill("name,age\n田中,30");
    await page.locator("button.btn-primary").click();
    await expect(page.locator("#outputText")).not.toHaveValue("");

    await page.locator("button.btn-clear").click();
    await expect(page.locator("#inputText")).toHaveValue("");
    await expect(page.locator("#outputText")).toHaveValue("");
  });

  test("コピーボタンが出力なしで無効になっている", async ({ page }) => {
    const copyBtn = page.locator('button[aria-label="出力結果をクリップボードにコピー"]');
    await expect(copyBtn).toBeDisabled();
  });

  test("使い方説明が表示される", async ({ page }) => {
    const tipsCard = page.locator(".tips-card").first();
    await expect(tipsCard).toBeVisible();
  });
});
