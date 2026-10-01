import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { describe, expect, test } from "vite-plus/test";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../../app/constants/site";
import { Route as RootRoute } from "../../app/routes/__root";
import { Route as TopRoute } from "../../app/routes/top";
import { Route as ReleaseNotesRoute } from "../../app/routes/release-notes";

describe("production site metadata", () => {
  test("uses the public production origin without a trailing slash", () => {
    expect(SITE_BASE_URL).toBe("https://tools.0g0.xyz");
    expect(new URL(SITE_BASE_URL).origin).toBe(SITE_BASE_URL);
  });

  test("builds the default share-image URL from the production origin", () => {
    expect(SITE_OGP_IMAGE).toBe("https://tools.0g0.xyz/ogp-default.png");
  });

  test("the referenced public asset is a complete 1200×630 PNG, not HTML", () => {
    const pathname = new URL(SITE_OGP_IMAGE).pathname;
    const image = readFileSync(new URL(`../../public${pathname}`, import.meta.url));

    expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(image.readUInt32BE(8)).toBe(13);
    expect(image.toString("ascii", 12, 16)).toBe("IHDR");
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
    // The checked-in export is 8-bit RGBA with standard compression/filtering and no interlace.
    expect([...image.subarray(24, 29)]).toEqual([8, 6, 0, 0, 0]);

    const compressed: Buffer[] = [];
    let offset = 8;
    let ended = false;
    while (offset < image.length) {
      const length = image.readUInt32BE(offset);
      const type = image.toString("ascii", offset + 4, offset + 8);
      expect(offset + length + 12).toBeLessThanOrEqual(image.length);
      if (type === "IDAT") compressed.push(image.subarray(offset + 8, offset + 8 + length));
      offset += length + 12;
      if (type === "IEND") {
        expect(length).toBe(0);
        ended = true;
        break;
      }
    }
    expect(ended).toBe(true);
    expect(offset).toBe(image.length);
    expect(compressed.length).toBeGreaterThan(0);
    expect(inflateSync(Buffer.concat(compressed))).toHaveLength((1200 * 4 + 1) * 630);
  });

  test("root image metadata matches the public PNG type and dimensions", async () => {
    const head = await RootRoute.options.head!({} as never);

    expect(head?.meta).toEqual(
      expect.arrayContaining([
        { property: "og:image", content: SITE_OGP_IMAGE },
        { property: "og:image:type", content: "image/png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
      ]),
    );
  });

  test("root OGP and Twitter defaults use the production origin", async () => {
    const head = await RootRoute.options.head!({} as never);

    expect(head?.meta).toEqual(
      expect.arrayContaining([
        { property: "og:url", content: "https://tools.0g0.xyz" },
        { property: "og:image", content: "https://tools.0g0.xyz/ogp-default.png" },
        { name: "twitter:image", content: "https://tools.0g0.xyz/ogp-default.png" },
      ]),
    );
  });

  test.each([
    { route: TopRoute, path: "/top" },
    { route: ReleaseNotesRoute, path: "/release-notes" },
  ])("page metadata preserves the $path path on the production origin", async ({ route, path }) => {
    const head = await route.options.head!({} as never);

    expect(head?.meta).toEqual(
      expect.arrayContaining([
        { property: "og:url", content: `https://tools.0g0.xyz${path}` },
        { property: "og:image", content: "https://tools.0g0.xyz/ogp-default.png" },
      ]),
    );
  });
});
