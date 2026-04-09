import { test, expect } from "@playwright/test";

test.describe("Brainfuck インタープリター - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/brainfuck");
    await page.waitForSelector(".tool-container");
  });

  test("ページが正しく表示される", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Brainfuck/);
  });

  test("メインヘッダーが表示される", async ({ page }) => {
    const heading = page.locator("h1.tool-title");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Brainfuck インタープリター");
  });

  test("アクセシビリティ属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("サンプルプログラムが表示される", async ({ page }) => {
    const samples = page.locator(".brainfuck-sample-btn");
    await expect(samples.first()).toBeVisible();
    const count = await samples.count();
    expect(count).toBeGreaterThan(0);
  });

  test("サンプルを選択するとコードが読み込まれる", async ({ page }) => {
    const catBtn = page.locator(".brainfuck-sample-btn", { hasText: "Cat" });
    await catBtn.click();
    const codeArea = page.locator("#brainfuck-code");
    const value = await codeArea.inputValue();
    expect(value).toContain(",[.,]");
  });

  test("コードを実行できる", async ({ page }) => {
    // デフォルトサンプルが読み込まれた状態で実行
    const runBtn = page.locator("button", { hasText: "実行" });
    await runBtn.click();
    const output = page.locator(".brainfuck-result-box");
    await expect(output).toBeVisible();
    // 出力がプレースホルダーでないことを確認
    await expect(output).not.toContainText("コードを入力して");
  });

  test("コマンドリファレンスが表示される", async ({ page }) => {
    const ref = page.locator(".brainfuck-command-ref");
    await expect(ref).toBeVisible();
    const items = page.locator(".brainfuck-cmd-item");
    const count = await items.count();
    expect(count).toBe(8); // 8つのコマンド
  });

  test("使い方説明が表示される", async ({ page }) => {
    const tips = page.locator(".info-box").first();
    await expect(tips).toBeVisible();
    const text = await tips.textContent();
    expect(text).toContain("Brainfuck");
  });
});
