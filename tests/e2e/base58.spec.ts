import { test, expect } from "@playwright/test";

test.describe("Base58 Converter - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/base58");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Base58/);
  });

  test("should display encode/decode tabs", async ({ page }) => {
    const encodeTab = page.locator('[role="tab"]', { hasText: "エンコード" });
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await expect(encodeTab).toBeVisible();
    await expect(decodeTab).toBeVisible();
  });

  test("should display alphabet selection", async ({ page }) => {
    const bitcoinRadio = page.locator('input[value="bitcoin"]');
    const flickrRadio = page.locator('input[value="flickr"]');
    await expect(bitcoinRadio).toBeVisible();
    await expect(flickrRadio).toBeVisible();
  });

  test("should encode text to Base58", async ({ page }) => {
    const input = page.locator("#b58-input");
    await input.fill("Hello");

    // Wait for output to appear
    const output = page.locator(".b58-textarea-output");
    await expect(output).toBeVisible();

    const outputValue = await output.inputValue();
    expect(outputValue.length).toBeGreaterThan(0);
    // Base58 of "Hello" should not contain spaces or padding
    expect(outputValue).not.toContain("=");
  });

  test("should switch to decode mode", async ({ page }) => {
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await decodeTab.click();
    await expect(decodeTab).toHaveAttribute("aria-selected", "true");
  });

  test("should decode valid Base58 string", async ({ page }) => {
    // Switch to decode mode
    await page.locator('[role="tab"]', { hasText: "デコード" }).click();

    const input = page.locator("#b58-input");
    // Base58 encoding of "Hello"
    await input.fill("9Ajdvzr");

    const output = page.locator(".b58-textarea-output");
    await expect(output).toBeVisible();
  });

  test("should show error for invalid Base58 in decode mode", async ({ page }) => {
    await page.locator('[role="tab"]', { hasText: "デコード" }).click();

    const input = page.locator("#b58-input");
    // "0" is not valid in Base58 Bitcoin alphabet
    await input.fill("0OIl");

    const error = page.locator(".b58-error");
    await expect(error).toBeVisible();
  });

  test("should swap input/output when swap button is clicked", async ({ page }) => {
    const input = page.locator("#b58-input");
    await input.fill("test");

    // Wait for output
    await page.locator(".b58-textarea-output").waitFor({ state: "visible" });

    const swapBtn = page.locator('button[aria-label="入出力を入れ替える"]');
    await swapBtn.click();

    // Mode should switch to decode
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await expect(decodeTab).toHaveAttribute("aria-selected", "true");
  });

  test("should clear input when clear button is clicked", async ({ page }) => {
    const input = page.locator("#b58-input");
    await input.fill("test text");

    const clearBtn = page.locator('button[aria-label="入力をクリア"]');
    await clearBtn.click();

    await expect(input).toHaveValue("");
  });

  test("should copy output when copy button is clicked", async ({ page }) => {
    const input = page.locator("#b58-input");
    await input.fill("Hello");

    await page.locator(".b58-textarea-output").waitFor({ state: "visible" });

    const copyBtn = page.locator('button[aria-label="出力をコピー"]');
    await expect(copyBtn).toBeEnabled();
  });

  test("should show byte count in encode output", async ({ page }) => {
    const input = page.locator("#b58-input");
    await input.fill("Hello");

    await page.locator(".b58-textarea-output").waitFor({ state: "visible" });

    const meta = page.locator(".b58-output-meta");
    await expect(meta).toBeVisible();
    await expect(meta).toContainText("バイト");
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });
});

test.describe("Top page - Base58 tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test('should display "Base58変換" in the tool list', async ({ page }) => {
    const link = page.locator('a[href="/base58"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("Base58");
  });

  test("should navigate to /base58 when clicking the tool card", async ({ page }) => {
    const link = page.locator('a[href="/base58"]');
    await link.click();
    await expect(page).toHaveURL("/base58");
  });
});
