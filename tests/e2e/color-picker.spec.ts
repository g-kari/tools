import { test, expect } from "@playwright/test";

test.describe("Color Picker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-picker");
  });

  test("should display the page title and main elements", async ({ page }) => {
    await expect(page).toHaveTitle(/カラーピッカー/);

    // Check main sections are visible
    await expect(
      page.getByRole("heading", { name: "カラーピッカー", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "HEX形式" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "RGB形式" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "HSL形式" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "CMYK形式" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "カラーパレット" })
    ).toBeVisible();
  });

  test("should have a color picker input", async ({ page }) => {
    const colorInput = page.locator('input[type="color"]');
    await expect(colorInput).toBeVisible();

    // Default color should be set
    const value = await colorInput.inputValue();
    expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test("should display color preview with current color", async ({ page }) => {
    const colorPreview = page.locator(".color-preview");
    await expect(colorPreview).toBeVisible();

    // Preview should have a background color
    const backgroundColor = await colorPreview.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBeTruthy();
  });

  test("should update all formats when color picker changes", async ({
    page,
  }) => {
    const colorInput = page.locator('input[type="color"]');
    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = "#ff0000";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Wait for state updates
    await page.waitForTimeout(100);

    // Check HEX format
    const hexInput = page.locator('input[placeholder="#000000"]');
    await expect(hexInput).toHaveValue("#FF0000");

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

  test("should update all formats when HEX input changes", async ({ page }) => {
    const hexInput = page.locator('input[placeholder="#000000"]');
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

    // Check color picker
    const colorInput = page.locator('input[type="color"]');
    await expect(colorInput).toHaveValue("#00ff00");
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
    const hexInput = page.locator('input[placeholder="#000000"]');
    await expect(hexInput).toHaveValue("#0000FF");

    // Check color picker
    const colorInput = page.locator('input[type="color"]');
    await expect(colorInput).toHaveValue("#0000ff");
  });

  test("should update all formats when HSL inputs change", async ({ page }) => {
    const hslH = page.locator("#hsl-h");
    const hslS = page.locator("#hsl-s");
    const hslL = page.locator("#hsl-l");

    await hslH.clear();
    await hslH.fill("240");
    await hslH.press("Enter");
    await hslS.clear();
    await hslS.fill("100");
    await hslS.press("Enter");
    await hslL.clear();
    await hslL.fill("50");
    await hslL.press("Enter");

    await page.waitForTimeout(200);

    // Check RGB format (should be blue)
    const rgbR = page.locator("#rgb-r");
    const rgbG = page.locator("#rgb-g");
    const rgbB = page.locator("#rgb-b");
    await expect(rgbR).toHaveValue("0");
    await expect(rgbG).toHaveValue("0");
    await expect(rgbB).toHaveValue("255");
  });

  test("should copy HEX format to clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Set a known color
    const colorInput = page.locator('input[type="color"]');
    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = "#123456";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(100);

    // Click copy button for HEX
    const hexSection = page
      .locator(".converter-section")
      .filter({ hasText: "HEX形式" });
    const copyButton = hexSection.getByRole("button", { name: /コピー/ });
    await copyButton.click();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toBe("#123456");
  });

  test("should copy RGB format to clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Set a known color
    const colorInput = page.locator('input[type="color"]');
    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = "#ff0000";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(100);

    // Click copy button for RGB
    const rgbSection = page
      .locator(".converter-section")
      .filter({ hasText: "RGB形式" });
    const copyButton = rgbSection.getByRole("button", { name: /コピー/ });
    await copyButton.click();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toBe("rgb(255, 0, 0)");
  });

  test("should add color to palette", async ({ page }) => {
    // Set a color
    const colorInput = page.locator('input[type="color"]');
    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = "#ff5733";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(100);

    // Click add to palette button
    const addButton = page.getByRole("button", { name: /\+ 追加/ });
    await addButton.click();

    // Verify color is in palette
    const paletteItems = page.locator(".palette-item");
    await expect(paletteItems).toHaveCount(1);

    // Verify color count
    await expect(page.locator(".palette-count")).toHaveText("1 / 10色");
  });

  test("should not add duplicate colors to palette", async ({ page }) => {
    // Set a color
    const colorInput = page.locator('input[type="color"]');
    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = "#abcdef";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(100);

    // Add to palette twice
    const addButton = page.getByRole("button", { name: /\+ 追加/ });
    await addButton.click();
    await page.waitForTimeout(100);
    await addButton.click();

    // Should still have only 1 item
    const paletteItems = page.locator(".palette-item");
    await expect(paletteItems).toHaveCount(1);
  });

  test("should remove color from palette", async ({ page }) => {
    // Add a color to palette
    const colorInput = page.locator('input[type="color"]');
    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = "#123456";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(100);

    const addButton = page.getByRole("button", { name: /\+ 追加/ });
    await addButton.click();
    await page.waitForTimeout(100);

    // Remove the color
    const removeButton = page
      .locator(".palette-item")
      .first()
      .locator(".palette-remove");
    await removeButton.click();

    // Verify palette is empty
    await expect(page.locator(".palette-empty")).toBeVisible();
  });

  test("should select color from palette", async ({ page }) => {
    // Add two colors to palette
    const colorInput = page.locator('input[type="color"]');

    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = "#ff0000";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(100);
    await page.getByRole("button", { name: /\+ 追加/ }).click();
    await page.waitForTimeout(100);

    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = "#00ff00";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(100);
    await page.getByRole("button", { name: /\+ 追加/ }).click();
    await page.waitForTimeout(100);

    // Click the first palette color
    const firstPaletteColor = page.locator(".palette-color").first();
    await firstPaletteColor.click();
    await page.waitForTimeout(100);

    // Verify the color changed
    const hexInput = page.locator('input[placeholder="#000000"]');
    await expect(hexInput).toHaveValue("#FF0000");
  });

  test("should limit palette to 10 colors", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /\+ 追加/ });
    const colorInput = page.locator('input[type="color"]');

    // Add 10 colors
    for (let i = 0; i < 10; i++) {
      const color = `#${i.toString().padStart(6, "0")}`;
      await colorInput.evaluate((el: HTMLInputElement, value: string) => {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }, color);
      await page.waitForTimeout(50);
      await addButton.click();
      await page.waitForTimeout(50);
    }

    // Verify 10 colors are in palette
    const paletteItems = page.locator(".palette-item");
    await expect(paletteItems).toHaveCount(10);

    // Verify add button is disabled
    await expect(addButton).toBeDisabled();

    // Verify count display
    await expect(page.locator(".palette-count")).toHaveText("10 / 10色");
  });

  test("should persist palette in localStorage", async ({ page, context }) => {
    // Clear localStorage first
    await page.evaluate(() => localStorage.clear());

    // Add a color to palette
    const colorInput = page.locator('input[type="color"]');
    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = "#fedcba";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(100);
    await page.getByRole("button", { name: /\+ 追加/ }).click();
    await page.waitForTimeout(100);

    // Reload the page
    await page.reload();
    await page.waitForTimeout(200);

    // Verify palette is still there
    const paletteItems = page.locator(".palette-item");
    await expect(paletteItems).toHaveCount(1);
  });

  test("should display color format strings correctly", async ({ page }) => {
    // Set a known color
    const colorInput = page.locator('input[type="color"]');
    await colorInput.evaluate((el: HTMLInputElement) => {
      el.value = "#ff8800";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(100);

    // Check RGB string format
    const rgbString = page
      .locator(".converter-section")
      .filter({ hasText: "RGB形式" })
      .locator(".color-format-input.readonly");
    await expect(rgbString).toHaveValue("rgb(255, 136, 0)");

    // Check HSL string format
    const hslString = page
      .locator(".converter-section")
      .filter({ hasText: "HSL形式" })
      .locator(".color-format-input.readonly");
    const hslValue = await hslString.inputValue();
    expect(hslValue).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);

    // Check CMYK string format
    const cmykString = page
      .locator(".converter-section")
      .filter({ hasText: "CMYK形式" })
      .locator(".color-format-input.readonly");
    const cmykValue = await cmykString.inputValue();
    expect(cmykValue).toMatch(/^cmyk\(\d+%, \d+%, \d+%, \d+%\)$/);
  });

  test("should be keyboard accessible", async ({ page }) => {
    // Tab through inputs
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Color picker should be focusable
    const colorInput = page.locator('input[type="color"]');
    await expect(colorInput).toBeFocused();

    // HEX input should be focusable
    await page.keyboard.press("Tab");
    const hexInput = page.locator('input[placeholder="#000000"]');
    await expect(hexInput).toBeFocused();
  });

  test("should display info box", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "カラーピッカーとは" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "カラー形式について" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tips" })).toBeVisible();
  });
});
