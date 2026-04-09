import { expect, test } from "@playwright/test";

test.describe("プレイフェア暗号ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/playfair");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /プレイフェア暗号/i })).toBeVisible();
  });

  test("入力エリアと変換結果エリアが表示される", async ({ page }) => {
    await expect(page.locator("#playfair-input")).toBeVisible();
    await expect(page.locator("#playfair-output")).toBeVisible();
  });

  test("キーワード入力欄が表示される", async ({ page }) => {
    await expect(page.locator("#playfair-keyword")).toBeVisible();
  });

  test("テキストを入力すると暗号化結果が表示される", async ({ page }) => {
    await page.locator("#playfair-input").fill("HELLO");
    const output = page.locator("#playfair-output");
    await expect(output).not.toContainText("変換結果がここに表示されます");
    // 暗号文はスペース区切りの2文字ペア
    const text = await output.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test("キーワードを変えると異なる暗号文になる", async ({ page }) => {
    await page.locator("#playfair-input").fill("ATTACK");
    await page.locator("#playfair-keyword").fill("KEYWORD");
    const output1 = await page.locator("#playfair-output").innerText();

    await page.locator("#playfair-keyword").fill("SECRET");
    const output2 = await page.locator("#playfair-output").innerText();

    expect(output1.trim()).not.toBe(output2.trim());
  });

  test("コピーボタンが無効→有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();
    await page.locator("#playfair-input").fill("test");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#playfair-input").fill("Hello");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#playfair-input")).toHaveValue("");
  });

  test("「結果を入力にセット」ボタンで復号化モードに切り替わる", async ({ page }) => {
    await page.locator("#playfair-input").fill("HELLO");
    await page.getByRole("button", { name: "結果を入力にセット" }).click();
    // 復号化モードボタンが押された状態になる
    const decryptBtn = page.getByRole("button", { name: "復号化" });
    await expect(decryptBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("プレイフェア方陣が表示される", async ({ page }) => {
    await expect(page.locator(".playfair-square-grid")).toBeVisible();
    // 5×5 = 25 セル
    const cells = page.locator(".playfair-square-cell");
    await expect(cells).toHaveCount(25);
  });

  test("暗号化モードでダイグラフ分割が表示される", async ({ page }) => {
    await page.locator("#playfair-input").fill("HELLO");
    await expect(page.locator(".playfair-digraphs")).toBeVisible();
  });

  test("復号化モードに切り替えられる", async ({ page }) => {
    await page.getByRole("button", { name: "復号化" }).click();
    await expect(page.getByRole("button", { name: "復号化" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: "暗号化" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
