import { test, expect } from "@playwright/test";

test.describe("Bifid暗号 - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bifid", { waitUntil: "domcontentloaded" });
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Bifid暗号/);
    await expect(page.getByRole("button", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "デコード" })).toBeVisible();
  });

  test("エンコードが正常に動作する", async ({ page }) => {
    // キーワードを空に設定（標準方陣）してHELPをエンコード
    const keyInput = page.getByLabel("Bifid暗号のキーワード（英字のみ有効）");
    await keyInput.fill("");

    const input = page.getByLabel("Bifid暗号の入力テキスト");
    await input.fill("HELP");

    const output = page.locator("#bifid-output");
    await expect(output).toHaveText("FNPE");
  });

  test("デコードが正常に動作する", async ({ page }) => {
    await page.getByRole("button", { name: "デコード" }).click();

    const keyInput = page.getByLabel("Bifid暗号のキーワード（英字のみ有効）");
    await keyInput.fill("");

    const input = page.getByLabel("Bifid暗号の入力テキスト");
    await input.fill("FNPE");

    const output = page.locator("#bifid-output");
    await expect(output).toHaveText("HELP");
  });

  test("キーワードの変更が変換結果に反映される", async ({ page }) => {
    const input = page.getByLabel("Bifid暗号の入力テキスト");
    await input.fill("HELLO");

    const output = page.locator("#bifid-output");
    const result1 = await output.textContent();

    const keyInput = page.getByLabel("Bifid暗号のキーワード（英字のみ有効）");
    await keyInput.fill("ZEBRA");

    const result2 = await output.textContent();
    expect(result1).not.toBe(result2);
  });

  test("コピーボタンが機能する", async ({ page }) => {
    const input = page.getByLabel("Bifid暗号の入力テキスト");
    await input.fill("HELLO");

    const copyBtn = page.getByRole("button", { name: "変換結果をクリップボードにコピー" });
    await expect(copyBtn).toBeEnabled();
    await copyBtn.click();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    const input = page.getByLabel("Bifid暗号の入力テキスト");
    await input.fill("HELLO");

    const clearBtn = page.getByRole("button", { name: "入力をクリア" });
    await clearBtn.click();

    await expect(input).toHaveValue("");
    const output = page.locator("#bifid-output");
    await expect(output).toHaveText("変換結果がここに表示されます");
  });

  test("方陣可視化が表示される", async ({ page }) => {
    const vizBtn = page.getByRole("button", { name: "方陣可視化を表示" });
    await vizBtn.click();

    const square = page.locator(".bifid-square");
    await expect(square).toBeVisible();

    // 5×5 = 25セル + ヘッダー行5セル + 行ヘッダー5セル
    const rows = square.locator("tbody tr");
    await expect(rows).toHaveCount(5);
  });

  test("空入力では変換されない", async ({ page }) => {
    const output = page.locator("#bifid-output");
    await expect(output).toHaveText("変換結果がここに表示されます");

    const copyBtn = page.getByRole("button", { name: "変換結果をクリップボードにコピー" });
    await expect(copyBtn).toBeDisabled();
  });

  test("アクセシビリティ: ARIAラベルが正しく設定されている", async ({ page }) => {
    await expect(page.getByLabel("Bifid暗号のキーワード（英字のみ有効）")).toBeVisible();
    await expect(page.getByLabel("Bifid暗号の分割周期（0で全体を一括処理）")).toBeVisible();
    await expect(page.getByLabel("Bifid暗号の入力テキスト")).toBeVisible();
  });
});
