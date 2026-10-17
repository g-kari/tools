import { test, expect } from "@playwright/test";

for (const route of ["char-count", "text-stats"]) {
  test.describe(`${route} 書記素数`, () => {
    test("複合文字のリアルタイム更新・クリア・再入力と従来値を保持", async ({ page }) => {
      await page.goto(`/${route}`);
      const input = page.locator("textarea");
      await expect(page.getByTestId("grapheme-count")).toHaveText("0");
      await input.fill("👨‍👩‍👧‍👦 🇯🇵 か\u3099 e\u0301");
      await expect(input).toHaveValue("👨‍👩‍👧‍👦 🇯🇵 か\u3099 e\u0301");
      await expect(page.getByTestId("grapheme-count")).toHaveText("7");
      await expect(page.getByTestId("char-count")).toHaveText("16");
      await expect(page.getByTestId("word-count")).toHaveText(route === "char-count" ? "4" : "2");
      await page.getByRole("button", { name: "クリア" }).click();
      await expect(input).toHaveValue("");
      await expect(page.getByTestId("grapheme-count")).toHaveText("0");
      await expect(page.getByTestId("char-count")).toHaveText("0");
      await expect(page.getByRole("button", { name: "クリア" })).toBeDisabled();
      await input.fill("👍🏽");
      await expect(page.getByTestId("grapheme-count")).toHaveText("1");
      await expect(page.getByTestId("char-count")).toHaveText("2");
    });

    test("未対応ブラウザーは書記素数を代用せず従来値を表示", async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(Intl, "Segmenter", { value: undefined, configurable: true });
      });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`/${route}`);
      await expect(page.getByTestId("grapheme-count")).toHaveText("未対応");
      await page.locator("textarea").fill("👨‍👩‍👧‍👦");
      await expect(page.getByTestId("grapheme-count")).toHaveText("未対応");
      await expect(page.getByTestId("char-count")).toHaveText("7");
      expect(errors).toEqual([]);
    });

    test("狭い画面でラベルと入力のキーボード操作を維持", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 844 });
      await page.goto(`/${route}`);
      const input = page.locator("textarea");
      await input.focus();
      await page.keyboard.insertText("e\u0301");
      await expect(page.getByTestId("grapheme-count")).toHaveText("1");
      await expect(page.getByTestId("char-count")).toHaveText("2");
      await expect(page.getByTestId("grapheme-count")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        320,
      );
    });
  });
}
