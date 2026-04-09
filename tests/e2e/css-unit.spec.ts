import { test, expect } from "@playwright/test";

test.describe("CSS単位変換", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/css-unit");
  });

  test("ページタイトルが表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/CSS単位変換/);
  });

  test("値入力欄が表示される", async ({ page }) => {
    const input = page.locator("#css-unit-value");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("16");
  });

  test("単位セレクターが表示される", async ({ page }) => {
    const selector = page.locator(".css-unit-selector");
    await expect(selector).toBeVisible();

    // 主要な単位ボタンが存在する
    for (const unit of ["px", "rem", "em", "vw", "vh", "%"]) {
      await expect(page.getByRole("button", { name: unit, exact: true })).toBeVisible();
    }
  });

  test("デフォルトで 16px の変換結果が表示される", async ({ page }) => {
    // 変換結果グリッドが表示される
    const results = page.locator(".css-unit-results");
    await expect(results).toBeVisible();

    // rem 結果が 1rem であることを確認
    const remItem = page.locator(".css-unit-result-item").filter({ hasText: "rem" }).first();
    await expect(remItem).toContainText("1rem");
  });

  test("値を変更すると変換結果が更新される", async ({ page }) => {
    const input = page.locator("#css-unit-value");
    await input.clear();
    await input.fill("32");

    const remItem = page.locator(".css-unit-result-item").filter({ hasText: "rem" }).first();
    await expect(remItem).toContainText("2rem");
  });

  test("単位を切り替えると変換元が変わる", async ({ page }) => {
    // rem を選択
    await page.getByRole("button", { name: "rem", exact: true }).click();

    // rem ボタンが active になる
    const remBtn = page.getByRole("button", { name: "rem", exact: true });
    await expect(remBtn).toHaveClass(/active/);

    // 入力欄に 16 を入力 → 1rem = 16px
    const input = page.locator("#css-unit-value");
    await input.clear();
    await input.fill("1");

    const pxItem = page.locator(".css-unit-result-item").filter({ hasText: "px" }).first();
    await expect(pxItem).toContainText("16px");
  });

  test("設定パネルを開閉できる", async ({ page }) => {
    const details = page.locator(".css-unit-settings");
    const summary = details.locator("summary");

    // 初期状態は閉じている
    await expect(details).not.toHaveAttribute("open", "");

    // クリックして開く
    await summary.click();
    await expect(details).toHaveAttribute("open", "");

    // 設定フィールドが表示される
    await expect(page.locator("#css-unit-root-font")).toBeVisible();
    await expect(page.locator("#css-unit-vw")).toBeVisible();
  });

  test("ルートフォントサイズを変更すると rem 変換結果が更新される", async ({ page }) => {
    // 設定パネルを開く
    await page.locator(".css-unit-settings summary").click();

    // ルートフォントサイズを 20 に変更
    const rootFontInput = page.locator("#css-unit-root-font");
    await rootFontInput.clear();
    await rootFontInput.fill("20");

    // 値欄に 1rem を入力（変換元を rem に切り替え）
    await page.getByRole("button", { name: "rem", exact: true }).click();
    const valueInput = page.locator("#css-unit-value");
    await valueInput.clear();
    await valueInput.fill("1");

    // 1rem = 20px になっているはず
    const pxItem = page.locator(".css-unit-result-item").filter({ hasText: "px" }).first();
    await expect(pxItem).toContainText("20px");
  });

  test("結果の値をクリックすると入力欄に反映される", async ({ page }) => {
    // 初期状態: 16px → rem: 1rem
    // rem の値カードをクリック
    const remValueBtn = page
      .locator(".css-unit-result-item")
      .filter({ hasText: "rem" })
      .first()
      .locator(".css-unit-result-value");
    await remValueBtn.click();

    // 入力欄が 1 になり、選択単位が rem になる
    const input = page.locator("#css-unit-value");
    await expect(input).toHaveValue("1");

    const remBtn = page.getByRole("button", { name: "rem", exact: true });
    await expect(remBtn).toHaveClass(/active/);
  });

  test("コピーボタンが各結果に存在する", async ({ page }) => {
    const copyBtns = page.locator(".css-unit-copy-btn");
    const count = await copyBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test("空の入力欄では空状態メッセージが表示される", async ({ page }) => {
    const input = page.locator("#css-unit-value");
    await input.clear();

    const empty = page.locator(".css-unit-empty");
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("値を入力すると");
  });

  test("TipsCard が表示される", async ({ page }) => {
    await expect(page.locator(".tips-card")).toBeVisible();
  });

  test('アクセシビリティ: 単位セレクターに role="group" がある', async ({ page }) => {
    const selector = page.locator('[role="group"][aria-label="変換元の単位を選択"]');
    await expect(selector).toBeVisible();
  });

  test('アクセシビリティ: 変換結果に role="list" がある', async ({ page }) => {
    const list = page.locator('[role="list"][aria-label="CSS 単位変換結果"]');
    await expect(list).toBeVisible();
  });
});
