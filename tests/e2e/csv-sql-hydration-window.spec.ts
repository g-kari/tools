import { test, expect } from "../browser/csv-json/url-app-test";

test.afterEach(async ({ page }, testInfo) => {
  let observations: unknown;
  let missing: string | undefined;
  try {
    if (page.isClosed()) throw new Error("Diagnostic page closed before observation");
    observations = await page.evaluate(() => ({
      phase: Reflect.get(window, "__csvSqlHydrationWindow"),
      observations: Reflect.get(window, "__csvSqlHydrationObservations"),
    }));
  } catch (error) {
    missing = String(error).slice(0, 1024);
    observations = { missing: true, reason: missing };
  }
  await testInfo.attach("phase-observations.json", {
    contentType: "application/json",
    body: Buffer.from(JSON.stringify(observations)),
  });
  // Preserve an existing assertion/timeout failure. Missing diagnostic evidence
  // must still fail an otherwise passing test rather than silently turn green.
  if (missing && testInfo.status === "passed") {
    throw new Error(`Diagnostic observations missing: ${missing}`);
  }
});

/**
 * Diagnostic candidate, not published or runtime-validated.
 * Exercise the narrow interval after React installs document-root event handlers,
 * before its first scheduled hydration task. The original 26 cases stay unchanged.
 * Document input capture is a phase heuristic, not a root identity proof. This
 * synthetic InputEvent has isTrusted=false and is not a production reproduction.
 */
for (const width of [1280, 390]) {
  test(`CSV SQL first native input during root hydration at ${width}px`, async ({ page, baseURL }) => {
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
    await page.addInitScript(() => {
      const early = "id,name\n1,alpha";
      const state = {
        enabled: false,
        armed: false,
        triggered: 0,
        inputBefore: "",
        inputAfter: "",
      };
      const observations: unknown[] = [];
      Object.defineProperty(window, "__csvSqlHydrationWindow", { value: state });
      Object.defineProperty(window, "__csvSqlHydrationObservations", { value: observations });
      const original = document.addEventListener;
      document.addEventListener = new Proxy(original, {
        apply(target, thisArg, args) {
          const result = Reflect.apply(target, thisArg, args);
          // React 18 installs input capture on the document root synchronously.
          // A microtask runs after the registration stack, not during that loop.
          // selectionchange is skipped for a document root by its dedup marker.
          if (!state.enabled || thisArg !== document || args[0] !== "input" || args[2] !== true || state.armed) {
            return result;
          }
          observations.push({
            point: "registration",
            url: location.href,
            readyState: document.readyState,
            body: !!document.body,
            inputPresent: !!document.querySelector("#csv-sql-input"),
            stack: new Error().stack?.slice(0, 2048),
          });
          state.armed = true;
          document.addEventListener = original;
          queueMicrotask(() => {
            const input = document.querySelector<HTMLTextAreaElement>("#csv-sql-input");
            const setValue = Object.getOwnPropertyDescriptor(
              HTMLTextAreaElement.prototype,
              "value",
            )?.set;
            const style = input ? getComputedStyle(input) : undefined;
            const visible =
              !!input?.getClientRects().length &&
              style?.display !== "none" &&
              style?.visibility !== "hidden";
            const editable = !!input && !input.disabled && !input.readOnly;
            observations.push({
              point: "microtask",
              url: location.href,
              readyState: document.readyState,
              body: !!document.body,
              inputPresent: !!input,
              nativeSetter: !!setValue,
              visible,
              editable,
            });
            if (!input || !setValue || !visible || !editable) return;
            state.triggered++;
            state.inputBefore = input.value;
            // Match the focus-then-input sequence used by a first textarea fill.
            input.focus();
            // Use the native setter so a newly installed React value tracker cannot
            // turn this into a programmatic no-change event.
            setValue.call(input, early);
            input.dispatchEvent(
              new InputEvent("input", {
                bubbles: true,
                composed: true,
                inputType: "insertText",
                data: early,
              }),
            );
            state.inputAfter = input.value;
          });
          return result;
        },
      });
    });
    const input = page.getByLabel("CSV入力", { exact: true });
    try {
      await page.goto("/csv-sql", { waitUntil: "commit" });
      await expect(input).toBeVisible();
      await expect(input).toHaveValue("");
      await scriptRequested;
      expect(heldScripts).toBeGreaterThan(0);
      // Ignore any unrelated earlier registration. Only arm after the SSR field
      // exists and immediately before permitting first-party application scripts.
      await page.evaluate(() => {
        Reflect.get(window, "__csvSqlHydrationWindow").enabled = true;
      });
    } finally {
      releaseScripts();
    }
    await page.waitForLoadState("load");
    // A missing probe phase is diagnosed separately from a missing SQL result.
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, "__csvSqlHydrationWindow")), {
        timeout: 5000,
        message: "diagnostic root-listener phase must fire exactly once",
      })
      .toEqual({
        enabled: true,
        armed: true,
        triggered: 1,
        inputBefore: "",
        inputAfter: "id,name\n1,alpha",
      });
    const output = page.getByLabel("生成されたSQL INSERT文", { exact: true });
    await expect(input).toHaveValue("id,name\n1,alpha");
    await expect(output).toHaveValue(/\(1, 'alpha'\)/);
    await expect(page.getByLabel("生成結果の統計", { exact: true })).toContainText("1 行");
    await expect(page.getByRole("button", { name: "SQLをコピー", exact: true })).toBeEnabled();
    await input.fill("id,name\n2,later");
    await expect(output).toHaveValue(/\(2, 'later'\)/);
    await page.getByRole("button", { name: "入力をクリア", exact: true }).click();
    await expect(input).toHaveValue("");
    await expect(output).toHaveCount(0);
  });
}
