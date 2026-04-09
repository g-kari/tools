import { test, expect } from "@playwright/test";

test.describe("ISBN バリデーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/isbn");
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/ISBN バリデーター/);
  });

  test("入力フィールドが存在する", async ({ page }) => {
    const input = page.getByLabel("ISBN入力欄");
    await expect(input).toBeVisible();
  });

  test("有効なISBN-13を入力すると有効と表示される", async ({ page }) => {
    const input = page.getByLabel("ISBN入力欄");
    await input.fill("9784873119038");
    await expect(page.getByText("✅ 有効なISBN")).toBeVisible();
  });

  test("有効なISBN-10を入力すると有効と表示される", async ({ page }) => {
    const input = page.getByLabel("ISBN入力欄");
    await input.fill("4873119030");
    await expect(page.getByText("✅ 有効なISBN")).toBeVisible();
  });

  test("無効なISBNを入力するとエラーが表示される", async ({ page }) => {
    const input = page.getByLabel("ISBN入力欄");
    await input.fill("9784873119039");
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("ISBN-13入力時にISBN-10変換結果が表示される", async ({ page }) => {
    const input = page.getByLabel("ISBN入力欄");
    await input.fill("9784873119038");
    await expect(page.getByText("4873119030")).toBeVisible();
  });

  test("ISBN-10入力時にISBN-13変換結果が表示される", async ({ page }) => {
    const input = page.getByLabel("ISBN入力欄");
    await input.fill("4873119030");
    await expect(page.getByText("9784873119038")).toBeVisible();
  });

  test("サンプルボタンをクリックするとISBNが設定される", async ({ page }) => {
    const sampleButton = page.getByRole("button", { name: /サンプル.*を使用/ }).first();
    await sampleButton.click();
    const input = page.getByLabel("ISBN入力欄");
    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    const input = page.getByLabel("ISBN入力欄");
    await input.fill("9784873119038");
    const clearButton = page.getByRole("button", { name: "クリア" });
    await clearButton.click();
    await expect(input).toHaveValue("");
  });

  test("ハイフン付き入力でも正しく検証される", async ({ page }) => {
    const input = page.getByLabel("ISBN入力欄");
    await input.fill("978-4-87311-903-8");
    await expect(page.getByText("✅ 有効なISBN")).toBeVisible();
  });

  test("X終端のISBN-10が正しく検証される", async ({ page }) => {
    const input = page.getByLabel("ISBN入力欄");
    await input.fill("030640615X");
    await expect(page.getByText("✅ 有効なISBN")).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText("ISBN とは")).toBeVisible();
  });
});
