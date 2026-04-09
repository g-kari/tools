import { expect, test } from "@playwright/test";

test.describe("テキスト暗号化ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/text-encrypt");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "テキスト暗号化" })).toBeVisible();
  });

  test("暗号方式選択ボタンが全て表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "ROT13" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Caesar暗号" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Vigenère暗号" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Atbash暗号" })).toBeVisible();
  });

  test("入力テキストエリアが表示される", async ({ page }) => {
    await expect(page.locator("#text-encrypt-input")).toBeVisible();
  });

  test("出力テキストエリアが表示される", async ({ page }) => {
    await expect(page.locator("#text-encrypt-output")).toBeVisible();
  });

  test("ROT13でテキストを変換できる", async ({ page }) => {
    await page.locator("#text-encrypt-input").fill("HELLO");
    const output = page.locator("#text-encrypt-output");
    await expect(output).toHaveValue("URYYB");
  });

  test("Caesar暗号を選択できる", async ({ page }) => {
    await page.getByRole("button", { name: "Caesar暗号" }).click();
    // シフト数入力が表示される
    await expect(page.locator("#text-encrypt-shift")).toBeVisible();
    // モード切替ボタンが表示される
    await expect(page.getByRole("button", { name: "暗号化" })).toBeVisible();
    await expect(page.getByRole("button", { name: "復号化" })).toBeVisible();
  });

  test("Caesar暗号でHELLOをシフト3で暗号化できる", async ({ page }) => {
    await page.getByRole("button", { name: "Caesar暗号" }).click();
    await page.locator("#text-encrypt-input").fill("HELLO");
    const output = page.locator("#text-encrypt-output");
    await expect(output).toHaveValue("KHOOR");
  });

  test("Vigenère暗号を選択するとキー入力が表示される", async ({ page }) => {
    await page.getByRole("button", { name: "Vigenère暗号" }).click();
    await expect(page.locator("#text-encrypt-key")).toBeVisible();
  });

  test("Vigenère暗号でキーを使って暗号化できる", async ({ page }) => {
    await page.getByRole("button", { name: "Vigenère暗号" }).click();
    await page.locator("#text-encrypt-key").fill("KEY");
    await page.locator("#text-encrypt-input").fill("HELLO");
    const output = page.locator("#text-encrypt-output");
    await expect(output).toHaveValue("RIJVS");
  });

  test("Atbash暗号でHELLOを変換できる", async ({ page }) => {
    await page.getByRole("button", { name: "Atbash暗号" }).click();
    await page.locator("#text-encrypt-input").fill("HELLO");
    const output = page.locator("#text-encrypt-output");
    await expect(output).toHaveValue("SVOOL");
  });

  test("コピーボタンが出力がない場合に無効化される", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: "コピー" });
    await expect(copyBtn).toBeDisabled();
  });

  test("クリアボタンが入力なしで無効化される", async ({ page }) => {
    const clearBtn = page.getByRole("button", { name: "クリア" });
    await expect(clearBtn).toBeDisabled();
  });

  test("クリアボタンで入力をクリアできる", async ({ page }) => {
    await page.locator("#text-encrypt-input").fill("HELLO");
    await page.getByRole("button", { name: "クリア" }).click();
    await expect(page.locator("#text-encrypt-input")).toHaveValue("");
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText("使い方")).toBeVisible();
  });

  test("ROT13は暗号化/復号化モードボタンを表示しない", async ({ page }) => {
    // ROT13はデフォルトで選択されている（自己逆関数なのでモード不要）
    await expect(page.getByRole("button", { name: "暗号化" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "復号化" })).not.toBeVisible();
  });
});
