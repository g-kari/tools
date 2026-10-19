import { test, expect } from "../browser/csv-json/url-app-test";
import * as yaml from "js-yaml";

test.describe(".envパーサー・コンバーター - E2Eテスト", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/env-parser");
    await page.waitForLoadState("networkidle");
  });

  test("ページに「undefined」が表示されないこと", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("正しいページタイトルが表示されること", async ({ page }) => {
    await expect(page).toHaveTitle(/.env/);
  });

  test("メイン見出しが表示されること", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("テキストエリアとボタンが存在すること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();
    const clearButton = page.locator("button.btn-clear");

    await expect(textarea).toBeVisible();
    await expect(parseButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test("基本的なパース動作（テーブル表示）", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill("DATABASE_URL=postgres://localhost/db\nAPI_KEY=secret123\nDEBUG=true");
    await parseButton.click();

    // テーブルが表示される
    const table = page.locator(".env-parser-table");
    await expect(table).toBeVisible();

    // キーが表示されている
    await expect(page.locator(".env-parser-table")).toContainText("DATABASE_URL");
    await expect(page.locator(".env-parser-table")).toContainText("API_KEY");
    await expect(page.locator(".env-parser-table")).toContainText("DEBUG");
  });

  test("パース後に値がテーブルに表示されること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill("PORT=3000");
    await parseButton.click();

    await expect(page.locator(".env-parser-table")).toContainText("PORT");
    await expect(page.locator(".env-parser-table")).toContainText("3000");
  });

  test("エクスポートタブが表示されること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill("KEY=value");
    await parseButton.click();

    // タブが表示される
    await expect(page.locator(".env-parser-tabs")).toBeVisible();
    await expect(page.locator("#tab-json")).toBeVisible();
    await expect(page.locator("#tab-yaml")).toBeVisible();
    await expect(page.locator("#tab-shell")).toBeVisible();
  });

  test("JSONタブ切り替えで正しい出力が表示されること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill("MY_KEY=my_value");
    await parseButton.click();

    await page.locator("#tab-json").click();

    const jsonPanel = page.locator("#tabpanel-json");
    await expect(jsonPanel).toBeVisible();
    const outputText = await jsonPanel.locator("textarea").inputValue();
    expect(outputText).toContain('"MY_KEY"');
    expect(outputText).toContain('"my_value"');
  });

  test("YAMLタブ切り替えで正しい出力が表示されること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill("MY_KEY=my_value");
    await parseButton.click();

    await page.locator("#tab-yaml").click();

    const yamlPanel = page.locator("#tabpanel-yaml");
    await expect(yamlPanel).toBeVisible();
    const outputText = await yamlPanel.locator("textarea").inputValue();
    expect(outputText).toContain('MY_KEY: "my_value"');
  });

  test("YAML出力とコピーが文字列の値とキー名を保持する", async ({ page }, testInfo) => {
    const source =
      "PORT=3000\nDEBUG=true\nPOSTCODE=00123\nLARGE=9007199254740993\nOPTION=null\nDATE=2026-10-19\nQUOTES=\"'quoted'\"\nDASH=-\nEMPTY=\nTRUE=upper\nTrue=title\ntrue=lower\n__proto__=plain\nconstructor=own\ntoString=text";
    await page.locator("#envInput").fill(source);
    await page.getByRole("button", { name: ".envの内容をパース", exact: true }).click();
    await page.getByRole("tab", { name: "YAML", exact: true }).click();
    const output = await page
      .getByRole("textbox", { name: "YAML形式の出力結果", exact: true })
      .inputValue();
    const decoded = yaml.load(output) as Record<string, string>;
    const expected = Object.fromEntries([
      ["PORT", "3000"],
      ["DEBUG", "true"],
      ["POSTCODE", "00123"],
      ["LARGE", "9007199254740993"],
      ["OPTION", "null"],
      ["DATE", "2026-10-19"],
      ["QUOTES", "'quoted'"],
      ["DASH", "-"],
      ["EMPTY", ""],
      ["TRUE", "upper"],
      ["True", "title"],
      ["true", "lower"],
      ["__proto__", "plain"],
      ["constructor", "own"],
      ["toString", "text"],
    ]);
    expect(decoded).toEqual(expected);
    expect(Object.keys(decoded)).toEqual(Object.keys(expected));
    expect(Object.prototype.hasOwnProperty.call(decoded, "__proto__")).toBe(true);
    await expect(page.locator("#envInput")).toHaveValue(source);
    await expect(page.locator(".env-parser-table tbody tr")).toHaveCount(15);
    await page.getByRole("button", { name: "YAML形式でコピー", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(output);
    await expect(page.locator("body")).toContainText("YAMLでは値を常に文字列として出力");
    await expect
      .poll(() =>
        page.locator(".tool-container").evaluate((element) => getComputedStyle(element).opacity),
      )
      .toBe("1");
    const noOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noOverflow).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("env-yaml-string-values.png"),
      fullPage: true,
    });
  });

  test("重複キーはYAMLで最後の値を使い入力と診断を保持する", async ({ page }) => {
    const source = "KEY=first\nBAD LINE\nKEY=last\nEMPTY=old\nEMPTY=\n__proto__=old\n__proto__=new";
    await page.locator("#envInput").fill(source);
    await page.getByRole("button", { name: ".envの内容をパース", exact: true }).click();
    await page.getByRole("tab", { name: "YAML", exact: true }).click();
    const output = await page
      .getByRole("textbox", { name: "YAML形式の出力結果", exact: true })
      .inputValue();
    const decoded = yaml.load(output) as Record<string, string>;
    expect(Object.keys(decoded)).toEqual(["KEY", "EMPTY", "__proto__"]);
    expect(decoded.KEY).toBe("last");
    expect(decoded.EMPTY).toBe("");
    expect(Object.prototype.hasOwnProperty.call(decoded, "__proto__")).toBe(true);
    expect(decoded.__proto__).toBe("new");
    await expect(page.locator("#envInput")).toHaveValue(source);
    await expect(page.locator(".env-parser-table tbody tr")).toHaveCount(6);
    await expect(page.locator(".env-parser-warning-item")).toHaveCount(3);
    await expect(page.locator(".env-parser-error-item")).toContainText("BAD LINE");
  });

  test("YAMLのタブ再選択とクリア後の再パースで最新結果をコピーする", async ({ page }) => {
    const input = page.locator("#envInput");
    const parse = page.getByRole("button", { name: ".envの内容をパース", exact: true });
    const output = page.getByRole("textbox", { name: "YAML形式の出力結果", exact: true });
    await input.fill("PORT=00123\nDEBUG=false");
    await parse.click();
    await page.getByRole("tab", { name: "YAML", exact: true }).click();
    const first = await output.inputValue();
    for (const tab of ["JSON", "Shell export", "YAML", "JSON", "YAML"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
    }
    await expect(output).toHaveValue(first);
    expect(yaml.load(first)).toEqual({ PORT: "00123", DEBUG: "false" });
    await page.getByRole("button", { name: "入力と結果をクリア", exact: true }).click();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await expect(page.getByRole("tablist", { name: "エクスポート形式タブ" })).toHaveCount(0);
    await input.fill("PORT=00007\nDEBUG=null\nQUOTED='\"new\"'");
    await parse.click();
    await expect(page.getByRole("tab", { name: "YAML", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const second = await output.inputValue();
    expect(yaml.load(second)).toEqual({ PORT: "00007", DEBUG: "null", QUOTED: '"new"' });
    expect(second).not.toBe(first);
    await page.getByRole("button", { name: "YAML形式でコピー", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(second);
  });

  test("Shellタブ切り替えで正しい出力が表示されること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill("MY_KEY=my_value");
    await parseButton.click();

    await page.locator("#tab-shell").click();

    const shellPanel = page.locator("#tabpanel-shell");
    await expect(shellPanel).toBeVisible();
    const outputText = await shellPanel.locator("textarea").inputValue();
    expect(outputText).toContain('export MY_KEY="my_value"');
  });

  test("クリアボタンで入力と結果がリセットされること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();
    const clearButton = page.locator("button.btn-clear");

    await textarea.fill("KEY=value");
    await parseButton.click();

    // テーブルが表示されていることを確認
    await expect(page.locator(".env-parser-table")).toBeVisible();

    // クリアする
    await clearButton.click();

    // テキストエリアが空になる
    await expect(textarea).toHaveValue("");
    // テーブルが非表示になる
    await expect(page.locator(".env-parser-table")).not.toBeVisible();
  });

  test("エラー行がエラー表示されること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill("VALID=ok\nINVALID_LINE\nANOTHER=ok");
    await parseButton.click();

    // エラーアイテムが表示される
    const errorItem = page.locator(".env-parser-error-item").first();
    await expect(errorItem).toBeVisible();
    await expect(errorItem).toContainText("INVALID_LINE");
  });

  test("重複キーが警告表示されること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill("KEY=value1\nKEY=value2");
    await parseButton.click();

    // 警告アイテムが表示される
    const warningItem = page.locator(".env-parser-warning-item").first();
    await expect(warningItem).toBeVisible();
    await expect(warningItem).toContainText("KEY");
  });

  test("空入力でパースするとトーストエラーが表示されること", async ({ page }) => {
    const parseButton = page.locator("button.btn-primary").first();

    await parseButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(".envの内容を入力してください");
  });

  test("コメント行がスキップされること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill("# this is a comment\nKEY=value\n# another comment");
    await parseButton.click();

    // テーブルに1件だけ表示される
    const rows = page.locator(".env-parser-table tbody tr");
    await expect(rows).toHaveCount(1);
  });

  test("クォート付き値が正しくパースされること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill('API_KEY="secret-key-123"');
    await parseButton.click();

    await expect(page.locator(".env-parser-table")).toContainText("secret-key-123");
    // クォートは除去されているので " は含まれない（テーブル値セルで）
    const valueCells = page.locator(".env-parser-table-value");
    const valueText = await valueCells.first().textContent();
    expect(valueText).toBe("secret-key-123");
  });

  test("ヒントカードが表示されること", async ({ page }) => {
    const infoBox = page.locator(".info-box");
    await expect(infoBox).toBeVisible();
    const infoText = await infoBox.textContent();
    expect(infoText).not.toContain("undefined");
  });

  test("アクセシビリティ属性が設定されていること", async ({ page }) => {
    // バナーとメインランドマーク
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    // スキップリンク
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("パース後にタブリストのARIAが設定されていること", async ({ page }) => {
    const textarea = page.locator("#envInput");
    const parseButton = page.locator("button.btn-primary").first();

    await textarea.fill("KEY=value");
    await parseButton.click();

    const tabList = page.locator('[role="tablist"]');
    await expect(tabList).toBeVisible();

    const activeTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(activeTab).toBeVisible();
  });
});
