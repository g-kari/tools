import { expect, test } from "@playwright/test";

test.describe("スキュタレー暗号ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scytale");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /スキュタレー暗号/ })).toBeVisible();
  });

  test("モード切替ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "エンコード" })).toBeVisible();
    await expect(page.getByRole("button", { name: "デコード" })).toBeVisible();
  });

  test("直径スライダーと数値入力が表示される", async ({ page }) => {
    await expect(page.locator("#scytale-diameter-range")).toBeVisible();
    await expect(page.locator(".scytale-diameter-input")).toBeVisible();
    await expect(page.locator(".scytale-diameter-value")).toBeVisible();
  });

  test("入力エリアと変換結果エリアが表示される", async ({ page }) => {
    await expect(page.locator("#scytale-input")).toBeVisible();
    await expect(page.locator("#scytale-output")).toBeVisible();
  });

  test("空入力では変換結果が空の状態メッセージを表示する", async ({ page }) => {
    await expect(page.locator("#scytale-output")).toContainText("変換結果がここに表示されます");
    await expect(page.locator("#scytale-output")).toHaveClass(/scytale-output--empty/);
  });

  test("初期状態ではグリッドが表示されない", async ({ page }) => {
    await expect(page.locator(".scytale-grids")).not.toBeVisible();
  });

  test("エンコードモードでテキストを変換できる", async ({ page }) => {
    await page.locator("#scytale-input").fill("HELLOWORLD");
    const output = page.locator("#scytale-output");
    await expect(output).not.toHaveClass(/scytale-output--empty/);
    const text = await output.textContent();
    expect(text?.trim()).not.toBe("");
    expect(text?.trim()).not.toBe("HELLOWORLD");
  });

  test("テキスト入力後にグリッドが表示される", async ({ page }) => {
    await page.locator("#scytale-input").fill("HELLOWORLD");
    await expect(page.locator(".scytale-grids")).toBeVisible();
    await expect(page.locator(".scytale-grid--plain")).toBeVisible();
    await expect(page.locator(".scytale-grid--cipher")).toBeVisible();
  });

  test("直径を変えると変換結果が変わる", async ({ page }) => {
    await page.locator("#scytale-input").fill("HELLOWORLD");
    const output = page.locator("#scytale-output");
    const initialText = await output.textContent();

    // 直径を変更
    const slider = page.locator("#scytale-diameter-range");
    await slider.fill("3");

    const newText = await output.textContent();
    expect(newText).not.toBe(initialText);
  });

  test("数値入力で直径を変更できる", async ({ page }) => {
    const numberInput = page.locator(".scytale-diameter-input");
    await numberInput.fill("8");
    await numberInput.blur();
    await expect(page.locator(".scytale-diameter-value")).toHaveText("8");
  });

  test("エンコード→デコードで元のテキストに戻せる", async ({ page }) => {
    const inputText = "HELLOWORLD";
    await page.locator("#scytale-input").fill(inputText);
    const encoded = await page.locator("#scytale-output").textContent();

    await page.getByRole("button", { name: "デコード" }).click();
    await page.locator("#scytale-input").fill(encoded?.trim() ?? "");

    const decoded = await page.locator("#scytale-output").textContent();
    expect(decoded?.trim()).toContain("HELLOWORLD");
  });

  test("コピーボタンは出力がない場合に無効になる", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();

    await page.locator("#scytale-input").fill("HELLO");
    await expect(copyBtn).toBeEnabled();
  });

  test("クリアボタンで入力がクリアされる", async ({ page }) => {
    await page.locator("#scytale-input").fill("HELLO");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#scytale-input")).toHaveValue("");
    await expect(page.locator("#scytale-output")).toContainText("変換結果がここに表示されます");
  });

  test("クリア後グリッドが非表示になる", async ({ page }) => {
    await page.locator("#scytale-input").fill("HELLO");
    await expect(page.locator(".scytale-grids")).toBeVisible();

    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator(".scytale-grids")).not.toBeVisible();
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
    await expect(page.getByText("スキュタレー暗号について")).toBeVisible();
  });

  test("モードをデコードに切り替えられる", async ({ page }) => {
    const decodeBtn = page.getByRole("button", { name: "デコード" });
    await decodeBtn.click();
    await expect(decodeBtn).toHaveAttribute("aria-pressed", "true");

    const encodeBtn = page.getByRole("button", { name: "エンコード" });
    await expect(encodeBtn).toHaveAttribute("aria-pressed", "false");
  });
});
