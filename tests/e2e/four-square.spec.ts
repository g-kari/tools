import { expect, test } from "@playwright/test";

test.describe("四方格子暗号ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/four-square");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /四方格子暗号/i })).toBeVisible();
  });

  test("入力エリアと変換結果エリアが表示される", async ({ page }) => {
    await expect(page.locator("#four-square-input")).toBeVisible();
    await expect(page.locator("#four-square-output")).toBeVisible();
  });

  test("キーワード入力欄が2つ表示される", async ({ page }) => {
    await expect(page.locator("#four-square-key1")).toBeVisible();
    await expect(page.locator("#four-square-key2")).toBeVisible();
  });

  test("テキストを入力すると暗号化結果が表示される", async ({ page }) => {
    await page.locator("#four-square-input").fill("HELLO");
    const output = page.locator("#four-square-output");
    await expect(output).not.toContainText("変換結果がここに表示されます");
    const text = await output.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test("キーワードを変えると異なる暗号文になる", async ({ page }) => {
    await page.locator("#four-square-input").fill("ATTACK");
    await page.locator("#four-square-key1").fill("EXAMPLE");
    const output1 = await page.locator("#four-square-output").innerText();

    await page.locator("#four-square-key1").fill("SECRET");
    const output2 = await page.locator("#four-square-output").innerText();

    expect(output1.trim()).not.toBe(output2.trim());
  });

  test("コピーボタンが無効→有効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();
    await page.locator("#four-square-input").fill("TEST");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.locator("#four-square-input").fill("Hello");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#four-square-input")).toHaveValue("");
  });

  test("「結果を入力にセット」ボタンで復号化モードに切り替わる", async ({ page }) => {
    await page.locator("#four-square-input").fill("HELLO");
    await page.getByRole("button", { name: "結果を入力にセット" }).click();
    const decryptBtn = page.getByRole("button", { name: "復号化" });
    await expect(decryptBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("ダイグラフ変換が表示される", async ({ page }) => {
    await page.locator("#four-square-input").fill("HELLO");
    await expect(page.locator(".four-square-digraphs")).toBeVisible();
  });

  test("方陣可視化ボタンで4つの方陣が表示される", async ({ page }) => {
    await page.getByRole("button", { name: "方陣可視化" }).click();
    await expect(page.locator(".four-square-grid-layout")).toBeVisible();
    const grids = page.locator(".four-square-mini-grid");
    await expect(grids).toHaveCount(4);
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
