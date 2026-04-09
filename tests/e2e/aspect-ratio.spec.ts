import { test, expect } from "@playwright/test";

test.describe("アスペクト比計算機ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aspect-ratio");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "幅・高さからアスペクト比を計算" }),
    ).toBeVisible();
  });

  test("幅と高さの入力フィールドが表示される", async ({ page }) => {
    await expect(page.getByLabel("幅（ピクセル）")).toBeVisible();
    await expect(page.getByLabel("高さ（ピクセル）")).toBeVisible();
  });

  test("デフォルト値 1920x1080 が入力されている", async ({ page }) => {
    await expect(page.getByLabel("幅（ピクセル）")).toHaveValue("1920");
    await expect(page.getByLabel("高さ（ピクセル）")).toHaveValue("1080");
  });

  test("1920x1080 で 16:9 が表示される", async ({ page }) => {
    const result = page.getByRole("region", {
      name: "アスペクト比の計算結果",
    });
    await expect(result).toContainText("16:9");
  });

  test("1280x960 で 4:3 が表示される", async ({ page }) => {
    await page.getByLabel("幅（ピクセル）").fill("1280");
    await page.getByLabel("高さ（ピクセル）").fill("960");
    await expect(page.getByRole("region", { name: "アスペクト比の計算結果" })).toContainText("4:3");
  });

  test("正方形（100x100）で 1:1 が表示される", async ({ page }) => {
    await page.getByLabel("幅（ピクセル）").fill("100");
    await page.getByLabel("高さ（ピクセル）").fill("100");
    await expect(page.getByRole("region", { name: "アスペクト比の計算結果" })).toContainText("1:1");
  });

  test("小数値も表示される", async ({ page }) => {
    const result = page.getByRole("region", {
      name: "アスペクト比の計算結果",
    });
    await expect(result).toContainText("1.7778");
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /アスペクト比.*をコピー/ })).toBeVisible();
  });

  test("アスペクト比プリセットセクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "よく使われる比率" })).toBeVisible();
  });

  test("16:9 プリセットが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: /16:9/ })).toBeVisible();
  });

  test("プリセットをクリックすると比率が更新される", async ({ page }) => {
    await page.getByRole("button", { name: /4:3/ }).click();
    await expect(page.getByLabel("比率の幅")).toHaveValue("4");
    await expect(page.getByLabel("比率の高さ")).toHaveValue("3");
  });

  test("比→寸法変換セクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "アスペクト比から寸法を計算" })).toBeVisible();
  });

  test("幅1920で高さ1080が計算される", async ({ page }) => {
    await expect(page.getByLabel(/高さ: 1080px/)).toBeVisible();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("アスペクト比について")).toBeVisible();
  });

  test("プレビューセクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "プレビュー" })).toBeVisible();
  });

  test("比率入力を変更できる", async ({ page }) => {
    const ratioW = page.getByLabel("比率の幅");
    await ratioW.fill("21");
    const ratioH = page.getByLabel("比率の高さ");
    await ratioH.fill("9");
    await expect(ratioW).toHaveValue("21");
    await expect(ratioH).toHaveValue("9");
  });
});
