import { test, expect } from "@playwright/test";

test.describe("Cookie Parser - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cookie-parser");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Cookieパーサー/);
  });

  test("should display mode tabs", async ({ page }) => {
    const cookieTab = page.locator(".cookie-parser-tab", {
      hasText: "Cookie",
    });
    const setCookieTab = page.locator(".cookie-parser-tab", {
      hasText: "Set-Cookie",
    });
    await expect(cookieTab).toBeVisible();
    await expect(setCookieTab).toBeVisible();
  });

  test("should have Cookie mode active by default", async ({ page }) => {
    const activeTab = page.locator(".cookie-parser-tab.active");
    await expect(activeTab).toContainText("Cookie");
  });

  test("should show Cookie input textarea in Cookie mode", async ({ page }) => {
    const textarea = page.locator("#cookie-input");
    await expect(textarea).toBeVisible();
  });

  test("should parse Cookie header and show results", async ({ page }) => {
    const textarea = page.locator("#cookie-input");
    await textarea.fill("session=abc123; user=john");

    // エントリーが表示される
    const rows = page.locator(".cookie-parser-table tbody tr");
    await expect(rows).toHaveCount(2);
  });

  test("should display cookie names in table", async ({ page }) => {
    const textarea = page.locator("#cookie-input");
    await textarea.fill("myToken=xyz789");

    const nameCell = page.locator(".cookie-parser-table-name").first();
    await expect(nameCell).toContainText("myToken");
  });

  test("should display cookie count", async ({ page }) => {
    const textarea = page.locator("#cookie-input");
    await textarea.fill("a=1; b=2; c=3");

    const count = page.locator(".cookie-parser-count");
    await expect(count).toContainText("3");
  });

  test("should clear input when clear button is clicked", async ({ page }) => {
    const textarea = page.locator("#cookie-input");
    await textarea.fill("session=abc");

    const clearBtn = page.locator("button", { hasText: "クリア" });
    await clearBtn.first().click();

    await expect(textarea).toHaveValue("");
  });

  test("should load sample cookies", async ({ page }) => {
    const sampleChip = page.locator(".cookie-parser-sample-chip").first();
    await sampleChip.click();

    const textarea = page.locator("#cookie-input");
    const value = await textarea.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("should switch to Set-Cookie mode", async ({ page }) => {
    const setCookieTab = page.locator(".cookie-parser-tab", {
      hasText: "Set-Cookie",
    });
    await setCookieTab.click();

    await expect(setCookieTab).toHaveClass(/active/);

    const textarea = page.locator("#set-cookie-input");
    await expect(textarea).toBeVisible();
  });

  test("should parse Set-Cookie header with attributes", async ({ page }) => {
    const setCookieTab = page.locator(".cookie-parser-tab", {
      hasText: "Set-Cookie",
    });
    await setCookieTab.click();

    const textarea = page.locator("#set-cookie-input");
    await textarea.fill("session=abc123; Path=/; HttpOnly; Secure; SameSite=Strict");

    // 属性カードが表示される
    const attrCards = page.locator(".cookie-parser-attr-card");
    const count = await attrCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should show security warnings for insecure cookie", async ({ page }) => {
    const setCookieTab = page.locator(".cookie-parser-tab", {
      hasText: "Set-Cookie",
    });
    await setCookieTab.click();

    const textarea = page.locator("#set-cookie-input");
    // Secure, HttpOnly, SameSite なし
    await textarea.fill("insecure=value; Path=/");

    const warnings = page.locator(".cookie-parser-warning");
    const count = await warnings.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should NOT show warnings for secure cookie", async ({ page }) => {
    const setCookieTab = page.locator(".cookie-parser-tab", {
      hasText: "Set-Cookie",
    });
    await setCookieTab.click();

    const textarea = page.locator("#set-cookie-input");
    await textarea.fill("session=abc; Path=/; Secure; HttpOnly; SameSite=Strict");

    const warnings = page.locator(".cookie-parser-warning");
    const count = await warnings.count();
    expect(count).toBe(0);
  });

  test("should display generated Set-Cookie header", async ({ page }) => {
    const setCookieTab = page.locator(".cookie-parser-tab", {
      hasText: "Set-Cookie",
    });
    await setCookieTab.click();

    const textarea = page.locator("#set-cookie-input");
    await textarea.fill("token=abc; Path=/; Secure; HttpOnly");

    const generatedHeader = page.locator(".cookie-parser-generated-value");
    await expect(generatedHeader).toBeVisible();
    const text = await generatedHeader.textContent();
    expect(text).toContain("token=abc");
  });

  test("should display empty state when no input", async ({ page }) => {
    const emptyState = page.locator(".cookie-parser-empty");
    await expect(emptyState).toBeVisible();
  });

  test("should show TipsCard", async ({ page }) => {
    const tipsCard = page.locator(".tips-card");
    await expect(tipsCard).toBeVisible();
  });

  test("should display Set-Cookie samples", async ({ page }) => {
    const setCookieTab = page.locator(".cookie-parser-tab", {
      hasText: "Set-Cookie",
    });
    await setCookieTab.click();

    const samples = page.locator(".cookie-parser-sample-chip");
    const count = await samples.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should be navigable via category dropdown", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", {
      hasText: "検証",
    });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/cookie-parser"]');
    await link.click();
    await expect(page).toHaveURL(/cookie-parser/);
    await expect(page).toHaveTitle(/Cookieパーサー/);
  });

  test("should have accessible aria labels", async ({ page }) => {
    // タブリスト
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();

    // 入力フィールドのラベル
    const cookieInput = page.locator("#cookie-input");
    await expect(cookieInput).toBeVisible();
  });

  test("should display Secure attribute as false initially", async ({ page }) => {
    const setCookieTab = page.locator(".cookie-parser-tab", {
      hasText: "Set-Cookie",
    });
    await setCookieTab.click();

    const textarea = page.locator("#set-cookie-input");
    // Secureなし
    await textarea.fill("name=value; Path=/");

    // 属性カードにSecureが無効と表示される
    const falseLabels = page.locator(".cookie-parser-attr-val-false");
    const count = await falseLabels.count();
    expect(count).toBeGreaterThan(0);
  });
});
