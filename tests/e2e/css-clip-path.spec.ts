import { test, expect } from "@playwright/test";

test.describe("CSS Clip-path ジェネレーター", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-clip-path");
  });

  test("ページが正しくレンダリングされる", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /clip-path/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: "polygon()" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "inset()" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "circle()" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "ellipse()" })).toBeVisible();
  });

  test("タブ切り替えが機能する", async ({ page }) => {
    // デフォルトは polygon
    await expect(page.getByRole("tab", { name: "polygon()" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // inset タブに切り替え
    await page.getByRole("tab", { name: "inset()" }).click();
    await expect(page.getByRole("tab", { name: "inset()" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText("上 (top)")).toBeVisible();

    // circle タブに切り替え
    await page.getByRole("tab", { name: "circle()" }).click();
    await expect(page.getByRole("tab", { name: "circle()" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText("半径 (radius)")).toBeVisible();

    // ellipse タブに切り替え
    await page.getByRole("tab", { name: "ellipse()" }).click();
    await expect(page.getByText("X軸半径 (rx)")).toBeVisible();
  });

  test("CSS コード出力が表示される", async ({ page }) => {
    // polygon モードで clip-path: polygon(...) が出力される
    await expect(page.getByLabel("生成されたCSSコード")).toContainText("clip-path: polygon(");
  });

  test("inset コントロールが機能する", async ({ page }) => {
    await page.getByRole("tab", { name: "inset()" }).click();

    // clip-path: inset(...) が出力される
    await expect(page.getByLabel("生成されたCSSコード")).toContainText("clip-path: inset(");
  });

  test("circle コントロールが機能する", async ({ page }) => {
    await page.getByRole("tab", { name: "circle()" }).click();
    await expect(page.getByLabel("生成されたCSSコード")).toContainText("clip-path: circle(");
  });

  test("ellipse コントロールが機能する", async ({ page }) => {
    await page.getByRole("tab", { name: "ellipse()" }).click();
    await expect(page.getByLabel("生成されたCSSコード")).toContainText("clip-path: ellipse(");
  });

  test("プリセット形状が適用できる", async ({ page }) => {
    // ダイヤモンドプリセットをクリック
    await page.getByRole("button", { name: "ダイヤモンドを適用" }).click();
    await expect(page.getByLabel("生成されたCSSコード")).toContainText("clip-path: polygon(");
    // polygon タブがアクティブになっているはず
    await expect(page.getByRole("tab", { name: "polygon()" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("コピーボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "CSSコードをコピー" })).toBeVisible();
  });

  test("リセットボタンが機能する", async ({ page }) => {
    await page.getByRole("button", { name: "設定をリセット" }).click();
    // リセット後もコードが出力されている
    await expect(page.getByLabel("生成されたCSSコード")).not.toBeEmpty();
  });

  test("polygon 頂点リストが表示される", async ({ page }) => {
    // デフォルトで polygon タブ
    await expect(page.getByText("頂点リスト")).toBeVisible();
    await expect(page.getByRole("button", { name: "頂点を追加" })).toBeVisible();
  });

  test("頂点の追加が機能する", async ({ page }) => {
    // デフォルトは3頂点
    const initialPoints = await page.getByLabel(/頂点\d+ X座標/).count();
    expect(initialPoints).toBe(3);

    await page.getByRole("button", { name: "頂点を追加" }).click();
    const afterPoints = await page.getByLabel(/頂点\d+ X座標/).count();
    expect(afterPoints).toBe(4);
  });

  test("プリセット一覧が表示される", async ({ page }) => {
    await expect(page.getByText("プリセット形状")).toBeVisible();
    await expect(page.getByRole("button", { name: "三角形を適用" })).toBeVisible();
    await expect(page.getByRole("button", { name: "六角形を適用" })).toBeVisible();
    await expect(page.getByRole("button", { name: "五芒星を適用" })).toBeVisible();
  });

  test("ページタイトルが正しい", async ({ page }) => {
    await expect(page).toHaveTitle(/CSS Clip-path/);
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.getByText(/ドラッグで頂点を移動できます/)).toBeVisible();
  });
});
