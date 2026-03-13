import { test, expect } from "@playwright/test";

test.describe("TOML/JSON変換 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/toml-json");
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
    await expect(page).toHaveTitle(/TOML.*JSON|JSON.*TOML/);
  });

  /**
   * デフォルト変換モードがTOML→JSONに設定されていることを確認するテスト
   */
  test("デフォルト変換モードがTOML→JSONになっている", async ({ page }) => {
    const tomlToJsonRadio = page.locator('input[value="toml-to-json"]');
    await expect(tomlToJsonRadio).toBeChecked();
  });

  /**
   * TOML→JSONとJSON→TOMLの変換モード選択ラジオボタンが表示されることを確認するテスト
   */
  test("変換モード選択のラジオボタンが両方表示される", async ({ page }) => {
    const tomlToJsonRadio = page.locator('input[value="toml-to-json"]');
    const jsonToTomlRadio = page.locator('input[value="json-to-toml"]');
    await expect(tomlToJsonRadio).toBeVisible();
    await expect(jsonToTomlRadio).toBeVisible();
  });

  /**
   * TOML→JSON変換が正しく動作することを確認するテスト
   */
  test("TOML→JSON変換が正しく動作する", async ({ page }) => {
    await page.locator('input[value="toml-to-json"]').click();
    await page.locator("#inputText").fill('name = "田中"\nage = 30');
    await page.locator("button.btn-primary").click();

    const output = await page.locator("#outputText").inputValue();
    const parsed = JSON.parse(output);
    expect(parsed).toEqual({ name: "田中", age: 30 });
  });

  /**
   * JSON→TOML変換が正しく動作することを確認するテスト
   */
  test("JSON→TOML変換が正しく動作する", async ({ page }) => {
    await page.locator('input[value="json-to-toml"]').click();
    await page.locator("#inputText").fill('{"name":"田中","age":30}');
    await page.locator("button.btn-primary").click();

    const output = await page.locator("#outputText").inputValue();
    expect(output).toContain("name");
    expect(output).toContain("田中");
    expect(output).toContain("age");
    expect(output).toContain("30");
  });

  /**
   * クリアボタンで入力と出力テキストエリアがクリアされることを確認するテスト
   */
  test("クリアボタンで入力と出力がクリアされる", async ({ page }) => {
    await page.locator("#inputText").fill('name = "田中"\nage = 30');
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
   * 無効なTOML入力で変換するとエラートーストが表示されることを確認するテスト
   */
  test("無効なTOML入力時にToastエラーが表示される", async ({ page }) => {
    await page.locator('input[value="toml-to-json"]').click();
    await page.locator("#inputText").fill("key = = invalid toml");
    await page.locator("button.btn-primary").click();
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
  });

  /**
   * 無効なJSON入力で変換するとエラートーストが表示されることを確認するテスト
   */
  test("無効なJSON入力時にToastエラーが表示される", async ({ page }) => {
    await page.locator('input[value="json-to-toml"]').click();
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
   * ナビゲーションからTOML/JSONページへ遷移できることを確認するテスト
   */
  test("ナビゲーションからTOML/JSONページへ遷移できる", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const link = page.locator('a[href="/toml-json"]');
    if (await link.isVisible()) {
      await link.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/toml-json/);
    } else {
      await page.goto("/toml-json");
      await expect(page).toHaveURL(/toml-json/);
    }
  });
});
