import { test, expect } from "@playwright/test";

test.describe("ビット演算計算機ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/bitwise");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "ビット演算計算機" })).toBeVisible();
  });

  test("入力Aセクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "入力 A" })).toBeVisible();
  });

  test("入力Bセクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "入力 B" })).toBeVisible();
  });

  test("演算結果セクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "演算結果（A op B）" })).toBeVisible();
  });

  test("シフト演算セクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "シフト演算（A）" })).toBeVisible();
  });

  test("デフォルト値 A=42, B=15 が入力されている", async ({ page }) => {
    const inputA = page.getByLabel("Aの値（10進数）");
    const inputB = page.getByLabel("Bの値（10進数）");
    await expect(inputA).toHaveValue("42");
    await expect(inputB).toHaveValue("15");
  });

  test("AND演算の結果が表示される", async ({ page }) => {
    const table = page.getByRole("table", { name: "ビット演算結果一覧" });
    await expect(table).toBeVisible();
    // 42 & 15 = 10
    await expect(table).toContainText("AND");
    await expect(table).toContainText("10");
  });

  test("OR演算の結果が表示される", async ({ page }) => {
    const table = page.getByRole("table", { name: "ビット演算結果一覧" });
    // 42 | 15 = 47
    await expect(table).toContainText("OR");
    await expect(table).toContainText("47");
  });

  test("XOR演算の結果が表示される", async ({ page }) => {
    const table = page.getByRole("table", { name: "ビット演算結果一覧" });
    // 42 ^ 15 = 37
    await expect(table).toContainText("XOR");
    await expect(table).toContainText("37");
  });

  test("基数を2進数に切り替えて入力できる", async ({ page }) => {
    const selectA = page.getByLabel("入力Aの基数");
    await selectA.selectOption("2");
    const inputA = page.getByLabel("Aの値（2進数）");
    await inputA.fill("1010");
    // 1010(2) = 10(10)
    await expect(page.locator(".bw-repr-grid").first()).toContainText("10");
  });

  test("無効な入力でエラーが表示される", async ({ page }) => {
    const inputA = page.getByLabel("Aの値（10進数）");
    await inputA.fill("abc");
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("入力を変更すると演算結果が更新される", async ({ page }) => {
    const inputA = page.getByLabel("Aの値（10進数）");
    await inputA.fill("255");
    const inputB = page.getByLabel("Bの値（10進数）");
    await inputB.fill("240");
    // 255 & 240 = 240
    const table = page.getByRole("table", { name: "ビット演算結果一覧" });
    await expect(table).toContainText("240");
  });

  test("32ビットビット表示が表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "ビット演算ビジュアル" })).toBeVisible();
  });

  test("シフト量を変更できる", async ({ page }) => {
    const shiftInput = page.getByLabel("シフト量（0〜31ビット）");
    await shiftInput.fill("3");
    // 42 << 3 = 336
    await expect(page.locator(".bw-shift-results")).toContainText("336");
  });

  test("コピーボタンが表示される", async ({ page }) => {
    const copyBtns = page.locator(".bw-op-copy-btn");
    await expect(copyBtns.first()).toBeVisible();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("ビット演算について")).toBeVisible();
  });

  test("16進数で入力できる", async ({ page }) => {
    const selectA = page.getByLabel("入力Aの基数");
    await selectA.selectOption("16");
    const inputA = page.getByLabel("Aの値（16進数）");
    await inputA.fill("FF");
    // FF(16) = 255(10)
    await expect(page.locator(".bw-repr-grid").first()).toContainText("255");
  });
});
