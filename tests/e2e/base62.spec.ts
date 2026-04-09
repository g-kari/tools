import { test, expect } from "@playwright/test";

test.describe("Base62 Converter - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/base62");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Base62/);
  });

  test("should display encode/decode tabs", async ({ page }) => {
    const encodeTab = page.locator('[role="tab"]', { hasText: "エンコード" });
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await expect(encodeTab).toBeVisible();
    await expect(decodeTab).toBeVisible();
  });

  test("should display text/number mode buttons", async ({ page }) => {
    const textBtn = page.locator("button[aria-pressed]", { hasText: "テキスト" });
    const numberBtn = page.locator("button[aria-pressed]", { hasText: "整数" });
    await expect(textBtn).toBeVisible();
    await expect(numberBtn).toBeVisible();
  });

  test("should display alphabet selection", async ({ page }) => {
    const standardRadio = page.locator('input[value="standard"]');
    const lowerFirstRadio = page.locator('input[value="lower-first"]');
    await expect(standardRadio).toBeVisible();
    await expect(lowerFirstRadio).toBeVisible();
  });

  test("should encode text to Base62", async ({ page }) => {
    const input = page.locator("#b62-input");
    await input.fill("Hello");

    const output = page.locator(".b62-textarea-output");
    await expect(output).toBeVisible();

    const outputValue = await output.inputValue();
    expect(outputValue.length).toBeGreaterThan(0);
    // Base62 出力には特殊文字が含まれない
    expect(outputValue).not.toContain("=");
    expect(outputValue).not.toContain("+");
    expect(outputValue).not.toContain("/");
  });

  test("should switch to decode mode", async ({ page }) => {
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await decodeTab.click();
    await expect(decodeTab).toHaveAttribute("aria-selected", "true");
  });

  test("should decode valid Base62 string", async ({ page }) => {
    // エンコードして値を取得
    const input = page.locator("#b62-input");
    await input.fill("Hello");
    const output = page.locator(".b62-textarea-output");
    await output.waitFor({ state: "visible" });
    const encoded = await output.inputValue();

    // デコードモードに切り替えて試す
    await page.locator('[role="tab"]', { hasText: "デコード" }).click();
    await input.fill(encoded);

    await output.waitFor({ state: "visible" });
    const decoded = await output.inputValue();
    expect(decoded).toBe("Hello");
  });

  test("should show error for invalid Base62 in decode mode", async ({ page }) => {
    await page.locator('[role="tab"]', { hasText: "デコード" }).click();

    const input = page.locator("#b62-input");
    await input.fill("Hello+World!");

    const error = page.locator(".b62-error");
    await expect(error).toBeVisible();
  });

  test("should switch to number mode and encode integer", async ({ page }) => {
    const numberBtn = page.locator("button[aria-pressed]", { hasText: "整数" });
    await numberBtn.click();

    const input = page.locator("#b62-input");
    await input.fill("12345");

    const result = page.locator(".b62-number-result");
    await expect(result).toBeVisible();

    const text = await result.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });

  test("should swap input/output when swap button is clicked", async ({ page }) => {
    const input = page.locator("#b62-input");
    await input.fill("test");

    await page.locator(".b62-textarea-output").waitFor({ state: "visible" });

    const swapBtn = page.locator('button[aria-label="入出力を入れ替える"]');
    await swapBtn.click();

    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await expect(decodeTab).toHaveAttribute("aria-selected", "true");
  });

  test("should clear input when clear button is clicked", async ({ page }) => {
    const input = page.locator("#b62-input");
    await input.fill("test text");

    const clearBtn = page.locator('button[aria-label="入力をクリア"]');
    await clearBtn.click();

    await expect(input).toHaveValue("");
  });

  test("should show byte count in encode output", async ({ page }) => {
    const input = page.locator("#b62-input");
    await input.fill("Hello");

    await page.locator(".b62-textarea-output").waitFor({ state: "visible" });

    const meta = page.locator(".b62-output-meta");
    await expect(meta).toBeVisible();
    await expect(meta).toContainText("バイト");
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });
});

test.describe("Top page - Base62 tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test('should display "Base62変換" in the tool list', async ({ page }) => {
    const link = page.locator('a[href="/base62"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("Base62");
  });

  test("should navigate to /base62 when clicking the tool card", async ({ page }) => {
    const link = page.locator('a[href="/base62"]');
    await link.click();
    await expect(page).toHaveURL("/base62");
  });
});
