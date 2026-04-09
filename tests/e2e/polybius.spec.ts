import { expect, test } from "@playwright/test";

test.describe("ポリュビオス暗号ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/polybius");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /ポリュビオス暗号/ })).toBeVisible();
  });

  test("モード切替ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "デコード" })).toBeVisible();
  });

  test("キーワード入力フィールドが表示される", async ({ page }) => {
    await expect(page.locator("#polybius-key")).toBeVisible();
  });

  test("5×5ポリュビオス方陣が表示される", async ({ page }) => {
    const grid = page.locator(".polybius-grid");
    await expect(grid).toBeVisible();
    // 5行のボディ行
    const rows = grid.locator("tbody tr");
    await expect(rows).toHaveCount(5);
    // 各行に5セル＋ヘッダーセル
    const firstRow = rows.first();
    const cells = firstRow.locator("td");
    await expect(cells).toHaveCount(6);
  });

  test("入力エリアと変換結果エリアが表示される", async ({ page }) => {
    await expect(page.locator("#polybius-input")).toBeVisible();
    await expect(page.locator("#polybius-output")).toBeVisible();
  });

  test("空入力では変換結果が空の状態メッセージを表示する", async ({ page }) => {
    await expect(page.locator("#polybius-output")).toContainText("変換結果がここに表示されます");
    await expect(page.locator("#polybius-output")).toHaveClass(/polybius-output--empty/);
  });

  test("エンコードモードでテキストを変換できる", async ({ page }) => {
    await page.locator("#polybius-input").fill("HELLO");
    const output = page.locator("#polybius-output");
    await expect(output).not.toHaveClass(/polybius-output--empty/);
    // ポリュビオスの出力は数字ペアのはず
    const text = await output.textContent();
    expect(text).toMatch(/\d/);
  });

  test("デコードモードで数字を変換できる", async ({ page }) => {
    await page.getByRole("button", { name: "デコード" }).click();
    // HELLOのデフォルトエンコード: 23 15 31 31 34
    await page.locator("#polybius-input").fill("23 15 31 31 34");
    const output = page.locator("#polybius-output");
    await expect(output).not.toHaveClass(/polybius-output--empty/);
    const text = await output.textContent();
    expect(text?.trim()).toContain("HELLO");
  });

  test("キーワードを設定すると方陣の並びが変わる", async ({ page }) => {
    // キーワードなしの方陣のA列1行目はAのはず
    const firstCell = page.locator(".polybius-grid tbody tr:first-child td:nth-child(2)");
    const defaultText = await firstCell.textContent();

    await page.locator("#polybius-key").fill("ZEBRA");
    const newText = await firstCell.textContent();
    // キーワードありでは最初のセルが変わる
    expect(newText).not.toBe(defaultText);
  });

  test("コピーボタンは出力がない場合に無効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();

    await page.locator("#polybius-input").fill("HELLO");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がクリアされる", async ({ page }) => {
    await page.locator("#polybius-input").fill("HELLO");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#polybius-input")).toHaveValue("");
    await expect(page.locator("#polybius-output")).toContainText("変換結果がここに表示されます");
  });

  test("クリアボタンは入力が空の場合に無効になる", async ({ page }) => {
    const clearBtn = page.getByRole("button", { name: "クリア" });
    await expect(clearBtn).toBeDisabled();

    await page.locator("#polybius-input").fill("TEST");
    await expect(clearBtn).toBeEnabled();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("ポリュビオス暗号について")).toBeVisible();
  });

  test("モードをデコードに切り替えられる", async ({ page }) => {
    const decodeBtn = page.getByRole("button", { name: "デコード" });
    await decodeBtn.click();
    await expect(decodeBtn).toHaveAttribute("aria-pressed", "true");

    const encodeBtn = page.getByRole("button", { name: "エンコード" });
    await expect(encodeBtn).toHaveAttribute("aria-pressed", "false");
  });
});
