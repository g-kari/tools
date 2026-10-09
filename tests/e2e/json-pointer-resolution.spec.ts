import { expect, test } from "@playwright/test";

test.describe("JSON Pointer exact resolution", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/json-pointer");
    await page.getByRole("button", { name: "サンプルJSONを読み込む", exact: true }).click();
    await expect(page.locator("#jsonInput")).toHaveValue(/Sayings of the Century/);
  });

  test("rejects invalid array indices, clears stale output and recovers without losing input", async ({
    page,
  }) => {
    const source = '["first","second"]';
    const json = page.locator("#jsonInput");
    const pointer = page.locator("#pointerInput");
    const evaluate = page.getByRole("button", { name: "JSON Pointerを評価する", exact: true });
    const copy = page.getByRole("button", {
      name: "評価結果をクリップボードにコピーする",
      exact: true,
    });
    const output = page.locator(".json-pointer-result-pre");
    const error = page.locator(".error-message");
    await json.fill(source);
    await pointer.fill("/1");
    await evaluate.click();
    await expect(output).toHaveText('"second"');

    for (const invalid of ["/01", "/", "/+1", "/1.0", "/-"]) {
      await pointer.fill(invalid);
      await evaluate.click();
      await evaluate.click();
      await expect(error).toBeVisible();
      await expect(output).toHaveCount(0);
      await expect(copy).toBeDisabled();
      await expect(json).toHaveValue(source);
      await expect(pointer).toHaveValue(invalid);
    }

    await pointer.fill("/0");
    await pointer.press("Control+Enter");
    await expect(output).toHaveText('"first"');
    await expect(error).toHaveCount(0);
    await expect(copy).toBeEnabled();
    await expect(json).toHaveValue(source);
  });

  test("preserves actual special members while rejecting inherited keys and malformed escapes", async ({
    page,
  }) => {
    const json = page.locator("#jsonInput");
    const pointer = page.locator("#pointerInput");
    const evaluate = page.getByRole("button", { name: "JSON Pointerを評価する", exact: true });
    const output = page.locator(".json-pointer-result-pre");
    const error = page.locator(".error-message");
    await json.fill("{}");
    await pointer.fill("/constructor");
    await evaluate.click();
    await expect(error).toContainText("存在しません");

    const source = '{"a~2b":7,"__proto__":{"constructor":"own"},"":"empty"}';
    await json.fill(source);
    await pointer.fill("/a~2b");
    await evaluate.click();
    await expect(error).toContainText("エスケープ");
    await expect(output).toHaveCount(0);
    await pointer.fill("/a~02b");
    await evaluate.click();
    await expect(output).toHaveText("7");
    await expect(error).toHaveCount(0);

    await pointer.fill("/__proto__/constructor");
    await evaluate.click();
    await expect(output).toHaveText('"own"');
    await pointer.fill("/");
    await evaluate.click();
    await expect(output).toHaveText('"empty"');
    await expect(json).toHaveValue(source);
  });
});
