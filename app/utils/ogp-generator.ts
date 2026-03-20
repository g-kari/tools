/**
 * OGP（Open Graph Protocol）メタタグジェネレーター ユーティリティ
 * Web ページ用の OGP メタタグ HTML を生成する
 */

/** OGP タグタイプの定義 */
export const OGP_TYPES = [
  "website",
  "article",
  "profile",
  "book",
  "music.song",
  "music.album",
  "music.playlist",
  "music.radio_station",
  "video.movie",
  "video.episode",
  "video.tv_show",
  "video.other",
] as const;

/** OGP タグタイプ */
export type OgpType = (typeof OGP_TYPES)[number];

/** Twitter Card タイプ */
export const TWITTER_CARD_TYPES = [
  "summary",
  "summary_large_image",
  "app",
  "player",
] as const;

/** Twitter Card タイプ */
export type TwitterCardType = (typeof TWITTER_CARD_TYPES)[number];

/** OGP ジェネレーター入力データ */
export interface OgpInput {
  /** ページタイトル */
  title: string;
  /** ページの説明 */
  description: string;
  /** ページの URL */
  url: string;
  /** OGP 画像の URL */
  imageUrl: string;
  /** コンテンツタイプ */
  type: OgpType;
  /** サイト名 */
  siteName: string;
  /** ロケール（例: ja_JP） */
  locale: string;
  /** Twitter Card タイプ */
  twitterCard: TwitterCardType;
  /** Twitter サイトアカウント */
  twitterSite: string;
  /** Twitter クリエイターアカウント */
  twitterCreator: string;
  /** Twitter Card を有効にするか */
  enableTwitterCard: boolean;
}

/** OGP ジェネレーターのデフォルト値 */
export const OGP_INPUT_DEFAULTS: OgpInput = {
  title: "",
  description: "",
  url: "",
  imageUrl: "",
  type: "website",
  siteName: "",
  locale: "ja_JP",
  twitterCard: "summary_large_image",
  twitterSite: "",
  twitterCreator: "",
  enableTwitterCard: true,
};

/**
 * 文字列を HTML 属性値として安全にエスケープする
 * @param value エスケープする文字列
 * @returns エスケープ済み文字列
 */
export function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * 単一の OGP メタタグ HTML を生成する
 * @param property プロパティ名（og:title など）
 * @param content コンテンツ値
 * @returns メタタグ HTML 文字列
 */
export function generateMetaTag(property: string, content: string): string {
  const escapedContent = escapeHtmlAttribute(content);
  return `<meta property="${property}" content="${escapedContent}" />`;
}

/**
 * 単一の Twitter メタタグ HTML を生成する
 * @param name name 属性値（twitter:card など）
 * @param content コンテンツ値
 * @returns メタタグ HTML 文字列
 */
export function generateTwitterTag(name: string, content: string): string {
  const escapedContent = escapeHtmlAttribute(content);
  return `<meta name="${name}" content="${escapedContent}" />`;
}

/**
 * OGP 入力データから OGP メタタグ HTML を生成する
 * @param input OGP 入力データ
 * @returns 生成された OGP メタタグ HTML 文字列（改行区切り）
 */
export function generateOgpTags(input: OgpInput): string {
  const lines: string[] = [];

  if (input.title) {
    lines.push(generateMetaTag("og:title", input.title));
  }
  if (input.type) {
    lines.push(generateMetaTag("og:type", input.type));
  }
  if (input.url) {
    lines.push(generateMetaTag("og:url", input.url));
  }
  if (input.imageUrl) {
    lines.push(generateMetaTag("og:image", input.imageUrl));
  }
  if (input.description) {
    lines.push(generateMetaTag("og:description", input.description));
  }
  if (input.siteName) {
    lines.push(generateMetaTag("og:site_name", input.siteName));
  }
  if (input.locale) {
    lines.push(generateMetaTag("og:locale", input.locale));
  }

  if (input.enableTwitterCard) {
    if (lines.length > 0) lines.push("");
    lines.push(generateTwitterTag("twitter:card", input.twitterCard));
    if (input.title) {
      lines.push(generateTwitterTag("twitter:title", input.title));
    }
    if (input.description) {
      lines.push(generateTwitterTag("twitter:description", input.description));
    }
    if (input.imageUrl) {
      lines.push(generateTwitterTag("twitter:image", input.imageUrl));
    }
    if (input.twitterSite) {
      const site = input.twitterSite.startsWith("@")
        ? input.twitterSite
        : `@${input.twitterSite}`;
      lines.push(generateTwitterTag("twitter:site", site));
    }
    if (input.twitterCreator) {
      const creator = input.twitterCreator.startsWith("@")
        ? input.twitterCreator
        : `@${input.twitterCreator}`;
      lines.push(generateTwitterTag("twitter:creator", creator));
    }
  }

  return lines.join("\n");
}

/**
 * 入力値のバリデーション結果
 */
export interface ValidationResult {
  /** URL が有効かどうか */
  isUrlValid: boolean;
  /** 画像 URL が有効かどうか */
  isImageUrlValid: boolean;
  /** タイトルが長すぎるか（100文字以上を警告） */
  isTitleTooLong: boolean;
  /** 説明文が長すぎるか（300文字以上を警告） */
  isDescriptionTooLong: boolean;
}

/**
 * URL が有効かどうかをチェックする
 * @param url チェックする URL 文字列
 * @returns URL が有効かどうか
 */
export function isValidUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * OGP 入力データをバリデーションする
 * @param input OGP 入力データ
 * @returns バリデーション結果
 */
export function validateOgpInput(input: OgpInput): ValidationResult {
  return {
    isUrlValid: isValidUrl(input.url),
    isImageUrlValid: isValidUrl(input.imageUrl),
    isTitleTooLong: input.title.length > 100,
    isDescriptionTooLong: input.description.length > 300,
  };
}
