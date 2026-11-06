import { test, expect } from "../browser/csv-json/url-app-test";

for (const width of [1280, 390]) {
  test(`native early input, keyboard and navigation retain startup state at ${width}px`, async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const origin = new URL(baseURL!).origin;
    let releaseScripts!: () => void;
    let firstScript!: () => void;
    const released = new Promise<void>((resolve) => {
      releaseScripts = resolve;
    });
    const scriptRequested = new Promise<void>((resolve) => {
      firstScript = resolve;
    });
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (new URL(request.url()).origin === origin && request.resourceType() === "script") {
        firstScript();
        await released;
      }
      await route.fallback();
    });
    const input = page.getByLabel("CSV入力", { exact: true });
    try {
      await page.goto("/csv-sql", { waitUntil: "commit" });
      await expect(input).toBeVisible();
      await scriptRequested;
      // This is a native Playwright fill before application scripts, not the
      // synthetic microtask phase probe above. Do not fill again after release.
      await input.fill("id,name\n3,native");
      await expect(input).toBeFocused();
      await input.press("ArrowLeft");
      await expect(input).toHaveValue("id,name\n3,native");
    } finally {
      releaseScripts();
    }
    await page.waitForLoadState("load");
    const output = page.getByLabel("生成されたSQL INSERT文", { exact: true });
    await expect(output).toHaveValue(/\(3, 'native'\)/);
    await expect(input).toHaveValue("id,name\n3,native");
    await page.getByRole("button", { name: "入力をクリア", exact: true }).click();
    await expect(input).toHaveValue("");
    await expect(output).toHaveCount(0);
    await input.fill("id,name\n4,repeat");
    await expect(output).toHaveValue(/\(4, 'repeat'\)/);

    await page.evaluate(() => {
      Reflect.set(window, "__startupNavigationMarker", "same-document");
    });
    await page.getByRole("link", { name: "ツール一覧ホームへ", exact: true }).click();
    await expect(page).toHaveURL(/\/top$/);
    const category = page.getByRole("button", { name: "変換", exact: true });
    await category.focus();
    await category.press("Enter");
    await page.getByRole("menuitem", { name: "CSV→SQL変換", exact: true }).click();
    await expect(page).toHaveURL(/\/csv-sql$/);
    expect(await page.evaluate(() => Reflect.get(window, "__startupNavigationMarker"))).toBe(
      "same-document",
    );
    await expect(input).toHaveValue("");
    await input.fill("id,name\n5,navigated");
    await expect(output).toHaveValue(/\(5, 'navigated'\)/);
  });
}

test.describe("startup without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const width of [1280, 390]) {
    test(`SSR content and native input remain available at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/csv-sql");
      await expect(page.getByRole("heading", { name: "Web ツール集", exact: true })).toBeVisible();
      const input = page.getByLabel("CSV入力", { exact: true });
      await expect(input).toBeEditable();
      await input.fill("id,name\n6,no-js");
      await expect(input).toHaveValue("id,name\n6,no-js");
      await expect(page.getByLabel("生成されたSQL INSERT文", { exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "SQLをコピー", exact: true })).toBeDisabled();
    });
  }
});
