import { test, expect } from "@playwright/test";

test.describe("CSS Scroll Snapジェネレーターページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-scroll-snap");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "CSS Scroll Snapジェネレーター" }),
    ).toBeVisible();
  });

  test("プリセットセクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "プリセット" })).toBeVisible();
  });

  test("プリセットボタンが複数表示される", async ({ page }) => {
    const presetBtns = page.locator(".css-ss-preset-btn");
    await expect(presetBtns).toHaveCount(6);
  });

  test("コンテナ設定セクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "コンテナ設定" })).toBeVisible();
  });

  test("アイテム設定セクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "アイテム設定" })).toBeVisible();
  });

  test("ライブプレビューセクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "ライブプレビュー" })).toBeVisible();
  });

  test("生成CSSセクションが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "生成 CSS" })).toBeVisible();
  });

  test("方向のトグルボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("方向: x")).toBeVisible();
    await expect(page.getByLabel("方向: y")).toBeVisible();
    await expect(page.getByLabel("方向: both")).toBeVisible();
  });

  test("厳密さのトグルボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("厳密さ: mandatory")).toBeVisible();
    await expect(page.getByLabel("厳密さ: proximity")).toBeVisible();
  });

  test("snap-align のトグルボタンが表示される", async ({ page }) => {
    await expect(page.getByLabel("align: start")).toBeVisible();
    await expect(page.getByLabel("align: center")).toBeVisible();
    await expect(page.getByLabel("align: end")).toBeVisible();
  });

  test("リセットボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "すべての設定をリセット" })).toBeVisible();
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(
      page.getByRole("button", {
        name: "生成されたCSSをクリップボードにコピー",
      }),
    ).toBeVisible();
  });

  test("生成CSSにscroll-snap-typeが含まれる", async ({ page }) => {
    const output = page.locator(".css-ss-css-output");
    await expect(output).toContainText("scroll-snap-type:");
  });

  test("プリセットを適用するとCSSが更新される", async ({ page }) => {
    const verticalBtn = page.locator(".css-ss-preset-btn", {
      hasText: "縦スクロール",
    });
    await verticalBtn.click();
    const output = page.locator(".css-ss-css-output");
    await expect(output).toContainText("scroll-snap-type: y");
  });

  test("方向ボタンをクリックするとCSSが更新される", async ({ page }) => {
    await page.getByLabel("方向: y").click();
    const output = page.locator(".css-ss-css-output");
    await expect(output).toContainText("overflow-y:");
  });
});
