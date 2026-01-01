import { createServerFn } from "@tanstack/react-start";
import { decodeHtmlEntities } from "../utils/html";
import Encoding from "encoding-japanese";

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

// decodeHtmlEntities is now imported from ../utils/html

/**
 * Extract charset from HTML meta tags
 * Supports both HTML5 (<meta charset="...">) and HTML4 (<meta http-equiv="Content-Type" ...>) formats
 */
export function extractCharsetFromHtml(html: string): string | null {
  // HTML5 format: <meta charset="UTF-8">
  const html5Match = html.match(
    /<meta\s+charset\s*=\s*["']?([a-zA-Z0-9_-]+)["']?/i
  );
  if (html5Match) {
    return html5Match[1].toLowerCase();
  }

  // HTML4 format: <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  const html4Match = html.match(
    /<meta\s+http-equiv\s*=\s*["']?content-type["']?[^>]+content\s*=\s*["'][^"']*charset=([a-zA-Z0-9_-]+)/i
  );
  if (html4Match) {
    return html4Match[1].toLowerCase();
  }

  // Reversed attribute order
  const reversedMatch = html.match(
    /<meta\s+content\s*=\s*["'][^"']*charset=([a-zA-Z0-9_-]+)[^>]+http-equiv\s*=\s*["']?content-type["']?/i
  );
  if (reversedMatch) {
    return reversedMatch[1].toLowerCase();
  }

  return null;
}

/**
 * Extract charset from Content-Type header
 */
export function extractCharsetFromContentType(
  contentType: string
): string | null {
  const match = contentType.match(/charset=([a-zA-Z0-9_-]+)/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Normalize charset name to standard form
 * Maps common aliases to their standard names
 */
export function normalizeCharset(charset: string): string {
  const normalized = charset.toLowerCase().replace(/[_-]/g, "");

  // Map common aliases to their standard names
  const charsetMap: Record<string, string> = {
    // Shift_JIS variants
    shiftjis: "shift_jis",
    sjis: "shift_jis",
    shiftjis2004: "shift_jis",
    xsjis: "shift_jis",
    csshiftjis: "shift_jis",
    mskanji: "shift_jis",
    windows31j: "shift_jis",
    cp932: "shift_jis",

    // EUC-JP variants
    eucjp: "euc-jp",
    xeucjp: "euc-jp",
    cseucpkdfmtjapanese: "euc-jp",

    // ISO-2022-JP variants
    iso2022jp: "iso-2022-jp",
    csiso2022jp: "iso-2022-jp",
    jis: "iso-2022-jp",

    // UTF-8 variants
    utf8: "utf-8",
    unicode: "utf-8",

    // ISO-8859-1 variants
    iso88591: "iso-8859-1",
    latin1: "iso-8859-1",
    csisolatin1: "iso-8859-1",
    l1: "iso-8859-1",
    ibm819: "iso-8859-1",
    cp819: "iso-8859-1",
    windows1252: "windows-1252",
    cp1252: "windows-1252",
  };

  return charsetMap[normalized] || charset.toLowerCase();
}

/**
 * Check if charset is a Japanese encoding that requires special handling
 */
function isJapaneseCharset(charset: string): boolean {
  const japaneseCharsets = ["shift_jis", "euc-jp", "iso-2022-jp"];
  return japaneseCharsets.includes(charset);
}

/**
 * Convert encoding-japanese encoding code to normalized charset name
 */
function encodingCodeToCharset(
  code: ReturnType<typeof Encoding.detect>
): string {
  switch (code) {
    case "SJIS":
      return "shift_jis";
    case "EUCJP":
      return "euc-jp";
    case "JIS":
      return "iso-2022-jp";
    case "UTF8":
      return "utf-8";
    case "UTF16":
    case "UTF16BE":
      return "utf-16be";
    case "UTF16LE":
      return "utf-16le";
    case "UTF32":
      return "utf-32";
    case "UNICODE":
      return "utf-8";
    case "ASCII":
      return "ascii";
    default:
      return "utf-8";
  }
}

/**
 * Auto-detect encoding from byte array using encoding-japanese
 */
export function detectEncodingFromBytes(bytes: Uint8Array): string {
  const detected = Encoding.detect(bytes);
  return encodingCodeToCharset(detected);
}

/**
 * Convert charset name to encoding-japanese encoding type
 */
function charsetToEncodingType(
  charset: string
): "SJIS" | "EUCJP" | "JIS" | "UTF8" | null {
  switch (charset) {
    case "shift_jis":
      return "SJIS";
    case "euc-jp":
      return "EUCJP";
    case "iso-2022-jp":
      return "JIS";
    case "utf-8":
      return "UTF8";
    default:
      return null;
  }
}

/**
 * Decode HTML content with specified charset
 * Uses encoding-japanese for Japanese encodings (Shift_JIS, EUC-JP, ISO-2022-JP)
 * Falls back to TextDecoder for other encodings
 */
export async function decodeHtmlWithCharset(
  arrayBuffer: ArrayBuffer,
  charset: string
): Promise<string> {
  const normalizedCharset = normalizeCharset(charset);
  const bytes = new Uint8Array(arrayBuffer);

  // For Japanese encodings, use encoding-japanese library
  if (isJapaneseCharset(normalizedCharset)) {
    try {
      const encodingType = charsetToEncodingType(normalizedCharset);
      if (encodingType) {
        // Convert to Unicode array and then to string
        const unicodeArray = Encoding.convert(bytes, {
          to: "UNICODE",
          from: encodingType,
        });
        return Encoding.codeToString(unicodeArray);
      }
    } catch {
      // Fall through to auto-detection
    }
  }

  // Try auto-detection for unspecified or failed encodings
  if (normalizedCharset === "utf-8" || !normalizedCharset) {
    const detected = Encoding.detect(bytes);
    if (detected && detected !== "UTF8" && detected !== "ASCII") {
      try {
        const unicodeArray = Encoding.convert(bytes, {
          to: "UNICODE",
          from: detected,
        });
        return Encoding.codeToString(unicodeArray);
      } catch {
        // Fall through to TextDecoder
      }
    }
  }

  // Use TextDecoder for other encodings
  try {
    const decoder = new TextDecoder(normalizedCharset, { fatal: false });
    return decoder.decode(arrayBuffer);
  } catch {
    // If charset is not supported, try UTF-8 as fallback
    try {
      const decoder = new TextDecoder("utf-8", { fatal: false });
      return decoder.decode(arrayBuffer);
    } catch {
      // Last resort: decode as Latin-1 (ISO-8859-1) which accepts all byte values
      const decoder = new TextDecoder("iso-8859-1");
      return decoder.decode(arrayBuffer);
    }
  }
}

/**
 * Resolve a relative URL to an absolute URL based on the base URL
 * Handles various relative path formats:
 * - Absolute URLs (https://...) - returned as-is
 * - Protocol-relative URLs (//example.com/...) - adds https:
 * - Root-relative URLs (/path/to/...) - uses base URL origin
 * - Relative URLs (path/to/...) - resolves relative to base URL
 */
export function resolveUrl(relativeUrl: string, baseUrl: string): string {
  if (!relativeUrl) {
    return relativeUrl;
  }

  // Already absolute URL
  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }

  try {
    const base = new URL(baseUrl);

    // Protocol-relative URL (//example.com/path)
    if (relativeUrl.startsWith("//")) {
      return `https:${relativeUrl}`;
    }

    // Use URL constructor to resolve relative URLs
    return new URL(relativeUrl, base).href;
  } catch {
    // If URL parsing fails, return the original
    return relativeUrl;
  }
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

// Browser-like User-Agents as fallback for sites that block bots
const BROWSER_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
];

// Fetch with bot User-Agent to get OGP data
async function fetchWithBotUserAgent(
  url: string,
  signal: AbortSignal
): Promise<Response | null> {
  const parsedUrl = new URL(url);

  // Try bot User-Agents first
  for (const userAgent of BOT_USER_AGENTS) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
          Referer: `${parsedUrl.protocol}//${parsedUrl.host}/`,
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

  // Fallback to browser-like User-Agents for sites that block bots
  for (const userAgent of BROWSER_USER_AGENTS) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          Referer: `${parsedUrl.protocol}//${parsedUrl.host}/`,
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "max-age=0",
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

// Extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // youtube.com/watch?v=VIDEO_ID
    if (
      urlObj.hostname === "www.youtube.com" ||
      urlObj.hostname === "youtube.com"
    ) {
      const videoId = urlObj.searchParams.get("v");
      if (videoId) return videoId;

      // youtube.com/embed/VIDEO_ID
      if (urlObj.pathname.startsWith("/embed/")) {
        const parts = urlObj.pathname.split("/");
        if (parts.length >= 3 && parts[2]) {
          return parts[2];
        }
      }
    }
    // youtu.be/VIDEO_ID
    if (urlObj.hostname === "youtu.be") {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) return videoId;
    }
  } catch {
    return null;
  }
  return null;
}

// Extract X/Twitter status ID from URL
function extractTwitterStatusId(url: string): {
  username: string;
  statusId: string;
} | null {
  try {
    const urlObj = new URL(url);
    if (
      urlObj.hostname === "twitter.com" ||
      urlObj.hostname === "www.twitter.com" ||
      urlObj.hostname === "x.com" ||
      urlObj.hostname === "www.x.com"
    ) {
      const match = urlObj.pathname.match(/^\/([^/]+)\/status\/(\d+)/);
      if (match) {
        return { username: match[1], statusId: match[2] };
      }
    }
  } catch {
    return null;
  }
  return null;
}

// Extract image URL from proxy URL (e.g., img.0g0.xyz/?url=...)
function extractProxiedImageUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const proxiedUrl = urlObj.searchParams.get("url");
    if (proxiedUrl && isImageUrl(proxiedUrl)) {
      return proxiedUrl;
    }
  } catch {
    return null;
  }
  return null;
}

