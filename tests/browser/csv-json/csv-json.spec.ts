import { test, expect, type Page } from "@playwright/test";

const externalRequests = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const attempts: string[] = [];
  externalRequests.set(page, attempts);
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:4195") {
      attempts.push(url.origin);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/");
});
test.afterEach(async ({ page }) => {
  expect(externalRequests.get(page)).toEqual([]);
});

test("sparse JSON columns survive repeated conversion and invalid-row recovery", async ({
  page,
}) => {
  await page.getByRole("radio", { name: "JSON から CSV へ変換" }).check();
  const input = page.locator("#inputText");
  const output = page.locator("#outputText");
  const convert = page.locator("button.btn-primary");
  const copy = page.getByRole("button", { name: "出力結果をクリップボードにコピー" });
  const source = '[{"name":"田中"},{"email":"taro@example.com"},{"active":false}]';
  await input.fill(source);
  for (let i = 0; i < 2; i++) {
    await convert.click();
    await expect(output).toHaveValue("name,email,active\n田中,,\n,taro@example.com,\n,,false");
    await expect(input).toHaveValue(source);
  }
  await page.screenshot({ path: "test-results/csv-json-sparse.png", fullPage: true });

  await input.fill('[{"name":"田中"},null]');
  await convert.click();
  await expect(page.locator(".toast").last()).toContainText("JSONのレコード 2");
  await expect(output).toHaveValue("");
  await expect(copy).toBeDisabled();
  await expect(input).toHaveValue('[{"name":"田中"},null]');

  await input.fill(JSON.stringify([{}, { note: "前\n後" }]));
  await convert.click();
  await expect(output).toHaveValue('note\n""\n"前\n後"');
  await expect(copy).toBeEnabled();
});

for (const delimiter of [",", "\t", ";"]) {
  test(`CSV duplicate headers and surplus cells recover without headers: ${JSON.stringify(delimiter)}`, async ({
    page,
  }) => {
    await page.locator("#delimiter").selectOption(delimiter);
    const input = page.locator("#inputText");
    const output = page.locator("#outputText");
    const convert = page.locator("button.btn-primary");
    const header = page.getByRole("checkbox", { name: "1行目をヘッダー行として扱う" });
    for (const csv of [
      `name${delimiter}name\n前${delimiter}後`,
      `name\n"前\n後"${delimiter}追加`,
    ]) {
      await header.check();
      await input.fill(csv);
      await convert.click();
      await expect(page.locator(".toast").last()).toContainText("ヘッダーなしで変換してください");
      await expect(output).toHaveValue("");
      await expect(
        page.getByRole("button", { name: "出力結果をクリップボードにコピー" }),
      ).toBeDisabled();
      await expect(input).toHaveValue(csv);
      if (delimiter === "," && csv.startsWith("name\n")) {
        await page.screenshot({ path: "test-results/csv-json-column-error.png", fullPage: true });
      }
      await header.uncheck();
      await convert.click();
      expect(JSON.parse(await output.inputValue())).toEqual(
        csv.startsWith(`name${delimiter}`)
          ? [
              ["name", "name"],
              ["前", "後"],
            ]
          : [["name"], ["前\n後", "追加"]],
      );
    }
  });
}

test("empty array rows fail explicitly, then clear and mode changes remain usable on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("radio", { name: "JSON から CSV へ変換" }).check();
  const input = page.locator("#inputText");
  const output = page.locator("#outputText");
  await input.fill('[["前"],[]]');
  await page.locator("button.btn-primary").click();
  await expect(page.locator(".toast").last()).toContainText("JSONのレコード 2 は空の配列");
  await expect(output).toHaveValue("");
  await input.fill('[["前"],[""]]');
  await page.locator("button.btn-primary").click();
  await expect(output).toHaveValue('前\n""');
  await page.getByRole("button", { name: "入力と出力をクリア" }).click();
  await expect(input).toHaveValue("");
  await expect(output).toHaveValue("");
  await expect(input).toBeFocused();
  await page.getByRole("radio", { name: "CSV から JSON へ変換" }).check();
  await input.fill("name\n田中");
  await page.locator("button.btn-primary").click();
  expect(JSON.parse(await output.inputValue())).toEqual([{ name: "田中" }]);
  await page.screenshot({ path: "test-results/csv-json-mobile.png", fullPage: true });
});
