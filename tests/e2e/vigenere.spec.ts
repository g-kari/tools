import { expect, test } from "@playwright/test";

test.describe("ヴィジュネル暗号ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/vigenere");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /ヴィジュネル暗号/i })).toBeVisible();
  });

  test("モード切替ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "デコード" })).toBeVisible();
  });

  test("キー入力フィールドとテキスト入力エリアが表示される", async ({ page }) => {
    await expect(page.locator("#vigenere-key-input")).toBeVisible();
    await expect(page.locator("#vigenere-input")).toBeVisible();
    await expect(page.locator("#vigenere-output")).toBeVisible();
  });

  test("デフォルトキーが「KEY」に設定されている", async ({ page }) => {
    await expect(page.locator("#vigenere-key-input")).toHaveValue("KEY");
  });

  test("空入力では変換結果が空の状態メッセージを表示する", async ({ page }) => {
    await expect(page.locator("#vigenere-output")).toContainText("変換結果がここに表示されます");
  });

  test("エンコードモードでテキストを変換できる", async ({ page }) => {
    await page.locator("#vigenere-input").fill("HELLO");
    // key "KEY": H+K(10)=R, E+E(4)=I, L+Y(24)=J, L+K(10)=V, O+E(4)=S
    await expect(page.locator("#vigenere-output")).toContainText("RIJVS");
  });

  test("デコードモードで元のテキストに戻せる", async ({ page }) => {
    await page.getByRole("button", { name: "デコード" }).click();
    await page.locator("#vigenere-input").fill("RIJVS");
    await expect(page.locator("#vigenere-output")).toContainText("HELLO");
  });

  test("キーを変更すると変換結果が変わる", async ({ page }) => {
    await page.locator("#vigenere-key-input").fill("ABC");
    await page.locator("#vigenere-input").fill("ABC");
    // key "ABC": A+A(0)=A, B+B(1)=C, C+C(2)=E
    await expect(page.locator("#vigenere-output")).toContainText("ACE");
  });

  test("無効なキー（英字なし）を入力するとエラーメッセージが表示される", async ({ page }) => {
    await page.locator("#vigenere-key-input").fill("123");
    await page.locator("#vigenere-input").fill("HELLO");
    await expect(page.locator("#vigenere-output")).toContainText(
      "有効なキーワードを入力してください",
    );
  });

  test("コピーボタンは出力がない場合に無効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: /コピー/ });
    await expect(copyBtn).toBeDisabled();
  });

  test("コピーボタンは出力がある場合に有効になる", async ({ page }) => {
    await page.locator("#vigenere-input").fill("HELLO");
    const copyBtn = page.getByRole("button", { name: /コピー/ });
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がクリアされる", async ({ page }) => {
    await page.locator("#vigenere-input").fill("HELLO");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#vigenere-input")).toHaveValue("");
  });

  test("入出力を入れ替えボタンが動作する", async ({ page }) => {
    await page.locator("#vigenere-input").fill("HELLO");
    const output = await page.locator("#vigenere-output").textContent();
    await page.getByRole("button", { name: "入出力を入れ替え" }).click();
    await expect(page.locator("#vigenere-input")).toHaveValue(output?.trim() ?? "");
    // モードがデコードに切り替わっているはず
    const decodeBtn = page.getByRole("button", { name: "デコード" });
    await expect(decodeBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("有効なキーに対してキービジュアルが表示される", async ({ page }) => {
    await page.locator("#vigenere-key-input").fill("KEY");
    await expect(page.locator(".vigenere-key-chars")).toBeVisible();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("ヴィジュネル暗号について")).toBeVisible();
  });
});
