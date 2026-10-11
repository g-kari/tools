import { test, expect, type Page } from "@playwright/test";

test.describe("URL Encode/Decode - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/url-encode");
    // Wait for React hydration
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/URL/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Web ツール集");
  });

  test("should have input and output textareas", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");

    await expect(inputTextarea).toBeVisible();
    await expect(outputTextarea).toBeVisible();
  });

  test("should have all action buttons", async ({ page }) => {
    const encodeButton = page.locator("button.btn-primary").first();
    const decodeButton = page.locator("button.btn-secondary").first();
    const clearButton = page.locator("button.btn-clear");

    await expect(encodeButton).toBeVisible();
    await expect(decodeButton).toBeVisible();
    await expect(clearButton).toBeVisible();
  });

  test("should encode text to URL format", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill("こんにちは 世界");
    await encodeButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    expect(output).toContain("%");
    expect(output).not.toContain(" ");
  });

  test("should decode URL encoded text", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const decodeButton = page.locator("button.btn-secondary").first();

    await inputTextarea.fill("%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF");
    await decodeButton.click();

    // Wait for output to be populated
    await expect(outputTextarea).toHaveValue("こんにちは");
  });

  test("should clear both textareas", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();
    const clearButton = page.locator("button.btn-clear");

    await inputTextarea.fill("テスト");
    await encodeButton.click();

    // Wait for output to have content
    await expect(outputTextarea).not.toHaveValue("");

    // Click clear
    await clearButton.click();

    // Both should be empty
    await expect(inputTextarea).toHaveValue("");
    await expect(outputTextarea).toHaveValue("");
  });

  test("should show toast when encoding empty input", async ({ page }) => {
    const encodeButton = page.locator("button.btn-primary").first();

    await encodeButton.click();

    // Check for toast notification
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("テキストを入力してください");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    // Check for ARIA roles
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Check for skip link
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display usage instructions with %XX format", async ({ page }) => {
    const usageSection = page.locator(".info-box");
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain("%XX");
    expect(usageText).not.toContain("undefined");
  });

  test("should handle special characters correctly", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill("hello world!@#$%^&*()");
    await encodeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    // Space should be encoded as %20
    expect(output).toContain("%20");
  });

  for (const malformed of ["%ZZ", "%E3%81", "%"]) {
    test(`clears prior success after invalid decode ${malformed} and allows correction`, async ({
      page,
    }) => {
      const input = page.locator("#inputText");
      const output = page.locator("#outputText");
      const decode = page.getByRole("button", {
        name: "URLエンコードされた文字列をデコード",
        exact: true,
      });
      await input.fill("old%20value");
      await decode.click();
      await expect(output).toHaveValue("old value");
      await input.fill(malformed);
      await decode.click();
      await expect(input).toHaveValue(malformed);
      await expect(output).toHaveValue("");
      await expect(page.locator(".toast-error").last()).toContainText(
        "無効なURLエンコード文字列です",
      );
      await input.fill("new%20value");
      await decode.click();
      await expect(output).toHaveValue("new value");
    });
  }

  async function enterCodeUnits(page: Page, units: number[]) {
    const input = page.locator("#inputText");
    await input.evaluate((element, values) => {
      const textarea = element as HTMLTextAreaElement;
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
        textarea,
        String.fromCharCode(...values),
      );
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }, units);
    await expect
      .poll(() =>
        input.evaluate((element) => {
          const value = (element as HTMLTextAreaElement).value;
          return Array.from({ length: value.length }, (_, index) => value.charCodeAt(index));
        }),
      )
      .toEqual(units);
  }

  test("preserves malformed UTF16 input but clears previous encode output", async ({ page }) => {
    const input = page.locator("#inputText");
    const output = page.locator("#outputText");
    const encode = page.getByRole("button", { name: "入力テキストをURLエンコード", exact: true });
    for (const units of [[0xd800], [0xdc00], [0x41, 0xd800, 0x42]]) {
      await input.fill("old value");
      await encode.click();
      await expect(output).toHaveValue("old%20value");
      await enterCodeUnits(page, units);
      await encode.click();
      await expect(output).toHaveValue("");
      await expect(page.locator(".toast-error").last()).toContainText("エンコードに失敗しました");
      await expect
        .poll(() =>
          input.evaluate((element) => {
            const value = (element as HTMLTextAreaElement).value;
            return Array.from({ length: value.length }, (_, index) => value.charCodeAt(index));
          }),
        )
        .toEqual(units);
      await input.fill("fixed value");
      await encode.click();
      await expect(output).toHaveValue("fixed%20value");
    }
  });

  test("clears previous output when either conversion is attempted with empty input", async ({
    page,
  }) => {
    const input = page.locator("#inputText");
    const output = page.locator("#outputText");
    for (const mode of ["encode", "decode"] as const) {
      const button = page.getByRole("button", {
        name:
          mode === "encode" ? "入力テキストをURLエンコード" : "URLエンコードされた文字列をデコード",
        exact: true,
      });
      await input.fill(mode === "encode" ? "old value" : "old%20value");
      await button.click();
      await expect(output).not.toHaveValue("");
      await input.fill("");
      await button.click();
      await expect(output).toHaveValue("");
      await expect(input).toBeFocused();
      await expect(page.locator(".toast-error").last()).toContainText("テキストを入力してください");
    }
  });
});
