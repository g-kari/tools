/**
 * @fileoverview robots.txt ジェネレーターユーティリティ
 * robots.txt ファイルを生成するための型定義と関数群
 */

/**
 * クローラーのルール（許可・拒否パスの設定）
 */
export interface CrawlerRule {
  /** ユニークID */
  id: string;
  /** ユーザーエージェント名（"*" はすべてのクローラー） */
  userAgent: string;
  /** 許可するパスのリスト */
  allow: string[];
  /** 拒否するパスのリスト */
  disallow: string[];
  /** クロール遅延（秒）。null で設定なし */
  crawlDelay: number | null;
}

/**
 * robots.txt 生成オプション
 */
export interface RobotsTxtOptions {
  /** クローラールールのリスト */
  rules: CrawlerRule[];
  /** サイトマップURLのリスト */
  sitemaps: string[];
}

/**
 * デフォルトのクローラールール（全クローラー許可）
 */
export const DEFAULT_RULE: Omit<CrawlerRule, "id"> = {
  userAgent: "*",
  allow: [],
  disallow: [],
  crawlDelay: null,
};

/**
 * よく使われるユーザーエージェント名のリスト
 */
export const COMMON_USER_AGENTS = [
  "*",
  "Googlebot",
  "Googlebot-Image",
  "Googlebot-Video",
  "Bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "facebot",
  "Twitterbot",
  "LinkedInBot",
  "Applebot",
  "AhrefsBot",
  "MJ12bot",
  "SemrushBot",
  "DotBot",
  "BLEXBot",
  "MajesticSEO",
] as const;

/**
 * よく使われる Disallow パスのプリセット
 */
export const COMMON_DISALLOW_PATHS = [
  "/admin",
  "/admin/",
  "/api/",
  "/private/",
  "/tmp/",
  "/cache/",
  "/search",
  "/login",
  "/register",
  "/wp-admin/",
  "/wp-includes/",
  "/*.php$",
  "/?",
  "/cgi-bin/",
] as const;

/**
 * ランダムなIDを生成する
 * @returns ランダムID文字列
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * パスが有効な robots.txt パス形式かどうかを検証する
 *
 * 有効な条件:
 * - "/"で始まる
 * - または "*" または空文字列
 *
 * @param path - 検証するパス文字列
 * @returns 有効であれば true
 */
export function isValidPath(path: string): boolean {
  if (path === "" || path === "*") return true;
  return path.startsWith("/");
}

/**
 * URLが有効なサイトマップURL形式かどうかを検証する
 * @param url - 検証するURL文字列
 * @returns 有効であれば true
 */
export function isValidSitemapUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * CrawlerRule から robots.txt のテキストブロックを生成する
 *
 * @param rule - クローラールール
 * @returns robots.txt のテキストブロック
 *
 * @example
 * generateRuleBlock({ userAgent: "*", allow: ["/public/"], disallow: ["/admin/"], crawlDelay: null, id: "1" })
 * // => "User-agent: *\nAllow: /public/\nDisallow: /admin/"
 */
export function generateRuleBlock(rule: CrawlerRule): string {
  const lines: string[] = [];

  lines.push(`User-agent: ${rule.userAgent || "*"}`);

  for (const path of rule.allow) {
    if (path.trim()) {
      lines.push(`Allow: ${path.trim()}`);
    }
  }

  for (const path of rule.disallow) {
    if (path.trim()) {
      lines.push(`Disallow: ${path.trim()}`);
    }
  }

  if (rule.crawlDelay !== null && rule.crawlDelay > 0) {
    lines.push(`Crawl-delay: ${rule.crawlDelay}`);
  }

  return lines.join("\n");
}

/**
 * RobotsTxtOptions から完全な robots.txt テキストを生成する
 *
 * @param options - 生成オプション
 * @returns 生成された robots.txt テキスト
 *
 * @example
 * generateRobotsTxt({
 *   rules: [{ id: "1", userAgent: "*", allow: [], disallow: ["/admin/"], crawlDelay: null }],
 *   sitemaps: ["https://example.com/sitemap.xml"]
 * })
 * // => "User-agent: *\nDisallow: /admin/\n\nSitemap: https://example.com/sitemap.xml"
 */
export function generateRobotsTxt(options: RobotsTxtOptions): string {
  const sections: string[] = [];

  for (const rule of options.rules) {
    const block = generateRuleBlock(rule);
    if (block) {
      sections.push(block);
    }
  }

  const validSitemaps = options.sitemaps.filter((url) => isValidSitemapUrl(url));
  for (const sitemap of validSitemaps) {
    sections.push(`Sitemap: ${sitemap}`);
  }

  return sections.join("\n\n");
}

/**
 * すべてのクローラーを拒否するプリセットを生成する
 * @returns RobotsTxtOptions
 */
export function createBlockAllPreset(): RobotsTxtOptions {
  return {
    rules: [
      {
        id: generateId(),
        userAgent: "*",
        allow: [],
        disallow: ["/"],
        crawlDelay: null,
      },
    ],
    sitemaps: [],
  };
}

/**
 * すべてのクローラーを許可するプリセットを生成する
 * @returns RobotsTxtOptions
 */
export function createAllowAllPreset(): RobotsTxtOptions {
  return {
    rules: [
      {
        id: generateId(),
        userAgent: "*",
        allow: [],
        disallow: [],
        crawlDelay: null,
      },
    ],
    sitemaps: [],
  };
}

/**
 * WordPress サイト向けプリセットを生成する
 * @returns RobotsTxtOptions
 */
export function createWordPressPreset(): RobotsTxtOptions {
  return {
    rules: [
      {
        id: generateId(),
        userAgent: "*",
        allow: ["/wp-content/uploads/"],
        disallow: [
          "/wp-admin/",
          "/wp-includes/",
          "/wp-content/plugins/",
          "/wp-content/themes/",
          "/?",
        ],
        crawlDelay: null,
      },
    ],
    sitemaps: ["https://example.com/sitemap.xml"],
  };
}
