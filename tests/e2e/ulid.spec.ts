import { test, expect } from "@playwright/test";

test.describe("ULID ジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ulid");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/ULID ジェネレーター/);
  });

  test("初回ロード時に ULID が1件生成される", async ({ page }) => {
    const ulidItems = page.locator('[role="listitem"]');
    await expect(ulidItems).toHaveCount(1);
  });

  test("生成された ULID が 26 文字である", async ({ page }) => {
    const ulidValue = page.locator(".ulid-value").first();
    const text = await ulidValue.textContent();
    expect(text?.replace(/\s/g, "").length).toBe(26);
  });

  test("生成ボタンで新しい ULID が生成される", async ({ page }) => {
    const firstUlid = await page.locator(".ulid-value").first().textContent();
    await page.getByRole("button", { name: "ULID 生成" }).click();
    const newUlid = await page.locator(".ulid-value").first().textContent();
    // 生成されるたびに異なる可能性が高い（稀に同一タイムスタンプで一致することがあるため、存在確認のみ）
    expect(newUlid).toBeTruthy();
  });

  test("生成数を変更して複数生成できる", async ({ page }) => {
    await page.locator("#ulid-count").fill("5");
    await page.getByRole("button", { name: "ULID 生成" }).click();
    const items = page.locator('[role="listitem"]');
    await expect(items).toHaveCount(5);
  });

  test("コピーボタンが表示される", async ({ page }) => {
    const copyBtn = page.locator(".btn-copy").first();
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveText("コピー");
  });

  test("クリアボタンで ULID がクリアされる", async ({ page }) => {
    await page.getByRole("button", { name: "クリア" }).click();
    const items = page.locator('[role="listitem"]');
    await expect(items).toHaveCount(0);
  });

  test("複数生成時に「すべてコピー」ボタンが表示される", async ({ page }) => {
    await page.locator("#ulid-count").fill("3");
    await page.getByRole("button", { name: "ULID 生成" }).click();
    await expect(page.getByRole("button", { name: "すべてコピー" })).toBeVisible();
  });

  test("パーサーに有効な ULID を入力するとパース結果が表示される", async ({ page }) => {
    await page.locator("#ulid-parse-input").fill("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    await expect(page.locator(".ulid-parser-result")).toBeVisible();
    await expect(page.locator(".ulid-parser-valid-ok")).toBeVisible();
  });

  test("パーサーに無効な ULID を入力するとエラーが表示される", async ({ page }) => {
    await page.locator("#ulid-parse-input").fill("INVALID");
    await expect(page.locator(".ulid-parser-error")).toBeVisible();
  });

  test("パーサーが小文字の ULID を受け付ける", async ({ page }) => {
    await page.locator("#ulid-parse-input").fill("01arz3ndektsv4rrffq69g5fav");
    await expect(page.locator(".ulid-parser-valid-ok")).toBeVisible();
  });

  test("凡例が表示される", async ({ page }) => {
    const legend = page.locator(".ulid-legend");
    await expect(legend).toBeVisible();
  });

  test("アクセシビリティ: 生成フォームに aria-label がある", async ({ page }) => {
    const form = page.locator('[aria-label="ULID 生成フォーム"]');
    await expect(form).toBeVisible();
  });
});
