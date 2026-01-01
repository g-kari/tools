import { describe, it, expect } from "vitest";
import { decodeHtmlEntities } from "../../app/utils/html";
import {
  extractCharsetFromHtml,
  extractCharsetFromContentType,
  normalizeCharset,
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
  result.image = getMetaContent("og:image");
  result.url = getMetaContent("og:url");
  result.type = getMetaContent("og:type");
  result.siteName = getMetaContent("og:site_name");
  result.locale = getMetaContent("og:locale");

  // Extract Twitter Card tags
  result.twitterCard = getMetaContent("twitter:card", false);
  result.twitterTitle = getMetaContent("twitter:title", false);
  result.twitterDescription = getMetaContent("twitter:description", false);
  result.twitterImage = getMetaContent("twitter:image", false);
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
    });
  });
});
