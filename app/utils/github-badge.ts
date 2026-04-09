/**
 * GitHubバッジジェネレーターユーティリティ
 * shields.io を使用してバッジURLを生成する
 */

/** バッジのスタイル */
export type BadgeStyle = "flat" | "flat-square" | "plastic" | "for-the-badge" | "social";

/** バッジの設定 */
export interface BadgeConfig {
  /** 左側のラベルテキスト（空文字可） */
  label: string;
  /** 右側のメッセージテキスト */
  message: string;
  /** 右側の背景色（色名またはHEXコード。例: brightgreen, ff0000） */
  color: string;
  /** 左側の背景色（省略可） */
  labelColor?: string;
  /** バッジのスタイル */
  style: BadgeStyle;
  /** Simple Icons のロゴ名（省略可） */
  logo?: string;
  /** ロゴの色（省略可） */
  logoColor?: string;
}

/** バッジスタイルの選択肢 */
export const BADGE_STYLES: { value: BadgeStyle; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "flat-square", label: "Flat Square" },
  { value: "plastic", label: "Plastic" },
  { value: "for-the-badge", label: "For the Badge" },
  { value: "social", label: "Social" },
];

/** よく使うバッジの色 */
export const BADGE_COLORS: { value: string; label: string; hex: string }[] = [
  { value: "brightgreen", label: "明るい緑", hex: "#4c1" },
  { value: "green", label: "緑", hex: "#97ca00" },
  { value: "yellowgreen", label: "黄緑", hex: "#a4a61d" },
  { value: "yellow", label: "黄", hex: "#dfb317" },
  { value: "orange", label: "オレンジ", hex: "#fe7d37" },
  { value: "red", label: "赤", hex: "#e05d44" },
  { value: "blue", label: "青", hex: "#007ec6" },
  { value: "lightgrey", label: "薄灰", hex: "#9f9f9f" },
  { value: "success", label: "success", hex: "#4c1" },
  { value: "important", label: "important", hex: "#fe7d37" },
  { value: "critical", label: "critical", hex: "#e05d44" },
  { value: "informational", label: "informational", hex: "#007ec6" },
  { value: "inactive", label: "inactive", hex: "#9f9f9f" },
];

/** よく使うロゴ */
export const POPULAR_LOGOS: { value: string; label: string }[] = [
  { value: "", label: "なし" },
  { value: "github", label: "GitHub" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "react", label: "React" },
  { value: "vue.js", label: "Vue.js" },
  { value: "node.js", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "go", label: "Go" },
  { value: "docker", label: "Docker" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "linux", label: "Linux" },
  { value: "npm", label: "npm" },
  { value: "vercel", label: "Vercel" },
  { value: "cloudflare", label: "Cloudflare" },
  { value: "visualstudiocode", label: "VS Code" },
];

/** shields.io のベースURL */
const SHIELDS_BASE = "https://img.shields.io/badge";

/**
 * バッジテキストをURLセーフな形式にエンコードする
 * shields.io の仕様に従い、スペースを_に、その他を%エンコードする
 * @param text エンコードするテキスト
 * @returns エンコード済みテキスト
 */
export function encodeBadgeText(text: string): string {
  // shields.io の仕様: _ → __ (先にエスケープ), - → --, スペース → _
  return encodeURIComponent(text.replace(/_/g, "__").replace(/-/g, "--").replace(/ /g, "_"));
}

/**
 * shields.io バッジのURLを生成する
 * @param config バッジの設定
 * @returns shields.io バッジ画像URL
 */
export function generateBadgeUrl(config: BadgeConfig): string {
  const { label, message, color, labelColor, style, logo, logoColor } = config;

  if (!message.trim()) return "";

  const encodedLabel = encodeBadgeText(label);
  const encodedMessage = encodeBadgeText(message);
  const encodedColor = encodeURIComponent(color || "blue");

  const path = label
    ? `${encodedLabel}-${encodedMessage}-${encodedColor}`
    : `${encodedMessage}-${encodedColor}`;

  const params = new URLSearchParams();
  if (style && style !== "flat") params.set("style", style);
  if (labelColor) params.set("labelColor", labelColor);
  if (logo) params.set("logo", logo);
  if (logoColor) params.set("logoColor", logoColor);

  const query = params.toString();
  return query ? `${SHIELDS_BASE}/${path}?${query}` : `${SHIELDS_BASE}/${path}`;
}

/**
 * バッジのMarkdown記法を生成する
 * @param config バッジの設定
 * @param linkUrl クリック時のリンク先URL（省略可）
 * @returns Markdown文字列
 */
export function generateBadgeMarkdown(config: BadgeConfig, linkUrl?: string): string {
  const imageUrl = generateBadgeUrl(config);
  if (!imageUrl) return "";

  const altText = config.label ? `${config.label}: ${config.message}` : config.message;
  const imgMarkdown = `![${altText}](${imageUrl})`;
  return linkUrl ? `[${imgMarkdown}](${linkUrl})` : imgMarkdown;
}

/**
 * バッジのHTML記法を生成する
 * @param config バッジの設定
 * @param linkUrl クリック時のリンク先URL（省略可）
 * @returns HTML文字列
 */
export function generateBadgeHtml(config: BadgeConfig, linkUrl?: string): string {
  const imageUrl = generateBadgeUrl(config);
  if (!imageUrl) return "";

  const altText = config.label ? `${config.label}: ${config.message}` : config.message;
  const imgTag = `<img src="${imageUrl}" alt="${altText}">`;
  return linkUrl ? `<a href="${linkUrl}">${imgTag}</a>` : imgTag;
}
