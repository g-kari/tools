import { test, expect } from "@playwright/test";

test.describe("CSS Cubic Bezier ジェネレーターページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-cubic-bezier");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "CSS Cubic Bezier ジェネレーター" }),
    ).toBeVisible();
  });

  test("ドキュメントタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/CSS Cubic Bezier ジェネレーター/);
  });

  test("SVGグラフが表示される", async ({ page }) => {
    await expect(page.getByRole("img", { name: /cubic-bezier/ })).toBeVisible();
  });

  test("X1スライダーが表示される", async ({ page }) => {
    await expect(page.getByLabel("X1 の値")).toBeVisible();
  });

  test("Y1スライダーが表示される", async ({ page }) => {
    await expect(page.getByLabel("Y1 の値")).toBeVisible();
  });

  test("X2スライダーが表示される", async ({ page }) => {
    await expect(page.getByLabel("X2 の値")).toBeVisible();
  });

  test("Y2スライダーが表示される", async ({ page }) => {
    await expect(page.getByLabel("Y2 の値")).toBeVisible();
  });

  test("アニメーションプレビューが表示される", async ({ page }) => {
    await expect(page.getByLabel("タイミング関数のアニメーションプレビュー")).toBeVisible();
  });

  test("CSSコード出力エリアが表示される", async ({ page }) => {
    const codeBlock = page.getByRole("region", { name: "CSSコード" });
    await expect(codeBlock).toBeVisible();
    const text = await codeBlock.textContent();
    expect(text).toContain("cubic-bezier");
    expect(text).toContain("transition-timing-function:");
    expect(text).toContain("animation-timing-function:");
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "CSSをクリップボードにコピー" })).toBeVisible();
  });

  test("再生ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "アニメーションを再生" })).toBeVisible();
  });

  test("プリセット一覧が表示される", async ({ page }) => {
    const presets = page.getByRole("list", {
      name: "タイミング関数プリセット一覧",
    });
    await expect(presets).toBeVisible();
    const presetBtns = presets.getByRole("listitem");
    await expect(presetBtns.first()).toBeVisible();
  });

  test("linear プリセットをクリックするとCSS値が更新される", async ({ page }) => {
    const linearBtn = page.getByRole("listitem").filter({ hasText: "linear" });
    await linearBtn.click();
    const codeBlock = page.getByRole("region", { name: "CSSコード" });
    const text = await codeBlock.textContent();
    expect(text).toContain("cubic-bezier(0, 0, 1, 1)");
  });

  test("ease プリセットをクリックするとボタンが選択状態になる", async ({ page }) => {
    const easeBtn = page.getByRole("listitem").filter({ hasText: /^ease$/ });
    await easeBtn.click();
    await expect(easeBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("X1スライダーを変更するとCSSが更新される", async ({ page }) => {
    const codeBlock = page.getByRole("region", { name: "CSSコード" });
    const initialText = await codeBlock.textContent();

    const x1Slider = page.getByLabel("X1 の値");
    await x1Slider.fill("0.5");

    const updatedText = await codeBlock.textContent();
    expect(updatedText).not.toBe(initialText);
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText(/制御点X/)).toBeVisible();
    await expect(page.getByText(/制御点Y/)).toBeVisible();
    await expect(page.getByText(/ドラッグ操作/)).toBeVisible();
  });
});
