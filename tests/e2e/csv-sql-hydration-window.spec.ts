import { test, expect } from "../browser/csv-json/url-app-test";

/**
 * Diagnostic candidate, not published or runtime-validated.
 * Exercise the narrow interval after React installs document-root event handlers,
 * before its first scheduled hydration task. The original 26 cases stay unchanged.
 * selectionchange is a React 18 phase heuristic, not a root identity proof. This
 * synthetic InputEvent has isTrusted=false and is not a production reproduction.
 */
for (const width of [1280, 390]) {
  test(`CSV SQL first native input during root hydration at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      const early = "id,name\n1,alpha";
      const state = { armed: false, triggered: 0, inputBefore: "", inputAfter: "" };
      Object.defineProperty(window, "__csvSqlHydrationWindow", { value: state });
      const original = document.addEventListener;
      document.addEventListener = new Proxy(original, {
        apply(target, thisArg, args) {
          const result = Reflect.apply(target, thisArg, args);
          // React 18 installs selectionchange last on the owner document. This is a
          // deliberate phase probe, not an assumption that network load means ready.
          if (thisArg !== document || args[0] !== "selectionchange" || state.armed) return result;
          state.armed = true;
          document.addEventListener = original;
          queueMicrotask(() => {
            const input = document.querySelector<HTMLTextAreaElement>("#csv-sql-input");
            const setValue = Object.getOwnPropertyDescriptor(
              HTMLTextAreaElement.prototype,
              "value",
            )?.set;
            if (!input || !setValue) return;
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
    await page.goto("/csv-sql");
    // A missing probe phase is diagnosed separately from a missing SQL result.
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, "__csvSqlHydrationWindow")), {
        timeout: 5000,
        message: "diagnostic root-listener phase must fire exactly once",
      })
      .toEqual({
        armed: true,
        triggered: 1,
        inputBefore: "",
        inputAfter: "id,name\n1,alpha",
      });
    const input = page.getByLabel("CSV入力", { exact: true });
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
