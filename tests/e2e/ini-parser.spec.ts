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
  test("特殊なセクション名とキーを保持し、次の入力へ持ち越さない", async ({ page }) => {
    const marker = "__iniSyntheticMarker_20261019";
    for (const name of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      const input = `[${name}]\n${marker} = first\n[ordinary]\n${name} = kept`;
      await page.getByLabel("INI入力テキストエリア").fill(input);
      const value = JSON.parse(await page.getByLabel("JSON出力").inputValue());
      expect(Object.hasOwn(value, name)).toBe(true);
      expect(value[name][marker]).toBe("first");
      expect(Object.hasOwn(value.ordinary, name)).toBe(true);
      expect(value.ordinary[name]).toBe("kept");
      await expect(page.getByRole("tree", { name: "INI構造ツリー" })).toBeVisible();
      expect(await page.evaluate((key) => Object.hasOwn(Object.prototype, key), marker)).toBe(
        false,
      );
    }
    await page.getByLabel("INI入力テキストエリア").fill("[clean]\nkey = next");
    await expect(page.getByLabel("JSON出力")).toHaveValue(
      JSON.stringify({ clean: { key: "next" } }, null, 2),
    );
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("特殊なグローバルキーの重複を正しい配列にする", async ({ page }) => {
    await page.getByLabel("重複キーを配列として扱う").check();
    for (const name of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      await page.getByLabel("INI入力テキストエリア").fill(`${name} = first\n${name} = second`);
      const value = JSON.parse(await page.getByLabel("JSON出力").inputValue());
      expect(Object.hasOwn(value, name)).toBe(true);
      expect(value[name]).toEqual(["first", "second"]);
    }
    await page.getByRole("button", { name: "入力をクリア", exact: true }).click();
    await expect(page.getByLabel("INI入力テキストエリア")).toHaveValue("");
  });

  test("JSONの特殊なキーとセクション名をINIへ出力し往復する", async ({ page }) => {
    const source = JSON.parse(
      '{"__proto__":{"__proto__":"first","constructor":"second"},"toString":"global","hasOwnProperty":["a","b"]}',
    );
    await page.getByRole("tab", { name: "JSON → INI" }).click();
    await page.getByLabel("JSON入力テキストエリア").fill(JSON.stringify(source));
    const output = await page.getByLabel("INI出力").inputValue();
    expect(output).toContain("[__proto__]");
    expect(output).toContain("__proto__ = first");
    expect(output).toContain("constructor = second");
    expect(output).toContain("toString = global");
    await page.getByRole("tab", { name: "INI → JSON" }).click();
    await page.getByLabel("重複キーを配列として扱う").check();
    await page.getByLabel("INI入力テキストエリア").fill(output);
    expect(JSON.parse(await page.getByLabel("JSON出力").inputValue())).toEqual(source);
    await expect(page.getByRole("button", { name: "出力をコピー", exact: true })).toBeEnabled();
  });
});
