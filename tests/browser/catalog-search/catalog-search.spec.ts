import { test, expect, type Page } from "@playwright/test";

const externalRequests = new WeakMap<Page, string[]>();
const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const attempts: string[] = [];
  const errors: string[] = [];
  externalRequests.set(page, attempts);
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== "http://127.0.0.1:4196") {
      attempts.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/");
  await expect(page.locator("#tool-search")).toBeVisible();
});
test.afterEach(async ({ page }) => {
  expect(externalRequests.get(page)).toEqual([]);
  expect(runtimeErrors.get(page)).toEqual([]);
});

for (const query of ["JSON 圧縮", "圧縮 json", " ＪＳＯＮ　圧縮 "]) {
  test(`catalog matches multiple words: ${query}`, async ({ page }) => {
    await page.locator("#tool-search").fill(query);
    await expect(page.locator('.top-tool-card[href="/json"]')).toBeVisible();
    await expect(page.locator('.top-tool-card[href="/uuid"]')).toHaveCount(0);
    await expect(
      page.getByRole("status").filter({ hasText: "件のツールが見つかりました" }),
    ).toBeVisible();
  });
}

test("category, path and half-width kana queries find existing tools", async ({ page }) => {
  const input = page.locator("#tool-search");
  await input.fill("変換 /url-encode");
  await expect(page.locator(".top-tool-card")).toHaveCount(1);
  await expect(page.locator(".top-tool-card")).toHaveAttribute("href", "/url-encode");
  await input.fill("ﾊﾟｽﾜｰﾄﾞ 生成");
  await expect(page.locator('.top-tool-card[href="/password-generator"]')).toBeVisible();
});

test("clear by keyboard returns focus and restores the full catalog", async ({ page }) => {
  const input = page.locator("#tool-search");
  const initial = await page.locator(".top-tool-card").count();
  expect(initial).toBeGreaterThan(200);
  await input.fill("JSON 圧縮");
  await input.press("Tab");
  await expect(page.locator(".top-search-clear")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(page.locator(".top-tool-card")).toHaveCount(initial);
  await expect(page.locator(".top-search-clear")).toHaveCount(0);
});

test("zero results and literal punctuation recover through either clear button", async ({
  page,
}) => {
  const input = page.locator("#tool-search");
  for (const query of ["JSON xxx-absent", ".*"]) {
    await input.fill(query);
    await expect(page.locator(".top-no-results")).toBeVisible();
    await expect(page.locator(".top-tool-card")).toHaveCount(0);
    await page.locator(".top-no-results button").click();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
  }
});

test("catalog and shortcut modal share the same ordered matches and preserve caps", async ({
  page,
}) => {
  for (const query of ["JSON 圧縮", "変換 /url-encode", "ﾊﾟｽﾜｰﾄﾞ", "生成"]) {
    await page.locator("#tool-search").fill(query);
    const paths = await page
      .locator(".top-tool-card")
      .evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
    const input = dialog.getByRole("textbox");
    await expect(input).toBeFocused();
    await input.fill(query);
    await expect(dialog.locator(".search-result-item")).toHaveCount(Math.min(12, paths.length));
    expect(
      await dialog
        .locator(".search-result-item")
        .evaluateAll((elements) => elements.map((element) => element.getAttribute("href"))),
    ).toEqual(paths.slice(0, 12));
    await input.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});

test("ordinary arrow selection and Enter still navigate to the chosen result", async ({ page }) => {
  await page.getByRole("button", { name: "ツールを検索（Ctrl+K）" }).click();
  const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
  const input = dialog.getByRole("textbox");
  await input.fill("JSON 圧縮");
  const paths = await dialog
    .locator(".search-result-item")
    .evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));
  expect(paths.length).toBeGreaterThan(1);
  await input.press("ArrowDown");
  await expect(input).toHaveAttribute("aria-activedescendant", "search-result-1");
  await input.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId("navigation")).toHaveText(paths[1]!);
});

test("IME-confirming keys leave navigation, selected result and dismissal untouched", async ({
  page,
}) => {
  await page.getByRole("button", { name: "ツールを検索（Ctrl+K）" }).click();
  const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
  const input = dialog.getByRole("textbox");
  await input.fill("変換 /url-encode");
  for (const options of [
    { key: "Enter", isComposing: true },
    { key: "ArrowDown", isComposing: true },
    { key: "Escape", isComposing: true },
    { key: "Enter", keyCode: 229 },
  ]) {
    const prevented = await input.evaluate((element, eventOptions) => {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ...eventOptions,
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    }, options);
    expect(prevented).toBe(false);
    await expect(dialog).toBeVisible();
    await expect(input).toHaveAttribute("aria-activedescendant", "search-result-0");
    await expect(page.getByTestId("navigation")).toHaveText("/top");
  }
  await input.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId("navigation")).toHaveText("/url-encode");
});

test("modal clear, empty results, dismissal and reopening retain existing defaults", async ({
  page,
}) => {
  const open = page.getByRole("button", { name: "ツールを検索（Ctrl+K）" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
  const input = dialog.getByRole("textbox");
  await expect(dialog.getByRole("option")).toHaveCount(8);
  await input.fill("xxx-absent JSON");
  await expect(dialog.getByRole("option")).toHaveCount(0);
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(dialog).toBeVisible();
  await input.fill(" ＪＳＯＮ　圧縮 ");
  await expect(dialog.locator('.search-result-item[href="/json"]')).toBeVisible();
  await dialog.getByRole("button", { name: "検索をクリア" }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(dialog.getByRole("option")).toHaveCount(8);
  await page.locator(".search-modal-overlay").click({ position: { x: 1, y: 1 } });
  await expect(dialog).toHaveCount(0);
  await open.click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(dialog.getByRole("option")).toHaveCount(8);
});

test("search hint and filtered results stay readable at both viewport widths", async ({
  page,
}, testInfo) => {
  await page.locator("#tool-search").fill("JSON 圧縮");
  await expect(page.locator("#tool-search-help")).toBeVisible();
  await expect(page.locator("#tool-search")).toHaveAttribute(
    "aria-describedby",
    "tool-search-help",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: `test-results/catalog-search-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "ツールを検索（Ctrl+K）" }).click();
  await page.getByRole("dialog").getByRole("textbox").fill("JSON 圧縮");
  await page.screenshot({ path: `test-results/catalog-modal-${testInfo.project.name}.png` });
});
