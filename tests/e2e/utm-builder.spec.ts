import { test, expect } from "@playwright/test";

test.describe("UTMパラメータビルダー - E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/utm-builder");
    await page.waitForLoadState("networkidle");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/UTMパラメータビルダー/);
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

  test("モード切替タブが表示される", async ({ page }) => {
    await expect(page.locator('[role="tablist"]')).toBeVisible();
    await expect(page.locator('button[role="tab"]', { hasText: "ビルドモード" })).toBeVisible();
    await expect(page.locator('button[role="tab"]', { hasText: "パースモード" })).toBeVisible();
  });

  test("初期状態でビルドモードが選択されている", async ({ page }) => {
    const buildTab = page.locator('button[role="tab"]', { hasText: "ビルドモード" });
    await expect(buildTab).toHaveAttribute("aria-selected", "true");
  });

  test.describe("ビルドモード", () => {
    test("フォームのフィールドが表示される", async ({ page }) => {
      await expect(page.locator("#utm-base-url")).toBeVisible();
      await expect(page.locator("#utm-source")).toBeVisible();
      await expect(page.locator("#utm-medium")).toBeVisible();
      await expect(page.locator("#utm-campaign")).toBeVisible();
      await expect(page.locator("#utm-term")).toBeVisible();
      await expect(page.locator("#utm-content")).toBeVisible();
    });

    test("必須フィールドを入力するとURLが生成される", async ({ page }) => {
      await page.fill("#utm-base-url", "https://example.com");
      await page.fill("#utm-source", "google");
      await page.fill("#utm-medium", "cpc");

      const resultUrl = page.locator(
        ".utm-builder-result-url:not(.utm-builder-result-url--placeholder)",
      );
      await expect(resultUrl).toBeVisible();
      const urlText = await resultUrl.textContent();
      expect(urlText).toContain("utm_source=google");
      expect(urlText).toContain("utm_medium=cpc");
    });

    test("全パラメータを入力するとすべてURLに含まれる", async ({ page }) => {
      await page.fill("#utm-base-url", "https://example.com/page");
      await page.fill("#utm-source", "facebook");
      await page.fill("#utm-medium", "social");
      await page.fill("#utm-campaign", "spring_sale");
      await page.fill("#utm-term", "shoes");
      await page.fill("#utm-content", "logolink");

      const resultUrl = page.locator(".utm-builder-result-url");
      await expect(resultUrl).toBeVisible();
      const urlText = await resultUrl.textContent();
      expect(urlText).toContain("utm_source=facebook");
      expect(urlText).toContain("utm_medium=social");
      expect(urlText).toContain("utm_campaign=spring_sale");
      expect(urlText).toContain("utm_content=logolink");
    });

    test("sourceのクイック選択プリセットが機能する", async ({ page }) => {
      const googleChip = page.locator(".utm-builder-preset-chip", { hasText: "google" }).first();
      await googleChip.click();

      const sourceInput = page.locator("#utm-source");
      await expect(sourceInput).toHaveValue("google");
    });

    test("mediumのクイック選択プリセットが機能する", async ({ page }) => {
      const cpcChip = page.locator(".utm-builder-preset-chip", { hasText: "cpc" }).nth(0);
      await cpcChip.click();

      const mediumInput = page.locator("#utm-medium");
      await expect(mediumInput).toHaveValue("cpc");
    });

    test("必須フィールドが空のときコピーボタンが無効", async ({ page }) => {
      const copyBtn = page.locator(".utm-builder-copy-btn");
      await expect(copyBtn).toBeDisabled();
    });

    test("URLが生成されたときコピーボタンが有効になる", async ({ page }) => {
      await page.fill("#utm-base-url", "https://example.com");
      await page.fill("#utm-source", "google");
      await page.fill("#utm-medium", "cpc");

      const copyBtn = page.locator(".utm-builder-copy-btn");
      await expect(copyBtn).toBeEnabled();
    });

    test("コピーボタンのクリックでクリップボードにURLが入る", async ({ page }) => {
      await page.fill("#utm-base-url", "https://example.com");
      await page.fill("#utm-source", "google");
      await page.fill("#utm-medium", "cpc");

      // クリップボードAPIへのアクセスを許可
      await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

      const copyBtn = page.locator(".utm-builder-copy-btn");
      await copyBtn.click();

      // トースト通知を確認
      const toast = page.locator('.toast, [role="status"]').first();
      await expect(toast).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("パースモード", () => {
    test.beforeEach(async ({ page }) => {
      const parseTab = page.locator('button[role="tab"]', { hasText: "パースモード" });
      await parseTab.click();
    });

    test("パースモードに切り替わる", async ({ page }) => {
      const parseTab = page.locator('button[role="tab"]', { hasText: "パースモード" });
      await expect(parseTab).toHaveAttribute("aria-selected", "true");

      await expect(page.locator("#utm-parse-input")).toBeVisible();
    });

    test("UTMパラメータ付きURLを解析する", async ({ page }) => {
      const testUrl =
        "https://example.com/page?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale";

      await page.fill("#utm-parse-input", testUrl);

      // 解析結果が表示されるまで待つ
      const parseResult = page.locator(".utm-builder-parse-result");
      await expect(parseResult).toBeVisible();

      const resultText = await parseResult.textContent();
      expect(resultText).toContain("google");
      expect(resultText).toContain("cpc");
      expect(resultText).toContain("spring_sale");
    });

    test("ベースURLが表示される", async ({ page }) => {
      const testUrl = "https://example.com/page?utm_source=google&utm_medium=cpc";

      await page.fill("#utm-parse-input", testUrl);

      const baseUrlCard = page.locator(".utm-builder-base-url-card");
      await expect(baseUrlCard).toBeVisible();
      const baseUrlText = await baseUrlCard.textContent();
      expect(baseUrlText).toContain("https://example.com/page");
    });

    test("各パラメータのカードが表示される", async ({ page }) => {
      const testUrl =
        "https://example.com?utm_source=facebook&utm_medium=social&utm_campaign=sale&utm_term=shoes&utm_content=logo";

      await page.fill("#utm-parse-input", testUrl);

      const cards = page.locator(".utm-builder-parse-card");
      // utm_source, utm_medium, utm_campaign, utm_term, utm_content の5枚
      await expect(cards).toHaveCount(5);
    });

    test("存在しないパラメータは（未設定）と表示される", async ({ page }) => {
      const testUrl = "https://example.com?utm_source=google&utm_medium=cpc";

      await page.fill("#utm-parse-input", testUrl);

      const parseResult = page.locator(".utm-builder-parse-result");
      await expect(parseResult).toBeVisible();
      const resultText = await parseResult.textContent();
      // campaign, term, content は未設定
      expect(resultText).toContain("（未設定）");
    });
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tipsCard = page.locator(".info-box").first();
    await expect(tipsCard).toBeVisible();
    const tipsText = await tipsCard.textContent();
    expect(tipsText).toContain("UTMパラメータとは");
  });
});
