import { test, expect } from "@playwright/test";

test.describe("Quoted-Printable Encode/Decode - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/quoted-printable");
    await page.waitForLoadState("networkidle");
  });

  test("should load the page without 'undefined' content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/Quoted-Printable/);
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
    const copyButton = page.locator("button.btn-copy");

    await expect(encodeButton).toBeVisible();
    await expect(decodeButton).toBeVisible();
    await expect(clearButton).toBeVisible();
    await expect(copyButton).toBeVisible();
  });

  test("should encode ASCII text to QP format", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill("Hello World");
    await encodeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    expect(output).toBe("Hello World");
  });

  test("should encode = character to =3D", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill("1+1=2");
    await encodeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    expect(output).toContain("=3D");
    expect(output).not.toContain("=2");
  });

  test("should encode Japanese text using =XX sequences", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();

    await inputTextarea.fill("あ");
    await encodeButton.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    expect(output).toContain("=E3");
    expect(output).toContain("=81");
    expect(output).toContain("=82");
  });

  test("should decode =XX sequences back to text", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const decodeButton = page.locator("button.btn-secondary").first();

    // 'あ' の QP エンコード
    await inputTextarea.fill("=E3=81=82");
    await decodeButton.click();

    await expect(outputTextarea).toHaveValue("あ");
  });

  test("should decode =3D back to =", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const decodeButton = page.locator("button.btn-secondary").first();

    await inputTextarea.fill("1+1=3D2");
    await decodeButton.click();

    await expect(outputTextarea).toHaveValue("1+1=2");
  });

  test("should clear both textareas", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const encodeButton = page.locator("button.btn-primary").first();
    const clearButton = page.locator("button.btn-clear");

    await inputTextarea.fill("テスト");
    await encodeButton.click();
    await expect(outputTextarea).not.toHaveValue("");

    await clearButton.click();

    await expect(inputTextarea).toHaveValue("");
    await expect(outputTextarea).toHaveValue("");
  });

  test("should show toast when encoding empty input", async ({ page }) => {
    const encodeButton = page.locator("button.btn-primary").first();

    await encodeButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("テキストを入力してください");
  });

  test("should show toast when decoding empty input", async ({ page }) => {
    const decodeButton = page.locator("button.btn-secondary").first();

    await decodeButton.click();

    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("テキストを入力してください");
  });

  test("copy button should be disabled when output is empty", async ({
    page,
  }) => {
    const copyButton = page.locator("button.btn-copy");
    await expect(copyButton).toBeDisabled();
  });

  test("copy button should be enabled after encoding", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    const encodeButton = page.locator("button.btn-primary").first();
    const copyButton = page.locator("button.btn-copy");

    await inputTextarea.fill("テスト");
    await encodeButton.click();

    await expect(copyButton).toBeEnabled();
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display usage instructions in tips card", async ({ page }) => {
    const tipsCard = page.locator(".info-box");
    await expect(tipsCard).toBeVisible();

    const tipsText = await tipsCard.textContent();
    expect(tipsText).toContain("QP エンコード");
    expect(tipsText).not.toContain("undefined");
  });

  test("should display Quoted-Printable description in tips card", async ({
    page,
  }) => {
    const tipsCard = page.locator(".info-box");
    const tipsText = await tipsCard.textContent();
    expect(tipsText).toContain("RFC 2045");
  });
});
