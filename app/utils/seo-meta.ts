/**
 * SEOメタタグ生成ユーティリティ
 * 基本SEO・OGP・Twitterカードのメタタグ文字列を生成する
 */

/** OGコンテンツタイプ */
export type OgType =
  | "website"
  | "article"
  | "product"
  | "profile"
  | "book"
  | "music.song"
  | "video.movie";

/** Twitterカードタイプ */
export type TwitterCard =
  | "summary"
  | "summary_large_image"
  | "app"
  | "player";

/** Robotsディレクティブ */
export type RobotsDirective =
  | "index, follow"
  | "noindex, follow"
  | "index, nofollow"
  | "noindex, nofollow";

/** 基本SEOメタタグの入力データ */
export interface BasicSeoData {
  title: string;
  description: string;
  keywords: string;
  author: string;
  canonicalUrl: string;
  robots: RobotsDirective;
}

/** Open Graphメタタグの入力データ */
export interface OgData {
  title: string;
  description: string;
  url: string;
  image: string;
  type: OgType;
  siteName: string;
  locale: string;
}

/** Twitterカードメタタグの入力データ */
export interface TwitterData {
  card: TwitterCard;
  title: string;
  description: string;
  image: string;
  site: string;
  creator: string;
}

/** 全メタタグの入力データ */
export interface SeoMetaData {
  basic: BasicSeoData;
  og: OgData;
  twitter: TwitterData;
}

/**
 * HTML特殊文字をエスケープする
 * @param str エスケープ対象の文字列
 * @returns エスケープ後の文字列
 */
export function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * 基本SEOメタタグのHTML文字列を生成する
 * @param data 基本SEOデータ
 * @param indent インデント文字列
 * @returns メタタグのHTML文字列（配列）
 */
export function generateBasicMetaTags(
  data: BasicSeoData,
  indent = "  "
): string[] {
  const tags: string[] = [];

  if (data.title) {
    tags.push(`${indent}<title>${escapeHtmlAttr(data.title)}</title>`);
  }
  if (data.description) {
    tags.push(
      `${indent}<meta name="description" content="${escapeHtmlAttr(data.description)}">`
    );
  }
  if (data.keywords) {
    tags.push(
      `${indent}<meta name="keywords" content="${escapeHtmlAttr(data.keywords)}">`
    );
  }
  if (data.author) {
    tags.push(
      `${indent}<meta name="author" content="${escapeHtmlAttr(data.author)}">`
    );
  }
  tags.push(
    `${indent}<meta name="robots" content="${escapeHtmlAttr(data.robots)}">`
  );
  if (data.canonicalUrl) {
    tags.push(
      `${indent}<link rel="canonical" href="${escapeHtmlAttr(data.canonicalUrl)}">`
    );
  }

  return tags;
}

/**
 * Open GraphメタタグのHTML文字列を生成する
 * @param data OGデータ
 * @param indent インデント文字列
 * @returns メタタグのHTML文字列（配列）
 */
export function generateOgTags(data: OgData, indent = "  "): string[] {
  const tags: string[] = [];

  tags.push(
    `${indent}<meta property="og:type" content="${escapeHtmlAttr(data.type)}">`
  );
  if (data.title) {
    tags.push(
      `${indent}<meta property="og:title" content="${escapeHtmlAttr(data.title)}">`
    );
  }
  if (data.description) {
    tags.push(
      `${indent}<meta property="og:description" content="${escapeHtmlAttr(data.description)}">`
    );
  }
  if (data.url) {
    tags.push(
      `${indent}<meta property="og:url" content="${escapeHtmlAttr(data.url)}">`
    );
  }
  if (data.image) {
    tags.push(
      `${indent}<meta property="og:image" content="${escapeHtmlAttr(data.image)}">`
    );
  }
  if (data.siteName) {
    tags.push(
      `${indent}<meta property="og:site_name" content="${escapeHtmlAttr(data.siteName)}">`
    );
  }
  if (data.locale) {
    tags.push(
      `${indent}<meta property="og:locale" content="${escapeHtmlAttr(data.locale)}">`
    );
  }

  return tags;
}

/**
 * TwitterカードメタタグのHTML文字列を生成する
 * @param data Twitterカードデータ
 * @param indent インデント文字列
 * @returns メタタグのHTML文字列（配列）
 */
export function generateTwitterTags(
  data: TwitterData,
  indent = "  "
): string[] {
  const tags: string[] = [];

  tags.push(
    `${indent}<meta name="twitter:card" content="${escapeHtmlAttr(data.card)}">`
  );
  if (data.title) {
    tags.push(
      `${indent}<meta name="twitter:title" content="${escapeHtmlAttr(data.title)}">`
    );
  }
  if (data.description) {
    tags.push(
      `${indent}<meta name="twitter:description" content="${escapeHtmlAttr(data.description)}">`
    );
  }
  if (data.image) {
    tags.push(
      `${indent}<meta name="twitter:image" content="${escapeHtmlAttr(data.image)}">`
    );
  }
  if (data.site) {
    tags.push(
      `${indent}<meta name="twitter:site" content="${escapeHtmlAttr(data.site)}">`
    );
  }
  if (data.creator) {
    tags.push(
      `${indent}<meta name="twitter:creator" content="${escapeHtmlAttr(data.creator)}">`
    );
  }

  return tags;
}

/**
 * 全メタタグのHTML文字列を生成する
 * @param data SEOメタデータ全体
 * @param options 生成オプション
 * @returns 全メタタグのHTML文字列
 */
export function generateAllMetaTags(
  data: SeoMetaData,
  options: { includeBasic: boolean; includeOg: boolean; includeTwitter: boolean }
): string {
  const lines: string[] = [];

  if (options.includeBasic) {
    const basicTags = generateBasicMetaTags(data.basic);
    if (basicTags.length > 0) {
      lines.push("  <!-- 基本SEO -->");
      lines.push(...basicTags);
    }
  }

  if (options.includeOg) {
    const ogTags = generateOgTags(data.og);
    if (ogTags.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push("  <!-- Open Graph -->");
      lines.push(...ogTags);
    }
  }

  if (options.includeTwitter) {
    const twitterTags = generateTwitterTags(data.twitter);
    if (twitterTags.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push("  <!-- Twitter Card -->");
      lines.push(...twitterTags);
    }
  }

  return lines.join("\n");
}

/**
 * Googleの検索結果プレビュー用にタイトルを切り詰める（約60文字）
 * @param title タイトル文字列
 * @returns 切り詰め後の文字列
 */
export function truncateTitle(title: string, maxLength = 60): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 1) + "…";
}

/**
 * Googleの検索結果プレビュー用にdescriptionを切り詰める（約160文字）
 * @param description description文字列
 * @returns 切り詰め後の文字列
 */
export function truncateDescription(
  description: string,
  maxLength = 160
): string {
  if (description.length <= maxLength) return description;
  return description.slice(0, maxLength - 1) + "…";
}
