import { test, expect } from "@playwright/test";

test.describe("関数グラフ描画ツール (/function-plotter)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/function-plotter");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/関数グラフ描画/);
    await expect(page.getByRole("heading", { name: "関数グラフ描画" })).toBeVisible();
  });

  test("デフォルトで sin(x) が入力されている", async ({ page }) => {
    const input1 = page.getByLabel("関数 1 の数式入力");
    await expect(input1).toHaveValue("sin(x)");
  });

  test("4つの関数入力フィールドが表示される", async ({ page }) => {
    for (let i = 1; i <= 4; i++) {
      await expect(page.getByLabel(`関数 ${i} の数式入力`)).toBeVisible();
    }
  });

  test("キャンバス（グラフ描画エリア）が表示される", async ({ page }) => {
    await expect(page.getByRole("img", { name: "数学関数グラフ" })).toBeVisible();
  });

  test("サンプル関数ボタンが存在する", async ({ page }) => {
    const sampleGroup = page.getByRole("group", { name: "サンプル関数" });
    await expect(sampleGroup).toBeVisible();
    // サンプルボタンが複数存在することを確認
    const sampleButtons = sampleGroup.locator("button");
    await expect(sampleButtons).toHaveCount(await sampleButtons.count());
    expect(await sampleButtons.count()).toBeGreaterThan(0);
  });

  test("サンプル関数ボタンクリックで入力が設定される", async ({ page }) => {
    // sin(x) はすでに入力されているので別サンプルを選択
    const sampleGroup = page.getByRole("group", { name: "サンプル関数" });
    const firstBtn = sampleGroup.locator("button").first();
    const sampleLabel = await firstBtn.getAttribute("title");
    if (sampleLabel) {
      // 関数 1 を空にする
      await page.getByLabel("関数 1 の数式入力").fill("");
      await firstBtn.click();
      await expect(page.getByLabel("関数 1 の数式入力")).not.toHaveValue("");
    }
  });

  test("x 軸の範囲入力フィールドが表示される", async ({ page }) => {
    await expect(page.getByLabel("x軸最小値")).toBeVisible();
    await expect(page.getByLabel("x軸最大値")).toBeVisible();
  });

  test("y 軸の範囲入力フィールドが表示される", async ({ page }) => {
    await expect(page.getByLabel("y軸最小値")).toBeVisible();
    await expect(page.getByLabel("y軸最大値")).toBeVisible();
  });

  test("y 自動調整ボタンが存在する", async ({ page }) => {
    await expect(page.getByLabel("y軸範囲を自動調整")).toBeVisible();
  });

  test("デフォルト範囲は x: -10〜10, y: -6〜6", async ({ page }) => {
    await expect(page.getByLabel("x軸最小値")).toHaveValue("-10");
    await expect(page.getByLabel("x軸最大値")).toHaveValue("10");
    await expect(page.getByLabel("y軸最小値")).toHaveValue("-6");
    await expect(page.getByLabel("y軸最大値")).toHaveValue("6");
  });

  test("不正な式を入力するとエラーが表示される", async ({ page }) => {
    await page.getByLabel("関数 1 の数式入力").fill("sin(");
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("有効な式で凡例が表示される", async ({ page }) => {
    // sin(x) はデフォルトで入力されているので凡例が出ているはず
    await expect(page.getByLabel("凡例")).toBeVisible();
  });

  test("ON/OFF ボタンで関数を無効化できる", async ({ page }) => {
    const toggleBtn = page.getByLabel("関数 1 を無効化");
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    // 無効化後は「有効化」ラベルに変わる
    await expect(page.getByLabel("関数 1 を有効化")).toBeVisible();
  });

  test("PNG 出力ボタンが存在する", async ({ page }) => {
    await expect(page.getByRole("button", { name: "PNG" })).toBeVisible();
  });
});
