import { describe, it, expect } from "vitest";
import { decodeHtmlEntities } from "../../app/utils/html";
import {
  extractCharsetFromHtml,
  extractCharsetFromContentType,
  normalizeCharset,
  detectEncodingFromBytes,
  decodeHtmlWithCharset,
  resolveUrl,
} from "../../app/functions/ogp";

// OGP data structure (duplicated for testing without importing server code)
interface OgpData {
  // Basic OGP tags
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  locale?: string;

  // Twitter Card tags
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;

  // Fallback meta tags
  metaTitle?: string;
  metaDescription?: string;

  // Result info
  fetchedUrl: string;
  error?: string;
}

// Parse OGP and meta tags from HTML (duplicated for testing)
function parseOgpFromHtml(html: string, url: string): OgpData {
  const result: OgpData = { fetchedUrl: url };

  // Helper function to extract content from meta tags
  // Supports various attribute orderings and formats
  const getMetaContent = (
    propertyOrName: string,
    isProperty: boolean = true
  ): string | undefined => {
    const attr = isProperty ? "property" : "name";
    const escapedProp = propertyOrName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Pattern 1: attribute comes before content
    // Pattern 2: content comes before attribute
    // Supports: single/double quotes with proper quote matching
    const patterns = [
      // property/name="..." content="..." (double quotes)
      new RegExp(
        `<meta[^>]+${attr}\\s*=\\s*"${escapedProp}"[^>]+content\\s*=\\s*"([^"]*)"`,
        "is"
      ),
      // property/name='...' content='...' (single quotes)
      new RegExp(
        `<meta[^>]+${attr}\\s*=\\s*'${escapedProp}'[^>]+content\\s*=\\s*'([^']*)'`,
        "is"
      ),
      // content="..." property/name="..." (double quotes, reversed)
      new RegExp(
        `<meta[^>]+content\\s*=\\s*"([^"]*)"[^>]+${attr}\\s*=\\s*"${escapedProp}"`,
        "is"
      ),
      // content='...' property/name='...' (single quotes, reversed)
      new RegExp(
        `<meta[^>]+content\\s*=\\s*'([^']*)'[^>]+${attr}\\s*=\\s*'${escapedProp}'`,
        "is"
      ),
      // Mixed: property/name="..." content='...'
      new RegExp(
        `<meta[^>]+${attr}\\s*=\\s*"${escapedProp}"[^>]+content\\s*=\\s*'([^']*)'`,
        "is"
      ),
      // Mixed: property/name='...' content="..."
      new RegExp(
        `<meta[^>]+${attr}\\s*=\\s*'${escapedProp}'[^>]+content\\s*=\\s*"([^"]*)"`,
        "is"
      ),
    ];

    for (const regex of patterns) {
      const match = html.match(regex);
      if (match && match[1]) {
        return decodeHtmlEntities(match[1].trim());
      }
    }

    return undefined;
  };

  // Extract OGP tags
  result.title = getMetaContent("og:title");
  result.description = getMetaContent("og:description");
  const ogImage = getMetaContent("og:image");
  result.image = ogImage ? resolveUrl(ogImage, url) : undefined;
  result.url = getMetaContent("og:url");
  result.type = getMetaContent("og:type");
  result.siteName = getMetaContent("og:site_name");
  result.locale = getMetaContent("og:locale");

  // Extract Twitter Card tags
  result.twitterCard = getMetaContent("twitter:card", false);
  result.twitterTitle = getMetaContent("twitter:title", false);
  result.twitterDescription = getMetaContent("twitter:description", false);
  const twitterImage = getMetaContent("twitter:image", false);
  result.twitterImage = twitterImage ? resolveUrl(twitterImage, url) : undefined;
  result.twitterSite = getMetaContent("twitter:site", false);
  result.twitterCreator = getMetaContent("twitter:creator", false);

  // Extract fallback meta tags
  result.metaDescription = getMetaContent("description", false);

  // Extract title from <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) {
    result.metaTitle = titleMatch[1].trim();
  }

  return result;
}