// Get YouTube thumbnail URL with fallback
// maxresdefault.jpg is not available for all videos, use hqdefault as fallback
function getYouTubeThumbnailUrl(videoId: string): string {
  // Use hqdefault as it's more reliably available
  // maxresdefault (1280x720) is only available for HD videos
  // hqdefault (480x360) is available for all videos
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Fetch YouTube OGP using noembed API
async function fetchYouTubeOgp(
  videoId: string,
  originalUrl: string,
  signal: AbortSignal
): Promise<OgpData> {
  try {
    const oembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(oembedUrl, { signal });

    if (response.ok) {
      const data = await response.json();
      // Use thumbnail_url from API if available, otherwise use our fallback
      const thumbnail =
        data.thumbnail_url || getYouTubeThumbnailUrl(videoId);
      return {
        fetchedUrl: originalUrl,
        title: data.title || undefined,
        description: data.author_name
          ? `${data.author_name} のYouTube動画`
          : undefined,
        image: thumbnail,
        siteName: "YouTube",
        type: "video",
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }
  } catch {
    // Fallback to basic info
  }

  // Fallback: return basic info with thumbnail
  return {
    fetchedUrl: originalUrl,
    title: "YouTube動画",
    image: getYouTubeThumbnailUrl(videoId),
    siteName: "YouTube",
    type: "video",
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

// Fetch X/Twitter OGP using syndication API
// Note: This uses an undocumented API endpoint which may change or require tokens
async function fetchTwitterOgp(
  username: string,
  statusId: string,
  originalUrl: string,
  signal: AbortSignal
): Promise<OgpData> {
  // Create fallback data first
  const fallbackData: OgpData = {
    fetchedUrl: originalUrl,
    title: `@${username} のポスト`,
    siteName: "X (formerly Twitter)",
    type: "article",
    url: originalUrl,
  };

  try {
    // Use syndication API to get tweet data
    // This is an undocumented endpoint and may require token parameter
    const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${statusId}&token=0`;
    const response = await fetch(syndicationUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      signal,
    });

    // Handle various error responses
    if (!response.ok) {
      // 404: Tweet not found or deleted
      // 403: Access denied
      // Other: API changes or rate limiting
      console.warn(
        `Twitter syndication API returned ${response.status} for status ${statusId}`
      );
      return fallbackData;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.warn(`Twitter syndication API returned non-JSON content`);
      return fallbackData;
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== "object") {
      return fallbackData;
    }

    const text = data.text || "";
    const authorName = data.user?.name || username;
    const authorScreenName = data.user?.screen_name || username;
    const profileImage = data.user?.profile_image_url_https;

    // Get media if available
    let image: string | undefined;
    if (data.mediaDetails && data.mediaDetails.length > 0) {
      image = data.mediaDetails[0].media_url_https;
    } else if (data.photos && data.photos.length > 0) {
      image = data.photos[0].url;
    }

    return {
      fetchedUrl: originalUrl,
      title: `${authorName} (@${authorScreenName})`,
      description: text.length > 200 ? text.substring(0, 200) + "..." : text,
      image: image || profileImage,
      siteName: "X (formerly Twitter)",
      type: "article",
      url: `https://x.com/${authorScreenName}/status/${statusId}`,
      twitterCard: "summary_large_image",
      twitterSite: `@${authorScreenName}`,
    };
  } catch (error) {
    // Handle network errors, timeouts, JSON parse errors, etc.
    if (error instanceof Error && error.name !== "AbortError") {
      console.warn(`Twitter syndication API error: ${error.message}`);
    }
    return fallbackData;
  }
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
    // Set up timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // Check for special URL handlers first

      // YouTube
      const youtubeVideoId = extractYouTubeVideoId(url);
      if (youtubeVideoId) {
        // Keep timeout active during async operation, clear in finally
        const result = await fetchYouTubeOgp(
          youtubeVideoId,
          url,
          controller.signal
        );
        return result;
      }

      // X/Twitter
      const twitterStatus = extractTwitterStatusId(url);
      if (twitterStatus) {
        // Keep timeout active during async operation, clear in finally
        const result = await fetchTwitterOgp(
          twitterStatus.username,
          twitterStatus.statusId,
          url,
          controller.signal
        );
        return result;
      }

      // Image proxy URLs
      const proxiedImageUrl = extractProxiedImageUrl(url);
      if (proxiedImageUrl) {
        return {
          fetchedUrl: url,
          title: "画像",
          image: proxiedImageUrl,
          type: "image",
        } as OgpData;
      }

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

      // Detect charset from Content-Type header
      const charsetFromHeader = extractCharsetFromContentType(contentType);

      // Get response as ArrayBuffer for proper charset handling
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Auto-detect encoding from bytes (for cases where header/meta are incorrect)
      const detectedEncoding = detectEncodingFromBytes(bytes);

      // First, try to decode as ASCII/Latin-1 to extract charset from HTML meta tags
      // This works because meta charset declarations are in ASCII-compatible positions
      const tempDecoder = new TextDecoder("iso-8859-1", { fatal: false });
      const tempHtml = tempDecoder.decode(arrayBuffer);
      const charsetFromMeta = extractCharsetFromHtml(tempHtml);

      // Determine final charset with priority:
      // 1. Meta tag charset (most reliable for the actual content)
      // 2. Content-Type header charset
      // 3. Auto-detected encoding from bytes
      // 4. UTF-8 as default
      let finalCharset: string;
      if (charsetFromMeta) {
        finalCharset = charsetFromMeta;
      } else if (charsetFromHeader) {
        finalCharset = charsetFromHeader;
      } else if (detectedEncoding !== "utf-8" && detectedEncoding !== "ascii") {
        // Use auto-detected encoding if it's not UTF-8/ASCII
        finalCharset = detectedEncoding;
      } else {
        finalCharset = "utf-8";
      }

      // Decode with the detected charset
      const html = await decodeHtmlWithCharset(arrayBuffer, finalCharset);

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
    } finally {
      // Always clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
    }
  });
