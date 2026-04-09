import { expect, test } from "@playwright/test";

test.describe("数論ツールページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/number-theory");
  });

  test("ページが正しく表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /数論ツール/ })).toBeVisible();
  });

  test("4つのタブが表示される", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "GCD / LCM" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "素因数分解" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "冪乗 mod" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "φ / 逆数" })).toBeVisible();
  });

  test.describe("GCD / LCM タブ", () => {
    test("数値を追加して GCD・LCM を計算できる", async ({ page }) => {
      const input = page.locator("#gcd-lcm-input");
      await input.fill("12");
      await page.getByRole("button", { name: "追加" }).click();
      await input.fill("8");
      await page.getByRole("button", { name: "追加" }).click();

      await expect(page.getByText("4").first()).toBeVisible();
      await expect(page.getByText("24")).toBeVisible();
    });

    test("Enter キーで数値を追加できる", async ({ page }) => {
      const input = page.locator("#gcd-lcm-input");
      await input.fill("6");
      await input.press("Enter");
      await input.fill("4");
      await input.press("Enter");

      await expect(page.getByText("GCD（最大公約数）")).toBeVisible();
    });

    test("チップの × ボタンで数値を削除できる", async ({ page }) => {
      const input = page.locator("#gcd-lcm-input");
      await input.fill("12");
      await page.getByRole("button", { name: "追加" }).click();

      const removeBtn = page.getByRole("button", { name: /12 を削除/ });
      await removeBtn.click();

      await expect(page.locator(".number-theory-number-chip")).toHaveCount(0);
    });
  });

  test.describe("素因数分解タブ", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("tab", { name: "素因数分解" }).click();
    });

    test("360 の素因数分解が正しく表示される", async ({ page }) => {
      await page.locator("#factorize-input").fill("360");
      await expect(page.getByText(/2.*3.*5/)).toBeVisible();
    });

    test('素数が "素数 ✓" と表示される', async ({ page }) => {
      await page.locator("#factorize-input").fill("7");
      await expect(page.getByText("素数 ✓")).toBeVisible();
    });

    test('合成数が "合成数" と表示される', async ({ page }) => {
      await page.locator("#factorize-input").fill("12");
      await expect(page.getByText("合成数")).toBeVisible();
    });

    test("オイラー関数が表示される", async ({ page }) => {
      await page.locator("#factorize-input").fill("12");
      await expect(page.getByText("φ(n) — オイラー関数")).toBeVisible();
      await expect(page.getByText("4").first()).toBeVisible();
    });
  });

  test.describe("冪乗 mod タブ", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("tab", { name: "冪乗 mod" }).click();
    });

    test("2^10 mod 1000 = 24 を計算できる", async ({ page }) => {
      await page.locator("#modpow-base").fill("2");
      await page.locator("#modpow-exp").fill("10");
      await page.locator("#modpow-mod").fill("1000");
      await expect(page.getByText("24").first()).toBeVisible();
    });

    test("計算式が表示される", async ({ page }) => {
      await page.locator("#modpow-base").fill("3");
      await page.locator("#modpow-exp").fill("4");
      await page.locator("#modpow-mod").fill("5");
      await expect(page.getByText(/3\^4 mod 5/)).toBeVisible();
    });

    test("負の指数でエラーが表示される", async ({ page }) => {
      await page.locator("#modpow-base").fill("2");
      await page.locator("#modpow-exp").fill("-1");
      await page.locator("#modpow-mod").fill("7");
      await expect(page.getByText(/指数は0以上/)).toBeVisible();
    });
  });

  test.describe("φ / 逆数タブ", () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("tab", { name: "φ / 逆数" }).click();
    });

    test("3^{-1} mod 11 = 4 を計算できる", async ({ page }) => {
      await page.locator("#modinv-a").fill("3");
      await page.locator("#modinv-m").fill("11");
      await expect(page.getByText("4").first()).toBeVisible();
    });

    test('逆数が存在しない場合に "存在しない" が表示される', async ({ page }) => {
      await page.locator("#modinv-a").fill("2");
      await page.locator("#modinv-m").fill("4");
      await expect(page.getByText("存在しない")).toBeVisible();
    });
  });

  test("Tipsカードが表示される", async ({ page }) => {
    await expect(page.getByText("GCD / LCM").first()).toBeVisible();
    await expect(page.getByText("冪乗 mod (modPow)")).toBeVisible();
  });
});
