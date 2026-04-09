import { test, expect } from "@playwright/test";

test.describe("Geohashエンコーダー/デコーダー - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/geohash");
    await page.waitForLoadState("networkidle");
  });

  test("undefined コンテンツを含まずにページをロードできる", async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("正しいページタイトルを表示する", async ({ page }) => {
    await expect(page).toHaveTitle(/Geohashエンコーダー\/デコーダー/);
  });

  test("アクセシビリティ属性が正しく設定されている", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });

  test("モードタブが表示される", async ({ page }) => {
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();

    const encodeTab = page.locator('[role="tab"]', { hasText: "エンコード" });
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await expect(encodeTab).toBeVisible();
    await expect(decodeTab).toBeVisible();
  });

  test("初期状態でエンコードモードが選択されている", async ({ page }) => {
    const encodeTab = page.locator('[role="tab"]', { hasText: "エンコード" });
    await expect(encodeTab).toHaveAttribute("aria-selected", "true");

    const latInput = page.locator("#geohash-lat");
    await expect(latInput).toBeVisible();
    const lngInput = page.locator("#geohash-lng");
    await expect(lngInput).toBeVisible();
  });

  test("エンコード: 緯度・経度を入力するとGeohashが生成される", async ({ page }) => {
    const latInput = page.locator("#geohash-lat");
    const lngInput = page.locator("#geohash-lng");

    await latInput.fill("35.6895");
    await lngInput.fill("139.6917");

    const result = page.locator(".geohash-result-value");
    await expect(result).toBeVisible();

    const hashText = await result.textContent();
    expect(hashText).toBeTruthy();
    expect(hashText!.length).toBeGreaterThan(0);
  });

  test("エンコード: 精度スライダーを変更すると精度が変わる", async ({ page }) => {
    const latInput = page.locator("#geohash-lat");
    const lngInput = page.locator("#geohash-lng");
    const slider = page.locator("#geohash-precision");

    await latInput.fill("35.6895");
    await lngInput.fill("139.6917");

    // 精度を5に設定
    await slider.evaluate((el: HTMLInputElement) => {
      el.value = "5";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const precisionValue = page.locator(".geohash-precision-value");
    await expect(precisionValue).toContainText("5");

    const result = page.locator(".geohash-result-value");
    await expect(result).toBeVisible();
    const hashText = await result.textContent();
    expect(hashText!.length).toBe(5);
  });

  test("エンコード: 範囲外の緯度を入力するとエラーが表示される", async ({ page }) => {
    const latInput = page.locator("#geohash-lat");
    const lngInput = page.locator("#geohash-lng");

    await latInput.fill("91");
    await lngInput.fill("139.6917");

    const error = page.locator('.geohash-error[role="alert"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText("緯度は-90〜90の範囲");
  });

  test("エンコード: 範囲外の経度を入力するとエラーが表示される", async ({ page }) => {
    const latInput = page.locator("#geohash-lat");
    const lngInput = page.locator("#geohash-lng");

    await latInput.fill("35.6895");
    await lngInput.fill("181");

    const error = page.locator('.geohash-error[role="alert"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText("経度は-180〜180の範囲");
  });

  test("エンコード: 入力前は空の状態メッセージが表示される", async ({ page }) => {
    const emptyState = page.locator(".geohash-empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("緯度と経度を入力するとGeohashが表示されます");
  });

  test("デコードモードに切り替えられる", async ({ page }) => {
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await decodeTab.click();

    await expect(decodeTab).toHaveAttribute("aria-selected", "true");

    const hashInput = page.locator("#geohash-input");
    await expect(hashInput).toBeVisible();
  });

  test("デコード: Geohash文字列を入力すると座標が表示される", async ({ page }) => {
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await decodeTab.click();

    const hashInput = page.locator("#geohash-input");
    await hashInput.fill("xn76urwe9");

    const result = page.locator('[aria-label="デコード結果"]');
    await expect(result).toBeVisible();

    const latValue = result.locator(".geohash-coord-value").first();
    const lngValue = result.locator(".geohash-coord-value").nth(1);
    await expect(latValue).toBeVisible();
    await expect(lngValue).toBeVisible();
  });

  test("デコード: バウンディングボックスが表示される", async ({ page }) => {
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await decodeTab.click();

    const hashInput = page.locator("#geohash-input");
    await hashInput.fill("xn76urwe9");

    const boundsSection = page.locator(".geohash-bounds-section");
    await expect(boundsSection).toBeVisible();
    await expect(boundsSection).toContainText("バウンディングボックス");
  });

  test("デコード: 無効なGeohash文字列を入力するとエラーが表示される", async ({ page }) => {
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await decodeTab.click();

    const hashInput = page.locator("#geohash-input");
    await hashInput.fill("aaaaa");

    const error = page.locator('.geohash-error[role="alert"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText("有効なGeohash文字列ではありません");
  });

  test("デコード: 入力前は空の状態メッセージが表示される", async ({ page }) => {
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await decodeTab.click();

    const emptyState = page.locator(".geohash-empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("Geohash文字列を入力すると座標が表示されます");
  });

  test("エンコード後に隣接セルグリッドが表示される", async ({ page }) => {
    const latInput = page.locator("#geohash-lat");
    const lngInput = page.locator("#geohash-lng");

    await latInput.fill("35.6895");
    await lngInput.fill("139.6917");

    const neighborsSection = page.locator(".geohash-neighbors-section");
    await expect(neighborsSection).toBeVisible();

    const grid = page.locator('[role="grid"]');
    await expect(grid).toBeVisible();

    const cells = page.locator('[role="gridcell"]');
    await expect(cells).toHaveCount(9);
  });

  test("隣接セルをクリックするとデコードモードに切り替わる", async ({ page }) => {
    const latInput = page.locator("#geohash-lat");
    const lngInput = page.locator("#geohash-lng");

    await latInput.fill("35.6895");
    await lngInput.fill("139.6917");

    const neighborsSection = page.locator(".geohash-neighbors-section");
    await expect(neighborsSection).toBeVisible();

    // 中心セル以外のセル（NWセル）をクリック
    const nwCell = page.locator('[aria-label^="NW:"]');
    await nwCell.click();

    // デコードモードに切り替わることを確認
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await expect(decodeTab).toHaveAttribute("aria-selected", "true");

    const hashInput = page.locator("#geohash-input");
    const inputValue = await hashInput.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
  });

  test("デコード後に隣接セルグリッドが表示される", async ({ page }) => {
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await decodeTab.click();

    const hashInput = page.locator("#geohash-input");
    await hashInput.fill("xn76urwe9");

    const neighborsSection = page.locator(".geohash-neighbors-section");
    await expect(neighborsSection).toBeVisible();

    const cells = page.locator('[role="gridcell"]');
    await expect(cells).toHaveCount(9);
  });

  test("エンコード結果のコピーボタンが表示される", async ({ page }) => {
    const latInput = page.locator("#geohash-lat");
    const lngInput = page.locator("#geohash-lng");

    await latInput.fill("35.6895");
    await lngInput.fill("139.6917");

    const copyBtn = page.locator('[aria-label="Geohash文字列をコピー"]');
    await expect(copyBtn).toBeVisible();
  });

  test("デコード結果の座標コピーボタンが表示される", async ({ page }) => {
    const decodeTab = page.locator('[role="tab"]', { hasText: "デコード" });
    await decodeTab.click();

    const hashInput = page.locator("#geohash-input");
    await hashInput.fill("xn76urwe9");

    const copyBtn = page.locator('[aria-label="座標をコピー"]');
    await expect(copyBtn).toBeVisible();
  });

  test("TipsCardが表示される", async ({ page }) => {
    const tipsSection = page.locator(".info-box").first();
    await expect(tipsSection).toBeVisible();
  });
});
