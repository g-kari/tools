import { test, expect } from "@playwright/test";

test.describe("Random Picker - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/random-picker");
    await page.waitForSelector(".tool-container");
  });

  test('should load the page without "undefined" content', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/ランダムピッカー/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator(".section-title").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("抽選リスト");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display textarea with default items", async ({ page }) => {
    const textarea = page.locator("textarea#picker-items");
    await expect(textarea).toBeVisible();
    const value = await textarea.inputValue();
    expect(value).toContain("Alice");
    expect(value).toContain("Bob");
  });

  test("should show item count badge", async ({ page }) => {
    const badge = page.locator(".picker-total-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("件");
  });

  test("should pick one item and show result", async ({ page }) => {
    const pickButton = page.locator('button.btn-primary:has-text("抽選する")');
    await pickButton.click();

    const resultSection = page.locator(".picker-result");
    await expect(resultSection).toBeVisible();

    const resultItems = page.locator(".picker-result-item");
    await expect(resultItems).toHaveCount(1);
  });

  test("should show result in history after picking", async ({ page }) => {
    const pickButton = page.locator('button.btn-primary:has-text("抽選する")');
    await pickButton.click();

    const historySection = page.locator(".picker-history");
    await expect(historySection).toBeVisible();

    const historyItems = page.locator(".picker-history-item");
    await expect(historyItems).toHaveCount(1);
  });

  test("should pick multiple items when count is set to 3", async ({ page }) => {
    const countInput = page.locator("input#pick-count");
    await countInput.fill("3");

    const pickButton = page.locator('button.btn-primary:has-text("抽選する")');
    await pickButton.click();

    const resultItems = page.locator(".picker-result-item");
    await expect(resultItems).toHaveCount(3);
  });

  test("should show reset button in without-replacement mode", async ({ page }) => {
    const resetButton = page.locator('button:has-text("リセット")');
    await expect(resetButton).toBeVisible();
  });

  test("should reduce remaining count after picking in without-replacement mode", async ({
    page,
  }) => {
    const remainingBadge = page.locator(".picker-remaining-badge");
    const beforeText = await remainingBadge.textContent();
    const beforeCount = parseInt(beforeText?.replace(/\D/g, "") ?? "0");

    const pickButton = page.locator('button.btn-primary:has-text("抽選する")');
    await pickButton.click();

    const afterText = await remainingBadge.textContent();
    const afterCount = parseInt(afterText?.replace(/\D/g, "") ?? "0");

    expect(afterCount).toBe(beforeCount - 1);
  });

  test("should reset remaining count after clicking reset button", async ({ page }) => {
    const pickButton = page.locator('button.btn-primary:has-text("抽選する")');
    await pickButton.click();

    const resetButton = page.locator('button:has-text("リセット")');
    await resetButton.click();

    const remainingBadge = page.locator(".picker-remaining-badge");
    const totalBadge = page.locator(".picker-total-badge");

    const totalText = await totalBadge.textContent();
    const remainingText = await remainingBadge.textContent();

    const total = parseInt(totalText?.replace(/\D/g, "") ?? "0");
    const remaining = parseInt(remainingText?.replace(/\D/g, "") ?? "0");

    expect(remaining).toBe(total);
  });

  test("should shuffle items when clicking shuffle button", async ({ page }) => {
    const textarea = page.locator("textarea#picker-items");
    const initialValue = await textarea.inputValue();

    const shuffleButton = page.locator('button:has-text("シャッフル")');
    await shuffleButton.click();

    // シャッフル後もアイテムが含まれていることを確認
    const afterValue = await textarea.inputValue();
    expect(afterValue.split("\n").sort()).toEqual(initialValue.split("\n").sort());
  });

  test("should accumulate history across multiple picks", async ({ page }) => {
    const pickButton = page.locator('button.btn-primary:has-text("抽選する")');

    await pickButton.click();
    await pickButton.click();
    await pickButton.click();

    const historyItems = page.locator(".picker-history-item");
    await expect(historyItems).toHaveCount(3);
  });

  test("should clear history when clicking clear button", async ({ page }) => {
    const pickButton = page.locator('button.btn-primary:has-text("抽選する")');
    await pickButton.click();
    await pickButton.click();

    const clearButton = page.locator('button.btn-clear:has-text("履歴をクリア")');
    await clearButton.click();

    const historySection = page.locator(".picker-history");
    await expect(historySection).not.toBeVisible();
  });

  test("should switch to restoration mode and hide reset button", async ({ page }) => {
    const restorationRadio = page.locator('input[name="pick-mode"]').nth(1);
    await restorationRadio.click();

    const resetButton = page.locator('button:has-text("リセット")');
    await expect(resetButton).not.toBeVisible();
  });

  test("should not reduce count in restoration mode", async ({ page }) => {
    const restorationRadio = page.locator('input[name="pick-mode"]').nth(1);
    await restorationRadio.click();

    const totalBadge = page.locator(".picker-total-badge");
    const beforeText = await totalBadge.textContent();

    const pickButton = page.locator('button.btn-primary:has-text("抽選する")');
    await pickButton.click();
    await pickButton.click();

    const afterText = await totalBadge.textContent();
    expect(afterText).toBe(beforeText);
  });

  test("should display ゲーム category in nav with active state", async ({ page }) => {
    const activeCategory = page.locator(".nav-category-btn.active");
    await expect(activeCategory).toContainText("ゲーム");
  });

  test("should show ランダムピッカー link in ゲーム category dropdown", async ({ page }) => {
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "ゲーム" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator('a[href="/random-picker"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("ランダムピッカー");
  });

  test("should display tips card", async ({ page }) => {
    const infoBox = page.locator(".info-box").first();
    await expect(infoBox).toBeVisible();
    const text = await infoBox.textContent();
    expect(text).toContain("ランダムピッカーとは");
  });
});
