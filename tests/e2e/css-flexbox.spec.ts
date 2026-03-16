import { test, expect } from "@playwright/test";

test.describe("CSSフレックスボックスジェネレーターページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-flexbox");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "CSSフレックスボックスジェネレーター" })
    ).toBeVisible();
  });

  test("コンテナプロパティセクションが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "コンテナプロパティ" })
    ).toBeVisible();
  });

  test("flex-direction セレクトが存在する", async ({ page }) => {
    const select = page.getByLabel("flex-direction の値");
    await expect(select).toBeVisible();
    await expect(select).toHaveValue("row");
  });

  test("justify-content セレクトが存在する", async ({ page }) => {
    const select = page.getByLabel("justify-content の値");
    await expect(select).toBeVisible();
    await expect(select).toHaveValue("flex-start");
  });

  test("align-items セレクトが存在する", async ({ page }) => {
    const select = page.getByLabel("align-items の値");
    await expect(select).toBeVisible();
    await expect(select).toHaveValue("stretch");
  });

  test("flex-wrap セレクトが存在する", async ({ page }) => {
    const select = page.getByLabel("flex-wrap の値");
    await expect(select).toBeVisible();
    await expect(select).toHaveValue("nowrap");
  });

  test("デフォルトで3つのアイテムが表示される", async ({ page }) => {
    const items = page.locator(".cfb-item-card");
    await expect(items).toHaveCount(3);
  });

  test("アイテム追加ボタンでアイテムが増える", async ({ page }) => {
    await page.getByLabel("フレックスアイテムを追加").click();
    const items = page.locator(".cfb-item-card");
    await expect(items).toHaveCount(4);
  });

  test("アイテム削除ボタンでアイテムが減る", async ({ page }) => {
    await page.getByLabel("Item 3を削除").click();
    const items = page.locator(".cfb-item-card");
    await expect(items).toHaveCount(2);
  });

  test("プレビューエリアが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "ライブプレビュー" })
    ).toBeVisible();
    await expect(page.locator(".cfb-preview-container")).toBeVisible();
  });

  test("プレビューにデフォルト3つのアイテムが表示される", async ({ page }) => {
    const previewItems = page.locator(".cfb-preview-item");
    await expect(previewItems).toHaveCount(3);
  });

  test("CSS出力エリアが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "生成 CSS" })
    ).toBeVisible();
    await expect(page.locator(".cfb-css-output")).toBeVisible();
  });

  test("生成CSSに display: flex が含まれる", async ({ page }) => {
    const cssOutput = page.locator(".cfb-css-output");
    await expect(cssOutput).toContainText("display: flex;");
  });

  test("flex-direction を変更するとCSSが更新される", async ({ page }) => {
    await page.getByLabel("flex-direction の値").selectOption("column");
    const cssOutput = page.locator(".cfb-css-output");
    await expect(cssOutput).toContainText("flex-direction: column;");
  });

  test("justify-content を変更するとCSSが更新される", async ({ page }) => {
    await page.getByLabel("justify-content の値").selectOption("center");
    const cssOutput = page.locator(".cfb-css-output");
    await expect(cssOutput).toContainText("justify-content: center;");
  });

  test("flex-wrap を wrap に変更すると align-content が表示される", async ({
    page,
  }) => {
    await page.getByLabel("flex-wrap の値").selectOption("wrap");
    await expect(page.getByLabel("align-content の値")).toBeVisible();
  });

  test("アイテムをクリックするとプロパティパネルが開く", async ({ page }) => {
    await page.getByLabel("Item 1のプロパティを開く").click();
    await expect(page.getByText("Item 1 のプロパティ")).toBeVisible();
  });

  test("アイテムのflex-growを設定するとCSSが更新される", async ({ page }) => {
    await page.getByLabel("Item 1のプロパティを開く").click();
    await page.getByLabel("flex-grow の値").fill("2");
    await page.getByLabel("flex-grow の値").blur();
    const cssOutput = page.locator(".cfb-css-output");
    await expect(cssOutput).toContainText("flex: 2");
  });

  test("コピーボタンが存在する", async ({ page }) => {
    await expect(
      page.getByLabel("生成されたCSSをクリップボードにコピー")
    ).toBeVisible();
  });

  test("リセットボタンでデフォルト状態に戻る", async ({ page }) => {
    await page.getByLabel("flex-direction の値").selectOption("column");
    await page.getByLabel("すべての設定をリセット").click();
    await expect(page.getByLabel("flex-direction の値")).toHaveValue("row");
    const items = page.locator(".cfb-item-card");
    await expect(items).toHaveCount(3);
  });

  test("ページにTipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });
});