describe("OGP Parser", () => {
  describe("parseOgpFromHtml", () => {
    it("should parse basic OGP tags", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="Test Title">
          <meta property="og:description" content="Test Description">
          <meta property="og:image" content="https://example.com/image.jpg">
          <meta property="og:url" content="https://example.com">
          <meta property="og:type" content="website">
          <meta property="og:site_name" content="Example Site">
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.title).toBe("Test Title");
      expect(result.description).toBe("Test Description");
      expect(result.image).toBe("https://example.com/image.jpg");
      expect(result.url).toBe("https://example.com");
      expect(result.type).toBe("website");
      expect(result.siteName).toBe("Example Site");
      expect(result.fetchedUrl).toBe("https://example.com");
    });

    it("should parse Twitter Card tags", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="Twitter Title">
          <meta name="twitter:description" content="Twitter Description">
          <meta name="twitter:image" content="https://example.com/twitter-image.jpg">
          <meta name="twitter:site" content="@example">
          <meta name="twitter:creator" content="@creator">
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.twitterCard).toBe("summary_large_image");
      expect(result.twitterTitle).toBe("Twitter Title");
      expect(result.twitterDescription).toBe("Twitter Description");
      expect(result.twitterImage).toBe("https://example.com/twitter-image.jpg");
      expect(result.twitterSite).toBe("@example");
      expect(result.twitterCreator).toBe("@creator");
    });

    it("should parse meta title from title tag", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Page Title</title>
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.metaTitle).toBe("Page Title");
    });

    it("should parse meta description", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="description" content="Meta Description">
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.metaDescription).toBe("Meta Description");
    });

    it("should handle content attribute before property/name", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta content="Reversed Title" property="og:title">
          <meta content="Reversed Description" name="description">
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.title).toBe("Reversed Title");
      expect(result.metaDescription).toBe("Reversed Description");
    });

    it("should handle single quotes in attributes", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property='og:title' content='Single Quote Title'>
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.title).toBe("Single Quote Title");
    });

    it("should handle missing OGP tags gracefully", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Only Title</title>
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.title).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.image).toBeUndefined();
      expect(result.metaTitle).toBe("Only Title");
      expect(result.fetchedUrl).toBe("https://example.com");
    });

    it("should handle Japanese content", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="日本語タイトル">
          <meta property="og:description" content="これは日本語の説明です">
          <meta property="og:locale" content="ja_JP">
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.title).toBe("日本語タイトル");
      expect(result.description).toBe("これは日本語の説明です");
      expect(result.locale).toBe("ja_JP");
    });

    it("should handle empty HTML", () => {
      const result = parseOgpFromHtml("", "https://example.com");

      expect(result.fetchedUrl).toBe("https://example.com");
      expect(result.title).toBeUndefined();
    });

    it("should parse og:locale tag", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:locale" content="en_US">
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.locale).toBe("en_US");
    });

    it("should decode HTML entities in content", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="Test &amp; Title">
          <meta property="og:description" content="&quot;Quoted&quot; &lt;text&gt;">
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.title).toBe("Test & Title");
      expect(result.description).toBe('"Quoted" <text>');
    });

    it("should decode numeric HTML entities", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="Test &#39;Title&#39;">
          <meta property="og:description" content="&#x27;Hex&#x27; entities">
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.title).toBe("Test 'Title'");
      expect(result.description).toBe("'Hex' entities");
    });

    it("should handle meta tags with extra whitespace", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta   property = "og:title"   content = "Spaced Title"  >
          <meta
            property="og:description"
            content="Multiline Meta"
          >
        </head>
        <body></body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com");

      expect(result.title).toBe("Spaced Title");
      expect(result.description).toBe("Multiline Meta");
    });

    it("should handle complex HTML with multiple meta tags", () => {
      const html = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Page Title</title>
          <meta name="description" content="Meta Description">
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="https://example.com/og.jpg">
          <meta property="og:url" content="https://example.com/page">
          <meta property="og:type" content="article">
          <meta property="og:site_name" content="Example">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="Twitter Title">
          <meta name="twitter:description" content="Twitter Desc">
          <meta name="twitter:image" content="https://example.com/twitter.jpg">
          <link rel="stylesheet" href="/style.css">
        </head>
        <body>
          <h1>Content</h1>
        </body>
        </html>
      `;

      const result = parseOgpFromHtml(html, "https://example.com/page");

      expect(result.title).toBe("OG Title");
      expect(result.description).toBe("OG Description");
      expect(result.image).toBe("https://example.com/og.jpg");
      expect(result.url).toBe("https://example.com/page");
      expect(result.type).toBe("article");
      expect(result.siteName).toBe("Example");
      expect(result.twitterCard).toBe("summary_large_image");
      expect(result.twitterTitle).toBe("Twitter Title");
      expect(result.twitterDescription).toBe("Twitter Desc");
      expect(result.twitterImage).toBe("https://example.com/twitter.jpg");
      expect(result.metaTitle).toBe("Page Title");
      expect(result.metaDescription).toBe("Meta Description");
    });
  });

  describe("Charset Detection", () => {
    describe("extractCharsetFromHtml", () => {
      it("should extract charset from HTML5 meta tag", () => {
        const html = '<meta charset="UTF-8">';
        expect(extractCharsetFromHtml(html)).toBe("utf-8");
      });

      it("should extract charset from HTML5 meta tag without quotes", () => {
        const html = "<meta charset=UTF-8>";
        expect(extractCharsetFromHtml(html)).toBe("utf-8");
      });

      it("should extract charset from HTML4 meta tag", () => {
        const html =
          '<meta http-equiv="Content-Type" content="text/html; charset=Shift_JIS">';
        expect(extractCharsetFromHtml(html)).toBe("shift_jis");
      });

      it("should extract charset from HTML4 meta tag with reversed attributes", () => {
        const html =
          '<meta content="text/html; charset=EUC-JP" http-equiv="Content-Type">';
        expect(extractCharsetFromHtml(html)).toBe("euc-jp");
      });

      it("should handle case insensitivity", () => {
        const html = '<meta charset="utf-8">';
        expect(extractCharsetFromHtml(html)).toBe("utf-8");
      });

      it("should return null if no charset is found", () => {
        const html = "<html><head><title>Test</title></head></html>";
        expect(extractCharsetFromHtml(html)).toBeNull();
      });

      it("should extract charset from ISO-8859-1", () => {
        const html =
          '<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">';
        expect(extractCharsetFromHtml(html)).toBe("iso-8859-1");
      });
    });

    describe("extractCharsetFromContentType", () => {
      it("should extract charset from Content-Type header", () => {
        const contentType = "text/html; charset=UTF-8";
        expect(extractCharsetFromContentType(contentType)).toBe("utf-8");
      });

      it("should handle charset with different case", () => {
        const contentType = "text/html; charset=shift_jis";
        expect(extractCharsetFromContentType(contentType)).toBe("shift_jis");
      });

      it("should return null if no charset is specified", () => {
        const contentType = "text/html";
        expect(extractCharsetFromContentType(contentType)).toBeNull();
      });

      it("should handle complex Content-Type headers", () => {
        const contentType =
          "text/html; charset=UTF-8; boundary=something";
        expect(extractCharsetFromContentType(contentType)).toBe("utf-8");
      });
    });

    describe("normalizeCharset", () => {
      it("should normalize shift-jis variants", () => {
        expect(normalizeCharset("shift-jis")).toBe("shift_jis");
        expect(normalizeCharset("shift_jis")).toBe("shift_jis");
        expect(normalizeCharset("shiftjis")).toBe("shift_jis");
        expect(normalizeCharset("sjis")).toBe("shift_jis");
        expect(normalizeCharset("Shift_JIS")).toBe("shift_jis");
      });

      it("should normalize euc-jp variants", () => {
        expect(normalizeCharset("euc-jp")).toBe("euc-jp");
        expect(normalizeCharset("eucjp")).toBe("euc-jp");
        expect(normalizeCharset("EUC-JP")).toBe("euc-jp");
      });

      it("should normalize utf-8 variants", () => {
        expect(normalizeCharset("utf-8")).toBe("utf-8");
        expect(normalizeCharset("utf8")).toBe("utf-8");
        expect(normalizeCharset("UTF-8")).toBe("utf-8");
        expect(normalizeCharset("unicode")).toBe("utf-8");
      });

      it("should normalize iso-8859-1 variants", () => {
        expect(normalizeCharset("iso-8859-1")).toBe("iso-8859-1");
        expect(normalizeCharset("iso88591")).toBe("iso-8859-1");
        expect(normalizeCharset("latin1")).toBe("iso-8859-1");
      });

      it("should preserve unknown charsets in lowercase", () => {
        expect(normalizeCharset("windows-1252")).toBe("windows-1252");
        expect(normalizeCharset("UNKNOWN-CHARSET")).toBe("unknown-charset");
      });

      it("should normalize additional Shift_JIS variants", () => {
        expect(normalizeCharset("x-sjis")).toBe("shift_jis");
        expect(normalizeCharset("csShiftJIS")).toBe("shift_jis");
        expect(normalizeCharset("MS_Kanji")).toBe("shift_jis");
        expect(normalizeCharset("Windows-31J")).toBe("shift_jis");
        expect(normalizeCharset("CP932")).toBe("shift_jis");
      });

      it("should normalize additional EUC-JP variants", () => {
        expect(normalizeCharset("x-euc-jp")).toBe("euc-jp");
        expect(normalizeCharset("cseucpkdfmtjapanese")).toBe("euc-jp");
      });

      it("should normalize ISO-2022-JP variants", () => {
        expect(normalizeCharset("iso-2022-jp")).toBe("iso-2022-jp");
        expect(normalizeCharset("csISO2022JP")).toBe("iso-2022-jp");
        expect(normalizeCharset("jis")).toBe("iso-2022-jp");
      });

      it("should normalize Windows-1252 variants", () => {
        expect(normalizeCharset("windows-1252")).toBe("windows-1252");
        expect(normalizeCharset("CP1252")).toBe("windows-1252");
      });
    });

    describe("detectEncodingFromBytes", () => {
      it("should detect UTF-8 encoded text", () => {
        const utf8Text = new TextEncoder().encode("Hello, 日本語テスト");
        expect(detectEncodingFromBytes(utf8Text)).toBe("utf-8");
      });

      it("should detect ASCII text", () => {
        const asciiText = new TextEncoder().encode("Hello, World!");
        const result = detectEncodingFromBytes(asciiText);
        expect(["ascii", "utf-8"]).toContain(result);
      });
    });

    describe("decodeHtmlWithCharset", () => {
      it("should decode UTF-8 content", async () => {
        const utf8Text = "Hello, 日本語テスト";
        const bytes = new TextEncoder().encode(utf8Text);
        const result = await decodeHtmlWithCharset(bytes.buffer, "utf-8");
        expect(result).toBe(utf8Text);
      });

      it("should decode Shift_JIS content", async () => {
        // Shift_JIS encoded "日本語" (0x93FA 0x967B 0x8CEA)
        const shiftJisBytes = new Uint8Array([
          0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea,
        ]);
        const result = await decodeHtmlWithCharset(
          shiftJisBytes.buffer,
          "shift_jis"
        );
        expect(result).toBe("日本語");
      });

      it("should decode EUC-JP content", async () => {
        // EUC-JP encoded "日本語" (0xC6FC 0xCBDC 0xB8EC)
        const eucJpBytes = new Uint8Array([
          0xc6, 0xfc, 0xcb, 0xdc, 0xb8, 0xec,
        ]);
        const result = await decodeHtmlWithCharset(eucJpBytes.buffer, "euc-jp");
        expect(result).toBe("日本語");
      });

      it("should decode ISO-8859-1 content", async () => {
        // ISO-8859-1 encoded text with accented characters
        const text = "Café résumé";
        const encoder = new TextEncoder();
        // Create ISO-8859-1 bytes manually for special chars
        const isoBytes = new Uint8Array([
          0x43,
          0x61,
          0x66,
          0xe9, // Café
          0x20,
          0x72,
          0xe9,
          0x73,
          0x75,
          0x6d,
          0xe9, // résumé
        ]);
        const result = await decodeHtmlWithCharset(
          isoBytes.buffer,
          "iso-8859-1"
        );
        expect(result).toBe("Café résumé");
      });

      it("should fallback gracefully for unknown charsets", async () => {
        const utf8Text = "Hello, World!";
        const bytes = new TextEncoder().encode(utf8Text);
        const result = await decodeHtmlWithCharset(
          bytes.buffer,
          "unknown-charset-xyz"
        );
        // Should not throw and return something readable
        expect(result).toBeTruthy();
      });

      it("should handle empty content", async () => {
        const emptyBytes = new Uint8Array([]);
        const result = await decodeHtmlWithCharset(emptyBytes.buffer, "utf-8");
        expect(result).toBe("");
      });

      it("should decode Shift_JIS HTML with meta tag", async () => {
        // Shift_JIS encoded HTML: <meta charset="shift_jis"><title>テスト</title>
        // "テスト" in Shift_JIS: 0x83 0x65 0x83 0x58 0x83 0x67
        const shiftJisHtml = new Uint8Array([
          // <meta charset="shift_jis"><title>
          0x3c,
          0x6d,
          0x65,
          0x74,
          0x61,
          0x20,
          0x63,
          0x68,
          0x61,
          0x72,
          0x73,
          0x65,
          0x74,
          0x3d,
          0x22,
          0x73,
          0x68,
          0x69,
          0x66,
          0x74,
          0x5f,
          0x6a,
          0x69,
          0x73,
          0x22,
          0x3e,
          0x3c,
          0x74,
          0x69,
          0x74,
          0x6c,
          0x65,
          0x3e,
          // テスト
          0x83,
          0x65,
          0x83,
          0x58,
          0x83,
          0x67,
          // </title>
          0x3c,
          0x2f,
          0x74,
          0x69,
          0x74,
          0x6c,
          0x65,
          0x3e,
        ]);
        const result = await decodeHtmlWithCharset(
          shiftJisHtml.buffer,
          "shift_jis"
        );
        expect(result).toContain("テスト");
        expect(result).toContain("<meta charset");
      });
    });

    describe("resolveUrl", () => {
      it("should return absolute URLs unchanged", () => {
        expect(resolveUrl("https://example.com/image.jpg", "https://base.com/page")).toBe("https://example.com/image.jpg");
        expect(resolveUrl("http://example.com/image.jpg", "https://base.com/page")).toBe("http://example.com/image.jpg");
      });

      it("should resolve protocol-relative URLs", () => {
        expect(resolveUrl("//cdn.example.com/image.jpg", "https://base.com/page")).toBe("https://cdn.example.com/image.jpg");
      });

      it("should resolve root-relative URLs", () => {
        expect(resolveUrl("/images/og.jpg", "https://example.com/path/to/page")).toBe("https://example.com/images/og.jpg");
        expect(resolveUrl("/og.png", "https://example.com/")).toBe("https://example.com/og.png");
      });

      it("should resolve relative URLs", () => {
        expect(resolveUrl("images/og.jpg", "https://example.com/path/page.html")).toBe("https://example.com/path/images/og.jpg");
        expect(resolveUrl("../images/og.jpg", "https://example.com/path/to/page.html")).toBe("https://example.com/path/images/og.jpg");
        expect(resolveUrl("./og.jpg", "https://example.com/path/page.html")).toBe("https://example.com/path/og.jpg");
      });

      it("should handle empty or undefined URLs", () => {
        expect(resolveUrl("", "https://example.com/")).toBe("");
      });

      it("should handle URLs with query strings and fragments", () => {
        expect(resolveUrl("/image.jpg?v=123", "https://example.com/page")).toBe("https://example.com/image.jpg?v=123");
        expect(resolveUrl("/image.jpg#section", "https://example.com/page")).toBe("https://example.com/image.jpg#section");
      });

      it("should handle complex relative paths", () => {
        expect(resolveUrl("../../assets/og.png", "https://example.com/a/b/c/page.html")).toBe("https://example.com/a/assets/og.png");
      });
    });
  });

  describe("parseOgpFromHtml with relative URLs", () => {
    it("should resolve relative og:image URLs", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="Test">
          <meta property="og:image" content="/images/og.jpg">
        </head>
        </html>
      `;
      const result = parseOgpFromHtml(html, "https://example.com/page");
      expect(result.image).toBe("https://example.com/images/og.jpg");
    });

    it("should resolve protocol-relative og:image URLs", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:image" content="//cdn.example.com/og.jpg">
        </head>
        </html>
      `;
      const result = parseOgpFromHtml(html, "https://example.com/page");
      expect(result.image).toBe("https://cdn.example.com/og.jpg");
    });

    it("should resolve relative twitter:image URLs", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="twitter:image" content="../assets/twitter.png">
        </head>
        </html>
      `;
      const result = parseOgpFromHtml(html, "https://example.com/path/page.html");
      expect(result.twitterImage).toBe("https://example.com/assets/twitter.png");
    });

    it("should keep absolute image URLs unchanged", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:image" content="https://other.com/image.jpg">
        </head>
        </html>
      `;
      const result = parseOgpFromHtml(html, "https://example.com/page");
      expect(result.image).toBe("https://other.com/image.jpg");
    });
  });
});
