import type { Page } from "@playwright/test";
import { test, expect } from "../browser/csv-json/url-app-test";

/** Follow native Tab order from the route-granted input focus to the Color trigger. */
async function focusColorTrigger(page: Page) {
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "ツールを検索（Ctrl+K）", exact: true }),
  ).toBeFocused();
  for (let i = 0; i < 7; i++) await page.keyboard.press("Shift+Tab");
  const trigger = page.locator(".nav-category-btn", { hasText: "カラー" });
  await expect(trigger).toBeFocused();
  return trigger;
}

test.describe("Global navigation focus ownership", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/env-parser");
    // Observe the route's mount effect before filling. Do not force focus from the test.
    await expect(page.locator("#envInput")).toBeFocused();
  });

  test("pointer hover preserves the input, selection and next keystroke", async ({
    page,
  }, testInfo) => {
    const input = page.locator("#envInput");
    await input.fill("KEEP=original");
    await input.press("Home");
    await input.press("Shift+ArrowRight");
    await input.press("Shift+ArrowRight");
    const before = await input.evaluate((element: HTMLTextAreaElement) => ({
      start: element.selectionStart,
      end: element.selectionEnd,
    }));
    expect(before).toEqual({ start: 0, end: 2 });
    const trigger = page.locator(".nav-category-btn", { hasText: "カラー" });
    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("menuitem", { name: "カラーピッカー", exact: true })).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue("KEEP=original");
    expect(
      await input.evaluate((element: HTMLTextAreaElement) => ({
        start: element.selectionStart,
        end: element.selectionEnd,
      })),
    ).toEqual(before);
    // Use the keyboard's current target rather than locator.press/focus.
    await page.keyboard.type("Z");
    await expect(input).toHaveValue("ZEP=original");
    await page.screenshot({
      path: testInfo.outputPath("navigation-hover-input-focus.png"),
      fullPage: true,
    });
  });

  test("pointer Clear keeps the route-granted input focus after tab changes", async ({ page }) => {
    const input = page.locator("#envInput");
    await input.fill("PORT=00123\nDEBUG=false");
    await page.getByRole("button", { name: ".envの内容をパース", exact: true }).click();
    for (const name of ["YAML", "JSON", "Shell export", "YAML", "JSON", "YAML"]) {
      await page.getByRole("tab", { name, exact: true }).click();
    }
    await page.getByRole("button", { name: "入力と結果をクリア", exact: true }).click();
    await expect(input).toHaveValue("");
    await expect(page.getByRole("tablist", { name: "エクスポート形式タブ" })).toHaveCount(0);
    await expect(input).toBeFocused();
    await page.keyboard.type("AFTER=clear");
    await expect(input).toHaveValue("AFTER=clear");
    await page.getByRole("button", { name: ".envの内容をパース", exact: true }).click();
    await expect(page.locator(".env-parser-table")).toContainText("AFTER");
    await expect(page.locator(".env-parser-table")).toContainText("clear");
  });

  test("keyboard opening and Escape return focus survive a different category hover", async ({
    page,
  }) => {
    const trigger = await focusColorTrigger(page);
    await page.keyboard.press("ArrowDown");
    const first = page.getByRole("menuitem", { name: "カラーピッカー", exact: true });
    await expect(first).toBeFocused();
    await page.locator(".nav-category-btn", { hasText: "変換" }).hover();
    await expect(first).toBeFocused();
    await page.keyboard.press("End");
    await expect(
      page.getByRole("menuitem", { name: "Tailwind CSSカラーリファレンス", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Home");
    await expect(first).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Tab");
    await expect(page.locator(".nav-category-btn", { hasText: "検索" })).toBeFocused();
  });

  test("hover-open keyboard activation focuses links and follows the chosen route", async ({
    page,
  }) => {
    const trigger = await focusColorTrigger(page);
    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Enter");
    const first = page.getByRole("menuitem", { name: "カラーピッカー", exact: true });
    await expect(first).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("menuitem", { name: "カラーフォーマット変換", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/color-converter$/);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  for (const key of ["Space", "ArrowDown"]) {
    test(`hover-open ${key} activation focuses the first link`, async ({ page }) => {
      const trigger = await focusColorTrigger(page);
      await trigger.hover();
      await expect(trigger).toBeFocused();
      await page.keyboard.press(key);
      await expect(
        page.getByRole("menuitem", { name: "カラーピッカー", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    });
  }

  for (const key of ["Tab", "Shift+Tab"]) {
    test(`native ${key} directly leaves the open menu and closes it`, async ({ page }) => {
      const trigger = await focusColorTrigger(page);
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("End");
      await expect(
        page.getByRole("menuitem", { name: "Tailwind CSSカラーリファレンス", exact: true }),
      ).toBeFocused();
      await page.keyboard.press(key);
      const next =
        key === "Shift+Tab" ? trigger : page.locator(".nav-category-btn", { hasText: "検索" });
      await expect(next).toBeFocused();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await page.keyboard.press("Shift+Tab");
      await expect(
        key === "Tab" ? trigger : page.locator(".nav-category-btn", { hasText: "画像" }),
      ).toBeFocused();
    });
  }

  test("pointer leave timers do not remove a keyboard-focused link", async ({ page }) => {
    const trigger = await focusColorTrigger(page);
    await trigger.hover();
    await page.keyboard.press("ArrowDown");
    const first = page.getByRole("menuitem", { name: "カラーピッカー", exact: true });
    await expect(first).toBeFocused();
    const other = page.locator(".nav-category-btn", { hasText: "変換" });
    await other.hover();
    await expect(other).toHaveAttribute("aria-expanded", "true");
    await page.mouse.move(1, 1);
    // The pointer-only menu's actual close is the semantic signal that its delay elapsed.
    await expect(other).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(first).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("menuitem", { name: "カラーフォーマット変換", exact: true }),
    ).toBeFocused();
  });

  test("pointer click toggles an already hovered trigger without reopening on blur", async ({
    page,
  }) => {
    const trigger = page.locator(".nav-category-btn", { hasText: "カラー" });
    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
    // Pointer is already over the button, so this click activates the closed menu.
    await trigger.click();
    await expect(page.getByRole("menuitem", { name: "カラーピッカー", exact: true })).toBeFocused();
    await page.keyboard.press("End");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "カラーピッカー", exact: true })).toBeFocused();
  });
});
