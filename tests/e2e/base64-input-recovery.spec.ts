import { test, expect } from "@playwright/test";

const ENCODE_ERROR = "エンコードに失敗しました。入力と設定を確認してください。";

for (const [name, codeUnits] of [
  ["high-surrogate", [0xd800]],
  ["low-surrogate", [0xdc00]],
  ["embedded-high-surrogate", [0x524d, 0xd800, 0x5f8c]],
] as const) {
  test(`Base64 recovers from ${name} without losing input`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto("/base64");
    const input = page.locator("#conv-input");
    await input.fill("previous valid output");
    await expect(page.locator(".conv-textarea-output")).toBeVisible();
    await input.focus();
    await input.evaluate(
      (node, units) => {
        const textarea = node as HTMLTextAreaElement;
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
          textarea,
          String.fromCharCode(...units),
        );
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      },
      [...codeUnits],
    );
    await expect(page.getByRole("alert")).toContainText(ENCODE_ERROR);
    expect(
      await input.evaluate((node) =>
        Array.from({ length: (node as HTMLTextAreaElement).value.length }, (_, i) =>
          (node as HTMLTextAreaElement).value.charCodeAt(i),
        ),
      ),
    ).toEqual([...codeUnits]);
    await expect(input).toBeFocused();
    await expect(page.getByRole("button", { name: "出力をコピー" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "入出力を入れ替える" })).toBeDisabled();
    await expect(page.locator(".conv-textarea-output")).toHaveCount(0);
    await input.fill("日本語 👩‍💻 e\u0301");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.locator(".conv-textarea-output")).not.toHaveValue("");
    await page.getByRole("button", { name: "入出力を入れ替える" }).click();
    await expect(page.locator(".conv-textarea-output")).toHaveValue("日本語 👩‍💻 e\u0301");
    await page.getByRole("button", { name: "入力をクリア" }).click();
    await expect(input).toHaveValue("");
    expect(pageErrors).toEqual([]);
  });
}
