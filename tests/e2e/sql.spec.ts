import { test, expect } from "@playwright/test";

test.describe("SQLフォーマッター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sql");
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/SQLフォーマッター/);
  });

  test("フォームが表示される", async ({ page }) => {
    await expect(page.locator("#inputText")).toBeVisible();
    await expect(page.locator("#outputText")).toBeVisible();
  });

  test("操作モードのラジオボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("radio", { name: "SQLを整形する" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "SQLを圧縮する" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "SQLを検証する" })).toBeVisible();
  });

  test("整形モードでSQLを整形できる", async ({ page }) => {
    await page.locator("#inputText").fill("SELECT id, name FROM users WHERE age > 18");
    await page.getByRole("button", { name: "SQL 整形" }).click();
    const output = await page.locator("#outputText").inputValue();
    expect(output).toContain("SELECT");
    expect(output).toContain("FROM");
    expect(output).toContain("WHERE");
    // 複数行に分割されている
    expect(output.split("\n").length).toBeGreaterThan(1);
  });

  test("圧縮モードでSQLを圧縮できる", async ({ page }) => {
    await page.getByRole("radio", { name: "SQLを圧縮する" }).click();
    await page.locator("#inputText").fill("SELECT\n  id,\n  name\nFROM users\nWHERE age > 18");
    await page.getByRole("button", { name: "SQL 圧縮" }).click();
    const output = await page.locator("#outputText").inputValue();
    // 1行に圧縮されている
    expect(output.split("\n").length).toBe(1);
    expect(output).toContain("SELECT");
  });

  test("検証モードで有効なSQLを検証できる", async ({ page }) => {
    await page.getByRole("radio", { name: "SQLを検証する" }).click();
    await page.locator("#inputText").fill("SELECT id FROM users WHERE age > 18");
    await page.getByRole("button", { name: "SQL 検証" }).click();
    const output = await page.locator("#outputText").inputValue();
    expect(output).toContain("✓");
  });

  test("検証モードで無効なSQLを検出できる", async ({ page }) => {
    await page.getByRole("radio", { name: "SQLを検証する" }).click();
    await page.locator("#inputText").fill("SELECT id FROM users WHERE age > 18)");
    await page.getByRole("button", { name: "SQL 検証" }).click();
    const output = await page.locator("#outputText").inputValue();
    expect(output).toContain("✗");
  });

  test("空入力でエラートーストが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "SQL 整形" }).click();
    await expect(page.locator(".toast")).toBeVisible();
  });

  test("クリアボタンで入力と出力がクリアされる", async ({ page }) => {
    await page.locator("#inputText").fill("SELECT id FROM users");
    await page.getByRole("button", { name: "SQL 整形" }).click();
    await page.getByRole("button", { name: "入力と出力をクリア" }).click();
    expect(await page.locator("#inputText").inputValue()).toBe("");
    expect(await page.locator("#outputText").inputValue()).toBe("");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "出力結果をクリップボードにコピー" }),
    ).toBeVisible();
  });

  test("モード切り替えで入力と出力がリセットされる", async ({ page }) => {
    await page.locator("#inputText").fill("SELECT id FROM users");
    await page.getByRole("button", { name: "SQL 整形" }).click();
    await page.getByRole("radio", { name: "SQLを圧縮する" }).click();
    expect(await page.locator("#inputText").inputValue()).toBe("");
    expect(await page.locator("#outputText").inputValue()).toBe("");
  });

  test("インデント幅オプションが表示される（整形モード）", async ({ page }) => {
    await expect(page.getByRole("radio", { name: "インデント2スペース" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "インデント4スペース" })).toBeVisible();
  });

  test("ヒントカードが表示される", async ({ page }) => {
    await expect(page.locator(".info-box").first()).toBeVisible();
  });
});
