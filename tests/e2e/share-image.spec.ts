import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

const imageUrl = "https://tools.0g0.xyz/ogp-default.png";
const imagePath = new URL(imageUrl).pathname;

test.describe("default share image", () => {
  for (const path of ["/top", "/json-lines", "/release-notes"]) {
    test(`${path} includes the public image in server-rendered metadata`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      const html = await response.text();
      expect(html).toContain(`<meta property="og:image" content="${imageUrl}"`);
      expect(html).toContain(`<meta name="twitter:image" content="${imageUrl}"`);
      expect(html).toContain('<meta property="og:image:type" content="image/png"');
      expect(html).toContain('<meta property="og:image:width" content="1200"');
      expect(html).toContain('<meta property="og:image:height" content="630"');
    });
  }

  test("the public URL serves the committed PNG rather than an HTML fallback", async ({
    request,
  }) => {
    const response = await request.get(imagePath);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]?.split(";")[0]).toBe("image/png");
    expect(await response.body()).toEqual(
      readFileSync(new URL("../../public/ogp-default.png", import.meta.url)),
    );
  });

  test("a browser decodes the image at its advertised dimensions", async ({ page }) => {
    // This test needs only the same-origin static image, not third-party fonts or ads.
    await page.goto(imagePath, { waitUntil: "domcontentloaded" });
    const dimensions = await page.evaluate(async () => {
      const image = document.querySelector("img");
      if (!image) throw new Error("The image URL did not render an image document");
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    });
    expect(dimensions).toEqual({ width: 1200, height: 630 });
  });
});
