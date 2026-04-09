import { test, expect } from "@playwright/test";

test.describe("パスワード強度チェッカー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/password-strength");
  });

  test("ページが正常に表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/パスワード強度チェッカー/);
    await expect(page.getByLabel("パスワード")).toBeVisible();
  });

  test("空の状態で空状態メッセージが表示される", async ({ page }) => {
    await expect(page.getByText("パスワードを入力すると強度を即座に解析します")).toBeVisible();
  });

  test("パスワードを入力すると強度バーが表示される", async ({ page }) => {
    await page.getByLabel("パスワード").fill("Hello123!");
    await expect(page.getByRole("progressbar")).toBeVisible();
  });

  test("弱いパスワードに「とても弱い」または「弱い」が表示される", async ({ page }) => {
    await page.getByLabel("パスワード").fill("abc");
    const label = page.locator(".ps-strength-label");
    await expect(label).toBeVisible();
    const text = await label.textContent();
    expect(["とても弱い", "弱い"]).toContain(text);
  });

  test("よく使われるパスワードに警告アドバイスが表示される", async ({ page }) => {
    await page.getByLabel("パスワード").fill("password");
    await expect(page.getByText(/よく使われる/)).toBeVisible();
  });

  test("強いパスワードに「強い」または「とても強い」が表示される", async ({ page }) => {
    await page.getByLabel("パスワード").fill("Xk9#mL2@pQ7!rT5$nJ3^wB");
    const label = page.locator(".ps-strength-label");
    const text = await label.textContent();
    expect(["強い", "とても強い"]).toContain(text);
  });

  test("文字クラスの内訳が表示される", async ({ page }) => {
    await page.getByLabel("パスワード").fill("Hello123!");
    await expect(page.getByText("小文字 (a-z)")).toBeVisible();
    await expect(page.getByText("大文字 (A-Z)")).toBeVisible();
    await expect(page.getByText("数字 (0-9)")).toBeVisible();
  });

  test("クラック時間が表示される", async ({ page }) => {
    await page.getByLabel("パスワード").fill("Hello123!");
    await expect(page.getByText("クラック時間の推定")).toBeVisible();
    await expect(page.getByText("オンライン（レート制限あり）")).toBeVisible();
  });

  test("エントロピーが表示される", async ({ page }) => {
    await page.getByLabel("パスワード").fill("Hello123!");
    await expect(page.getByText(/エントロピー.*bit/)).toBeVisible();
  });

  test("パスワード表示切り替えボタンが動作する", async ({ page }) => {
    const input = page.getByLabel("パスワード");
    await input.fill("MySecret");
    expect(await input.getAttribute("type")).toBe("password");

    await page.getByRole("button", { name: "パスワードを表示する" }).click();
    expect(await input.getAttribute("type")).toBe("text");

    await page.getByRole("button", { name: "パスワードを隠す" }).click();
    expect(await input.getAttribute("type")).toBe("password");
  });

  test("クリアボタンが動作する", async ({ page }) => {
    await page.getByLabel("パスワード").fill("Hello123!");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.getByLabel("パスワード")).toHaveValue("");
    await expect(page.getByText("パスワードを入力すると強度を即座に解析します")).toBeVisible();
  });

  test("改善アドバイスセクションが表示される", async ({ page }) => {
    await page.getByLabel("パスワード").fill("abc123");
    await expect(page.getByText("改善アドバイス")).toBeVisible();
  });

  test("外部送信なしのヒントが表示される", async ({ page }) => {
    await expect(page.getByText(/外部送信なし/)).toBeVisible();
  });
});
