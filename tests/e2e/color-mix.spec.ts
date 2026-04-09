import { test, expect } from "@playwright/test";

test.describe("CSS color-mix() Playground - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-mix");
    await page.waitForLoadState("networkidle");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/color-mix/);
  });

  test("should display two color pickers", async ({ page }) => {
    const color1 = page.locator("#color-mix-color1");
    const color2 = page.locator("#color-mix-color2");
    await expect(color1).toBeVisible();
    await expect(color2).toBeVisible();
  });

  test("should display percentage slider", async ({ page }) => {
    const slider = page.locator("#color-mix-percentage");
    await expect(slider).toBeVisible();
    await expect(slider).toHaveAttribute("type", "range");
  });

  test("should display color space selection buttons", async ({ page }) => {
    const colorSpaceBtns = page.locator(".color-mix-colorspace-btn");
    const count = await colorSpaceBtns.count();
    expect(count).toBeGreaterThan(3);
  });

  test("should display preset color pairs", async ({ page }) => {
    const presets = page.locator(".color-mix-preset-btn");
    const count = await presets.count();
    expect(count).toBeGreaterThan(3);
  });

  test("should apply preset when clicked", async ({ page }) => {
    const firstPreset = page.locator(".color-mix-preset-btn").first();
    await firstPreset.click();

    // Color inputs should be updated (not verifying exact values)
    const color1Input = page.locator('input[aria-label="色1 HEX値入力"]');
    const value = await color1Input.inputValue();
    expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("should display generated CSS code", async ({ page }) => {
    const cssCode = page.locator(".basic-auth-result-value");
    await expect(cssCode).toBeVisible();
    const text = await cssCode.textContent();
    expect(text).toContain("color-mix");
  });

  test("should display gradient steps preview", async ({ page }) => {
    const gradientSteps = page.locator(".color-mix-gradient-step");
    const count = await gradientSteps.count();
    expect(count).toBe(11); // 0, 10, 20, ..., 100
  });

  test("should swap colors when swap button is clicked", async ({ page }) => {
    const color1Input = page.locator('input[aria-label="色1 HEX値入力"]');
    const color2Input = page.locator('input[aria-label="色2 HEX値入力"]');

    const color1Before = await color1Input.inputValue();
    const color2Before = await color2Input.inputValue();

    const swapBtn = page.locator('button[aria-label="2色を入れ替え"]');
    await swapBtn.click();

    const color1After = await color1Input.inputValue();
    const color2After = await color2Input.inputValue();

    expect(color1After).toBe(color2Before);
    expect(color2After).toBe(color1Before);
  });

  test("should update percentage label when slider is moved", async ({ page }) => {
    const slider = page.locator("#color-mix-percentage");
    await slider.fill("75");

    const labelText = await page
      .locator(".color-mix-label")
      .filter({ hasText: "色1の割合" })
      .textContent();
    expect(labelText).toContain("75%");
  });

  test('should have "CSS をコピー" button', async ({ page }) => {
    const copyBtn = page.locator('button[aria-label="color-mix() CSS値をコピー"]');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeEnabled();
  });

  test('should have "CSS 変数でコピー" button', async ({ page }) => {
    const copyBtn = page.locator('button[aria-label*="CSS カスタムプロパティ"]');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeEnabled();
  });

  test("should display CSS variables code block", async ({ page }) => {
    const codeBlock = page.locator(".color-mix-css-code");
    await expect(codeBlock).toBeVisible();
    const text = await codeBlock.textContent();
    expect(text).toContain(":root");
    expect(text).toContain("--color-mix-");
  });

  test("should update CSS output when colors change", async ({ page }) => {
    const color1Input = page.locator('input[aria-label="色1 HEX値入力"]');
    await color1Input.fill("#ff0000");
    await color1Input.press("Tab");

    const cssCode = page.locator(".basic-auth-result-value");
    const text = await cssCode.textContent();
    expect(text).toContain("color-mix");
  });

  test("should have proper accessibility landmarks", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });
});

test.describe("Top page - Color Mix tool listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test('should display "color-mix" in the tool list', async ({ page }) => {
    const link = page.locator('a[href="/color-mix"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("color-mix");
  });

  test("should navigate to /color-mix when clicking the tool card", async ({ page }) => {
    const link = page.locator('a[href="/color-mix"]');
    await link.click();
    await expect(page).toHaveURL("/color-mix");
  });
});
