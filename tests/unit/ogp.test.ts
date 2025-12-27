import { describe, it, expect } from "vitest";

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
  const getMetaContent = (
    propertyOrName: string,
    isProperty: boolean = true
  ): string | undefined => {
    const attr = isProperty ? "property" : "name";
    // Match both single and double quotes
    const regex = new RegExp(
      `<meta\\s+[^>]*${attr}=["']${propertyOrName}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta\\s+[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${propertyOrName}["'][^>]*>`,
      "i"
    );
    const match = html.match(regex);
    return match ? match[1] || match[2] : undefined;
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
});
