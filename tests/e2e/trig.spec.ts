import { test, expect } from "@playwright/test";

test.describe("三角関数計算機 (/trig)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/trig");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/三角関数計算機/);
  });

  test("角度入力フィールドが表示される", async ({ page }) => {
    const input = page.getByRole("spinbutton", { name: /角度の値/ });
    await expect(input).toBeVisible();
  });

  test("初期値 45 度で sin/cos/tan が表示される", async ({ page }) => {
    const input = page.getByRole("spinbutton", { name: /角度の値/ });
    await expect(input).toHaveValue("45");
    // sin 45° ≈ 0.7071...
    await expect(page.locator(".trig-values-grid")).toContainText("sin");
    await expect(page.locator(".trig-values-grid")).toContainText("cos");
    await expect(page.locator(".trig-values-grid")).toContainText("tan");
  });

  test("角度を変更すると値が更新される", async ({ page }) => {
    const input = page.getByRole("spinbutton", { name: /角度の値/ });
    await input.fill("90");
    // tan(90°) は未定義
    const tanCard = page.locator(".trig-val-card").filter({ hasText: "tan" });
    await expect(tanCard).toContainText("未定義");
  });

  test("単位をラジアンに切り替えられる", async ({ page }) => {
    const select = page.getByRole("combobox", { name: /角度の単位/ });
    await select.selectOption("rad");
    // 45° = π/4 rad ≈ 0.7854
    const input = page.getByRole("spinbutton", { name: /角度の値/ });
    const val = await input.inputValue();
    expect(parseFloat(val)).toBeCloseTo(Math.PI / 4, 3);
  });

  test("クイック選択ボタンで角度を変更できる", async ({ page }) => {
    const btn90 = page.getByRole("button", { name: /90度を選択/ });
    await btn90.click();
    const input = page.getByRole("spinbutton", { name: /角度の値/ });
    const val = await input.inputValue();
    expect(parseFloat(val)).toBeCloseTo(90, 3);
  });

  test("角度変換グリッドが表示される", async ({ page }) => {
    await expect(page.locator(".trig-conversion-grid")).toBeVisible();
    await expect(page.locator(".trig-conversion-grid")).toContainText("rad");
    await expect(page.locator(".trig-conversion-grid")).toContainText("grad");
    await expect(page.locator(".trig-conversion-grid")).toContainText("turn");
  });

  test("逆三角関数セクションが表示される", async ({ page }) => {
    await expect(page.locator(".trig-inverse-grid")).toBeVisible();
    await expect(page.locator(".trig-inverse-grid")).toContainText("arcsin");
    await expect(page.locator(".trig-inverse-grid")).toContainText("arccos");
    await expect(page.locator(".trig-inverse-grid")).toContainText("arctan");
  });

  test("arcsin に 0.5 を入力すると 30° が表示される", async ({ page }) => {
    const asinInput = page.getByLabel(/arcsin .* の入力値/);
    await asinInput.fill("0.5");
    await expect(page.locator(".trig-inverse-grid")).toContainText("30");
  });

  test("arcsin に範囲外の値を入力するとエラーが表示される", async ({ page }) => {
    const asinInput = page.getByLabel(/arcsin .* の入力値/);
    await asinInput.fill("2");
    await expect(page.locator(".trig-inverse-grid")).toContainText("入力範囲");
  });

  test("よく使う角度テーブルが表示される", async ({ page }) => {
    const table = page.locator(".trig-table");
    await expect(table).toBeVisible();
    await expect(table).toContainText("0°");
    await expect(table).toContainText("90°");
    await expect(table).toContainText("180°");
    await expect(table).toContainText("360°");
    await expect(table).toContainText("π/2");
  });

  test("よく使う角度テーブルで 90° の tan が「未定義」と表示される", async ({ page }) => {
    const table = page.locator(".trig-table");
    const row90 = table.locator("tr").filter({ hasText: "90°" });
    await expect(row90).toContainText("未定義");
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.locator(".tips-card")).toBeVisible();
    await expect(page.locator(".tips-card")).toContainText("ラジアン");
  });

  test("ナビゲーションから /trig にアクセスできる", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "三角関数計算機" }).click();
    await expect(page).toHaveURL(/\/trig/);
  });
});
