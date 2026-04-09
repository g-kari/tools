import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

/**
 * テスト用の最小HARファイルを一時ディレクトリに作成する
 */
function createTempHarFile(): string {
  const harData = {
    log: {
      version: "1.2",
      creator: { name: "TestBrowser", version: "1.0" },
      entries: [
        {
          startedDateTime: "2024-01-01T00:00:00.000Z",
          time: 150,
          request: {
            method: "GET",
            url: "https://example.com/api/test",
            headers: [],
            queryString: [],
            headersSize: 200,
            bodySize: 0,
          },
          response: {
            status: 200,
            statusText: "OK",
            headers: [],
            content: {
              size: 2048,
              mimeType: "application/json",
            },
            redirectURL: "",
            headersSize: 100,
            bodySize: 1948,
          },
          timings: {
            send: 1,
            wait: 130,
            receive: 19,
          },
        },
        {
          startedDateTime: "2024-01-01T00:00:00.200Z",
          time: 50,
          request: {
            method: "POST",
            url: "https://example.com/api/data",
            headers: [],
            queryString: [],
            headersSize: 250,
            bodySize: 100,
          },
          response: {
            status: 404,
            statusText: "Not Found",
            headers: [],
            content: {
              size: 128,
              mimeType: "application/json",
            },
            redirectURL: "",
            headersSize: 80,
            bodySize: 48,
          },
          timings: {
            send: 2,
            wait: 40,
            receive: 8,
          },
        },
      ],
    },
  };

  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, "test-playwright.har");
  fs.writeFileSync(filePath, JSON.stringify(harData));
  return filePath;
}

test.describe("HARアナライザー", () => {
  test("ページが正しく読み込まれる", async ({ page }) => {
    await page.goto("/har");
    await expect(page).toHaveTitle(/HAR アナライザー/);
  });

  test("アップロードゾーンが表示される", async ({ page }) => {
    await page.goto("/har");
    const uploadZone = page.locator(".har-upload-zone");
    await expect(uploadZone).toBeVisible();
    await expect(uploadZone).toContainText(".har ファイルをドロップ");
  });

  test("有効なHARファイルをアップロードするとサマリーが表示される", async ({ page }) => {
    await page.goto("/har");

    const filePath = createTempHarFile();

    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);

      // サマリーグリッドが表示されることを確認
      await expect(page.locator(".har-summary-grid")).toBeVisible();

      // リクエスト数が表示される
      await expect(page.locator(".har-summary-card").first()).toContainText("2");

      // テーブルが表示される
      await expect(page.locator(".har-table-wrapper")).toBeVisible();
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test("フィルターコントロールが機能する", async ({ page }) => {
    await page.goto("/har");

    const filePath = createTempHarFile();

    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);

      // フィルターバーが表示されるのを待つ
      await expect(page.locator(".har-filter-bar")).toBeVisible();

      // メソッドフィルターでGETを選択
      await page.selectOption("#filter-method", "GET");

      // フィルター後の件数表示が変わっていることを確認
      const countText = page.locator(".har-filter-count");
      await expect(countText).toContainText("1 / 2 件");
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  test("クリアボタンでリセットされる", async ({ page }) => {
    await page.goto("/har");

    const filePath = createTempHarFile();

    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);

      await expect(page.locator(".har-summary-grid")).toBeVisible();

      await page.click(".har-clear-btn");

      // ファイルがクリアされてアップロードゾーンが再表示される
      await expect(page.locator(".har-upload-zone")).toBeVisible();
      await expect(page.locator(".har-summary-grid")).not.toBeVisible();
    } finally {
      fs.unlinkSync(filePath);
    }
  });
});
