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
  await input.fill("JSON");
  await expect(dialog.getByRole("option").nth(1)).toBeVisible();
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

test("Tab and Shift+Tab cycle inside search while background controls stay inert", async ({
  page,
}) => {
  const open = page.getByRole("button", { name: "ツールを検索（Ctrl+K）" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
  const input = dialog.getByRole("textbox");
  const links = dialog.locator(".search-result-item");
  await expect(page.locator("#root")).toHaveAttribute("inert", "");
  await expect(input).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(links.last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  const count = await links.count();
  for (let index = 0; index < count + 2; index++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await expect(input).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(open).toBeFocused();
  await expect(page.locator("#root")).not.toHaveAttribute("inert");
});

test("zero results and changing clear controls keep a live Tab cycle", async ({ page }) => {
  await page.getByRole("button", { name: "ツールを検索（Ctrl+K）" }).click();
  const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
  const input = dialog.getByRole("textbox");
  const close = dialog.getByRole("button", { name: "検索を閉じる", exact: true });
  await input.fill("xyz-absent JSON");
  await expect(dialog.locator(".search-result-item")).toHaveCount(0);
  await input.press("Tab");
  await expect(dialog.getByRole("button", { name: "検索をクリア" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();
  await input.fill("JSON");
  await input.press("Tab");
  await expect(dialog.getByRole("button", { name: "検索をクリア" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("navigation")).toHaveText("/top");
  await expect(dialog.getByRole("option")).toHaveCount(8);
  await input.press("Tab");
  await expect(close).toBeFocused();
});

for (const control of ["input", "clear", "close", "link"]) {
  test(`Escape from ${control} restores the opener`, async ({ page }) => {
    const open = page.getByRole("button", { name: "ツールを検索（Ctrl+K）" });
    await open.click();
    const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
    const input = dialog.getByRole("textbox");
    await input.fill("JSON");
    const target =
      control === "input"
        ? input
        : control === "clear"
          ? dialog.getByRole("button", { name: "検索をクリア" })
          : control === "close"
            ? dialog.getByRole("button", { name: "検索を閉じる", exact: true })
            : dialog.locator(".search-result-item").nth(1);
    await target.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(open).toBeFocused();
  });
}

test("shortcut toggle restores the source input, selection and background scrolling", async ({
  page,
}) => {
  const source = page.locator("#tool-search");
  await source.fill("JSON 圧縮");
  await source.evaluate((element: HTMLInputElement) => element.setSelectionRange(1, 4));
  await source.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
  await expect(dialog.getByRole("textbox")).toBeFocused();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Control+k");
  await expect(dialog).toHaveCount(0);
  await expect(source).toBeFocused();
  await expect(source).toHaveValue("JSON 圧縮");
  expect(
    await source.evaluate((element: HTMLInputElement) => [
      element.selectionStart,
      element.selectionEnd,
    ]),
  ).toEqual([1, 4]);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("focused result Enter opens that link and leaves destination focus intact through Back", async ({
  page,
}) => {
  const open = page.getByRole("button", { name: "ツールを検索（Ctrl+K）" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
  const input = dialog.getByRole("textbox");
  await input.fill("JSON");
  const links = dialog.locator(".search-result-item");
  const chosen = await links.nth(1).getAttribute("href");
  await input.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(links.nth(1)).toBeFocused();
  await expect(input).toHaveAttribute("aria-activedescendant", "search-result-1");
  await page.keyboard.press("Enter");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId("navigation")).toHaveText(chosen!);
  await expect(page.getByRole("textbox", { name: "移動先の入力" })).toBeFocused();
  // The fixture uses memory history, so its own Back control owns this transition.
  await page.getByTestId("history-back").click();
  await expect(page.getByTestId("navigation")).toHaveText("/top");
  await expect(dialog).toHaveCount(0);
  await open.click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(dialog.getByRole("option")).toHaveCount(8);
});

test("route changes while open dismiss search and release the old background", async ({ page }) => {
  await page.getByRole("button", { name: "ツールを検索（Ctrl+K）" }).click();
  let dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
  await dialog.getByRole("textbox").fill("変換 /url-encode");
  await dialog.getByRole("textbox").press("Enter");
  const destination = page.getByRole("textbox", { name: "移動先の入力" });
  await expect(destination).toBeFocused();
  await destination.press("Control+k");
  dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
  await expect(dialog).toBeVisible();
  // Simulate a history transition independently of the inert background's controls.
  await page.getByTestId("history-back").evaluate((element: HTMLButtonElement) => element.click());
  await expect(page.getByTestId("navigation")).toHaveText("/top");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("#root")).not.toHaveAttribute("inert");
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await page.locator("#tool-search").fill("JSON 圧縮");
});

test("visible close and backdrop cancellation survive repeated reopening", async ({ page }) => {
  const open = page.getByRole("button", { name: "ツールを検索（Ctrl+K）" });
  for (let count = 0; count < 3; count++) {
    await open.click();
    const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
    const input = dialog.getByRole("textbox");
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("");
    await input.fill("JSON 圧縮");
    if (count === 1) {
      await page.locator(".search-modal-overlay").click({ position: { x: 1, y: 1 } });
    } else {
      await dialog.getByRole("button", { name: "検索を閉じる", exact: true }).press("Enter");
    }
    await expect(dialog).toHaveCount(0);
    await expect(open).toBeFocused();
  }
});

test("search keyboard input leaves the actual background game unchanged", async ({ page }) => {
  await page.locator('.top-tool-card[href="/minesweeper"]').click();
  await page.getByRole("button", { name: "ゲームスタート", exact: true }).click();
  const board = page.getByRole("grid", { name: "マインスイーパーボード" });
  const first = board.getByRole("gridcell").first();
  await first.focus();
  await expect(first).toHaveClass(/selected/);
  const before = await board.innerHTML();
  await first.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "ツール検索", exact: true });
  const input = dialog.getByRole("textbox");
  await input.pressSequentially("f ");
  await input.press("ArrowDown");
  await input.press("ArrowRight");
  await dialog.getByRole("button", { name: "検索をクリア" }).press("Enter");
  await expect(dialog).toBeVisible();
  await input.press("Space");
  await expect(input).toHaveValue(" ");
  expect(await board.innerHTML()).toBe(before);
  await input.press("Escape");
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(board.getByRole("gridcell").nth(1)).toHaveClass(/selected/);
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
    animations: "disabled",
  });
  await page.getByRole("button", { name: "ツールを検索（Ctrl+K）" }).click();
  await page.getByRole("dialog").getByRole("textbox").fill("JSON 圧縮");
  await page.screenshot({
    path: `test-results/catalog-modal-${testInfo.project.name}.png`,
    animations: "disabled",
  });
});
