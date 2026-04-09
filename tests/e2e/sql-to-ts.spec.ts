import { test, expect } from "@playwright/test";

test.describe("SQL→TypeScript型変換 - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/sql-to-ts");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/SQL→TypeScript型変換/);
  });

  test("SQL入力エリアが存在する", async ({ page }) => {
    const inputTextarea = page.locator("#sqlInput");
    await expect(inputTextarea).toBeVisible();
  });

  test("型定義出力エリアが存在する", async ({ page }) => {
    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toBeVisible();
  });

  test("サンプル読込ボタンが機能する", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "サンプル読込" });
    await sampleButton.click();

    const inputTextarea = page.locator("#sqlInput");
    const value = await inputTextarea.inputValue();
    expect(value.trim()).not.toBe("");
    expect(value).toContain("CREATE TABLE");
  });

  test("型変換ボタンが機能する", async ({ page }) => {
    const inputTextarea = page.locator("#sqlInput");
    await inputTextarea.fill(
      "CREATE TABLE users (id INTEGER NOT NULL, name VARCHAR(255) NOT NULL);",
    );

    const generateButton = page.locator("button", { hasText: "型変換" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("interface");
    await expect(outputArea).toContainText("Users");
    await expect(outputArea).toContainText("id");
    await expect(outputArea).toContainText("number");
  });

  test("クリアボタンが機能する", async ({ page }) => {
    const inputTextarea = page.locator("#sqlInput");
    await inputTextarea.fill("CREATE TABLE test (id INTEGER NOT NULL);");

    const clearButton = page.locator("button", { hasText: "クリア" });
    await clearButton.click();

    await expect(inputTextarea).toHaveValue("");
  });

  test("コピーボタンが存在する（出力前は無効）", async ({ page }) => {
    const copyButton = page.locator("button", { hasText: "型定義をコピー" });
    await expect(copyButton).toBeDisabled();
  });

  test("interface/typeラジオボタンが機能する", async ({ page }) => {
    const inputTextarea = page.locator("#sqlInput");
    await inputTextarea.fill("CREATE TABLE items (id INTEGER NOT NULL);");

    const typeRadio = page.locator('input[type="radio"]').nth(1);
    await typeRadio.check();

    const generateButton = page.locator("button", { hasText: "型変換" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("type ");
  });

  test("無効なSQL入力でエラーが表示される", async ({ page }) => {
    const inputTextarea = page.locator("#sqlInput");
    await inputTextarea.fill("SELECT * FROM users;");

    const generateButton = page.locator("button", { hasText: "型変換" });
    await generateButton.click();

    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
  });

  test("サンプルSQLから型定義を生成できる", async ({ page }) => {
    const sampleButton = page.locator("button", { hasText: "サンプル読込" });
    await sampleButton.click();

    const generateButton = page.locator("button", { hasText: "型変換" });
    await generateButton.click();

    const outputArea = page.locator('[role="region"][aria-live="polite"]');
    await expect(outputArea).toContainText("interface");
    await expect(outputArea).toContainText("id: number");
    await expect(outputArea).toContainText("name: string");
  });
});
