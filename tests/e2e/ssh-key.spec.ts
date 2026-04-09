import { test, expect } from "@playwright/test";

test.describe("SSH鍵生成", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ssh-key");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/SSH鍵生成/);
  });

  test("h1見出しが表示される", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "SSH鍵生成" })).toBeVisible();
  });

  test("セキュリティ警告が表示される", async ({ page }) => {
    await expect(page.getByText("鍵ペアはブラウザ内")).toBeVisible();
  });

  test("アルゴリズム選択ボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "RSA 2048" })).toBeVisible();
    await expect(page.getByRole("button", { name: "RSA 4096" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ECDSA P-256" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ECDSA P-384" })).toBeVisible();
  });

  test("デフォルトのアルゴリズムが ECDSA P-256 になっている", async ({ page }) => {
    const btn = page.getByRole("button", { name: "ECDSA P-256" });
    await expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  test("鍵ペアを生成するボタンが表示される", async ({ page }) => {
    await expect(page.getByRole("button", { name: "鍵ペアを生成" })).toBeVisible();
  });

  test("アルゴリズムを切り替えられる", async ({ page }) => {
    await page.getByRole("button", { name: "RSA 2048" }).click();
    await expect(page.getByRole("button", { name: "RSA 2048" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByRole("button", { name: "ECDSA P-256" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("鍵ペアを生成できる（ECDSA P-256）", async ({ page }) => {
    await page.getByRole("button", { name: "鍵ペアを生成" }).click();
    // 生成完了を待機（最大10秒）
    await expect(page.getByLabel("秘密鍵（PKCS#8 PEM）")).toBeVisible({ timeout: 10000 });
    const privateKeyContent = await page.getByLabel("秘密鍵（PKCS#8 PEM）").textContent();
    expect(privateKeyContent).toContain("-----BEGIN PRIVATE KEY-----");
    expect(privateKeyContent).toContain("-----END PRIVATE KEY-----");
  });

  test("OpenSSH公開鍵タブが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "鍵ペアを生成" }).click();
    await expect(page.getByRole("tab", { name: "OpenSSH形式" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("tab", { name: "PEM公開鍵" })).toBeVisible();
  });

  test("OpenSSH形式の公開鍵が表示される（ECDSA P-256）", async ({ page }) => {
    await page.getByRole("button", { name: "鍵ペアを生成" }).click();
    await expect(page.getByLabel("OpenSSH公開鍵")).toBeVisible({ timeout: 10000 });
    const publicKeyContent = await page.getByLabel("OpenSSH公開鍵").textContent();
    expect(publicKeyContent).toMatch(/^ecdsa-sha2-nistp256 /);
  });

  test("PEM公開鍵タブに切り替えられる", async ({ page }) => {
    await page.getByRole("button", { name: "鍵ペアを生成" }).click();
    await expect(page.getByRole("tab", { name: "PEM公開鍵" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("tab", { name: "PEM公開鍵" }).click();
    const pemContent = await page.getByLabel("PEM公開鍵（SPKI形式）").textContent();
    expect(pemContent).toContain("-----BEGIN PUBLIC KEY-----");
  });

  test("TipsCardが表示される", async ({ page }) => {
    await expect(page.getByText("アルゴリズムの選び方")).toBeVisible();
    await expect(page.getByText("SSH鍵の使い方")).toBeVisible();
    await expect(page.getByText("セキュリティについて")).toBeVisible();
  });
});
