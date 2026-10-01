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
