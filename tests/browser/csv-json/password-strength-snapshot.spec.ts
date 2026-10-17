import { test, expect } from "@playwright/test";
for (const [name, viewport] of [
  ["desktop", { width: 1280, height: 800 }],
  ["mobile", { width: 390, height: 844 }],
] as const) {
  test.describe(name, () => {
    test.use({ viewport });
    test("strength and copy stay with the generated value until regeneration", async ({ page }) => {
      const external: string[] = [],
        errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== "http://127.0.0.1:4195") {
          external.push(url.origin);
          return route.abort();
        }
        return route.continue();
      });
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (value: string) => {
              (window as unknown as { fixtureCopies: string[] }).fixtureCopies.push(value);
            },
          },
        });
        (window as unknown as { fixtureCopies: string[] }).fixtureCopies = [];
      });
      await page.goto("/password-generator");
      const output = page.locator("#passwordOutput"),
        strength = page.getByRole("progressbar");
      const generate = page.getByRole("button", { name: "新しいパスワードを生成", exact: true });
      const copy = page.getByRole("button", {
        name: "パスワードをクリップボードにコピー",
        exact: true,
      });
      await expect.poll(async () => (await output.inputValue()).length).toBe(16);
      await expect(strength).toHaveAttribute("aria-valuenow", "4");
      await page.getByRole("button", { name: "詳細設定（文字種）" }).click();
      await page.getByLabel("大文字を含める", { exact: true }).uncheck();
      await page.getByLabel("小文字を含める", { exact: true }).uncheck();
      await expect(strength).toHaveAttribute("aria-valuenow", "4");
      await generate.click();
      const digits = await output.inputValue();
      expect(digits).toMatch(/^\d{16}$/);
      await expect(strength).toHaveAttribute("aria-valuenow", "3");
      await page.getByLabel("大文字を含める", { exact: true }).check();
      await page.getByLabel("小文字を含める", { exact: true }).check();
      await page.getByLabel("記号を含める", { exact: true }).check();
      await page.getByRole("slider").press("End");
      await expect(output).toHaveValue(digits);
      await expect(strength).toHaveAttribute("aria-valuenow", "3");
      await copy.click();
      expect(
        await page.evaluate(() =>
          (window as unknown as { fixtureCopies: string[] }).fixtureCopies.at(-1),
        ),
      ).toBe(digits);
      await generate.click();
      await expect.poll(async () => (await output.inputValue()).length).toBe(128);
      await expect(strength).toHaveAttribute("aria-valuenow", "5");
      const next = await output.inputValue();
      await copy.click();
      expect(
        await page.evaluate(() =>
          (window as unknown as { fixtureCopies: string[] }).fixtureCopies.at(-1),
        ),
      ).toBe(next);
      await page.getByRole("button", { name: "パスワードをクリア", exact: true }).click();
      await expect(output).toHaveValue("");
      await expect(strength).toHaveCount(0);
      await expect(copy).toBeDisabled();
      await page.getByRole("slider").press("Home");
      await generate.click();
      await expect.poll(async () => (await output.inputValue()).length).toBe(4);
      await expect(strength).toHaveAttribute("aria-valuenow", "1");
      expect(external).toEqual([]);
      expect(errors).toEqual([]);
    });
  });
}
