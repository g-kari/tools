import { test, expect } from "@playwright/test";

const v7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test.describe("UUID v7 generation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/uuid");
    await expect(page.locator(".uuid-value")).toHaveCount(1);
  });

  test("keeps v4 values until explicitly generating v7", async ({ page }) => {
    const original = await page.locator(".uuid-value").textContent();
    await expect(page.locator("#uuid-version-4")).toBeChecked();
    await page.getByLabel("v7（時刻＋ランダム）", { exact: true }).check();
    await expect(page.locator(".uuid-value")).toHaveText(original!);
    await expect(page.locator("#uuid-result-version")).toContainText("v4");
    await page.getByRole("button", { name: "UUID生成", exact: true }).click();
    await expect(page.locator(".uuid-value")).toHaveText(v7);
    await expect(page.locator("#uuid-result-version")).toContainText("v7");
    await page.getByLabel("v4（ランダム）", { exact: true }).check();
    await expect(page.locator("#uuid-result-version")).toContainText("v7");
  });

  test("generates 100 unique values, formats and copies the complete batch", async ({ page }) => {
    await page.getByLabel("v7（時刻＋ランダム）", { exact: true }).check();
    await page.locator("#count").fill("100");
    await page.getByRole("button", { name: "UUID生成", exact: true }).click();
    const output = page.locator(".uuid-value");
    await expect(output).toHaveCount(100);
    const original = await output.allTextContents();
    expect(new Set(original).size).toBe(100);
    expect(original.every((value) => v7.test(value))).toBe(true);
    await page.getByLabel("大文字で表示").check();
    await page.getByLabel("ハイフンなし").check();
    const formatted = original.map((value) => value.replaceAll("-", "").toUpperCase());
    await expect(output).toHaveText(formatted);
    await page.getByRole("button", { name: "すべてコピー", exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(formatted.join("\n"));
    await page.getByRole("button", { name: "UUID 1をコピー", exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(formatted[0]);
  });

  test("supports native keyboard version selection and clear/regenerate", async ({ page }) => {
    await page.locator("#uuid-version-4").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#uuid-version-7")).toBeChecked();
    await page.getByRole("button", { name: "UUID生成", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".uuid-value")).toHaveText(v7);
    await page.getByRole("button", { name: "クリア", exact: true }).click();
    await expect(page.locator(".uuid-value")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "クリア", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "UUID生成", exact: true }).click();
    await expect(page.locator(".uuid-value")).toHaveText(v7);
  });

  test("keeps the selector, disclosure and results within a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 333, height: 800 });
    await page.getByLabel("v7（時刻＋ランダム）", { exact: true }).check();
    await page.getByRole("button", { name: "UUID生成", exact: true }).click();
    await expect(page.locator("#uuid-version-help")).toContainText("生成時刻");
    await expect(page.locator("#uuid-version-help")).toContainText("時計が戻った場合");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    for (const selector of [".uuid-version-group", "#uuid-version-help", ".uuid-value"]) {
      const box = await page.locator(selector).first().boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(333);
    }
  });
});
