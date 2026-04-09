import { test, expect } from "@playwright/test";

test.describe("カラートークン生成 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/color-token");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/カラートークン/);
  });

  test("should have base color picker input", async ({ page }) => {
    const picker = page.locator(".ct-color-picker");
    await expect(picker).toBeVisible();
  });

  test("should have HEX text input with default value", async ({ page }) => {
    const hexInput = page.locator("#ct-hex-input");
    await expect(hexInput).toBeVisible();
    const value = await hexInput.inputValue();
    expect(value).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test("should have color name input", async ({ page }) => {
    const nameInput = page.locator("#ct-name-input");
    await expect(nameInput).toBeVisible();
  });

  test("should display shade strip with 11 cells", async ({ page }) => {
    const strip = page.locator(".ct-swatch-strip");
    await expect(strip).toBeVisible();
    const cells = page.locator(".ct-strip-cell");
    await expect(cells).toHaveCount(11);
  });

  test("should display detail list with 11 rows", async ({ page }) => {
    const rows = page.locator(".ct-swatch-row");
    await expect(rows).toHaveCount(11);
  });

  test("should have HEX codes in detail rows", async ({ page }) => {
    const hexCodes = page.locator(".ct-swatch-hex");
    const texts = await hexCodes.allTextContents();
    texts.forEach((text) => {
      expect(text).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test("should have format tabs", async ({ page }) => {
    const tabs = page.locator(".ct-format-tabs");
    await expect(tabs).toBeVisible();
    const tabButtons = page.locator(".ct-format-tab");
    await expect(tabButtons).toHaveCount(4);
  });

  test("should show CSS variable output by default", async ({ page }) => {
    const cssTab = page.locator(".ct-format-tab").filter({ hasText: "CSS変数" });
    await expect(cssTab).toHaveClass(/active/);
    const textarea = page.locator(".ct-output-textarea");
    const content = await textarea.inputValue();
    expect(content).toContain(":root {");
    expect(content).toContain("--primary-500:");
  });

  test("should switch to SCSS format", async ({ page }) => {
    const scssTab = page.locator(".ct-format-tab").filter({ hasText: "SCSS" });
    await scssTab.click();
    await expect(scssTab).toHaveClass(/active/);
    const textarea = page.locator(".ct-output-textarea");
    const content = await textarea.inputValue();
    expect(content).toContain("$primary-500:");
  });

  test("should switch to Tailwind format", async ({ page }) => {
    const twTab = page.locator(".ct-format-tab").filter({ hasText: "Tailwind" });
    await twTab.click();
    const textarea = page.locator(".ct-output-textarea");
    const content = await textarea.inputValue();
    expect(content).toContain("tailwind.config.js");
    expect(content).toContain("500:");
  });

  test("should switch to JSON format", async ({ page }) => {
    const jsonTab = page.locator(".ct-format-tab").filter({ hasText: "JSON" });
    await jsonTab.click();
    const textarea = page.locator(".ct-output-textarea");
    const content = await textarea.inputValue();
    const parsed = JSON.parse(content);
    expect(parsed["primary-500"]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  test("should update output when color name is changed", async ({ page }) => {
    const nameInput = page.locator("#ct-name-input");
    await nameInput.fill("brand");
    const textarea = page.locator(".ct-output-textarea");
    const content = await textarea.inputValue();
    expect(content).toContain("--brand-500:");
  });

  test("should update shades when HEX input is changed", async ({ page }) => {
    const hexInput = page.locator("#ct-hex-input");
    await hexInput.fill("#ef4444");
    await page.waitForTimeout(100);
    const hexCodes = page.locator(".ct-swatch-hex");
    const texts = await hexCodes.allTextContents();
    expect(texts).toHaveLength(11);
    texts.forEach((text) => {
      expect(text).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  test("should have copy button for each row", async ({ page }) => {
    const copyBtns = page.locator(".ct-swatch-copy");
    await expect(copyBtns).toHaveCount(11);
  });

  test("should have output copy button", async ({ page }) => {
    const copyBtn = page.locator(".ct-copy-btn");
    await expect(copyBtn).toBeVisible();
  });

  test("should display tips card", async ({ page }) => {
    const tips = page.locator(".tips-card, .info-box");
    await expect(tips.first()).toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const strip = page.locator('[aria-label="生成されたシェード一覧"]');
    await expect(strip).toBeVisible();
  });

  test("should have navigation link in category dropdown", async ({ page }) => {
    await page.goto("/");
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "画像" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/color-token"]');
    await expect(link).toBeVisible();
  });
});
