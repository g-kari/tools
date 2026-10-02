import { test, expect, type Page } from "@playwright/test";

const source = String.raw`{"id":9007199254740993,"v":1e400,"n":-0,"2":1,"1":2,"x":1,"x":2,"text":"\u0061 \\ \" ,:{}[]"}`;
const externalRequests = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const attempts: string[] = [];
  externalRequests.set(page, attempts);
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "http://127.0.0.1:4194") {
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

test("exact tokens survive repeated formatting, minification and keyboard shortcut", async ({
  page,
}) => {
  const input = page.getByRole("textbox", { name: "JSON入力欄", exact: true });
  const output = page.getByRole("textbox", { name: "変換結果の出力欄", exact: true });
  await input.fill(source);
  await input.press("Control+Enter");
  const formatted = await output.inputValue();
  expect(formatted).toContain("9007199254740993");
  expect(formatted).toContain("1e400");
  await expect(input).toHaveValue(source);
  await page.getByRole("button", { name: "JSONを整形（フォーマット）", exact: true }).click();
  await expect(output).toHaveValue(formatted);
  await input.fill(formatted);
  await expect(output).toHaveValue("");
  await page.getByRole("button", { name: "JSONを圧縮（ミニファイ）", exact: true }).click();
  await expect(output).toHaveValue(source);
  await expect(input).toHaveValue(formatted);
  await page.getByRole("button", { name: "JSONを圧縮（ミニファイ）", exact: true }).click();
  await expect(output).toHaveValue(source);
  await page.screenshot({ path: "test-results/json-lossless.png", fullPage: true });
});

test("input edits invalidate output; invalid and empty input recover without source mutation", async ({
  page,
}) => {
  const input = page.getByRole("textbox", { name: "JSON入力欄", exact: true });
  const output = page.getByRole("textbox", { name: "変換結果の出力欄", exact: true });
  for (const action of ["JSONを整形（フォーマット）", "JSONを圧縮（ミニファイ）"]) {
    await input.fill(source);
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(output).not.toHaveValue("");
    await input.fill('{"bad":1,}');
    await expect(output).toHaveValue("");
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(page.locator(".error-message")).toBeVisible();
    await expect(input).toHaveValue('{"bad":1,}');
    await expect(output).toHaveValue("");
    await input.fill(source);
    await expect(page.locator(".error-message")).toHaveCount(0);
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(output).not.toHaveValue("");
    await input.fill("");
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(output).toHaveValue("");
    await expect(input).toBeFocused();
  }
  await page.getByRole("button", { name: "入力と出力をクリア", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(output).toHaveValue("");
  await expect(page.locator(".error-message")).toHaveCount(0);
  await expect(input).toBeFocused();
});
