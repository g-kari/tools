import { test, expect } from "@playwright/test";

test.describe("Markdownテーブル生成", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/markdown-table");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Markdownテーブル生成/);
    await expect(
      page.getByRole("heading", { name: "Markdownテーブル生成" })
    ).toBeVisible();
  });

  test("初期状態でテーブルグリッドが表示される", async ({ page }) => {
    const table = page.locator(".markdown-table-grid");
    await expect(table).toBeVisible();
  });

  test("初期状態で3列3行のテーブルが表示される", async ({ page }) => {
    const headers = page.locator(".markdown-table-header-input");
    await expect(headers).toHaveCount(3);

    const rows = page.locator(".markdown-table-grid tbody tr");
    await expect(rows).toHaveCount(3);
  });

  test("ヘッダー入力でMarkdown出力が更新される", async ({ page }) => {
    const headerInput = page.locator("#markdown-table-header-0");
    await headerInput.fill("テスト列");
    const output = page.locator("#markdown-table-output");
    await expect(output).toContainText("テスト列");
  });

  test("セル入力でMarkdown出力が更新される", async ({ page }) => {
    const cellInput = page.locator(".markdown-table-cell-input").first();
    await cellInput.fill("サンプルデータ");
    const output = page.locator("#markdown-table-output");
    await expect(output).toContainText("サンプルデータ");
  });

  test("整列方向を変更するとMarkdown出力が更新される", async ({ page }) => {
    const alignSelect = page.locator(".markdown-table-align-select").first();
    await alignSelect.selectOption("left");
    const output = page.locator("#markdown-table-output");
    await expect(output).toContainText(":---");
  });

  test("行追加ボタンで行が増える", async ({ page }) => {
    const addRowBtn = page.getByRole("button", { name: "行を追加" });
    await addRowBtn.click();
    const rows = page.locator(".markdown-table-grid tbody tr");
    await expect(rows).toHaveCount(4);
  });

  test("列追加ボタンで列が増える", async ({ page }) => {
    const addColBtn = page.getByRole("button", { name: "列を追加" });
    await addColBtn.click();
    const headers = page.locator(".markdown-table-header-input");
    await expect(headers).toHaveCount(4);
  });

  test("行削除ボタンで行が減る", async ({ page }) => {
    const removeBtn = page.locator(".markdown-table-row-remove").first();
    await removeBtn.click();
    const rows = page.locator(".markdown-table-grid tbody tr");
    await expect(rows).toHaveCount(2);
  });

  test("列削除ボタンで列が減る", async ({ page }) => {
    const removeBtn = page.locator(".markdown-table-col-remove").first();
    await removeBtn.click();
    const headers = page.locator(".markdown-table-header-input");
    await expect(headers).toHaveCount(2);
  });

  test("1列の場合は列削除ボタンが無効になる", async ({ page }) => {
    // 2列削除して1列にする
    const removeBtn = page.locator(".markdown-table-col-remove").first();
    await removeBtn.click();
    await removeBtn.click();
    const lastRemoveBtn = page.locator(".markdown-table-col-remove").first();
    await expect(lastRemoveBtn).toBeDisabled();
  });

  test("コピーボタンが存在する", async ({ page }) => {
    const copyBtn = page.getByRole("button", {
      name: "Markdownをクリップボードにコピー",
    });
    await expect(copyBtn).toBeVisible();
  });

  test("クリアボタンでテーブルがリセットされる", async ({ page }) => {
    const headerInput = page.locator("#markdown-table-header-0");
    await headerInput.fill("テスト入力");
    const clearBtn = page.getByRole("button", { name: "テーブルをリセット" });
    await clearBtn.click();
    const headerInputAfter = page.locator("#markdown-table-header-0");
    await expect(headerInputAfter).not.toHaveValue("テスト入力");
  });

  test("CSVインポート入力欄が存在する", async ({ page }) => {
    const csvInput = page.getByLabel("CSVインポート入力");
    await expect(csvInput).toBeVisible();
  });

  test("CSVが入力されていない場合インポートボタンが無効", async ({
    page,
  }) => {
    const importBtn = page.getByRole("button", {
      name: "CSVをインポートしてテーブルに反映",
    });
    await expect(importBtn).toBeDisabled();
  });

  test("CSVをインポートできる", async ({ page }) => {
    const csvInput = page.getByLabel("CSVインポート入力");
    await csvInput.fill("名前,年齢\nAlice,30");
    const importBtn = page.getByRole("button", {
      name: "CSVをインポートしてテーブルに反映",
    });
    await importBtn.click();
    const output = page.locator("#markdown-table-output");
    await expect(output).toContainText("名前");
    await expect(output).toContainText("Alice");
  });

  test("Tipsカードが表示される", async ({ page }) => {
    const tips = page.locator(".tips-card");
    await expect(tips).toBeVisible();
  });

  test("キーボードナビゲーションが機能する", async ({ page }) => {
    const headerInput = page.locator("#markdown-table-header-0");
    await headerInput.focus();
    await expect(headerInput).toBeFocused();
  });
});
