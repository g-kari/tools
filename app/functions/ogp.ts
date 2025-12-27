import { createServerFn } from "@tanstack/react-start";

// OGP data structure
export interface OgpData {
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

// Parse OGP and meta tags from HTML
export function parseOgpFromHtml(html: string, url: string): OgpData {
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

// Validate URL
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Server function to fetch OGP data
export const fetchOgp = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    if (!data || typeof data !== "string") {
      throw new Error("URLを入力してください");
    }

    const trimmedUrl = data.trim();

    // Add https:// if protocol is missing
    const urlWithProtocol = trimmedUrl.match(/^https?:\/\//)
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    if (!isValidUrl(urlWithProtocol)) {
      throw new Error("無効なURL形式です");
    }

    return urlWithProtocol;
  })
  .handler(async ({ data: url }) => {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; OGPChecker/1.0; +https://tools.example.com)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        return {
          fetchedUrl: url,
          error: `HTTPエラー: ${response.status} ${response.statusText}`,
        } as OgpData;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        return {
          fetchedUrl: url,
          error: "HTMLではないコンテンツです",
        } as OgpData;
      }

      const html = await response.text();
      return parseOgpFromHtml(html, url);
    } catch (error) {
      return {
        fetchedUrl: url,
        error:
          error instanceof Error
            ? `取得エラー: ${error.message}`
            : "不明なエラーが発生しました",
      } as OgpData;
    }
  });
