import { test, expect } from "@playwright/test";

test.describe("JSON Lines フォーマッター - E2E Tests", () => {
  test.describe.configure({ timeout: 10000 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/json-lines");
    await page.waitForLoadState("networkidle");
  });

  test("ページが正しいタイトルで表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/JSON Lines/);
  });

  test('"undefined" が含まれないこと', async ({ page }) => {
    const bodyText = await page.textContent("body");
    expect(bodyText).not.toContain("undefined");
    expect(bodyText).not.toBe("undefined");
  });

  test("入力テキストエリアが表示される", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    await expect(inputTextarea).toBeVisible();
  });

  test("3つのモード切り替えボタンが存在する", async ({ page }) => {
    const validateBtn = page.locator("button[aria-pressed]", { hasText: "検証・整形" });
    const toArrayBtn = page.locator("button[aria-pressed]", { hasText: "JSONL → JSON配列" });
    const fromArrayBtn = page.locator("button[aria-pressed]", { hasText: "JSON配列 → JSONL" });

    await expect(validateBtn).toBeVisible();
    await expect(toArrayBtn).toBeVisible();
    await expect(fromArrayBtn).toBeVisible();
  });

  test("デフォルトは「検証・整形」モードである", async ({ page }) => {
    const validateBtn = page.locator('button[aria-pressed="true"]');
    await expect(validateBtn).toContainText("検証・整形");
  });

  test("検証モード: 有効な JSON Lines 入力で統計が表示される", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    await inputTextarea.fill('{"id":1}\n{"id":2}\n{"id":3}');

    const stats = page.locator(".jsonl-stats");
    await expect(stats).toBeVisible();
    await expect(stats).toContainText("3");
  });

  test("検証モード: 無効な行でエラーリストが表示される", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    await inputTextarea.fill('{"id":1}\ninvalid json here\n{"id":3}');

    const errorList = page.locator(".jsonl-error-list");
    await expect(errorList).toBeVisible();
    await expect(errorList).toContainText("行 2");
  });

  test("検証モード: 整形ボタンで JSON を pretty-print できる", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    await inputTextarea.fill('{"id":1,"name":"田中"}');

    const formatBtn = page.locator("button", { hasText: "整形" });
    await formatBtn.click();

    const value = await inputTextarea.inputValue();
    expect(value).toContain('"id": 1');
    expect(value).toContain('"name": "田中"');
  });

  test("検証モード: 圧縮ボタンで JSON を1行にできる", async ({ page }) => {
    const inputTextarea = page.locator("#inputText");
    await inputTextarea.fill('{\n  "id": 1,\n  "name": "田中"\n}');

    const minifyBtn = page.locator("button", { hasText: "圧縮" });
    await minifyBtn.click();

    const value = await inputTextarea.inputValue();
    expect(value.split("\n").filter((l) => l.trim()).length).toBe(1);
  });

  test("JSONL→JSON配列モード: 変換が正しく機能する", async ({ page }) => {
    const toArrayBtn = page.locator("button[aria-pressed]", { hasText: "JSONL → JSON配列" });
    await toArrayBtn.click();

    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const convertBtn = page.locator("button.btn-primary");

    await inputTextarea.fill('{"id":1}\n{"id":2}');
    await convertBtn.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  test("JSONL→JSON配列モード: 無効な行でエラーが表示される", async ({ page }) => {
    const toArrayBtn = page.locator("button[aria-pressed]", { hasText: "JSONL → JSON配列" });
    await toArrayBtn.click();

    const inputTextarea = page.locator("#inputText");
    const convertBtn = page.locator("button.btn-primary");

    await inputTextarea.fill('{"id":1}\ninvalid');
    await convertBtn.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
  });

  test("JSON配列→JSONLモード: 変換が正しく機能する", async ({ page }) => {
    const fromArrayBtn = page.locator("button[aria-pressed]", { hasText: "JSON配列 → JSONL" });
    await fromArrayBtn.click();

    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const convertBtn = page.locator("button.btn-primary");

    await inputTextarea.fill('[{"id":1},{"id":2}]');
    await convertBtn.click();

    await expect(outputTextarea).not.toHaveValue("");
    const output = await outputTextarea.inputValue();
    const lines = output.split("\n").filter((l) => l.trim());
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toEqual({ id: 1 });
  });

  test("JSON配列→JSONLモード: 配列でない JSON でエラーが表示される", async ({ page }) => {
    const fromArrayBtn = page.locator("button[aria-pressed]", { hasText: "JSON配列 → JSONL" });
    await fromArrayBtn.click();

    const inputTextarea = page.locator("#inputText");
    const convertBtn = page.locator("button.btn-primary");

    await inputTextarea.fill('{"id":1}');
    await convertBtn.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("JSON配列");
  });

  test("サンプルボタンで入力が読み込まれる", async ({ page }) => {
    const sampleBtn = page.locator("button", { hasText: "サンプル" });
    const inputTextarea = page.locator("#inputText");

    await sampleBtn.click();
    const value = await inputTextarea.inputValue();
    expect(value.length).toBeGreaterThan(0);
    expect(value).toContain("{");
  });

  test("クリアボタンで入力・出力がリセットされる", async ({ page }) => {
    const toArrayBtn = page.locator("button[aria-pressed]", { hasText: "JSONL → JSON配列" });
    await toArrayBtn.click();

    const inputTextarea = page.locator("#inputText");
    const outputTextarea = page.locator("#outputText");
    const convertBtn = page.locator("button.btn-primary");
    const clearBtn = page.locator("button.btn-clear");

    await inputTextarea.fill('{"id":1}');
    await convertBtn.click();
    await expect(outputTextarea).not.toHaveValue("");

    await clearBtn.click();
    await expect(inputTextarea).toHaveValue("");
    await expect(outputTextarea).toHaveValue("");
  });

  test("空入力で変換ボタンを押すとエラーが表示される", async ({ page }) => {
    const toArrayBtn = page.locator("button[aria-pressed]", { hasText: "JSONL → JSON配列" });
    await toArrayBtn.click();

    const convertBtn = page.locator("button.btn-primary");
    await convertBtn.click();

    const errorMessage = page.locator(".error-message");
    await expect(errorMessage).toBeVisible();
  });

  test("TipsCard が表示される", async ({ page }) => {
    const infoBox = page.locator(".info-box");
    await expect(infoBox).toBeVisible();

    const infoText = await infoBox.textContent();
    expect(infoText).toContain("使い方");
    expect(infoText).not.toContain("undefined");
  });

  test("アクセシビリティ: ランドマークが存在する", async ({ page }) => {
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
  });
});
