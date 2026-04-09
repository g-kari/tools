/**
 * @fileoverview Sitemap XML生成・解析ユーティリティ
 * XMLサイトマップ（sitemap.xml）を生成する関数群
 */

/** 変更頻度の選択肢 */
export type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

/**
 * サイトマップのURLエントリ
 */
export interface SitemapEntry {
  /** ページURL（必須） */
  loc: string;
  /** 最終更新日（ISO 8601形式 YYYY-MM-DD） */
  lastmod?: string;
  /** 変更頻度 */
  changefreq?: ChangeFreq;
  /** 優先度（0.0〜1.0） */
  priority?: number;
}

/**
 * URLが有効か検証する
 *
 * @param url - 検証するURL文字列
 * @returns 有効なURLであれば true
 *
 * @example
 * isValidSitemapUrl("https://example.com") // => true
 * isValidSitemapUrl("example.com") // => false
 */
export function isValidSitemapUrl(url: string): boolean {
  if (!url || url.trim() === "") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 優先度値が有効か検証する（0.0〜1.0）
 *
 * @param priority - 検証する優先度
 * @returns 有効であれば true
 */
export function isValidPriority(priority: number): boolean {
  return priority >= 0.0 && priority <= 1.0;
}

/**
 * 日付文字列を YYYY-MM-DD 形式に正規化する
 *
 * @param date - 日付文字列
 * @returns YYYY-MM-DD 形式の文字列、または空文字列
 */
export function normalizeDate(date: string): string {
  if (!date || date.trim() === "") return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * 文字列をXMLエスケープする
 *
 * @param str - エスケープする文字列
 * @returns XMLエスケープ済み文字列
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * サイトマップXMLを生成する
 *
 * @param entries - URLエントリの配列
 * @returns サイトマップXML文字列
 *
 * @example
 * generateSitemapXml([{ loc: "https://example.com/", priority: 1.0 }])
 * // => '<?xml version="1.0" encoding="UTF-8"?>\n<urlset ...>...</urlset>'
 */
export function generateSitemapXml(entries: SitemapEntry[]): string {
  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const entry of entries) {
    if (!entry.loc || !isValidSitemapUrl(entry.loc)) continue;

    xmlLines.push("  <url>");
    xmlLines.push(`    <loc>${escapeXml(entry.loc)}</loc>`);

    if (entry.lastmod) {
      const normalized = normalizeDate(entry.lastmod);
      if (normalized) {
        xmlLines.push(`    <lastmod>${normalized}</lastmod>`);
      }
    }

    if (entry.changefreq) {
      xmlLines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    }

    if (entry.priority !== undefined && isValidPriority(entry.priority)) {
      xmlLines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
    }

    xmlLines.push("  </url>");
  }

  xmlLines.push("</urlset>");
  return xmlLines.join("\n");
}

/**
 * 優先度の表示文字列を返す（0.0〜1.0 → 小数点1桁）
 *
 * @param value - 優先度値
 * @returns 表示用文字列
 */
export function formatPriority(value: number): string {
  return value.toFixed(1);
}

/** 変更頻度の表示ラベル */
export const CHANGEFREQ_LABELS: Record<ChangeFreq, string> = {
  always: "常時 (always)",
  hourly: "毎時 (hourly)",
  daily: "毎日 (daily)",
  weekly: "毎週 (weekly)",
  monthly: "毎月 (monthly)",
  yearly: "毎年 (yearly)",
  never: "変更なし (never)",
};

/** 変更頻度の選択肢リスト */
export const CHANGEFREQ_OPTIONS: ChangeFreq[] = [
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
];
