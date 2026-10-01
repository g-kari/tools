import { expect, test, type Page } from "@playwright/test";

const origin = "http://127.0.0.1:4193";
const resources = new Map([
  ["/", "document"],
  ["/fixture.js", "script"],
  ["/fixture.css", "stylesheet"],
]);
const violations = new WeakMap<Page, string[]>();

// データ送信・外部ホスト・想定外パス・リソースを失敗として扱う。
test.beforeEach(async ({ page }) => {
  const blocked: string[] = [];
  violations.set(page, blocked);
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      request.method() !== "GET" ||
      url.origin !== origin ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      resources.get(url.pathname) !== request.resourceType()
    ) {
      blocked.push(`${request.method()} ${request.url()} (${request.resourceType()})`);
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
  await page.goto("/");
  await expect(page.getByRole("textbox", { name: "JSON Lines入力欄", exact: true })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(violations.get(page), "検証中のリクエストは固定ローカルファイルのみ").toEqual([]);
});

test("整形・圧縮を繰り返してもレコードと文字列の値を保持する", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "JSON Lines入力欄", exact: true });
  const values = [{ id: 1, v: ['a,b:c\\"d\ne', null, { x: [1, 2] }] }, false, "前\n後"];
  const original = values.map((value) => JSON.stringify(value)).join("\n");
  await input.fill(original);
  const format = page.getByRole("button", { name: "各行のJSONを整形", exact: true });
  await format.click();
  const formatted = await input.inputValue();
  expect(formatted.split("\n").map((line) => JSON.parse(line))).toEqual(values);
  await expect(page.locator(".jsonl-stat-valid")).toHaveText("3");
  await expect(page.locator(".jsonl-error-list")).toHaveCount(0);
  await format.click();
  await expect(input).toHaveValue(formatted);
  await page.getByRole("button", { name: "各行のJSONを圧縮", exact: true }).click();
  await expect(input).toHaveValue(original);
  await page.getByRole("button", { name: "各行のJSONを圧縮", exact: true }).click();
  await expect(input).toHaveValue(original);
  await page.screenshot({ path: "test-results/json-lines-formatted.png", fullPage: true });
});

test("不正なレコードを含む整形・圧縮は入力全体を保ち、修正後に再試行できる", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "JSON Lines入力欄", exact: true });
  const original = '{"id":1}\n\n  invalid  \n{"id":2}';
  for (const action of ["各行のJSONを整形", "各行のJSONを圧縮"]) {
    await input.fill(original);
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(input).toHaveValue(original);
    await expect(page.locator(".error-message")).toContainText("入力は変更していません");
    await expect(page.locator(".jsonl-error-list")).toContainText("行 3");
    await expect(page.locator(".jsonl-stat-valid")).toHaveText("2");
    await input.fill('{"id":1}\n{"id":2}');
    await expect(page.locator(".error-message")).toHaveCount(0);
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(page.locator(".jsonl-error-list")).toHaveCount(0);
  }
});

test("複数行オブジェクトを圧縮時に別レコードと結合しない", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "JSON Lines入力欄", exact: true });
  const original = '{\n  "id": 1\n}\n{"id":2}';
  await input.fill(original);
  await page.getByRole("button", { name: "各行のJSONを圧縮", exact: true }).click();
  await expect(input).toHaveValue(original);
  await expect(page.locator(".error-message")).toContainText("入力は変更していません");
});

test("検証モードではCtrl/Command+Enterとモード再クリックが入力を保持する", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "JSON Lines入力欄", exact: true });
  await input.fill('{"id":1}');
  await input.press("Control+Enter");
  await input.press("Meta+Enter");
  await page.getByRole("button", { name: "検証・整形", exact: true }).click();
  await expect(input).toHaveValue('{"id":1}');
  await expect(page.locator(".error-message")).toHaveCount(0);
  await expect(page.locator("#outputText")).toHaveCount(0);
});

