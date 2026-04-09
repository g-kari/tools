import { test, expect } from "@playwright/test";

test.describe("INIファイルパーサー/フォーマッター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ini-parser");
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/INIファイルパーサー/);
    await expect(page.getByRole("tab", { name: "INI → JSON" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "JSON → INI" })).toBeVisible();
  });

  test("INI入力テキストエリアが表示される", async ({ page }) => {
    await expect(page.getByLabel("INI入力テキストエリア")).toBeVisible();
  });

  test("サンプルボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /php.ini.*サンプルを読み込む/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /.gitconfig.*サンプルを読み込む/ }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /app.ini.*サンプルを読み込む/ })).toBeVisible();
  });

  test("php.ini サンプルを読み込めてJSONに変換できる", async ({ page }) => {
    await page.getByRole("button", { name: /php.ini.*サンプルを読み込む/ }).click();
    const textarea = page.getByLabel("INI入力テキストエリア");
    await expect(textarea).not.toHaveValue("");

    // JSON出力が表示されることを確認
    const jsonOutput = page.getByLabel("JSON出力");
    await expect(jsonOutput).toBeVisible();
    const outputValue = await jsonOutput.inputValue();
    expect(outputValue).toContain('"PHP"');
    expect(outputValue).toContain('"memory_limit"');
  });

  test(".gitconfig サンプルをパースできる", async ({ page }) => {
    await page.getByRole("button", { name: /.gitconfig.*サンプルを読み込む/ }).click();
    const jsonOutput = page.getByLabel("JSON出力");
    await expect(jsonOutput).toBeVisible();
    const outputValue = await jsonOutput.inputValue();
    expect(outputValue).toContain('"user"');
    expect(outputValue).toContain('"core"');
  });

  test("手動でINIを入力してJSONを得られる", async ({ page }) => {
    const input = page.getByLabel("INI入力テキストエリア");
    await input.fill("[section]\nkey = value");

    const jsonOutput = page.getByLabel("JSON出力");
    await expect(jsonOutput).toBeVisible();
    const outputValue = await jsonOutput.inputValue();
    expect(outputValue).toContain('"section"');
    expect(outputValue).toContain('"key"');
    expect(outputValue).toContain('"value"');
  });

  test("構造ビューが表示される", async ({ page }) => {
    await page.getByRole("button", { name: /app.ini.*サンプルを読み込む/ }).click();
    await expect(page.getByRole("tree", { name: "INI構造ツリー" })).toBeVisible();
  });

  test("統計情報が表示される", async ({ page }) => {
    await page.getByLabel("INI入力テキストエリア").fill("[s1]\na = 1\nb = 2\n[s2]\nc = 3");
    await expect(page.getByText("セクション数")).toBeVisible();
    await expect(page.getByText("総キー数")).toBeVisible();
  });

  test("クリアボタンが動作する", async ({ page }) => {
    await page.getByLabel("INI入力テキストエリア").fill("[section]\nkey = value");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.getByLabel("INI入力テキストエリア")).toHaveValue("");
  });

  test("JSON→INI モードに切り替えられる", async ({ page }) => {
    await page.getByRole("tab", { name: "JSON → INI" }).click();
    await expect(page.getByLabel("JSON入力テキストエリア")).toBeVisible();
  });

  test("JSON→INI 変換が動作する", async ({ page }) => {
    await page.getByRole("tab", { name: "JSON → INI" }).click();
    const input = page.getByLabel("JSON入力テキストエリア");
    await input.fill('{"database": {"host": "localhost", "port": "5432"}}');

    const iniOutput = page.getByLabel("INI出力");
    await expect(iniOutput).toBeVisible();
    const outputValue = await iniOutput.inputValue();
    expect(outputValue).toContain("[database]");
    expect(outputValue).toContain("host");
    expect(outputValue).toContain("localhost");
  });

  test("不正なJSONにエラーが表示される", async ({ page }) => {
    await page.getByRole("tab", { name: "JSON → INI" }).click();
    await page.getByLabel("JSON入力テキストエリア").fill("{invalid json}");
    await expect(page.getByRole("alert", { name: "JSONパースエラー" })).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText("INIファイルの書式")).toBeVisible();
  });
});
