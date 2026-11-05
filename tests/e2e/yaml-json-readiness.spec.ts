import { test, expect } from "../browser/csv-json/url-app-test";

for (const width of [1280, 390]) {
  test(`YAML first offered Convert is not lost while scripts load at ${width}px`, async ({
    page,
    baseURL,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const origin = new URL(baseURL!).origin;
    let releaseScripts!: () => void;
    const released = new Promise<void>((resolve) => {
      releaseScripts = resolve;
    });
    let heldScripts = 0;
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (new URL(request.url()).origin === origin && request.resourceType() === "script") {
        heldScripts++;
        await released;
      }
      await route.fallback();
    });
    const input = page.locator("#inputText");
    const output = page.locator("#outputText");
    const convert = page.getByRole("button", { name: "YAML → JSON 変換", exact: true });
    const early = "user:\n  name: first";
    let offeredBeforeScripts = false;
    try {
      await page.goto("/yaml-json", { waitUntil: "commit" });
      await expect(input).toBeVisible();
      await expect.poll(() => heldScripts).toBeGreaterThan(0);
      await input.fill(early);
      await expect(input).toHaveValue(early);
      offeredBeforeScripts = await convert.isEnabled();
      if (offeredBeforeScripts) {
        // Exactly one offered action: do not retry this click after hydration.
        await convert.click();
      } else {
        await expect(convert).toBeDisabled();
      }
      // The route's mount focus must establish hydration, not test-driven input focus.
      await output.focus();
      await expect(input).not.toBeFocused();
    } finally {
      releaseScripts();
    }
    await expect(input).toBeFocused();
    await expect(input).toHaveValue(early);
    if (!offeredBeforeScripts) {
      await expect(convert).toBeEnabled();
      await convert.click();
    }
    await testInfo.attach("first-offered-convert.json", {
      contentType: "application/json",
      body: Buffer.from(
        JSON.stringify({
          width,
          heldScripts,
          offeredBeforeScripts,
          input: await input.inputValue(),
          output: await output.inputValue(),
        }),
      ),
    });
    await expect(output).toHaveValue(JSON.stringify({ user: { name: "first" } }, null, 2));
    await expect(page.locator("#input-error")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "出力結果をクリップボードにコピー", exact: true }),
    ).toBeEnabled();
  });
}
