import { test, expect } from "@playwright/test";

test.describe("複利計算機 - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/compound-interest");
    await page.waitForLoadState("networkidle");
  });

  test("undefinedコンテンツを含まずにページをロードできる", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("正しいページタイトルを表示する", async ({ page }) => {
    await expect(page).toHaveTitle(/複利計算機/);
  });

  test("アクセシビリティ属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("入力フォームが表示される", async ({ page }) => {
    await expect(page.locator("#ci-principal")).toBeVisible();
    await expect(page.locator("#ci-rate")).toBeVisible();
    await expect(page.locator("#ci-term")).toBeVisible();
    await expect(page.locator("#ci-frequency")).toBeVisible();
    await expect(page.locator("#ci-contribution")).toBeVisible();
  });

  test("デフォルト値で計算結果が表示される", async ({ page }) => {
    const summary = page.locator(".ci-summary");
    await expect(summary).toBeVisible();

    const cards = page.locator(".ci-summary-card");
    await expect(cards).toHaveCount(3);
  });

  test("最終残高カードが表示される", async ({ page }) => {
    const primaryCard = page.locator(".ci-summary-card.primary");
    await expect(primaryCard).toBeVisible();
    await expect(primaryCard).toContainText("最終残高");
  });

  test("元本合計・総利息カードが表示される", async ({ page }) => {
    const cards = page.locator(".ci-summary-card");
    await expect(cards.nth(1)).toContainText("元本合計");
    await expect(cards.nth(2)).toContainText("総利息");
  });

  test("比率バーが表示される", async ({ page }) => {
    const ratioBar = page.locator(".ci-ratio-bar");
    await expect(ratioBar).toBeVisible();
    const ratioTrack = page.locator(".ci-ratio-track");
    await expect(ratioTrack).toBeVisible();
  });

  test("複利計算頻度選択肢が4つある", async ({ page }) => {
    const options = page.locator("#ci-frequency option");
    await expect(options).toHaveCount(4);
  });

  test("年利率を変更すると計算結果が更新される", async ({ page }) => {
    const primaryCard = page.locator(".ci-summary-card.primary");
    const initialValue = await primaryCard.locator(".ci-summary-value").textContent();

    await page.locator("#ci-rate").fill("10");
    const newValue = await primaryCard.locator(".ci-summary-value").textContent();

    expect(newValue).not.toBe(initialValue);
  });

  test("運用期間を変更すると計算結果が更新される", async ({ page }) => {
    const primaryCard = page.locator(".ci-summary-card.primary");
    const initialValue = await primaryCard.locator(".ci-summary-value").textContent();

    await page.locator("#ci-term").fill("20");
    const newValue = await primaryCard.locator(".ci-summary-value").textContent();

    expect(newValue).not.toBe(initialValue);
  });

  test("追加積立金を設定すると積立ラベルが表示される", async ({ page }) => {
    await page.locator("#ci-contribution").fill("10000");

    const ratioLabel = page.locator(".ci-ratio-bar-label");
    await expect(ratioLabel).toContainText("積立");
  });

  test("年別内訳ボタンをクリックするとテーブルが展開される", async ({ page }) => {
    const toggleBtn = page.locator(".ci-schedule-toggle").last();
    await expect(toggleBtn).toContainText("年別内訳");

    await toggleBtn.click();
    const table = page.locator("#ci-schedule-table");
    await expect(table).toBeVisible();
  });

  test("年別内訳テーブルに正しい列ヘッダーがある", async ({ page }) => {
    const toggleBtn = page.locator(".ci-schedule-toggle").last();
    await toggleBtn.click();

    const table = page.locator(".ci-schedule-table");
    await expect(table.locator("th").nth(0)).toContainText("年");
    await expect(table.locator("th").nth(1)).toContainText("残高");
    await expect(table.locator("th").nth(2)).toContainText("元本累計");
    await expect(table.locator("th").nth(3)).toContainText("利息累計");
    await expect(table.locator("th").nth(4)).toContainText("当年利息");
  });

  test("年別内訳ボタンを再クリックするとテーブルが閉じる", async ({ page }) => {
    const toggleBtn = page.locator(".ci-schedule-toggle").last();
    await toggleBtn.click();
    await expect(page.locator("#ci-schedule-table")).toBeVisible();

    await toggleBtn.click();
    await expect(page.locator("#ci-schedule-table")).not.toBeVisible();
  });

  test("無効な元本入力でエラーが表示される", async ({ page }) => {
    await page.locator("#ci-principal").fill("-1");
    const error = page.locator(".ci-error");
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute("role", "alert");
  });

  test("年利率100%超でエラーが表示される", async ({ page }) => {
    await page.locator("#ci-rate").fill("101");
    const error = page.locator(".ci-error");
    await expect(error).toBeVisible();
  });

  test("結果をコピーボタンが表示される", async ({ page }) => {
    const copyBtn = page.locator('[aria-label="計算結果をクリップボードにコピー"]');
    await expect(copyBtn).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tips = page.locator('.tips-card, [class*="tips"]');
    await expect(tips.first()).toBeVisible();
  });

  test("デフォルト10年の内訳テーブルが10行になる", async ({ page }) => {
    const toggleBtn = page.locator(".ci-schedule-toggle").last();
    await toggleBtn.click();

    const rows = page.locator(".ci-schedule-table tbody tr");
    await expect(rows).toHaveCount(10);
  });
});
