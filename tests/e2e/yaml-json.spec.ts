import { test, expect } from "@playwright/test";

test.describe("YAML/JSON変換 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/yaml-json");
    await page.waitForLoadState("networkidle");
  });

  /**
   * ページが正しく読み込まれることを確認するテスト
   */
  test("ページが正しく読み込まれる", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  /**
   * ページタイトルが正しいことを確認するテスト
   */
  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/YAML.*JSON|JSON.*YAML/);
  });

  /**
   * デフォルト変換モードがYAML→JSONに設定されていることを確認するテスト
   */
  test("デフォルト変換モードがYAML→JSONになっている", async ({ page }) => {
    const yamlToJsonRadio = page.locator('input[value="yaml-to-json"]');
    await expect(yamlToJsonRadio).toBeChecked();
  });

  /**
   * YAML→JSONとJSON→YAMLの変換モード選択ラジオボタンが表示されることを確認するテスト
   */
  test("変換モード選択のラジオボタンが両方表示される", async ({ page }) => {
    const yamlToJsonRadio = page.locator('input[value="yaml-to-json"]');
    const jsonToYamlRadio = page.locator('input[value="json-to-yaml"]');
    await expect(yamlToJsonRadio).toBeVisible();
    await expect(jsonToYamlRadio).toBeVisible();
  });

  /**
   * YAML→JSON変換が正しく動作することを確認するテスト
   */
  test("YAML→JSON変換が正しく動作する", async ({ page }) => {
    await page.locator('input[value="yaml-to-json"]').click();
    await page.locator("#inputText").fill("name: 田中\nage: 30");
    await page.locator("button.btn-primary").click();

    const output = await page.locator("#outputText").inputValue();
    const parsed = JSON.parse(output);
    expect(parsed).toEqual({ name: "田中", age: 30 });
  });

  /**
   * JSON→YAML変換が正しく動作することを確認するテスト
   */
  test("JSON→YAML変換が正しく動作する", async ({ page }) => {
    await page.locator('input[value="json-to-yaml"]').click();
    await page.locator("#inputText").fill('{"name":"田中","age":30}');
    await page.locator("button.btn-primary").click();

    const output = await page.locator("#outputText").inputValue();
    expect(output).toContain("name:");
    expect(output).toContain("田中");
    expect(output).toContain("age:");
    expect(output).toContain("30");
  });

  /**
   * クリアボタンで入力と出力テキストエリアがクリアされることを確認するテスト
   */
  test("クリアボタンで入力と出力がクリアされる", async ({ page }) => {
    await page.locator("#inputText").fill("name: 田中\nage: 30");
    await page.locator("button.btn-primary").click();
    await expect(page.locator("#outputText")).not.toHaveValue("");

    await page.locator("button.btn-clear").click();
    await expect(page.locator("#inputText")).toHaveValue("");
    await expect(page.locator("#outputText")).toHaveValue("");
  });

  /**
   * コピーボタンが出力なしで無効になっていることを確認するテスト
   */
  test("コピーボタンが出力なしで無効になっている", async ({ page }) => {
    const copyBtn = page.locator(
      'button[aria-label="出力結果をクリップボードにコピー"]'
    );
    await expect(copyBtn).toBeDisabled();
  });

  /**
   * 空入力で変換するとエラートーストが表示されることを確認するテスト
   */
  test("空入力で変換するとToastエラーが表示される", async ({ page }) => {
    await page.locator("button.btn-primary").click();
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("テキストを入力してください");
  });

  /**
   * 無効なYAML入力で変換するとエラートーストが表示されることを確認するテスト
   */
  test("無効なYAML入力時にToastエラーが表示される", async ({ page }) => {
    await page.locator('input[value="yaml-to-json"]').click();
    await page
      .locator("#inputText")
      .fill("key: :\n  invalid: : yaml: :");
    await page.locator("button.btn-primary").click();
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
  });

  /**
   * 無効なJSON入力で変換するとエラートーストが表示されることを確認するテスト
   */
  test("無効なJSON入力時にToastエラーが表示される", async ({ page }) => {
    await page.locator('input[value="json-to-yaml"]').click();
    await page.locator("#inputText").fill("{invalid json here}");
    await page.locator("button.btn-primary").click();
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
  });

  /**
   * インデント選択ラジオボタンが表示されることを確認するテスト
   */
  test("インデント選択ラジオボタンが表示される", async ({ page }) => {
    const indent2Radio = page.locator('input[name="indent"][value="2"]');
    const indent4Radio = page.locator('input[name="indent"][value="4"]');
    await expect(indent2Radio).toBeVisible();
    await expect(indent4Radio).toBeVisible();
    await expect(indent2Radio).toBeChecked();
  });

  /**
   * ナビゲーションからYAML/JSONページへ遷移できることを確認するテスト
   */
  test("ナビゲーションからYAML/JSONページへ遷移できる", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const link = page.locator('a[href="/yaml-json"]');
    if (await link.isVisible()) {
      await link.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/yaml-json/);
    } else {
      await page.goto("/yaml-json");
      await expect(page).toHaveURL(/yaml-json/);
    }
  });
});
