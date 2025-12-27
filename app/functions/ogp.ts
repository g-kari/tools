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

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

// Parse OGP and meta tags from HTML
export function parseOgpFromHtml(html: string, url: string): OgpData {
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
    // Supports: single/double quotes, spaces, newlines
    const patterns = [
      // property/name="..." content="..."
      new RegExp(
        `<meta[^>]+${attr}\\s*=\\s*["']${escapedProp}["'][^>]+content\\s*=\\s*["']([^"']*?)["']`,
        "is"
      ),
      // content="..." property/name="..."
      new RegExp(
        `<meta[^>]+content\\s*=\\s*["']([^"']*?)["'][^>]+${attr}\\s*=\\s*["']${escapedProp}["']`,
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

// Validate URL
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Bot User-Agents for fetching OGP (sites often serve OGP only to known bots)
const BOT_USER_AGENTS = [
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "Twitterbot/1.0",
  "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
];

// Fetch with bot User-Agent to get OGP data
async function fetchWithBotUserAgent(
  url: string,
  signal: AbortSignal
): Promise<Response | null> {
  for (const userAgent of BOT_USER_AGENTS) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        },
        redirect: "follow",
        signal,
      });

      if (response.ok) {
        return response;
      }
    } catch {
      // Try next user agent
      continue;
    }
  }
  return null;
}

// Check if URL points to an image
function isImageUrl(url: string): boolean {
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
    ".ico",
  ];
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return imageExtensions.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

// Check if content type indicates an image
function isImageContentType(contentType: string): boolean {
  return contentType.startsWith("image/");
}

// Server function to fetch OGP data
export const fetchOgp = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
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
      // Set up timeout with AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // First, try with bot user agents (better for OGP)
      let response = await fetchWithBotUserAgent(url, controller.signal);

      // Fallback to regular browser user agent
      if (!response) {
        response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
          },
          redirect: "follow",
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          fetchedUrl: url,
          error: `HTTPエラー: ${response.status} ${response.statusText}`,
        } as OgpData;
      }

      const contentType = response.headers.get("content-type") || "";

      // Handle image URLs - return image as OGP image
      if (isImageContentType(contentType) || isImageUrl(url)) {
        return {
          fetchedUrl: url,
          title: "画像",
          image: url,
          type: "image",
        } as OgpData;
      }

      if (
        !contentType.includes("text/html") &&
        !contentType.includes("application/xhtml+xml")
      ) {
        return {
          fetchedUrl: url,
          error: `HTMLではないコンテンツです (${contentType || "不明な形式"})`,
        } as OgpData;
      }

      const html = await response.text();
      const ogpData = parseOgpFromHtml(html, url);

      // If no OGP data was found with bot UA, the result might still be empty
      // This is expected for some sites that don't support OGP
      return ogpData;
    } catch (error) {
      let errorMessage = "不明なエラーが発生しました";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "タイムアウト: サーバーからの応答がありませんでした";
        } else {
          errorMessage = `取得エラー: ${error.message}`;
        }
      }
      return {
        fetchedUrl: url,
        error: errorMessage,
      } as OgpData;
    }
  });
