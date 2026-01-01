import { test, expect } from "@playwright/test";

test.describe("Minify Tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/minify");
  });

  test("should have correct page title and structure", async ({ page }) => {
    await expect(page).toHaveTitle("コード圧縮ツール (Minify)");

    // Check main heading
    await expect(page.locator("h1")).toContainText("コード圧縮ツール");

    // Check page subtitle
    await expect(page.locator(".page-subtitle")).toBeVisible();

    // Check code type selector
    await expect(page.locator("#codeType")).toBeVisible();

    // Check input textarea
    await expect(page.locator("#input")).toBeVisible();

    // Check buttons
    await expect(page.locator('button:has-text("圧縮")')).toBeVisible();
    await expect(page.locator('button:has-text("クリア")')).toBeVisible();

    // Check info box
    await expect(page.locator(".info-box")).toBeVisible();
  });

  test("should minify JavaScript code", async ({ page }) => {
    // Select JavaScript
    await page.selectOption("#codeType", "javascript");

    // Input JavaScript code with comments and whitespace
    const jsCode = `
      // This is a comment
      function hello() {
        console.log("Hello World");
      }
    `;
    await page.fill("#input", jsCode);

    // Click minify button
    await page.click('button:has-text("圧縮")');

    // Wait for output
    await expect(page.locator("#output")).toBeVisible();

    // Check that output is minified
    const output = await page.locator("#output").inputValue();
    expect(output).not.toContain("//");
    expect(output).not.toContain("\n");
    expect(output).toContain("function hello()");

    // Check compression ratio is displayed
    await expect(page.locator(".compression-ratio")).toBeVisible();
    await expect(page.locator(".compression-ratio")).toContainText("圧縮率:");
  });

  test("should minify CSS code", async ({ page }) => {
    // Select CSS
    await page.selectOption("#codeType", "css");

    // Input CSS code
    const cssCode = `
      /* Comment */
      body {
        margin: 0px;
        padding: 0px;
        background: #ffffff;
      }
    `;
    await page.fill("#input", cssCode);

    // Click minify button
    await page.click('button:has-text("圧縮")');

    // Wait for output
    await expect(page.locator("#output")).toBeVisible();

    // Check that output is minified
    const output = await page.locator("#output").inputValue();
    expect(output).not.toContain("/*");
    expect(output).toContain("body{");
    expect(output).toContain("margin:0");
    expect(output).toContain("#fff"); // Color code shortened
  });

  test("should minify HTML code", async ({ page }) => {
    // Select HTML
    await page.selectOption("#codeType", "html");

    // Input HTML code
    const htmlCode = `
      <!-- Comment -->
      <div>
        <p>Hello</p>
      </div>
    `;
    await page.fill("#input", htmlCode);

    // Click minify button
    await page.click('button:has-text("圧縮")');

    // Wait for output
    await expect(page.locator("#output")).toBeVisible();

    // Check that output is minified
    const output = await page.locator("#output").inputValue();
    expect(output).not.toContain("<!--");
    expect(output).toBe("<div><p>Hello</p></div>");
  });

  test("should minify JSON code", async ({ page }) => {
    // Select JSON
    await page.selectOption("#codeType", "json");

    // Input JSON code
    const jsonCode = `
      {
        "name": "test",
        "value": 123
      }
    `;
    await page.fill("#input", jsonCode);

    // Click minify button
    await page.click('button:has-text("圧縮")');

    // Wait for output
    await expect(page.locator("#output")).toBeVisible();

    // Check that output is minified
    const output = await page.locator("#output").inputValue();
    expect(output).toBe('{"name":"test","value":123}');
  });

  test("should show error for empty input", async ({ page }) => {
    // Click minify without input
    await page.click('button:has-text("圧縮")');

    // Check error message
    await expect(page.locator(".error-message")).toBeVisible();
    await expect(page.locator(".error-message")).toContainText(
      "コードを入力してください"
    );
  });

  test("should show error for invalid JSON", async ({ page }) => {
    // Select JSON
    await page.selectOption("#codeType", "json");

    // Input invalid JSON
    await page.fill("#input", "{ invalid json }");

    // Click minify button
    await page.click('button:has-text("圧縮")');

    // Check error message
    await expect(page.locator(".error-message")).toBeVisible();
    await expect(page.locator(".error-message")).toContainText("JSON構文エラー");
  });

  test("should copy output to clipboard", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Select JavaScript and minify
    await page.selectOption("#codeType", "javascript");
    await page.fill("#input", "function test() { return true; }");
    await page.click('button:has-text("圧縮")');

    // Wait for output
    await expect(page.locator("#output")).toBeVisible();

    // Click copy button
    await page.click('button:has-text("コピー")');

    // Verify clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain("function test()");
  });

  test("should clear all fields", async ({ page }) => {
    // Fill input
    await page.fill("#input", "test code");
    await page.click('button:has-text("圧縮")');

    // Wait for output
    await expect(page.locator("#output")).toBeVisible();

    // Click clear button
    await page.click('button:has-text("クリア")');

    // Check that fields are cleared
    await expect(page.locator("#input")).toHaveValue("");
    await expect(page.locator("#output")).not.toBeVisible();
    await expect(page.locator(".error-message")).not.toBeVisible();
  });

  test("should switch between code types", async ({ page }) => {
    // Start with JavaScript
    await expect(page.locator("#codeType")).toHaveValue("javascript");
    await expect(page.locator("#input")).toHaveAttribute(
      "placeholder",
      /JAVASCRIPT/i
    );

    // Switch to CSS
    await page.selectOption("#codeType", "css");
    await expect(page.locator("#input")).toHaveAttribute("placeholder", /CSS/i);

    // Switch to HTML
    await page.selectOption("#codeType", "html");
    await expect(page.locator("#input")).toHaveAttribute(
      "placeholder",
      /HTML/i
    );

    // Switch to JSON
    await page.selectOption("#codeType", "json");
    await expect(page.locator("#input")).toHaveAttribute(
      "placeholder",
      /JSON/i
    );
  });

  test("should calculate compression ratio", async ({ page }) => {
    // Input code with significant whitespace
    const input = `
      function test() {
        console.log("hello");
      }
    `;
    await page.fill("#input", input);
    await page.click('button:has-text("圧縮")');

    // Wait for compression ratio
    await expect(page.locator(".compression-ratio")).toBeVisible();

    // Check that ratio is displayed as percentage
    const ratioText = await page.locator(".compression-ratio").textContent();
    expect(ratioText).toMatch(/圧縮率:\s*\d+\.\d+%\s*削減/);
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    // Check code type selector
    await expect(page.locator("#codeType")).toHaveAttribute(
      "aria-label",
      "圧縮するコードのタイプ"
    );

    // Check input textarea
    await expect(page.locator("#input")).toHaveAttribute(
      "aria-label",
      "圧縮する元のコード"
    );

    // Check buttons
    await expect(page.locator('button:has-text("圧縮")')).toHaveAttribute(
      "aria-label",
      "コードを圧縮"
    );
    await expect(page.locator('button:has-text("クリア")')).toHaveAttribute(
      "aria-label",
      "すべてクリア"
    );
  });

  test("should focus input on page load", async ({ page }) => {
    // Check that input is focused
    await expect(page.locator("#input")).toBeFocused();
  });

  test("should handle large code input", async ({ page }) => {
    // Generate large JavaScript code
    const largeCode = Array(100)
      .fill(0)
      .map(
        (_, i) => `
      function func${i}() {
        console.log("Function ${i}");
      }
    `
      )
      .join("\n");

    await page.fill("#input", largeCode);
    await page.click('button:has-text("圧縮")');

    // Wait for output
    await expect(page.locator("#output")).toBeVisible({ timeout: 10000 });

    // Check that output exists and is smaller
    const output = await page.locator("#output").inputValue();
    expect(output.length).toBeGreaterThan(0);
    expect(output.length).toBeLessThan(largeCode.length);
  });
});
