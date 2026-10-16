import { test, expect } from "@playwright/test";

test.describe("Markdownテーブル生成", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/markdown-table");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/Markdownテーブル生成/);
    await expect(page.getByRole("heading", { name: "Markdownテーブル生成" })).toBeVisible();
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

  test("CSVが入力されていない場合インポートボタンが無効", async ({ page }) => {
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

  test("引用符付きCSVを編集し、未対応・不正な入力を保持して修復できる", async ({ page }) => {
    const source = page.getByLabel("CSVインポート入力", { exact: true });
    const importButton = page.getByRole("button", { name: "CSVをインポートしてテーブルに反映" });
    const output = page.getByLabel("Markdown出力", { exact: true });
    await source.fill('"A,B",C\n"x,""y""",z');
    await importButton.click();
    await expect(page.getByLabel("列1のヘッダー", { exact: true })).toHaveValue("A,B");
    const cell = page.getByLabel("行1列1", { exact: true });
    await expect(cell).toHaveValue('x,"y"');
    await cell.fill('x,"y"編集');
    await expect(output).toHaveValue(/x,"y"編集/);
    const previous = await output.inputValue();
    for (const invalid of [
      'A,B\n1,"open',
      "A,B\n1,2,3",
      'A\tB\n"x\ny"\tz',
      '\t\nA,B\n1,"open',
      'A,B\nx,"前\n後"',
      '"A\nB",C\nx,y',
      'A,B\nx,"a\\|b"',
      '"A\\|B",C\nx,y',
    ]) {
      await source.fill(invalid);
      await importButton.click();
      await importButton.click();
      await expect(page.getByRole("alert")).toContainText("レコード");
      await expect(source).toHaveAccessibleDescription(/レコード/);
      await expect(source).toHaveValue(invalid);
      await expect(output).toHaveValue(previous);
    }
    await source.fill('A,B\n"fixed,ok",value');
    await importButton.click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(source).toHaveValue("");
    await expect(output).toHaveValue(/fixed,ok/);
    await source.fill('A\n"open');
    await importButton.click();
    await page.getByRole("button", { name: "CSVインポート入力をクリア" }).click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(source).toHaveValue("");
  });

  test("キーボードナビゲーションが機能する", async ({ page }) => {
    const headerInput = page.locator("#markdown-table-header-0");
    await headerInput.focus();
    await expect(headerInput).toBeFocused();
  });
});
