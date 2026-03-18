import { test, expect } from "@playwright/test";

test.describe("Nano ID ジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/nano-id");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Nano ID ジェネレーター/);
  });

  test("初回ロード時に Nano ID が 1 件生成される", async ({ page }) => {
    const items = page.locator('[role="listitem"]');
    await expect(items).toHaveCount(1);
  });

  test("生成された Nano ID がデフォルト 21 文字である", async ({ page }) => {
    const value = page.locator(".nanoid-value").first();
    const text = await value.textContent();
    expect(text?.trim().length).toBe(21);
  });

  test("生成ボタンで新しい Nano ID が生成される", async ({ page }) => {
    await page.getByRole("button", { name: "Nano ID 生成" }).click();
    const value = page.locator(".nanoid-value").first();
    await expect(value).toBeVisible();
  });

  test("サイズ変更で指定文字数の ID が生成される", async ({ page }) => {
    await page.locator("#nanoid-size").fill("10");
    await page.getByRole("button", { name: "Nano ID 生成" }).click();
    const value = page.locator(".nanoid-value").first();
    const text = await value.textContent();
    expect(text?.trim().length).toBe(10);
  });

  test("生成数を変更して複数生成できる", async ({ page }) => {
    await page.locator("#nanoid-count").fill("5");
    await page.getByRole("button", { name: "Nano ID 生成" }).click();
    const items = page.locator('[role="listitem"]');
    await expect(items).toHaveCount(5);
  });

  test("コピーボタンが表示される", async ({ page }) => {
    const copyBtn = page.locator(".btn-copy").first();
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveText("コピー");
  });

  test("クリアボタンで ID がクリアされる", async ({ page }) => {
    await page.getByRole("button", { name: "クリア" }).click();
    const items = page.locator('[role="listitem"]');
    await expect(items).toHaveCount(0);
  });

  test("複数生成時に「すべてコピー」ボタンが表示される", async ({ page }) => {
    await page.locator("#nanoid-count").fill("3");
    await page.getByRole("button", { name: "Nano ID 生成" }).click();
    await expect(
      page.getByRole("button", { name: "すべてコピー" })
    ).toBeVisible();
  });

  test("プリセット選択が存在する", async ({ page }) => {
    const select = page.locator("#nanoid-preset");
    await expect(select).toBeVisible();
  });

  test("アルファベット入力フィールドが存在する", async ({ page }) => {
    const input = page.locator("#nanoid-alphabet");
    await expect(input).toBeVisible();
  });

  test("エントロピー情報が表示される", async ({ page }) => {
    const hint = page.locator(".nanoid-hint");
    await expect(hint).toBeVisible();
    const text = await hint.textContent();
    expect(text).toContain("エントロピー");
  });

  test("アクセシビリティ: 生成フォームに aria-label がある", async ({
    page,
  }) => {
    const form = page.locator('[aria-label="Nano ID 生成フォーム"]');
    await expect(form).toBeVisible();
  });

  test("アクセシビリティ: 結果リストに aria-label がある", async ({ page }) => {
    const list = page.locator('[aria-label="生成した Nano ID"]');
    await expect(list).toBeVisible();
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.getByText("Nano ID とは")).toBeVisible();
  });
});