test("変換ショートカットと往復変換、入力編集とモード変更の出力リセット", async ({ page }) => {
  const toArray = page.getByRole("button", { name: "JSONL → JSON配列", exact: true });
  await toArray.click();
  const input = page.locator("#inputText");
  const output = page.getByRole("textbox", { name: "変換結果の出力欄", exact: true });
  await input.fill('{"id":1}\nfalse');
  await input.press("Control+Enter");
  const array = await output.inputValue();
  expect(JSON.parse(array)).toEqual([{ id: 1 }, false]);
  await toArray.click();
  await expect(input).toHaveValue('{"id":1}\nfalse');
  await expect(output).toHaveValue(array);
  await input.fill("");
  await expect(output).toHaveValue("");
  await expect(page.getByRole("button", { name: "出力をクリップボードにコピー" })).toHaveCount(0);
  await page.getByRole("button", { name: "JSON配列に変換", exact: true }).click();
  await expect(page.locator(".error-message")).toContainText("入力してください");
  await page.getByRole("button", { name: "JSON配列 → JSONL", exact: true }).click();
  await expect(page.locator(".error-message")).toHaveCount(0);
  await expect(input).toHaveValue("");
  await input.fill(array);
  await input.press("Meta+Enter");
  await expect(output).toHaveValue('{"id":1}\nfalse');
  await page.getByRole("button", { name: "入力と出力をクリア", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(output).toHaveValue("");
});

test("不正な変換のエラーから修正して再変換できる", async ({ page }) => {
  await page.getByRole("button", { name: "JSONL → JSON配列", exact: true }).click();
  const input = page.locator("#inputText");
  const output = page.locator("#outputText");
  await input.fill('{"id":1}');
  await page.getByRole("button", { name: "JSON配列に変換", exact: true }).click();
  await expect(output).not.toHaveValue("");
  await input.fill('{"id":1}\ninvalid\n{"id":2}');
  await page.getByRole("button", { name: "JSON配列に変換", exact: true }).click();
  await expect(output).toHaveValue("");
  await expect(page.locator(".error-message")).toContainText("行 2");
  await input.fill('{"id":1}\n{"id":2}');
  await page.getByRole("button", { name: "JSON配列に変換", exact: true }).click();
  expect(JSON.parse(await output.inputValue())).toEqual([{ id: 1 }, { id: 2 }]);
  await expect(page.locator(".error-message")).toHaveCount(0);
});

test("サンプル・クリアと狭い画面での操作", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "サンプルデータを読み込む", exact: true }).click();
  await expect(page.locator(".jsonl-stat-valid")).toHaveText("3");
  await page.getByRole("button", { name: "各行のJSONを整形", exact: true }).click();
  await expect(page.locator(".jsonl-error-list")).toHaveCount(0);
  await page.screenshot({ path: "test-results/json-lines-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "入力と出力をクリア", exact: true }).click();
  await expect(page.locator("#inputText")).toHaveValue("");
  await expect(page.getByRole("button", { name: "各行のJSONを整形", exact: true })).toBeDisabled();
});

test("BOM・NBSP付きの有効な入力を検証と同じ基準で整形・圧縮する", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "JSON Lines入力欄", exact: true });
  const original = '\uFEFF{"id":1,"v":[1,2]}\u00A0\n\u00A0{"id":2}\uFEFF';
  await input.fill(original);
  await expect(page.locator(".jsonl-stat-valid")).toHaveText("2");
  await expect(page.locator(".jsonl-error-list")).toHaveCount(0);
  await page.getByRole("button", { name: "各行のJSONを整形", exact: true }).click();
  await expect(input).toHaveValue('{"id": 1, "v": [1, 2]}\n{"id": 2}');
  await expect(page.locator(".error-message")).toHaveCount(0);
  await input.fill(original);
  await page.getByRole("button", { name: "各行のJSONを圧縮", exact: true }).click();
  await expect(input).toHaveValue('{"id":1,"v":[1,2]}\n{"id":2}');
  await expect(page.locator(".error-message")).toHaveCount(0);
});
