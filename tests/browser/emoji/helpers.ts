import { expect, type Page } from "@playwright/test";
import type { EmojiFixture } from "./fixture/emoji";
import type { ShimState, ShimConfig } from "./fixture/ffmpeg-shim";

export const origin = "http://127.0.0.1:4194";
export const coreBase = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
export type FixtureWindow = Window & { emojiFixture: EmojiFixture; emojiFFmpeg: ShimState };

/** Fail closed on outbound writes or unknown destinations; the real run allows only current core GETs. */
export async function containRequests(page: Page, real: boolean): Promise<string[]> {
  const blocked: string[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const local =
      url.origin === origin &&
      /^\/(shim|real)\/(?:index\.html|fixture\.js|assets\/[a-zA-Z0-9_.-]+)?$/.test(url.pathname);
    const core =
      request.url() === `${coreBase}/ffmpeg-core.js` ||
      request.url() === `${coreBase}/ffmpeg-core.wasm`;
    if (
      request.method() !== "GET" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (!local && !core)
    ) {
      blocked.push(`${request.method()} ${request.url()}`);
      await route.abort("blockedbyclient");
    } else if (core && !real) {
      // Exercise the existing toBlobURL/load helper while avoiding core downloads in shim cases.
      await route.fulfill({
        status: 200,
        contentType: url.pathname.endsWith(".wasm") ? "application/wasm" : "text/javascript",
        body: "fixture",
      });
    } else if (core) {
      // route.continue() permits follow-on redirects. Fetch exactly this source and reject redirects.
      const response = await route.fetch({ maxRedirects: 0 });
      if (!response.ok() || response.url() !== request.url()) {
        blocked.push(`Unexpected core response: ${response.status()} ${response.url()}`);
        await route.abort("blockedbyclient");
      } else {
        await route.fulfill({ response });
      }
    } else {
      await route.continue();
    }
  });
  return blocked;
}

export const generate = (page: Page) =>
  page.getByRole("button", { name: "GIFを生成", exact: true });
export const save = (page: Page) => page.getByRole("button", { name: "GIFを保存", exact: true });
export const preview = (page: Page) =>
  page.getByRole("img", { name: "生成されたGIFのプレビュー", exact: true });

export async function configure(page: Page, options: Partial<ShimConfig>) {
  await page.evaluate((config) => (window as FixtureWindow).emojiFFmpeg.configure(config), options);
}

/** No image upload leaves the browser; this is a generated, synthetic file chooser input. */
export async function imageFile(page: Page, color = "#ef4444", name = "synthetic.png") {
  const encoded = await page.evaluate((fill) => {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 128;
    const context = canvas.getContext("2d")!;
    context.fillStyle = fill;
    context.fillRect(0, 0, 192, 128);
    context.fillStyle = "#ffffff";
    context.fillRect(25, 20, 40, 40);
    return canvas.toDataURL("image/png").split(",")[1];
  }, color);
  return { name, mimeType: "image/png", buffer: Buffer.from(encoded, "base64") };
}

export async function upload(page: Page, color?: string, name?: string) {
  await page.locator("#imageFile").setInputFiles(await imageFile(page, color, name));
  await expect(page.locator("canvas.preview-canvas")).toBeVisible();
}

export async function openGif(page: Page, options?: Partial<ShimConfig>) {
  await page.goto("/shim/");
  await expect(page.getByRole("heading", { name: "絵文字コンバーター" })).toBeVisible();
  if (options) await configure(page, options);
  await upload(page);
  await page.locator('input[name="outputFormat"][value="gif"]').check();
}

export async function encodedPreview(page: Page) {
  await expect(generate(page)).toBeEnabled();
  await generate(page).click();
  await expect(preview(page)).toBeVisible();
  await expect(preview(page)).toHaveJSProperty("naturalWidth", 128);
  await expect(preview(page)).toHaveJSProperty("naturalHeight", 128);
  await expect(save(page)).toBeEnabled();
  return (await preview(page).getAttribute("src"))!;
}

export async function previewBytes(page: Page) {
  const src = (await preview(page).getAttribute("src"))!;
  return page.evaluate(async (url) => {
    const blob = (window as FixtureWindow).emojiFixture.blobs.get(url);
    if (!blob) throw new Error("Preview does not reference a tracked Blob");
    return { mime: blob.type, bytes: Array.from(new Uint8Array(await blob.arrayBuffer())) };
  }, src);
}
