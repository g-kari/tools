import { test, expect } from "../browser/csv-json/url-app-test";

/** Keep actual SSR controls editable while withholding all local application scripts. */
for (const width of [1280, 390]) {
  for (const rerender of [false, true]) {
    test(`YAML early input survives hydration${rerender ? " and option change" : ""} at ${width}px`, async ({
      page,
      baseURL,
    }, testInfo) => {
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
      let heldScripts = 0;
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (new URL(request.url()).origin === origin && request.resourceType() === "script") {
          heldScripts++;
          firstScript();
          await released;
        }
        await route.fallback();
      });

      const input = page.locator("#inputText");
      const output = page.locator("#outputText");
      const early = "name: 早い入力\ncount: 7";
      try {
        await page.goto("/yaml-json", { waitUntil: "commit" });
        await expect(input).toBeVisible();
        await scriptRequested;
        expect(heldScripts).toBeGreaterThan(0);
        await input.fill(early);
        await expect(input).toHaveValue(early);
        // Move native focus away, so only the route's mount effect can grant readiness.
        await page.keyboard.press("Tab");
        await expect(
          page.getByRole("button", { name: "YAML → JSON 変換", exact: true }),
        ).toBeFocused();
      } finally {
        releaseScripts();
      }
      await expect(input).toBeFocused();
      await expect(input).toHaveValue(early);
      if (rerender) {
        await page.getByRole("radio", { name: "インデント4スペース", exact: true }).check();
      }
      await page.getByRole("button", { name: "YAML → JSON 変換", exact: true }).click();
      await testInfo.attach("early-input-state.json", {
        contentType: "application/json",
        body: Buffer.from(
          JSON.stringify({
            width,
            rerender,
            heldScripts,
            expectedInput: early,
            actualInput: await input.inputValue(),
            actualOutput: await output.inputValue(),
            error: await page.evaluate(
              () => document.querySelector("#input-error-detail")?.textContent ?? null,
            ),
          }),
        ),
      });
      await expect(input).toHaveValue(early);
      await expect(page.locator('[role="alert"][aria-label="変換エラー"]')).toHaveCount(0);
      await expect(output).toHaveValue(
        JSON.stringify({ name: "早い入力", count: 7 }, null, rerender ? 4 : 2),
      );
    });
  }
}
