import { expect, test } from "@playwright/test";

test.describe("タイムゾーン変換ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/timezone");
  });

  test("ページタイトルが正しく表示されること", async ({ page }) => {
    await expect(page).toHaveTitle(/タイムゾーン変換/);
  });

  test("見出しが表示されること", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "タイムゾーン変換" })
    ).toBeVisible();
  });

  test("日時入力フィールドが表示されること", async ({ page }) => {
    await expect(page.locator("#timezone-datetime")).toBeVisible();
  });

  test("タイムゾーン選択ドロップダウンが表示されること", async ({ page }) => {
    await expect(page.locator("#timezone-source")).toBeVisible();
  });

  test("「現在時刻」ボタンが表示されること", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "現在時刻" })
    ).toBeVisible();
  });

  test("変換結果テーブルが表示されること", async ({ page }) => {
    const table = page.locator(".timezone-table");
    await expect(table).toBeVisible();
  });

  test("デフォルトで変換結果が表示されること", async ({ page }) => {
    const rows = page.locator(".timezone-result-row");
    await expect(rows.first()).toBeVisible();
  });

  test("「現在時刻」ボタンで日時が更新されること", async ({ page }) => {
    const input = page.locator("#timezone-datetime");
    await input.fill("2020-01-01T00:00");
    await page.getByRole("button", { name: "現在時刻" }).click();
    const value = await input.inputValue();
    expect(value).not.toBe("2020-01-01T00:00");
  });

  test("「すべて選択」ボタンですべてのチェックボックスがオンになること", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "すべてのタイムゾーンを選択" }).click();
    const checkboxes = page.locator(".timezone-checkbox");
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test("「すべて解除」ボタンですべてのチェックボックスがオフになること", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "すべての選択を解除" }).click();
    const checkboxes = page.locator(".timezone-checkbox");
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).not.toBeChecked();
    }
  });

  test("「すべて解除」後に空状態メッセージが表示されること", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "すべての選択を解除" }).click();
    await expect(
      page.getByText("変換先タイムゾーンを1つ以上選択してください")
    ).toBeVisible();
  });

  test("「全結果コピー」ボタンが存在すること", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "変換結果をすべてクリップボードにコピー" })
    ).toBeVisible();
  });

  test("「リセット」ボタンで入力がリセットされること", async ({ page }) => {
    const input = page.locator("#timezone-datetime");
    await input.fill("2020-01-01T00:00");
    await page.getByRole("button", { name: "入力をリセット" }).click();
    const value = await input.inputValue();
    expect(value).not.toBe("2020-01-01T00:00");
  });

  test("チェックボックスをオフにするとその結果が消えること", async ({
    page,
  }) => {
    // 東京のチェックボックスをオフにする
    const tokyoCheckbox = page.locator(
      '.timezone-checkbox[aria-label*="東京"]'
    );
    if (await tokyoCheckbox.isChecked()) {
      await tokyoCheckbox.uncheck();
      const rows = page.locator(".timezone-result-row");
      // 東京の行が表示されていないこと
      await expect(rows.filter({ hasText: "東京" })).toHaveCount(0);
    }
  });

  test("ナビゲーションからアクセスできること", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "タイムゾーン変換" })).toBeVisible();
  });
});
