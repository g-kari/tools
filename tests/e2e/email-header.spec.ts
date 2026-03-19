import { test, expect } from "@playwright/test";

const SAMPLE_HEADERS = `Received: from mail.example.com (mail.example.com [203.0.113.1])
 by mx.example.org with ESMTPS; Thu, 20 Mar 2026 10:00:05 +0900
Received: from smtp.example.com (smtp.example.com [203.0.113.2])
 by mail.example.com with ESMTP; Thu, 20 Mar 2026 10:00:02 +0900
From: sender@example.com
To: recipient@example.org
Subject: Test Email
Date: Thu, 20 Mar 2026 10:00:00 +0900
Message-ID: <test123@example.com>
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Return-Path: <bounce@example.com>
Authentication-Results: mx.example.org;
 spf=pass smtp.mailfrom=example.com;
 dkim=pass header.d=example.com;
 dmarc=pass action=none header.from=example.com
X-Spam-Status: No, score=-1.5 required=5.0 tests=BAYES_00,SPF_PASS`;

test.describe("メールヘッダー解析ページ", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/email-header");
  });

  test("ページタイトルが正しく表示される", async ({ page }) => {
    await expect(page).toHaveTitle(/メールヘッダー解析/);
  });

  test("テキストエリアが表示される", async ({ page }) => {
    const textarea = page.getByLabel("メールヘッダー入力欄");
    await expect(textarea).toBeVisible();
  });

  test("解析ボタンが表示される", async ({ page }) => {
    const button = page.getByRole("button", { name: /解析/ });
    await expect(button).toBeVisible();
  });

  test("クリアボタンが表示される", async ({ page }) => {
    const button = page.getByRole("button", { name: "クリア" });
    await expect(button).toBeVisible();
  });

  test("空のまま解析するとエラーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: /解析/ }).click();
    await expect(page.getByText("メールヘッダーを入力してください")).toBeVisible();
  });

  test("サンプルヘッダーを解析できる", async ({ page }) => {
    await page.getByLabel("メールヘッダー入力欄").fill(SAMPLE_HEADERS);
    await page.getByRole("button", { name: /解析/ }).click();
    await expect(page.getByText("サマリー")).toBeVisible();
  });

  test("Fromが表示される", async ({ page }) => {
    await page.getByLabel("メールヘッダー入力欄").fill(SAMPLE_HEADERS);
    await page.getByRole("button", { name: /解析/ }).click();
    await expect(page.getByText("sender@example.com")).toBeVisible();
  });

  test("認証結果セクションが表示される", async ({ page }) => {
    await page.getByLabel("メールヘッダー入力欄").fill(SAMPLE_HEADERS);
    await page.getByRole("button", { name: /解析/ }).click();
    await expect(page.getByText(/SPF.*DKIM.*DMARC/)).not.toBeVisible();
    await expect(page.getByText("認証結果")).toBeVisible();
  });

  test("SPFのpassが表示される", async ({ page }) => {
    await page.getByLabel("メールヘッダー入力欄").fill(SAMPLE_HEADERS);
    await page.getByRole("button", { name: /解析/ }).click();
    const spfBadge = page.locator('[aria-label="SPF: pass"]');
    await expect(spfBadge).toBeVisible();
  });

  test("メール経路が表示される", async ({ page }) => {
    await page.getByLabel("メールヘッダー入力欄").fill(SAMPLE_HEADERS);
    await page.getByRole("button", { name: /解析/ }).click();
    await expect(page.getByText(/メール経路.*2.*ホップ/)).toBeVisible();
  });

  test("全ヘッダーテーブルが表示される", async ({ page }) => {
    await page.getByLabel("メールヘッダー入力欄").fill(SAMPLE_HEADERS);
    await page.getByRole("button", { name: /解析/ }).click();
    await expect(page.getByText(/全ヘッダー/)).toBeVisible();
  });

  test("ヘッダーフィルターが機能する", async ({ page }) => {
    await page.getByLabel("メールヘッダー入力欄").fill(SAMPLE_HEADERS);
    await page.getByRole("button", { name: /解析/ }).click();
    await page.getByLabel("ヘッダーフィルター").fill("From");
    await expect(page.getByText("sender@example.com")).toBeVisible();
  });

  test("クリアボタンで入力がリセットされる", async ({ page }) => {
    await page.getByLabel("メールヘッダー入力欄").fill(SAMPLE_HEADERS);
    await page.getByRole("button", { name: /解析/ }).click();
    await page.getByRole("button", { name: "クリア" }).click();
    const textarea = page.getByLabel("メールヘッダー入力欄");
    await expect(textarea).toHaveValue("");
  });

  test("コピーボタンが表示される（解析後）", async ({ page }) => {
    await page.getByLabel("メールヘッダー入力欄").fill(SAMPLE_HEADERS);
    await page.getByRole("button", { name: /解析/ }).click();
    await expect(page.getByRole("button", { name: "全ヘッダーをコピー" })).toBeVisible();
  });

  test("スパム情報セクションが表示される", async ({ page }) => {
    await page.getByLabel("メールヘッダー入力欄").fill(SAMPLE_HEADERS);
    await page.getByRole("button", { name: /解析/ }).click();
    await expect(page.getByText("スパム情報")).toBeVisible();
  });
});
