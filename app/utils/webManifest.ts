/**
 * @fileoverview Web App Manifest (PWA) ジェネレーターユーティリティ
 * manifest.json を生成するための型定義と関数群
 */

/**
 * Web App Manifest のディスプレイモード
 */
export type DisplayMode =
  | "standalone"
  | "fullscreen"
  | "minimal-ui"
  | "browser";

/**
 * Web App Manifest のオリエンテーション
 */
export type Orientation =
  | "any"
  | "natural"
  | "landscape"
  | "portrait"
  | "landscape-primary"
  | "landscape-secondary"
  | "portrait-primary"
  | "portrait-secondary";

/**
 * アイコンの用途
 */
export type IconPurpose = "any" | "maskable" | "monochrome";

/**
 * アイコン定義
 */
export interface ManifestIcon {
  /** ユニークID */
  id: string;
  /** 画像URL */
  src: string;
  /** サイズ（例: "192x192"） */
  sizes: string;
  /** MIMEタイプ（例: "image/png"） */
  type: string;
  /** 用途 */
  purpose: IconPurpose;
}

/**
 * スクリーンショット定義
 */
export interface ManifestScreenshot {
  /** ユニークID */
  id: string;
  /** 画像URL */
  src: string;
  /** サイズ（例: "1280x720"） */
  sizes: string;
  /** MIMEタイプ */
  type: string;
  /** フォームファクター */
  form_factor?: "narrow" | "wide";
  /** ラベル */
  label?: string;
}

/**
 * Web App Manifest の設定オプション
 */
export interface ManifestOptions {
  /** アプリ名 */
  name: string;
  /** 短い名前（ホーム画面表示用） */
  short_name: string;
  /** アプリの説明 */
  description: string;
  /** 開始 URL */
  start_url: string;
  /** スコープ */
  scope: string;
  /** ディスプレイモード */
  display: DisplayMode;
  /** オリエンテーション */
  orientation: Orientation;
  /** テーマカラー */
  theme_color: string;
  /** 背景色 */
  background_color: string;
  /** 言語 */
  lang: string;
  /** テキスト方向 */
  dir: "auto" | "ltr" | "rtl";
  /** カテゴリ */
  categories: string[];
  /** アイコンリスト */
  icons: ManifestIcon[];
  /** スクリーンショットリスト */
  screenshots: ManifestScreenshot[];
  /** 関連するネイティブアプリ */
  prefer_related_applications: boolean;
}

/**
 * デフォルトのマニフェストオプション
 */
export const DEFAULT_MANIFEST_OPTIONS: ManifestOptions = {
  name: "My App",
  short_name: "App",
  description: "",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "any",
  theme_color: "#ffffff",
  background_color: "#ffffff",
  lang: "ja",
  dir: "auto",
  categories: [],
  icons: [],
  screenshots: [],
  prefer_related_applications: false,
};

/**
 * ディスプレイモードの選択肢
 */
export const DISPLAY_MODES: { value: DisplayMode; label: string; description: string }[] = [
  { value: "standalone", label: "standalone", description: "ネイティブアプリ風（ブラウザUI非表示）" },
  { value: "fullscreen", label: "fullscreen", description: "全画面（ステータスバーも非表示）" },
  { value: "minimal-ui", label: "minimal-ui", description: "最小限のブラウザUI" },
  { value: "browser", label: "browser", description: "通常のブラウザ表示" },
];

/**
 * オリエンテーションの選択肢
 */
export const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: "any", label: "any（制限なし）" },
  { value: "natural", label: "natural（自然な向き）" },
  { value: "portrait", label: "portrait（縦向き）" },
  { value: "landscape", label: "landscape（横向き）" },
  { value: "portrait-primary", label: "portrait-primary" },
  { value: "portrait-secondary", label: "portrait-secondary" },
  { value: "landscape-primary", label: "landscape-primary" },
  { value: "landscape-secondary", label: "landscape-secondary" },
];

/**
 * 一般的なアイコンサイズ
 */
export const COMMON_ICON_SIZES = [
  "16x16",
  "32x32",
  "48x48",
  "72x72",
  "96x96",
  "128x128",
  "144x144",
  "152x152",
  "192x192",
  "384x384",
  "512x512",
];

/**
 * 一般的なアプリカテゴリ
 */
export const COMMON_CATEGORIES = [
  "books",
  "business",
  "education",
  "entertainment",
  "finance",
  "fitness",
  "food",
  "games",
  "government",
  "health",
  "kids",
  "lifestyle",
  "magazines",
  "medical",
  "music",
  "navigation",
  "news",
  "personalization",
  "photo",
  "politics",
  "productivity",
  "security",
  "shopping",
  "social",
  "sports",
  "travel",
  "utilities",
  "weather",
];

