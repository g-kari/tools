import { test, expect } from "@playwright/test";

test.describe("Sitemap XMLジェネレーター - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sitemap");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Sitemap XML/);
  });

  test("ページ本文に undefined が含まれない", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
  });

  test("アクセシビリティ属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("初期状態で1つのURLエントリが表示される", async ({ page }) => {
    const entries = page.locator(".sitemap-entry-card");
    await expect(entries).toHaveCount(1);
  });

  test("URLを入力するとXMLが生成される", async ({ page }) => {
    const locInput = page.locator('input[type="url"]').first();
    await locInput.fill("https://example.com/");

    const xmlOutput = page.locator(".sitemap-xml-output");
    await expect(xmlOutput).toContainText("https://example.com/");
    await expect(xmlOutput).toContainText("<loc>");
    await expect(xmlOutput).toContainText("</urlset>");
  });

  test("無効なURLでプレースホルダーが表示される", async ({ page }) => {
    const locInput = page.locator('input[type="url"]').first();
    await locInput.fill("not-a-url");
    await locInput.blur();

    const xmlOutput = page.locator(".sitemap-xml-output");
    await expect(xmlOutput).toContainText("有効なURLを1つ以上入力すると");
  });

  test("「+ URLを追加」ボタンでエントリが追加される", async ({ page }) => {
    const addBtn = page.locator(".sitemap-add-btn");
    await addBtn.click();

    const entries = page.locator(".sitemap-entry-card");
    await expect(entries).toHaveCount(2);
  });

  test("エントリが2つ以上のとき削除ボタンが表示される", async ({ page }) => {
    const addBtn = page.locator(".sitemap-add-btn");
    await addBtn.click();

    const removeButtons = page.locator(".sitemap-entry-remove-btn");
    await expect(removeButtons).toHaveCount(2);
  });

  test("エントリが1つのとき削除ボタンが表示されない", async ({ page }) => {
    const removeButtons = page.locator(".sitemap-entry-remove-btn");
    await expect(removeButtons).toHaveCount(0);
  });

  test("削除ボタンでエントリが削除される", async ({ page }) => {
    const addBtn = page.locator(".sitemap-add-btn");
    await addBtn.click();
    await addBtn.click();

    const removeBtn = page.locator(".sitemap-entry-remove-btn").first();
    await removeBtn.click();

    const entries = page.locator(".sitemap-entry-card");
    await expect(entries).toHaveCount(2);
  });

  test("変更頻度のセレクトボックスが機能する", async ({ page }) => {
    const locInput = page.locator('input[type="url"]').first();
    await locInput.fill("https://example.com/");

    const changefreqSelect = page.locator(".sitemap-select").first();
    await changefreqSelect.selectOption("weekly");

    const xmlOutput = page.locator(".sitemap-xml-output");
    await expect(xmlOutput).toContainText("<changefreq>weekly</changefreq>");
  });

  test("優先度チェックボックスで優先度フィールドが有効になる", async ({
    page,
  }) => {
    const locInput = page.locator('input[type="url"]').first();
    await locInput.fill("https://example.com/");

    const priorityCheckbox = page.locator('input[type="checkbox"]').first();
    await priorityCheckbox.check();

    const prioritySlider = page.locator(".sitemap-priority-slider");
    await expect(prioritySlider).toBeEnabled();
  });

  test("優先度を設定するとXMLに含まれる", async ({ page }) => {
    const locInput = page.locator('input[type="url"]').first();
    await locInput.fill("https://example.com/");

    const priorityCheckbox = page.locator('input[type="checkbox"]').first();
    await priorityCheckbox.check();

    const xmlOutput = page.locator(".sitemap-xml-output");
    await expect(xmlOutput).toContainText("<priority>");
  });

  test("コピーボタンは有効なURLがないとき無効", async ({ page }) => {
    const copyBtn = page.locator(".sitemap-action-btn", { hasText: "コピー" });
    await expect(copyBtn).toBeDisabled();
  });

  test("有効なURLがあるときコピーボタンが有効", async ({ page }) => {
    const locInput = page.locator('input[type="url"]').first();
    await locInput.fill("https://example.com/");

    const copyBtn = page.locator(".sitemap-action-btn", { hasText: "コピー" });
    await expect(copyBtn).toBeEnabled();
  });

  test("ダウンロードボタンは有効なURLがないとき無効", async ({ page }) => {
    const downloadBtn = page.locator(".sitemap-action-btn", {
      hasText: "ダウンロード",
    });
    await expect(downloadBtn).toBeDisabled();
  });

  test("最終更新日を設定するとXMLに含まれる", async ({ page }) => {
    const locInput = page.locator('input[type="url"]').first();
    await locInput.fill("https://example.com/");

    const dateInput = page.locator('input[type="date"]').first();
    await dateInput.fill("2024-01-15");

    const xmlOutput = page.locator(".sitemap-xml-output");
    await expect(xmlOutput).toContainText("<lastmod>2024-01-15</lastmod>");
  });

  test("複数URLを追加するとすべてXMLに含まれる", async ({ page }) => {
    const locInput = page.locator('input[type="url"]').first();
    await locInput.fill("https://example.com/");

    const addBtn = page.locator(".sitemap-add-btn");
    await addBtn.click();

    const locInputs = page.locator('input[type="url"]');
    await locInputs.nth(1).fill("https://example.com/about");

    const xmlOutput = page.locator(".sitemap-xml-output");
    await expect(xmlOutput).toContainText("https://example.com/");
    await expect(xmlOutput).toContainText("https://example.com/about");
  });

  test("エントリ統計が正しく表示される", async ({ page }) => {
    const stats = page.locator(".sitemap-stats");
    await expect(stats).toBeVisible();
    await expect(stats).toContainText("エントリ数:");
    await expect(stats).toContainText("有効なURL:");
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tipsCard = page.locator(".info-box").first();
    await expect(tipsCard).toBeVisible();
    const tipsText = await tipsCard.textContent();
    expect(tipsText).toContain("サイトマップXMLとは");
  });
});
