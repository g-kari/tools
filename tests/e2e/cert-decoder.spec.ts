import { test, expect } from "@playwright/test";

test.describe("X.509 Certificate Decoder - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cert-decoder");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/X\.509.*証明書/);
  });

  test("should display PEM input textarea", async ({ page }) => {
    const textarea = page.locator("#cert-pem-input");
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeEnabled();
  });

  test('should display "サンプル証明書を読み込む" button', async ({ page }) => {
    const sampleBtn = page.locator('button[aria-label*="サンプル証明書"]');
    await expect(sampleBtn).toBeVisible();
  });

  test("should load sample certificate when sample button is clicked", async ({ page }) => {
    const sampleBtn = page.locator('button[aria-label*="サンプル証明書"]');
    await sampleBtn.click();

    const textarea = page.locator("#cert-pem-input");
    const value = await textarea.inputValue();
    expect(value).toContain("-----BEGIN CERTIFICATE-----");
    expect(value).toContain("-----END CERTIFICATE-----");
  });

  test("should parse sample certificate and display results", async ({ page }) => {
    // Load sample certificate
    const sampleBtn = page.locator('button[aria-label*="サンプル証明書"]');
    await sampleBtn.click();

    // Click parse button
    const parseBtn = page.locator(".btn-primary", { hasText: "解析" });
    await parseBtn.click();

    // Wait for result
    const result = page.locator(".cert-result");
    await expect(result).toBeVisible({ timeout: 5000 });
  });

  test("should display certificate details after parsing", async ({ page }) => {
    const sampleBtn = page.locator('button[aria-label*="サンプル証明書"]');
    await sampleBtn.click();

    const parseBtn = page.locator(".btn-primary", { hasText: "解析" });
    await parseBtn.click();

    const result = page.locator(".cert-result");
    await expect(result).toBeVisible({ timeout: 5000 });

    // Should contain ISRG in the result
    const resultText = await result.textContent();
    expect(resultText).toContain("ISRG");
  });

  test("should show status banner after parsing", async ({ page }) => {
    const sampleBtn = page.locator('button[aria-label*="サンプル証明書"]');
    await sampleBtn.click();

    const parseBtn = page.locator(".btn-primary", { hasText: "解析" });
    await parseBtn.click();

    await page.locator(".cert-result").waitFor({ timeout: 5000 });

    const statusBanner = page.locator(".cert-status-banner");
    await expect(statusBanner).toBeVisible();
  });

  test("should show error for invalid PEM input", async ({ page }) => {
    const textarea = page.locator("#cert-pem-input");
    await textarea.fill("not a valid PEM certificate");

    const parseBtn = page.locator(".btn-primary", { hasText: "解析" });
    await parseBtn.click();

    const error = page.locator(".cert-error");
    await expect(error).toBeVisible({ timeout: 5000 });
  });

  test("should clear input when clear button is clicked", async ({ page }) => {
    const sampleBtn = page.locator('button[aria-label*="サンプル証明書"]');
    await sampleBtn.click();

    const clearBtn = page.locator(".btn-clear");
    await clearBtn.click();

    const textarea = page.locator("#cert-pem-input");
    await expect(textarea).toHaveValue("");
  });

  test("should show sections headings: Subject, Issuer, Validity", async ({ page }) => {
    const sampleBtn = page.locator('button[aria-label*="サンプル証明書"]');
    await sampleBtn.click();

    const parseBtn = page.locator(".btn-primary", { hasText: "解析" });
    await parseBtn.click();

    await page.locator(".cert-result").waitFor({ timeout: 5000 });

    const resultText = await page.locator(".cert-result").textContent();
    expect(resultText).toContain("サブジェクト");
    expect(resultText).toContain("発行者");
    expect(resultText).toContain("有効期限");
  });

  test("should display fingerprints section", async ({ page }) => {
    const sampleBtn = page.locator('button[aria-label*="サンプル証明書"]');
    await sampleBtn.click();

    const parseBtn = page.locator(".btn-primary", { hasText: "解析" });
    await parseBtn.click();

    await page.locator(".cert-result").waitFor({ timeout: 5000 });

    const resultText = await page.locator(".cert-result").textContent();
    expect(resultText).toContain("フィンガープリント");
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });
});

test.describe("Top page - Cert Decoder tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test('should display "X.509 証明書デコーダー" in the tool list', async ({ page }) => {
    const link = page.locator('a[href="/cert-decoder"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("X.509");
  });

  test("should navigate to /cert-decoder when clicking the tool card", async ({ page }) => {
    const link = page.locator('a[href="/cert-decoder"]');
    await link.click();
    await expect(page).toHaveURL("/cert-decoder");
  });
});
