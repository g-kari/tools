import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

// Replace only the framework transport adapter. The real validators and handlers
// execute below; fetch is always offline. This is not a DNS/transport SSRF test.
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    inputValidator: <T>(validate: (data: unknown) => T) => ({
      handler:
        <R>(handler: (context: { data: T }) => R) =>
        async (context: { data: unknown }) =>
          handler({ data: validate(context.data) }),
    }),
  }),
}));

import { fetchOgp, parseOgpFromHtml, type OgpData } from "../../app/functions/ogp";
import {
  checkSecurityHeaders,
  type SecurityHeadersResult,
} from "../../app/functions/security-headers";

// These tests use the offline transport contract above, not TanStack's generic
// network-call adapter; explicitly typing the local boundary avoids instantiating
// that unrelated transport type graph at every handler test call.
const requestOgp = fetchOgp as unknown as (context: { data: string }) => Promise<OgpData>;
const requestHeaders = checkSecurityHeaders as unknown as (context: {
  data: string;
}) => Promise<SecurityHeadersResult>;

describe("offline OGP and security-header server handlers", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const validHeaders = {
    "content-security-policy": "default-src 'self'; script-src 'self'",
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=()",
    "x-xss-protection": "0",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    expect(vi.getTimerCount()).toBe(0);
    for (const [message] of vi.mocked(console.warn).mock.calls) {
      expect(message).toMatch(
        /^Twitter syndication API (returned (403 for status 123|non-JSON content)|error: offline)$/,
      );
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function response(body = "", headers: Record<string, string> = {}, status = 200, url = "") {
    const result = new Response(body, { headers, status });
    Object.defineProperty(result, "url", { value: url });
    return result;
  }

  it("executes the production meta parser for all supported attribute orders and fallbacks", () => {
    const html = `<title>Fallback title</title>
      <meta property="og:title" content=" A &amp; B ">
      <meta property='og:description' content='Description'>
      <meta content="/cover.png" property="og:image">
      <meta content='Example' property='og:site_name'>
      <meta property="og:type" content='article'>
      <meta property='og:locale' content="ja_JP">
      <meta name="twitter:card" content="summary_large_image">
      <meta name='twitter:title' content='Tweet title'>
      <meta content="Tweet description" name="twitter:description">
      <meta content='//cdn.example.com/photo.jpg' name='twitter:image'>
      <meta name="twitter:site" content='@example'>
      <meta name='twitter:creator' content="@creator">
      <meta name="description" content="Fallback description">`;
    expect(parseOgpFromHtml(html, "https://example.com/post")).toMatchObject({
      fetchedUrl: "https://example.com/post",
      title: "A & B",
      description: "Description",
      image: "https://example.com/cover.png",
      type: "article",
      siteName: "Example",
      locale: "ja_JP",
      twitterCard: "summary_large_image",
      twitterTitle: "Tweet title",
      twitterDescription: "Tweet description",
      twitterImage: "https://cdn.example.com/photo.jpg",
      twitterSite: "@example",
      twitterCreator: "@creator",
      metaTitle: "Fallback title",
      metaDescription: "Fallback description",
    });
    expect(parseOgpFromHtml("<html></html>", "https://example.com").title).toBeUndefined();
  });

  it("validates before any network request and normalizes a public URL", async () => {
    for (const data of [
      "",
      "https://[",
      "http://localhost",
      "http://127.0.0.1",
      "http://192.168.1.2",
    ]) {
      await expect(requestOgp({ data })).rejects.toThrow();
    }
    for (const data of ["invalid", "ftp://example.com", "http://localhost", "http://10.1.2.3"]) {
      await expect(requestHeaders({ data })).rejects.toThrow();
    }
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValue(
      response('<meta property="og:title" content="Normalized">', {
        "content-type": "text/html; charset=utf-8",
      }),
    );
    expect(await requestOgp({ data: " example.com " })).toMatchObject({
      fetchedUrl: "https://example.com",
      title: "Normalized",
    });
  });

  it.each([
    ["https://youtube.com/watch?v=abc", "https://www.youtube.com/watch?v=abc"],
    ["https://www.youtube.com/embed/abc", "https://www.youtube.com/watch?v=abc"],
    ["https://youtu.be/abc", "https://www.youtube.com/watch?v=abc"],
  ])("uses the video metadata adapter for %s", async (url, canonical) => {
    fetchMock.mockResolvedValue(
      response(
        JSON.stringify({
          title: "Video",
          author_name: "Author",
          thumbnail_url: "https://example.com/thumb.jpg",
        }),
        { "content-type": "application/json" },
      ),
    );
    expect(await requestOgp({ data: url })).toMatchObject({
      title: "Video",
      description: "Author のYouTube動画",
      image: "https://example.com/thumb.jpg",
      url: canonical,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["http-error", "network-error", "empty-data"])(
    "keeps a video thumbnail on %s",
    async (kind) => {
      if (kind === "network-error") fetchMock.mockRejectedValue(new Error("offline"));
      else
        fetchMock.mockResolvedValue(
          response(
            kind === "empty-data" ? "{}" : "",
            { "content-type": "application/json" },
            kind === "http-error" ? 403 : 200,
          ),
        );
      expect(await requestOgp({ data: "https://youtu.be/abc" })).toMatchObject({
        image: "https://img.youtube.com/vi/abc/hqdefault.jpg",
        siteName: "YouTube",
      });
    },
  );

  it.each([
    { mediaDetails: [{ media_url_https: "https://example.com/media.jpg" }] },
    { photos: [{ url: "https://example.com/media.jpg" }] },
    {},
  ])("extracts Twitter content with each media fallback", async (media) => {
    fetchMock.mockResolvedValue(
      response(
        JSON.stringify({
          text: "x".repeat(201),
          user: {
            name: "Example",
            screen_name: "example",
            profile_image_url_https: "https://example.com/avatar.jpg",
          },
          ...media,
        }),
        { "content-type": "application/json" },
      ),
    );
    const result = await requestOgp({ data: "https://x.com/example/status/123" });
    expect(result.title).toBe("Example (@example)");
    expect(result.description).toBe("x".repeat(200) + "...");
    expect(result.image).toBe(
      Object.keys(media).length
        ? "https://example.com/media.jpg"
        : "https://example.com/avatar.jpg",
    );
  });

  it.each(["forbidden", "non-json", "null", "network-error", "empty-user"])(
    "keeps Twitter fallbacks for %s",
    async (kind) => {
      if (kind === "network-error") fetchMock.mockRejectedValue(new Error("offline"));
      else
        fetchMock.mockResolvedValue(
          response(
            kind === "null" ? "null" : "{}",
            { "content-type": kind === "non-json" ? "text/html" : "application/json" },
            kind === "forbidden" ? 403 : 200,
          ),
        );
      const result = await requestOgp({ data: "https://twitter.com/example/status/123" });
      expect(result.fetchedUrl).toBe("https://twitter.com/example/status/123");
      expect(result.title).toContain("example");
    },
  );

  it("resolves a proxied image without fetching and recognizes direct images", async () => {
    const proxied =
      "https://proxy.example.com/?url=" + encodeURIComponent("https://example.com/photo.png");
    expect(await requestOgp({ data: proxied })).toMatchObject({
      image: "https://example.com/photo.png",
      type: "image",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValue(response("", { "content-type": "image/png" }));
    expect(await requestOgp({ data: "https://example.com/image" })).toMatchObject({
      image: "https://example.com/image",
      type: "image",
    });
    fetchMock.mockResolvedValue(response("", { "content-type": "application/octet-stream" }));
    expect(await requestOgp({ data: "https://example.com/photo.JPG" })).toMatchObject({
      type: "image",
    });
  });

  it("uses browser fallback after bot failures and returns HTML, MIME and HTTP results", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    fetchMock.mockResolvedValueOnce(response("", {}, 403));
    fetchMock.mockResolvedValueOnce(response("", {}, 403));
    fetchMock.mockResolvedValueOnce(
      response('<meta charset="utf-8"><meta property="og:title" content="Browser result">', {
        "content-type": "text/html",
      }),
    );
    expect(await requestOgp({ data: "https://example.com/post" })).toMatchObject({
      title: "Browser result",
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    fetchMock.mockResolvedValue(response("data", { "content-type": "application/json" }));
    expect((await requestOgp({ data: "https://example.com/data" })).error).toContain(
      "HTMLではない",
    );
    fetchMock.mockResolvedValue(response("", {}, 503));
    expect((await requestOgp({ data: "https://example.com/post" })).error).toContain(
      "HTTPエラー: 503",
    );
  });

  it("reports rejected private redirect metadata and network errors without retaining timers", async () => {
    fetchMock.mockResolvedValue(response("", {}, 200, "http://127.0.0.1/private"));
    expect((await requestOgp({ data: "https://example.com" })).error).toContain(
      "プライベートIPへのリダイレクト",
    );
    expect((await requestHeaders({ data: "https://example.com" })).error).toContain(
      "プライベートIPへのリダイレクト",
    );
    fetchMock.mockRejectedValue(new Error("offline"));
    expect((await requestOgp({ data: "https://example.com" })).error).toContain("ネットワーク接続");
    expect((await requestHeaders({ data: "https://example.com" })).error).toBe("offline");
    fetchMock.mockRejectedValue("opaque failure");
    expect((await requestOgp({ data: "https://example.com" })).error).toContain("不明なエラー");
    expect((await requestHeaders({ data: "https://example.com" })).error).toContain("取得に失敗");
  });

  it("aborts timed-out header requests and clears the deadline", async () => {
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init!.signal!.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const pending = requestHeaders({ data: "https://example.com" });
    await vi.advanceTimersByTimeAsync(10000);
    expect((await pending).error).toContain("タイムアウト");
  });

  it("calculates actual perfect and missing-header scores, using a HEAD request", async () => {
    fetchMock.mockResolvedValue(response("", validHeaders));
    const result = await requestHeaders({ data: "https://example.com" });
    expect(result.score).toBe(100);
    expect(result.checks).toHaveLength(7);
    expect(result.checks.every((check) => check.level === "pass")).toBe(true);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("HEAD");
    fetchMock.mockResolvedValue(response());
    const missing = await requestHeaders({ data: "https://example.com" });
    expect(missing.score).toBe(13);
    expect(missing.checks.filter((check) => check.level === "danger")).toHaveLength(4);
  });

  it.each([
    ["content-security-policy", "script-src 'unsafe-inline'", "Content-Security-Policy"],
    ["content-security-policy", "img-src https:", "Content-Security-Policy"],
    ["strict-transport-security", "max-age=60", "Strict-Transport-Security"],
    ["strict-transport-security", "max-age=31536000", "Strict-Transport-Security"],
    ["strict-transport-security", "invalid", "Strict-Transport-Security"],
    ["x-content-type-options", "invalid", "X-Content-Type-Options"],
    ["x-frame-options", "invalid", "X-Frame-Options"],
    ["referrer-policy", "unsafe-url", "Referrer-Policy"],
    ["x-xss-protection", "1; mode=block", "X-XSS-Protection"],
  ])("grades the real warning branch for %s=%s", async (name, value, checkName) => {
    fetchMock.mockResolvedValue(response("", { ...validHeaders, [name]: value }));
    const result = await requestHeaders({ data: "https://example.com" });
    expect(result.checks.find((check) => check.name === checkName)?.level).toBe("warning");
    expect(result.score).toBeLessThan(100);
  });

  it("warns that HSTS does not apply to HTTP", async () => {
    fetchMock.mockResolvedValue(response("", validHeaders));
    const result = await requestHeaders({ data: "http://example.com" });
    expect(
      result.checks.find((check) => check.name === "Strict-Transport-Security")?.message,
    ).toContain("HTTP接続");
    expect(result.score).toBe(90);
  });
});
