import { test, expect } from "@playwright/test";

test.describe("色名検索ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-name");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/色名検索/);
  });

  test("HEX入力フィールドが表示される", async ({ page }) => {
    const hexInput = page.locator("#cn-hex-input");
    await expect(hexInput).toBeVisible();
  });

  test("デフォルト色でTOP 10の結果が表示される", async ({ page }) => {
    const cards = page.locator(".cn-color-card");
    await expect(cards).toHaveCount(10);
  });

  test("HEXを入力すると結果が更新される", async ({ page }) => {
    const hexInput = page.locator("#cn-hex-input");
    await hexInput.fill("#FF0000");

    // 最上位が red であること
    const firstCard = page.locator(".cn-color-card").first();
    await expect(firstCard.locator(".cn-color-name")).toContainText("red");
  });

  test("完全一致色のバッジが「完全一致」と表示される", async ({ page }) => {
    const hexInput = page.locator("#cn-hex-input");
    await hexInput.fill("#FF0000");

    const exactBadge = page.locator(".cn-badge-exact").first();
    await expect(exactBadge).toBeVisible();
    await expect(exactBadge).toHaveText("完全一致");
  });

  test("入力スウォッチに完全一致の色名が表示される", async ({ page }) => {
    const hexInput = page.locator("#cn-hex-input");
    await hexInput.fill("#0000FF");

    const exactName = page.locator(".cn-exact-name");
    await expect(exactName).toBeVisible();
    await expect(exactName).toHaveText("blue");
  });

  test("無効なHEXを入力するとエラーメッセージが表示される", async ({ page }) => {
    const hexInput = page.locator("#cn-hex-input");
    await hexInput.fill("#GGGGGG");

    const errorMsg = page.locator(".cn-error-msg");
    await expect(errorMsg).toBeVisible();
  });

  test("無効なHEXでは結果グリッドが非表示になる", async ({ page }) => {
    const hexInput = page.locator("#cn-hex-input");
    await hexInput.fill("#GGGGGG");

    const grid = page.locator(".cn-results-grid");
    await expect(grid).not.toBeVisible();
  });

  test("名前コピーボタンが各カードに存在する", async ({ page }) => {
    const copyBtns = page.locator(".cn-copy-btn");
    // 各カードに2つのボタン(名前+HEX) × 10件 = 20
    const count = await copyBtns.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test("「全色を表示」ボタンでCSS色一覧が開く", async ({ page }) => {
    const toggleBtn = page.locator(".cn-toggle-btn");
    await expect(toggleBtn).toBeVisible();

    await toggleBtn.click();

    const allGrid = page.locator(".cn-all-grid");
    await expect(allGrid).toBeVisible();

    // 135色以上のアイテムが存在する
    const items = page.locator(".cn-all-item");
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(135);
  });

  test("全色一覧の色をクリックすると入力に反映される", async ({ page }) => {
    // 全色一覧を開く
    await page.locator(".cn-toggle-btn").click();

    // tomato をクリック
    const tomatoBtn = page.locator(".cn-all-item").filter({ hasText: "tomato" });
    await tomatoBtn.first().click();

    // HEX入力が #FF6347 になること
    const hexInput = page.locator("#cn-hex-input");
    await expect(hexInput).toHaveValue(/FF6347/i);
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tips = page.locator(".tips-card").or(page.getByText("使い方"));
    await expect(tips.first()).toBeVisible();
  });

  test("ΔE情報が結果カードに表示される", async ({ page }) => {
    const deltaE = page.locator(".cn-delta-e").first();
    await expect(deltaE).toBeVisible();
    await expect(deltaE).toContainText("ΔE");
  });

  test("ナビゲーションに「色名検索」が表示される", async ({ page }) => {
    await page.goto("/top");
    const navLink = page.getByRole("link", { name: "色名検索" });
    await expect(navLink).toBeVisible();
  });
});
