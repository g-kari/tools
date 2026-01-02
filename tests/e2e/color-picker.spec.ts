/**
 * E2E tests for the Color Picker feature.
 * Tests color format conversions (HEX/RGB/HSL/CMYK), palette management,
 * clipboard operations, localStorage persistence, and accessibility.
 * @module tests/e2e/color-picker.spec
 */
import { test, expect } from "@playwright/test";

/**
 * Color Picker test suite.
 * Validates the /color-picker route functionality including UI elements,
 * color conversions, palette operations, and keyboard navigation.
 */
test.describe("Color Picker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-picker");
  });

  test("should display the page title and main elements", async ({ page }) => {
    await expect(page).toHaveTitle(/カラーピッカー/);

    // Check main elements are visible (compact layout)
    await expect(page.locator(".color-preview-compact")).toBeVisible();
    await expect(page.locator(".hex-input-compact")).toBeVisible();
    await expect(page.locator(".color-formats-grid")).toBeVisible();
    await expect(page.locator(".palette-section-compact")).toBeVisible();
    await expect(page.locator(".image-picker-compact")).toBeVisible();
  });

  test("should have a color picker input", async ({ page }) => {
    const colorInput = page.locator('input[type="color"]');
    await expect(colorInput).toBeAttached();

    // Default color should be set
    const value = await colorInput.inputValue();
    expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test("should display color preview with current color", async ({ page }) => {
    const colorPreview = page.locator(".color-preview-compact");
    await expect(colorPreview).toBeVisible();

    // Preview should have a background color
    const backgroundColor = await colorPreview.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBeTruthy();
  });

  test("should update all formats when HEX input is changed", async ({
    page,
  }) => {
    // Use HEX input to set color
    const hexInput = page.locator(".hex-input-compact");
    await hexInput.clear();
    await hexInput.fill("#FF0000");
    await hexInput.press("Enter");
    await page.waitForTimeout(200);

    // Check RGB format
    const rgbR = page.locator("#rgb-r");
    const rgbG = page.locator("#rgb-g");
    const rgbB = page.locator("#rgb-b");
    await expect(rgbR).toHaveValue("255");
    await expect(rgbG).toHaveValue("0");
    await expect(rgbB).toHaveValue("0");

    // Check HSL format
    const hslH = page.locator("#hsl-h");
    const hslS = page.locator("#hsl-s");
    const hslL = page.locator("#hsl-l");
    await expect(hslH).toHaveValue("0");
    await expect(hslS).toHaveValue("100");
    await expect(hslL).toHaveValue("50");
  });

  test("should update all formats when HEX input changes with blur", async ({
    page,
  }) => {
    const hexInput = page.locator(".hex-input-compact");
    await hexInput.clear();
    await hexInput.fill("#00FF00");
    await hexInput.blur();

    await page.waitForTimeout(100);

    // Check RGB format
    const rgbR = page.locator("#rgb-r");
    const rgbG = page.locator("#rgb-g");
    const rgbB = page.locator("#rgb-b");
    await expect(rgbR).toHaveValue("0");
    await expect(rgbG).toHaveValue("255");
    await expect(rgbB).toHaveValue("0");
  });

  test("should update all formats when RGB inputs change", async ({ page }) => {
    const rgbR = page.locator("#rgb-r");
    const rgbG = page.locator("#rgb-g");
    const rgbB = page.locator("#rgb-b");

    await rgbR.clear();
    await rgbR.fill("0");
    await rgbG.clear();
    await rgbG.fill("0");
    await rgbB.clear();
    await rgbB.fill("255");

    await page.waitForTimeout(100);

    // Check HEX format
    const hexInput = page.locator(".hex-input-compact");
    await expect(hexInput).toHaveValue("#0000FF");
  });

  test("should update HEX when HSL inputs change", async ({ page }) => {
    // Test that HSL input changes the HEX value
    const hslH = page.locator("#hsl-h");
    const hexInput = page.locator(".hex-input-compact");

    // Get initial HEX value
    const initialHex = await hexInput.inputValue();

    // Change H value
    await hslH.clear();
    await hslH.fill("180");
    await hslH.press("Enter");
    await page.waitForTimeout(300);

    // HEX value should have changed
    const newHex = await hexInput.inputValue();
    expect(newHex).not.toBe(initialHex);
  });

  test("should copy HEX format to clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Set a known color using HEX input
    const hexInput = page.locator(".hex-input-compact");
    await hexInput.clear();
    await hexInput.fill("#123456");
    await hexInput.press("Enter");
    await page.waitForTimeout(200);

    // Click copy button for HEX (first copy button in header)
    const copyButton = page.locator(".color-hex-input .btn-copy-small");
    await copyButton.click();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toBe("#123456");
  });

  test("should copy RGB format to clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Set a known color using HEX input
    const hexInput = page.locator(".hex-input-compact");
    await hexInput.clear();
    await hexInput.fill("#FF0000");
    await hexInput.press("Enter");
    await page.waitForTimeout(200);

    // Click copy button for RGB (first format row)
    const rgbRow = page.locator(".format-row").first();
    const copyButton = rgbRow.locator(".btn-copy-small");
    await copyButton.click();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toBe("rgb(255, 0, 0)");
  });

  test("should add color to palette", async ({ page }) => {
    // Set a color using HEX input
    const hexInput = page.locator(".hex-input-compact");
    await hexInput.clear();
    await hexInput.fill("#FF5733");
    await hexInput.press("Enter");
    await page.waitForTimeout(200);

    // Click add to palette button
    const addButton = page.locator(".btn-add-palette-small");
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();
    await page.waitForTimeout(100);

    // Verify color is in palette
    const paletteColors = page.locator(".palette-color-compact");
    await expect(paletteColors).toHaveCount(1);
  });

  test("should not add duplicate colors to palette", async ({ page }) => {
    // Set a color using HEX input
    const hexInput = page.locator(".hex-input-compact");
    await hexInput.clear();
    await hexInput.fill("#ABCDEF");
    await hexInput.press("Enter");
    await page.waitForTimeout(200);

    // Add to palette twice
    const addButton = page.locator(".btn-add-palette-small");
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();
    await page.waitForTimeout(100);
    await addButton.click();

    // Should still have only 1 item
    const paletteColors = page.locator(".palette-color-compact");
    await expect(paletteColors).toHaveCount(1);
  });

  test("should remove color from palette with right-click", async ({
    page,
  }) => {
    // Add a color to palette using HEX input
    const hexInput = page.locator(".hex-input-compact");
    await hexInput.clear();
    await hexInput.fill("#123456");
    await hexInput.press("Enter");
    await page.waitForTimeout(200);

    const addButton = page.locator(".btn-add-palette-small");
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();
    await page.waitForTimeout(100);

    // Right-click to remove the color
    const paletteColor = page.locator(".palette-color-compact").first();
    await paletteColor.click({ button: "right" });

    // Verify palette is empty
    await expect(page.locator(".palette-empty-compact")).toBeVisible();
  });

  test("should select color from palette", async ({ page }) => {
    // Add two colors to palette using HEX input
    const hexInput = page.locator(".hex-input-compact");
    const addButton = page.locator(".btn-add-palette-small");

    await hexInput.clear();
    await hexInput.fill("#FF0000");
    await hexInput.press("Enter");
    await page.waitForTimeout(200);
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();
    await page.waitForTimeout(100);

    await hexInput.clear();
    await hexInput.fill("#00FF00");
    await hexInput.press("Enter");
    await page.waitForTimeout(200);
    await addButton.click();
    await page.waitForTimeout(100);

    // Click the first palette color
    const firstPaletteColor = page.locator(".palette-color-compact").first();
    await firstPaletteColor.click();
    await page.waitForTimeout(100);

    // Verify the color changed
    await expect(hexInput).toHaveValue("#FF0000");
  });

  test("should limit palette to 10 colors", async ({ page }) => {
    const addButton = page.locator(".btn-add-palette-small");
    const hexInput = page.locator(".hex-input-compact");
    await addButton.scrollIntoViewIfNeeded();

    // Add 10 colors
    for (let i = 0; i < 10; i++) {
      const color = `#${i.toString().padStart(6, "0")}`;
      await hexInput.clear();
      await hexInput.fill(color);
      await hexInput.press("Enter");
      await page.waitForTimeout(50);
      await addButton.click();
      await page.waitForTimeout(50);
    }

    // Verify 10 colors are in palette
    const paletteColors = page.locator(".palette-color-compact");
    await expect(paletteColors).toHaveCount(10);

    // Verify add button is disabled
    await expect(addButton).toBeDisabled();
  });

  test("should persist palette in localStorage", async ({ page }) => {
    // Clear localStorage first
    await page.evaluate(() => localStorage.clear());

    // Add a color to palette using HEX input
    const hexInput = page.locator(".hex-input-compact");
    const addButton = page.locator(".btn-add-palette-small");
    await hexInput.clear();
    await hexInput.fill("#FEDCBA");
    await hexInput.press("Enter");
    await page.waitForTimeout(200);
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();
    await page.waitForTimeout(100);

    // Reload the page
    await page.reload();
    await page.waitForTimeout(200);

    // Verify palette is still there
    const paletteColors = page.locator(".palette-color-compact");
    await expect(paletteColors).toHaveCount(1);
  });

  test("should display image picker section", async ({ page }) => {
    // Check image picker elements
    await expect(page.locator(".image-picker-title")).toHaveText("画像から取得");
    await expect(page.locator(".btn-upload-small")).toBeVisible();
    await expect(page.locator(".image-placeholder")).toBeVisible();
    // Check placeholder text includes D&D hint
    await expect(page.locator(".image-placeholder")).toContainText("D&D");
  });

  test("should display info box with tips", async ({ page }) => {
    // Check info-box sections
    await expect(page.locator(".info-box")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "カラーピッカーとは" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "カラー形式について" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tips" })).toBeVisible();
  });

  test("should be keyboard accessible", async ({ page }) => {
    // Focus on RGB R input directly
    const rgbR = page.locator("#rgb-r");
    await rgbR.focus();
    await expect(rgbR).toBeFocused();

    // Tab to RGB G
    await page.keyboard.press("Tab");
    const rgbG = page.locator("#rgb-g");
    await expect(rgbG).toBeFocused();

    // Tab to RGB B
    await page.keyboard.press("Tab");
    const rgbB = page.locator("#rgb-b");
    await expect(rgbB).toBeFocused();
  });
});
