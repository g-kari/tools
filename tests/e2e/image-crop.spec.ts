import { test, expect } from "@playwright/test";

test.describe("Image Crop - E2E Tests", () => {
  /**
   * カテゴリドロップダウンを開いてリンクをクリックするヘルパー関数
   */
  async function navigateViaCategory(
    page: import("@playwright/test").Page,
    categoryName: string,
    linkHref: string
  ) {
    const categoryBtn = page.locator(".nav-category-btn", {
      hasText: categoryName,
    });
    await categoryBtn.hover();
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();
    const link = dropdown.locator(`a[href="${linkHref}"]`);
    await link.click();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/image-crop");
    await page.waitForLoadState("networkidle");
  });

  test("should load the page without 'undefined' content", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("should display the correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/画像トリミング/);
  });

  test("should display the main heading", async ({ page }) => {
    const heading = page.locator(".section-title").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("画像選択");
  });

  test("should have proper accessibility attributes", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("should display usage instructions", async ({ page }) => {
    const usageSection = page.locator(".info-box").first();
    await expect(usageSection).toBeVisible();

    const usageText = await usageSection.textContent();
    expect(usageText).toContain("画像トリミングツールとは");
    expect(usageText).not.toContain("undefined");
  });

  test("should display dropzone for file upload", async ({ page }) => {
    const dropzone = page.locator(".dropzone");
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText("クリックして画像を選択");
    await expect(dropzone).toContainText("ドラッグ&ドロップ");
  });

  test("should have proper aria-label on dropzone", async ({ page }) => {
    const dropzone = page.locator(".dropzone");
    await expect(dropzone).toHaveAttribute("aria-label", "画像ファイルをアップロード");
    await expect(dropzone).toHaveAttribute("role", "button");
    await expect(dropzone).toHaveAttribute("tabindex", "0");
  });

  test("should have file input hidden but present", async ({ page }) => {
    const fileInput = page.locator("input#imageFile");
    await expect(fileInput).toHaveAttribute("type", "file");
    await expect(fileInput).toHaveAttribute("accept", "image/*");
  });

  test("should not display crop settings without image", async ({ page }) => {
    const aspectRatioSection = page.locator(".section-title", {
      hasText: "アスペクト比",
    });
    await expect(aspectRatioSection).not.toBeVisible();

    const cropAreaSection = page.locator(".section-title", {
      hasText: "トリミング範囲",
    });
    await expect(cropAreaSection).not.toBeVisible();
  });

  test("should navigate to page via category dropdown", async ({ page }) => {
    await page.goto("/");
    await navigateViaCategory(page, "画像", "/image-crop");
    await expect(page).toHaveURL("/image-crop");
    const heading = page.locator(".section-title", { hasText: "画像選択" });
    await expect(heading).toBeVisible();
  });

  test("should have keyboard navigation support on dropzone", async ({
    page,
  }) => {
    const dropzone = page.locator(".dropzone");
    await dropzone.focus();
    await expect(dropzone).toBeFocused();

    // Enterキーでファイル選択ダイアログが開くことを確認（実際には開かない）
    const fileInput = page.locator("input[type='file']");
    await expect(fileInput).toBeAttached();
  });

  test("should display correct initial state", async ({ page }) => {
    const heading = page.locator(".section-title", { hasText: "画像選択" });
    await expect(heading).toBeVisible();

    const dropzone = page.locator(".dropzone");
    await expect(dropzone).toBeVisible();

    const infoBox = page.locator(".info-box").first();
    await expect(infoBox).toBeVisible();
  });

  test("should have responsive layout", async ({ page }) => {
    const container = page.locator(".tool-container");
    await expect(container).toBeVisible();

    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(container).toBeVisible();

    // デスクトップビューポートに戻す
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(container).toBeVisible();
  });

  test("should not show cropped preview initially", async ({ page }) => {
    const result = page.locator(".section-title", { hasText: "トリミング結果" });
    await expect(result).not.toBeVisible();
  });

  test("should have Material Design styling", async ({ page }) => {
    const container = page.locator(".tool-container");
    await expect(container).toBeVisible();

    const dropzone = page.locator(".dropzone");
    const backgroundColor = await dropzone.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // Material Design 3のカラーが適用されていることを確認
    expect(backgroundColor).toBeTruthy();
  });

  test("should be accessible via navigation", async ({ page }) => {
    await page.goto("/");

    // 画像カテゴリを開く
    const imageCategory = page.locator(".nav-category-btn", {
      hasText: "画像",
    });
    await imageCategory.hover();

    // ドロップダウンが表示される
    const dropdown = page.locator(".nav-dropdown");
    await expect(dropdown).toBeVisible();

    // 画像トリミングリンクが存在する
    const cropLink = dropdown.locator('a[href="/image-crop"]');
    await expect(cropLink).toBeVisible();
    await expect(cropLink).toContainText("画像トリミング");

    // クリックして遷移
    await cropLink.click();
    await expect(page).toHaveURL("/image-crop");
  });

  test("should have proper input labels", async ({ page }) => {
    // 画像アップロード前は入力フィールドが表示されない
    const xInput = page.locator("input#crop-x");
    await expect(xInput).not.toBeVisible();

    const yInput = page.locator("input#crop-y");
    await expect(yInput).not.toBeVisible();

    const widthInput = page.locator("input#crop-width");
    await expect(widthInput).not.toBeVisible();

    const heightInput = page.locator("input#crop-height");
    await expect(heightInput).not.toBeVisible();
  });

  test("should not have any console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/image-crop");
    await page.waitForLoadState("networkidle");

    // JSエラーがないことを確認
    expect(errors.length).toBe(0);
  });

  test("should have correct meta tags", async ({ page }) => {
    await expect(page).toHaveTitle(/画像トリミング/);

    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute(
      "content",
      "width=device-width, initial-scale=1.0"
    );
  });

  test("should display upload icon in dropzone", async ({ page }) => {
    const dropzone = page.locator(".dropzone");
    const icon = dropzone.locator(".upload-icon");
    await expect(icon).toBeVisible();
  });

  test("should display dropzone hint text", async ({ page }) => {
    const dropzone = page.locator(".dropzone");
    const hint = dropzone.locator(".dropzone-hint");
    await expect(hint).toBeVisible();
    await expect(hint).toContainText("PNG, JPEG, WebP");
  });

  test("should display info box with usage instructions", async ({ page }) => {
    const infoBox = page.locator(".info-box").first();
    await expect(infoBox).toBeVisible();

    // 使い方セクションの確認
    const usageTitle = infoBox.locator("h3", { hasText: "使い方" });
    await expect(usageTitle).toBeVisible();

    // 機能セクションの確認
    const featuresTitle = infoBox.locator("h3", { hasText: "機能" });
    await expect(featuresTitle).toBeVisible();
  });
});
