import { test, expect } from "@playwright/test";

test.describe("Cron式パーサー (croner) - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cron");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正常に表示される", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Cron/);
  });

  test("Cron式入力フィールドが存在する", async ({ page }) => {
    const cronInput = page.locator("#cron-expression");
    await expect(cronInput).toBeVisible();
    await expect(cronInput).toHaveAttribute("placeholder", "* * * * *");
  });

  test("プリセットボタンが複数表示される", async ({ page }) => {
    const presetGroup = page.locator('[aria-label="よく使うCron式のプリセット一覧"]');
    await expect(presetGroup).toBeVisible();

    const presetButtons = presetGroup.locator("button");
    const count = await presetButtons.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("プリセットをクリックすると入力フィールドに式が入力される", async ({ page }) => {
    const cronInput = page.locator("#cron-expression");

    // 最初のプリセットボタンをクリック
    const firstPreset = page
      .locator('[aria-label="よく使うCron式のプリセット一覧"] button')
      .first();
    await firstPreset.click();

    const value = await cronInput.inputValue();
    expect(value.trim()).not.toBe("");
  });

  test("有効なCron式を入力すると次回実行時刻が表示される", async ({ page }) => {
    const cronInput = page.locator("#cron-expression");
    await cronInput.fill("* * * * *");

    // 次回実行時刻リストが表示される
    const nextRuns = page.locator(".cron-next-runs");
    await expect(nextRuns).toBeVisible();

    // 10件表示される
    const items = page.locator(".cron-next-run-item");
    await expect(items).toHaveCount(10);
  });

  test("有効なCron式を入力すると説明が表示される", async ({ page }) => {
    const cronInput = page.locator("#cron-expression");
    await cronInput.fill("* * * * *");

    const description = page.locator("#cron-desc-msg");
    await expect(description).toBeVisible();
    await expect(description).toContainText("毎分");
  });

  test("無効なCron式を入力するとエラーメッセージが表示される", async ({ page }) => {
    const cronInput = page.locator("#cron-expression");
    await cronInput.fill("invalid expression");

    const errorMsg = page.locator("#cron-error-msg");
    await expect(errorMsg).toBeVisible();
  });

  test("プリセット「毎日午前9時」を選択すると正しい式が入力される", async ({ page }) => {
    const cronInput = page.locator("#cron-expression");

    const presetBtn = page.locator('[aria-label="毎日午前9時（0 9 * * *）"]');
    if ((await presetBtn.count()) > 0) {
      await presetBtn.click();
      await expect(cronInput).toHaveValue("0 9 * * *");
    }
  });

  test("コピーボタンが存在する（入力なし時は無効）", async ({ page }) => {
    const copyBtn = page.locator('button[aria-label="Cron式をクリップボードにコピー"]');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeDisabled();
  });

  test("Cron式入力後にコピーボタンが有効になる", async ({ page }) => {
    const cronInput = page.locator("#cron-expression");
    await cronInput.fill("*/5 * * * *");

    const copyBtn = page.locator('button[aria-label="Cron式をクリップボードにコピー"]');
    await expect(copyBtn).toBeEnabled();
  });

  test("一覧コピーボタンが有効な式入力後に表示される", async ({ page }) => {
    const cronInput = page.locator("#cron-expression");
    await cronInput.fill("0 9 * * *");

    const copyTimesBtn = page.locator(
      'button[aria-label="次回実行時刻一覧をクリップボードにコピー"]',
    );
    await expect(copyTimesBtn).toBeVisible();
    await expect(copyTimesBtn).toBeEnabled();
  });

  test("リセットボタンをクリックすると入力がクリアされる", async ({ page }) => {
    const cronInput = page.locator("#cron-expression");
    await cronInput.fill("* * * * *");

    // 次回実行時刻が表示されることを確認
    await expect(page.locator(".cron-next-runs")).toBeVisible();

    // リセットボタンをクリック
    const resetBtn = page.locator('button[aria-label="入力をリセット"]');
    await resetBtn.click();

    await expect(cronInput).toHaveValue("");
    await expect(page.locator(".cron-next-runs")).not.toBeVisible();
  });

  test("フィールドヒント（分・時・日・月・曜日）が表示される", async ({ page }) => {
    const fieldHint = page.locator(".cron-field-hint");
    await expect(fieldHint).toBeVisible();

    const fieldText = await fieldHint.textContent();
    expect(fieldText).toContain("分");
    expect(fieldText).toContain("時");
    expect(fieldText).toContain("日");
    expect(fieldText).toContain("月");
    expect(fieldText).toContain("曜日");
  });

  test("アクセシビリティ: バナーとメインランドマークが存在する", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
  });

  test("アクセシビリティ: スキップリンクが存在する", async ({ page }) => {
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("TipsCardが使い方と書き方の説明を表示する", async ({ page }) => {
    const infoBoxes = page.locator(".info-box");
    const allText = await infoBoxes.allTextContents();
    const combinedText = allText.join(" ");

    expect(combinedText).toContain("使い方");
    expect(combinedText).toContain("Cron式の書き方");
    expect(combinedText).not.toContain("undefined");
  });

  test("ナビゲーションからcronページへ遷移できる", async ({ page }) => {
    await page.goto("/");

    // 検証カテゴリをホバー
    const categoryBtn = page.locator(".nav-category-btn", { hasText: "検証" });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();

    // cronリンクをクリック
    const cronLink = dropdown.locator('a[href="/cron"]');
    await expect(cronLink).toBeVisible();
    await cronLink.click();

    await expect(page).toHaveURL("/cron");
  });

  test("プリセット選択後に押下状態が視覚的に反映される", async ({ page }) => {
    const firstPreset = page
      .locator('[aria-label="よく使うCron式のプリセット一覧"] button')
      .first();
    await firstPreset.click();

    // aria-pressed="true" が設定されている
    await expect(firstPreset).toHaveAttribute("aria-pressed", "true");
  });
});
