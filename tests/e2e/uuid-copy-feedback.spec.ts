import { expect, test } from "@playwright/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`bulk copy keeps keyboard, retry and feedback semantics (${reducedMotion})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const writes: string[] = [];
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            writes.push(text);
          },
        },
      });
      Object.assign(window, { __uuidWrites: writes });
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/uuid");
    await page.locator("#count").fill("3");
    await page.getByRole("button", { name: "UUID生成", exact: true }).click();
    const button = page.getByRole("button", { name: "すべてコピー", exact: true });
    await button.focus();
    await page.keyboard.press("Enter");
    const copied = page.getByRole("button", { name: "コピーしました", exact: true });
    await expect(copied).toBeFocused();
    await expect(copied).toHaveAttribute("data-copied", "");
    await expect(copied.locator('[data-icon="copied"]')).toBeVisible();
    await expect(copied.locator('[data-uuid-feedback="animate-ui"]')).toBeVisible();
    await page.keyboard.press("Space");
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as { __uuidWrites: string[] }).__uuidWrites.length),
      )
      .toBe(2);
    const values = await page.locator(".uuid-value").allTextContents();
    expect(
      await page.evaluate(() => (window as unknown as { __uuidWrites: string[] }).__uuidWrites),
    ).toEqual([values.join("\n"), values.join("\n")]);
    await expect(button).toBeVisible({ timeout: 4000 });
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error("synthetic denial");
          },
        },
      });
    });
    await button.click();
    await expect(button).not.toHaveAttribute("data-copied");
    await expect(
      page.locator('[role="status"]').filter({ hasText: "コピーに失敗しました" }),
    ).toBeAttached();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("desktop bulk copy retains the unavailable-Clipboard fallback and focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    const writes: string[] = [];
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: (command: string) => {
        if (command !== "copy") throw new Error("Unexpected command");
        writes.push((document.activeElement as HTMLTextAreaElement).value);
        return true;
      },
    });
    Object.assign(window, { __fallbackWrites: writes });
  });
  await page.goto("/uuid");
  await page.locator("#count").fill("3");
  await page.getByRole("button", { name: "UUID生成", exact: true }).click();
  const button = page.getByRole("button", { name: "すべてコピー", exact: true });
  await button.focus();
  await page.keyboard.press("Enter");
  const copied = page.getByRole("button", { name: "コピーしました", exact: true });
  await expect(copied).toBeFocused();
  await expect(copied).toHaveAttribute("data-copied", "");
  const values = await page.locator(".uuid-value").allTextContents();
  expect(
    await page.evaluate(
      () => (window as unknown as { __fallbackWrites: string[] }).__fallbackWrites,
    ),
  ).toEqual([values.join("\n")]);
  await expect(page.locator('textarea[tabindex="-1"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("optional animation chunk failure leaves the copy button usable", async ({ page }) => {
  await page.route(/UuidCopyFeedback/, (route) => route.abort("failed"));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => {} },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/uuid");
  await page.locator("#count").fill("3");
  await page.getByRole("button", { name: "UUID生成", exact: true }).click();
  const button = page.getByRole("button", { name: "すべてコピー", exact: true });
  await button.focus();
  await page.keyboard.press("Enter");
  const copied = page.getByRole("button", { name: "コピーしました", exact: true });
  await expect(copied).toBeFocused();
  await expect(copied.locator('[data-icon="copied"]')).toBeVisible();
  await expect(copied.locator('[data-uuid-feedback="animate-ui"]')).toHaveCount(0);
  await expect(button).toBeVisible({ timeout: 4000 });
  await button.click();
  await expect(copied).toBeVisible();
  expect(errors).toEqual([]);
});
