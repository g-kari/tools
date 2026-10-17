import { test, expect, type Page } from "@playwright/test";
import { assertYamlJsonRecovery, yamlJsonFailures } from "./yaml-json-recovery-assertions";

type CopyProbeWindow = Window & { yamlJsonWrites: string[] };
const externalRequests = new WeakMap<Page, string[]>();
const pageErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const attempts: string[] = [];
  const errors: string[] = [];
  externalRequests.set(page, attempts);
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    const origin = new URL(route.request().url()).origin;
    if (origin !== "http://127.0.0.1:4195") {
      attempts.push(origin);
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
});

test.afterEach(async ({ page }) => {
  expect(externalRequests.get(page)).toEqual([]);
  expect(pageErrors.get(page)).toEqual([]);
});

for (const width of [1280, 390]) {
  test.describe(`YAML/JSON recovery at ${width}px`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 900 } });
    for (const [index, failure] of yamlJsonFailures.entries()) {
      test(`recovery ${index + 1}: ${failure.mode}`, async ({ page }, testInfo) => {
        await assertYamlJsonRecovery(page, failure, testInfo, "yaml-json-component-error");
      });
    }

    test("mode, indent and Copy recover", async ({ page }) => {
      await page.goto("/yaml-json");
      // Observe the Clipboard API boundary without changing permissions or the shared hook.
      await page.evaluate(() => {
        const writes: string[] = [];
        (window as unknown as CopyProbeWindow).yamlJsonWrites = writes;
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (text: string) => {
              writes.push(text);
            },
          },
        });
      });
      const writes = () =>
        page.evaluate(() => (window as unknown as CopyProbeWindow).yamlJsonWrites);
      const input = page.locator("#inputText");
      const output = page.locator("#outputText");
      const copy = page.getByRole("button", { name: "出力結果をクリップボードにコピー" });
      const convert = page.locator("button.btn-primary");
      const error = page.getByRole("alert", { name: "変換エラー", exact: true });
      await input.fill("user:\n  name: first");
      await convert.click();
      const first = await output.inputValue();
      await copy.click();
      await expect(copy).toHaveText("コピー済");
      expect(await writes()).toEqual([first]);
      await page.getByRole("radio", { name: "インデント4スペース" }).check();
      await expect(output).toHaveValue(first);
      await convert.click();
      await expect(output).toHaveValue('{\n    "user": {\n        "name": "first"\n    }\n}');

      await input.fill("name: [");
      await convert.click();
      await expect(copy).toBeDisabled();
      await expect(copy).toHaveText("コピー");
      await copy.evaluate((button: HTMLButtonElement) => button.click());
      expect(await writes()).toEqual([first]);
      await page.getByRole("radio", { name: "JSON から YAML へ変換" }).check();
      await expect(input).toHaveValue("");
      await expect(output).toHaveValue("");
      await expect(error).toHaveCount(0);
      await expect(copy).toBeDisabled();
      await input.fill('{"user":{"name":"repaired"}}');
      await convert.click();
      await expect(output).toHaveValue("user:\n  name: repaired\n");
      await copy.click();
      expect(await writes()).toEqual([first, "user:\n  name: repaired\n"]);
      await page.getByRole("radio", { name: "YAML から JSON へ変換" }).check();
      await expect(output).toHaveValue("");
      await expect(copy).toBeDisabled();
      await expect(page.getByRole("radio", { name: "インデント4スペース" })).toBeChecked();
    });
  });
}
