import { test, expect } from "@playwright/test";

test.describe("日本電話番号フォーマッター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/phone");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正常に表示される（undefinedコンテンツなし）", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("正しいページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/電話番号フォーマッター/);
  });

  test("電話番号入力フィールドが表示される", async ({ page }) => {
    const input = page.locator("#phone-input");
    await expect(input).toBeVisible();
    await expect(input).toBeEnabled();
  });

  test("有効な携帯電話番号をリアルタイム検証する", async ({ page }) => {
    const input = page.locator("#phone-input");
    await input.fill("09012345678");

    const banner = page.locator(".phone-result-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/valid/);
    await expect(banner).toContainText("携帯電話");
  });

  test("有効な東京固定電話番号を検証する", async ({ page }) => {
    const input = page.locator("#phone-input");
    await input.fill("0312345678");

    const banner = page.locator(".phone-result-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/valid/);
    await expect(banner).toContainText("固定電話");
  });

  test("無効な番号に対してエラーを表示する", async ({ page }) => {
    const input = page.locator("#phone-input");
    await input.fill("1234567890");

    const banner = page.locator(".phone-result-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/invalid/);
  });

  test("フォーマット結果セクションが表示される", async ({ page }) => {
    const input = page.locator("#phone-input");
    await input.fill("09012345678");

    const formatsSection = page.locator(".phone-formats-section");
    await expect(formatsSection).toBeVisible();
  });

  test("3つのフォーマットカードが表示される", async ({ page }) => {
    const input = page.locator("#phone-input");
    await input.fill("09012345678");

    const cards = page.locator(".phone-format-card");
    await expect(cards).toHaveCount(3);
  });

  test("ハイフン区切りフォーマットが正しく表示される", async ({ page }) => {
    const input = page.locator("#phone-input");
    await input.fill("09012345678");

    const formatsSection = page.locator(".phone-formats-section");
    await expect(formatsSection).toContainText("090-1234-5678");
  });

  test("E.164フォーマットが正しく表示される", async ({ page }) => {
    const input = page.locator("#phone-input");
    await input.fill("09012345678");

    const formatsSection = page.locator(".phone-formats-section");
    await expect(formatsSection).toContainText("+819012345678");
  });

  test("各フォーマットのコピーボタンが表示される", async ({ page }) => {
    const input = page.locator("#phone-input");
    await input.fill("09012345678");

    const copyBtns = page.locator(".phone-copy-btn");
    await expect(copyBtns).toHaveCount(3);
  });

  test("クリアボタンで入力と結果をリセットする", async ({ page }) => {
    const input = page.locator("#phone-input");
    await input.fill("09012345678");

    await expect(page.locator(".phone-result-banner")).toBeVisible();

    const clearBtn = page.locator('button[aria-label="入力をクリア"]');
    await clearBtn.click();

    await expect(input).toHaveValue("");
    await expect(page.locator(".phone-result-banner")).not.toBeVisible();
  });

  test("サンプル番号テーブルが表示される", async ({ page }) => {
    const sampleSection = page.locator(".phone-sample-section");
    await expect(sampleSection).toBeVisible();

    const table = page.locator(".phone-sample-table");
    await expect(table).toBeVisible();
  });

  test("「使用」ボタンでサンプル番号が入力欄に設定される", async ({ page }) => {
    const firstUseBtn = page.locator(".phone-use-btn").first();
    await firstUseBtn.click();

    const input = page.locator("#phone-input");
    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("「使用」ボタンクリック後にフォーマット結果が表示される", async ({ page }) => {
    const firstUseBtn = page.locator(".phone-use-btn").first();
    await firstUseBtn.click();

    const banner = page.locator(".phone-result-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveClass(/valid/);
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tipsCard = page.locator(".tips-card").first();
    await expect(tipsCard).toBeVisible();
  });

  test("緊急電話番号は有効だが国際フォーマットセクションは非表示", async ({ page }) => {
    const input = page.locator("#phone-input");
    await input.fill("110");

    const banner = page.locator(".phone-result-banner");
    await expect(banner).toHaveClass(/valid/);

    const formatsSection = page.locator(".phone-formats-section");
    await expect(formatsSection).not.toBeVisible();
  });
});

test.describe("トップページ - 電話番号フォーマッターツール一覧", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/top");
    await page.waitForLoadState("networkidle");
  });

  test("ツール一覧に「電話番号フォーマッター」が表示される", async ({ page }) => {
    const phoneLink = page.locator('a[href="/phone"]');
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toContainText("電話番号");
  });

  test("電話番号フォーマッターをクリックすると /phone に遷移する", async ({ page }) => {
    const phoneLink = page.locator('a[href="/phone"]').first();
    await phoneLink.click();

    await expect(page).toHaveURL("/phone");
  });
});
