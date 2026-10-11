import { expect, test } from "@playwright/test";

/** Share real-component assertions between the isolated and full-app browser tests. */
export function registerJsonFlattenCollisionTests() {
  test.describe("JSON Flatten collision recovery", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/json-flatten");
    });

    test("clears collision output, preserves input, and recovers with a different delimiter", async ({
      page,
    }) => {
      const input = page.locator("#inputText");
      const output = page.locator("#outputText");
      const convert = page.getByRole("button", { name: "JSONをフラット化", exact: true });
      const copy = page.getByRole("button", { name: "出力をクリップボードにコピー", exact: true });
      const error = page.locator(".error-message");
      await input.fill('{"a":{"b":1}}');
      await convert.click();
      await expect(output).toHaveValue('{\n  "a.b": 1\n}');
      await expect(copy).toBeVisible();

      const source = '{"a.b":1,"a":{"b":2}}';
      await input.fill(source);
      await convert.click();
      await convert.click();
      await expect(error).toContainText("衝突");
      await expect(error).toContainText("a.b");
      await expect(output).toHaveValue("");
      await expect(copy).toHaveCount(0);
      await expect(input).toHaveValue(source);

      await page.locator("#delimiter").selectOption("__");
      const customSource = '{"a__b":1,"a":{"b":2}}';
      await input.fill(customSource);
      await convert.click();
      await expect(error).toContainText("a__b");
      await expect(output).toHaveValue("");
      await expect(input).toHaveValue(customSource);

      await page.locator("#delimiter").selectOption("/");
      await input.press("Control+Enter");
      await expect(output).toHaveValue('{\n  "a__b": 1,\n  "a/b": 2\n}');
      await expect(error).toHaveCount(0);
      await expect(copy).toBeVisible();
      await expect(input).toHaveValue(customSource);
    });

    test("rejects both prefix-conflict orders and restores literal own members", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "アンフラット化", exact: true }).click();
      const input = page.locator("#inputText");
      const output = page.locator("#outputText");
      const convert = page.getByRole("button", { name: "JSONをアンフラット化", exact: true });
      const copy = page.getByRole("button", { name: "出力をクリップボードにコピー", exact: true });
      const error = page.locator(".error-message");
      for (const source of ['{"a.b":1,"a":2}', '{"a":2,"a.b":1}']) {
        await input.fill('{"a.b":1}');
        await convert.click();
        await expect(output).not.toHaveValue("");
        await input.fill(source);
        await convert.click();
        await expect(error).toContainText("衝突");
        await expect(error).toContainText("a.b");
        await expect(output).toHaveValue("");
        await expect(copy).toHaveCount(0);
        await expect(input).toHaveValue(source);
      }

      const source =
        '{"__proto__.name":"own","constructor.name":"literal","tags.0":"a","tags.1":"b"}';
      await input.fill(source);
      await input.press("Control+Enter");
      await expect(error).toHaveCount(0);
      const restored = JSON.parse(await output.inputValue());
      expect(Object.hasOwn(restored, "__proto__")).toBe(true);
      expect(restored.__proto__).toEqual({ name: "own" });
      expect(restored.constructor).toEqual({ name: "literal" });
      expect(restored.tags).toEqual(["a", "b"]);
      await expect(copy).toBeVisible();
      await expect(input).toHaveValue(source);
    });
  });
}
