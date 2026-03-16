import { test, expect } from "@playwright/test";

test.describe("CSS Container Query ビルダー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-container-query");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/CSS Container Query ビルダー/);
  });

  test("コンテナー設定パネルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "コンテナー定義" })
    ).toBeVisible();
    await expect(page.getByLabel("コンテナーの CSS セレクタ")).toBeVisible();
    await expect(page.getByLabel("container-type の値")).toBeVisible();
  });

  test("クエリ条件パネルが表示される", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "クエリ条件" })
    ).toBeVisible();
    await expect(page.getByLabel("条件 1 のタイプ")).toBeVisible();
  });

  test("生成 CSS セクションが表示される", async ({ page }) => {
    await expect(page.getByLabel("生成された CSS コード")).toBeVisible();
    const css = await page.getByLabel("生成された CSS コード").textContent();
    expect(css).toContain("container-type: inline-size;");
    expect(css).toContain("@container");
  });

  test("コンテナーセレクタを変更すると CSS が更新される", async ({
    page,
  }) => {
    const selectorInput = page.getByLabel("コンテナーの CSS セレクタ");
    await selectorInput.clear();
    await selectorInput.fill(".my-wrapper");
    const css = await page.getByLabel("生成された CSS コード").textContent();
    expect(css).toContain(".my-wrapper {");
  });

  test("container-type を変更すると CSS が更新される", async ({ page }) => {
    await page.getByLabel("container-type の値").selectOption("size");
    const css = await page.getByLabel("生成された CSS コード").textContent();
    expect(css).toContain("container-type: size;");
  });

  test("container-name を入力すると CSS に反映される", async ({ page }) => {
    await page.getByLabel("container-name の値").fill("sidebar");
    const css = await page.getByLabel("生成された CSS コード").textContent();
    expect(css).toContain("container-name: sidebar;");
    expect(css).toContain("@container sidebar");
  });

  test("条件タイプを max-width に変更すると CSS が更新される", async ({
    page,
  }) => {
    await page.getByLabel("条件 1 のタイプ").selectOption("max-width");
    const css = await page.getByLabel("生成された CSS コード").textContent();
    expect(css).toContain("max-width:");
  });

  test("条件タイプを width-range に変更すると範囲式が生成される", async ({
    page,
  }) => {
    await page.getByLabel("条件 1 のタイプ").selectOption("width-range");
    const css = await page.getByLabel("生成された CSS コード").textContent();
    expect(css).toMatch(/\d+px <= width <= \d+px/);
  });

  test("条件を追加できる", async ({ page }) => {
    await page.getByRole("button", { name: "条件を追加" }).click();
    await expect(page.getByLabel("条件 2 のタイプ")).toBeVisible();
  });

  test("論理演算子バッジをクリックで切り替えられる", async ({ page }) => {
    // まず条件を2つにする
    await page.getByRole("button", { name: "条件を追加" }).click();
    const logicBadge = page.getByRole("button", {
      name: /論理演算子: and/,
    });
    await expect(logicBadge).toBeVisible();
    await logicBadge.click();
    await expect(
      page.getByRole("button", { name: /論理演算子: or/ })
    ).toBeVisible();
    const css = await page.getByLabel("生成された CSS コード").textContent();
    expect(css).toContain(" or ");
  });

  test("ターゲットセレクタを変更すると CSS が更新される", async ({
    page,
  }) => {
    const targetInput = page.getByLabel("クエリ内のターゲットセレクタ");
    await targetInput.clear();
    await targetInput.fill(".my-card");
    const css = await page.getByLabel("生成された CSS コード").textContent();
    expect(css).toContain(".my-card {");
  });

  test("プレビュースライダーが動作する", async ({ page }) => {
    const slider = page.getByLabel(/コンテナー幅/);
    await expect(slider).toBeVisible();
    // プレビュー幅バッジが表示されている
    await expect(page.getByText(/\d+px/).first()).toBeVisible();
  });

  test("クエリ適用状態のステータスが表示される", async ({ page }) => {
    const status = page.getByRole("status");
    await expect(status).toBeVisible();
  });

  test("CSS コピーボタンが動作する", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page
      .getByRole("button", { name: "生成された CSS をクリップボードにコピー" })
      .click();
    // トースト通知を確認
    await expect(page.getByText("CSS をコピーしました")).toBeVisible();
  });

  test("リセットボタンで設定が初期化される", async ({ page }) => {
    // セレクタを変更
    const selectorInput = page.getByLabel("コンテナーの CSS セレクタ");
    await selectorInput.clear();
    await selectorInput.fill(".modified");
    // リセット
    await page.getByRole("button", { name: "すべての設定をリセット" }).click();
    // デフォルト値に戻っているか確認
    await expect(selectorInput).toHaveValue(".container");
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(
      page.getByText("CSS Container Queries とは")
    ).toBeVisible();
  });

  test("アクセシビリティ: ページにランドマークが存在する", async ({ page }) => {
    await expect(page.getByRole("main")).toBeVisible();
  });
});
