import { test, expect, type Page } from "@playwright/test";

const externalRequests = new WeakMap<Page, string[]>();
const pageErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const attempts: string[] = [];
  const errors: string[] = [];
  externalRequests.set(page, attempts);
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== "http://127.0.0.1:4195") {
      attempts.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
});
test.afterEach(async ({ page }) => {
  expect(externalRequests.get(page)).toEqual([]);
  expect(pageErrors.get(page)).toEqual([]);
});

function convertButton(page: Page, mode: "encode" | "decode") {
  return page.getByRole("button", {
    name: mode === "encode" ? "入力テキストをURLエンコード" : "URLエンコードされた文字列をデコード",
    exact: true,
  });
}
async function enterCodeUnits(page: Page, units: number[]) {
  await page.locator("#inputText").evaluate((element, values) => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
      element,
      String.fromCharCode(...values),
    );
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, units);
  await expect.poll(() => readCodeUnits(page)).toEqual(units);
}
async function readCodeUnits(page: Page) {
  return page.locator("#inputText").evaluate((element) => {
    const value = (element as HTMLTextAreaElement).value;
    return Array.from({ length: value.length }, (_, index) => value.charCodeAt(index));
  });
}
async function assertError(page: Page, message: string) {
  await expect(page.locator("#outputText")).toHaveValue("");
  const toast = page.locator(".toast-error");
  await expect(toast).toHaveCount(1);
  await expect(toast).toContainText(message);
  await expect(page.locator(".tool-container")).toHaveCSS("opacity", "1");
  await expect(toast).toHaveCSS("opacity", "1");
  await expect(toast).toHaveCSS("transform", "none");
  await expect(toast).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}
async function repairAndClear(page: Page, mode: "encode" | "decode") {
  const input = page.locator("#inputText");
  const output = page.locator("#outputText");
  await input.fill(mode === "encode" ? "修正済み 😀" : "new%20value");
  await convertButton(page, mode).click();
  await expect(output).toHaveValue(
    mode === "encode" ? encodeURIComponent("修正済み 😀") : "new value",
  );
  await page.getByRole("button", { name: "入力と出力をクリア", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(output).toHaveValue("");
  await expect(input).toBeFocused();
}

for (const width of [1280, 390]) {
  test.describe(`URL recovery at width ${width}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto("/url-encode");
      await expect(page.locator("#inputText")).toBeVisible();
      await expect(page.locator(".toast-error")).toHaveCount(0);
    });

    for (const value of ["%ZZ", "%E3%81", "%"]) {
      test(`decode preserves ${value} and clears old output before repair`, async ({ page }) => {
        const input = page.locator("#inputText");
        await input.fill("old%20value");
        await convertButton(page, "decode").click();
        await expect(page.locator("#outputText")).toHaveValue("old value");
        await input.fill(value);
        await convertButton(page, "decode").click();
        await expect(input).toHaveValue(value);
        await assertError(page, "無効なURLエンコード文字列です");
        if (value === "%E3%81")
          await page.screenshot({
            path: `test-results/url-decode-error-${width}.png`,
            fullPage: true,
          });
        await repairAndClear(page, "decode");
      });
    }
    for (const units of [[0xd800], [0xdc00], [0x41, 0xd800, 0x42]]) {
      test(`encode preserves units ${units.join("-")} after failure`, async ({ page }) => {
        await page.locator("#inputText").fill("old value");
        await convertButton(page, "encode").click();
        await expect(page.locator("#outputText")).toHaveValue("old%20value");
        await enterCodeUnits(page, units);
        await convertButton(page, "encode").click();
        await expect.poll(() => readCodeUnits(page)).toEqual(units);
        await assertError(page, "エンコードに失敗しました");
        if (units.length === 1 && units[0] === 0xd800)
          await page.screenshot({
            path: `test-results/url-encode-error-${width}.png`,
            fullPage: true,
          });
        await repairAndClear(page, "encode");
      });
    }
    for (const mode of ["encode", "decode"] as const) {
      test(`empty ${mode} attempt clears old output and focuses input`, async ({ page }) => {
        const input = page.locator("#inputText");
        await input.fill(mode === "encode" ? "old value" : "old%20value");
        await convertButton(page, mode).click();
        await expect(page.locator("#outputText")).not.toHaveValue("");
        await input.fill("");
        await convertButton(page, mode).click();
        await expect(input).toHaveValue("");
        await expect(input).toBeFocused();
        await assertError(page, "テキストを入力してください");
        await repairAndClear(page, mode);
      });
    }
  });
}
