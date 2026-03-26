import { test, expect } from "@playwright/test";

test.describe("VSCode スニペットジェネレーター - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/vscode-snippet");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/VSCode スニペット/);
  });

  test("ページ本文に undefined が含まれない", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("アクセシビリティ属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("初期状態でスニペットカードが1つ表示される", async ({ page }) => {
    const cards = page.locator(".vscode-snippet-card");
    await expect(cards).toHaveCount(1);
  });

  test("初期状態で有効な JSON が出力される", async ({ page }) => {
    const output = page.locator(".vscode-snippet-output-area");
    const value = await output.inputValue();
    expect(() => JSON.parse(value)).not.toThrow();
  });

  test("スニペット名を入力すると JSON に反映される", async ({ page }) => {
    const nameInput = page.locator('.vscode-snippet-card input[type="text"]').first();
    await nameInput.fill("My Snippet");

    const output = page.locator(".vscode-snippet-output-area");
    await expect(output).toContainText("My Snippet");
  });

  test("本文を入力すると JSON の body に反映される", async ({ page }) => {
    const nameInput = page.locator('.vscode-snippet-card input[type="text"]').first();
    await nameInput.fill("test");

    const bodyTextarea = page.locator(".vscode-snippet-body-textarea").first();
    await bodyTextarea.fill("console.log($1);");

    const output = page.locator(".vscode-snippet-output-area");
    await expect(output).toContainText("console.log($1);");
  });

  test("「＋ スニペットを追加」ボタンでカードが増える", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: "＋ スニペットを追加" });
    await addBtn.click();

    const cards = page.locator(".vscode-snippet-card");
    await expect(cards).toHaveCount(2);
  });

  test("スニペットが2つ以上のとき削除ボタンが表示される", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: "＋ スニペットを追加" });
    await addBtn.click();

    const removeBtn = page.locator(".vscode-snippet-remove-btn");
    await expect(removeBtn.first()).toBeVisible();
  });

  test("削除ボタンでカードが減る", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: "＋ スニペットを追加" });
    await addBtn.click();

    const removeBtn = page.locator(".vscode-snippet-remove-btn").first();
    await removeBtn.click();

    const cards = page.locator(".vscode-snippet-card");
    await expect(cards).toHaveCount(1);
  });

  test("リセットボタンでフォームが初期状態に戻る", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: "＋ スニペットを追加" });
    await addBtn.click();
    await addBtn.click();

    const resetBtn = page.getByRole("button", { name: "リセット" });
    await resetBtn.click();

    const cards = page.locator(".vscode-snippet-card");
    await expect(cards).toHaveCount(1);
  });

  test("スコープを選択すると JSON に scope フィールドが含まれる", async ({ page }) => {
    const nameInput = page.locator('.vscode-snippet-card input[type="text"]').first();
    await nameInput.fill("ts snippet");

    const scopeSelect = page.locator(".vscode-snippet-card select").first();
    await scopeSelect.selectOption("typescript");

    const output = page.locator(".vscode-snippet-output-area");
    await expect(output).toContainText('"scope": "typescript"');
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.getByText("VS Code スニペットとは")).toBeVisible();
    await expect(page.getByText("タブストップの使い方")).toBeVisible();
  });

  test("ナビゲーションに VSCode スニペット生成が含まれる", async ({ page }) => {
    const navLink = page.locator('a[href="/vscode-snippet"]');
    await expect(navLink.first()).toBeAttached();
  });
});
