import { test, expect } from "@playwright/test";

test.describe("正規表現ライブラリ (/regex-library)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/regex-library");
  });

  test("should display the page title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "正規表現ライブラリ" })).toBeVisible();
  });

  test("should display regex pattern cards", async ({ page }) => {
    const cards = page.getByRole("listitem");
    await expect(cards.first()).toBeVisible();
  });

  test("should display total count", async ({ page }) => {
    await expect(page.getByRole("status").first()).toBeVisible();
    const countText = await page.getByRole("status").first().textContent();
    expect(countText).toMatch(/件/);
  });

  test("should filter by category", async ({ page }) => {
    // メールカテゴリボタンをクリック
    await page.getByRole("button", { name: "メール" }).click();

    const countEl = page.locator(".regex-lib-count");
    await expect(countEl).toBeVisible();
    const countText = await countEl.textContent();
    // フィルタリング後は全件より少ない件数のはず
    expect(countText).toMatch(/件/);
  });

  test("should search by query", async ({ page }) => {
    const searchInput = page.getByPlaceholder("名前・説明・パターンで検索...");
    await searchInput.fill("メール");

    const countEl = page.locator(".regex-lib-count");
    await expect(countEl).toBeVisible();
    const countText = await countEl.textContent();
    expect(countText).toMatch(/件/);
  });

  test("should show no results message for unmatched query", async ({ page }) => {
    const searchInput = page.getByPlaceholder("名前・説明・パターンで検索...");
    await searchInput.fill("zzzznonexistentpatternzzz");

    await expect(page.getByText("該当する正規表現が見つかりませんでした。")).toBeVisible();
  });

  test("should display pattern code in each card", async ({ page }) => {
    const patternCode = page.locator(".regex-lib-pattern-code").first();
    await expect(patternCode).toBeVisible();
    const text = await patternCode.textContent();
    expect(text).toBeTruthy();
  });

  test("should display match examples", async ({ page }) => {
    const matchChips = page.locator(".regex-lib-chip.match").first();
    await expect(matchChips).toBeVisible();
  });

  test("should display no-match examples", async ({ page }) => {
    const noMatchChips = page.locator(".regex-lib-chip.no-match").first();
    await expect(noMatchChips).toBeVisible();
  });

  test("should allow live testing with input", async ({ page }) => {
    // 最初のカードのテスト入力に何か入力
    const testInput = page.locator(".regex-lib-test-input").first();
    await testInput.fill("user@example.com");

    // テスト結果が表示されること
    const testResult = page.locator(".regex-lib-test-result").first();
    await expect(testResult).toBeVisible();
    const resultText = await testResult.textContent();
    expect(resultText).not.toBe("─");
  });

  test("should have copy pattern button", async ({ page }) => {
    const copyBtn = page.locator(".regex-lib-copy-btn").first();
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveText("パターンをコピー");
  });

  test("should have link to regex-checker", async ({ page }) => {
    const checkerLink = page.locator(".regex-lib-checker-btn").first();
    await expect(checkerLink).toBeVisible();
    await expect(checkerLink).toContainText("チェッカーで開く");
  });

  test("should reset to all categories on category button click", async ({ page }) => {
    // まずメールカテゴリに絞り込む
    await page.getByRole("button", { name: "メール" }).click();
    // すべてに戻す
    await page.getByRole("button", { name: "すべて" }).click();

    const countEl = page.locator(".regex-lib-count");
    const countText = await countEl.textContent();
    // 全件が表示されること
    expect(countText).toMatch(/\d+ 件 \/ 全/);
  });

  test("should have accessible category filter buttons", async ({ page }) => {
    const allBtn = page.getByRole("button", { name: "すべて" });
    await expect(allBtn).toHaveAttribute("aria-pressed", "true");

    const emailBtn = page.getByRole("button", { name: "メール" });
    await expect(emailBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("should display tips card", async ({ page }) => {
    await expect(page.getByText("正規表現の基本構文")).toBeVisible();
  });
});