/**
 * ユニークIDを生成する
 * @returns ユニークID文字列
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * デフォルトアイコンセットを生成する
 * @returns アイコンリスト
 */
export function createDefaultIcons(): ManifestIcon[] {
  return [
    {
      id: generateId(),
      src: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      id: generateId(),
      src: "/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      id: generateId(),
      src: "/icons/icon-maskable-192x192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
  ];
}

/**
 * 色文字列を検証する
 * @param color - 検証する色文字列
 * @returns 有効な色かどうか
 */
export function isValidColor(color: string): boolean {
  if (!color) return false;
  // #RGB, #RRGGBB, #RRGGBBAA 形式を検証
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(color);
}

/**
 * URL文字列を検証する
 * @param url - 検証するURL文字列
 * @returns 有効なURLかどうか
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url, "https://example.com");
    return true;
  } catch {
    return false;
  }
}

/**
 * アイコンのMIMEタイプを拡張子から推定する
 * @param src - アイコンのURL/パス
 * @returns MIMEタイプ
 */
export function guessIconType(src: string): string {
  const ext = src.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",
  };
  return mimeMap[ext ?? ""] ?? "image/png";
}

/**
 * マニフェストオブジェクトを生成する（空フィールドを除く）
 * @param options - マニフェストオプション
 * @returns 生成されたマニフェストオブジェクト
 */
export function buildManifestObject(options: ManifestOptions): Record<string, unknown> {
  const manifest: Record<string, unknown> = {
    name: options.name,
    short_name: options.short_name,
    start_url: options.start_url,
    display: options.display,
    theme_color: options.theme_color,
    background_color: options.background_color,
  };

  if (options.description) {
    manifest.description = options.description;
  }

  if (options.scope && options.scope !== "/") {
    manifest.scope = options.scope;
  } else if (options.scope === "/") {
    manifest.scope = options.scope;
  }

  if (options.orientation !== "any") {
    manifest.orientation = options.orientation;
  }

  if (options.lang) {
    manifest.lang = options.lang;
  }

  if (options.dir !== "auto") {
    manifest.dir = options.dir;
  }

  if (options.categories.length > 0) {
    manifest.categories = options.categories;
  }

  if (options.icons.length > 0) {
    manifest.icons = options.icons.map(({ id: _id, ...icon }) => {
      const obj: Record<string, string> = {
        src: icon.src,
        sizes: icon.sizes,
        type: icon.type,
      };
      if (icon.purpose !== "any") {
        obj.purpose = icon.purpose;
      }
      return obj;
    });
  }

  if (options.screenshots.length > 0) {
    manifest.screenshots = options.screenshots.map(({ id: _id, ...ss }) => {
      const obj: Record<string, string | undefined> = {
        src: ss.src,
        sizes: ss.sizes,
        type: ss.type,
      };
      if (ss.form_factor) obj.form_factor = ss.form_factor;
      if (ss.label) obj.label = ss.label;
      return obj;
    });
  }

  if (options.prefer_related_applications) {
    manifest.prefer_related_applications = true;
  }

  return manifest;
}

/**
 * manifest.json の文字列を生成する
 * @param options - マニフェストオプション
 * @returns JSON文字列（インデント付き）
 */
export function generateManifestJson(options: ManifestOptions): string {
  const obj = buildManifestObject(options);
  return JSON.stringify(obj, null, 2);
}

/**
 * HTML link タグを生成する
 * @param options - マニフェストオプション
 * @returns HTML文字列
 */
export function generateLinkTag(options: ManifestOptions): string {
  const tags: string[] = [
    `<link rel="manifest" href="/manifest.json">`,
    `<meta name="theme-color" content="${options.theme_color}">`,
    `<meta name="apple-mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="default">`,
    `<meta name="apple-mobile-web-app-title" content="${options.short_name || options.name}">`,
  ];

  // Apple Touch Icon（最大サイズのアイコンを使用）
  const appleIcon = options.icons
    .filter((i) => i.type === "image/png" && i.purpose !== "maskable")
    .sort((a, b) => {
      const sizeA = parseInt(a.sizes.split("x")[0] ?? "0", 10);
      const sizeB = parseInt(b.sizes.split("x")[0] ?? "0", 10);
      return sizeB - sizeA;
    })[0];

  if (appleIcon) {
    tags.push(`<link rel="apple-touch-icon" href="${appleIcon.src}">`);
  }

  return tags.join("\n");
}
