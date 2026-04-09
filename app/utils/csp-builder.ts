/**
 * CSP（Content-Security-Policy）ビルダー・パーサーユーティリティ
 * W3C CSP Level 3 仕様準拠
 */

/**
 * CSP ディレクティブの定義情報
 */
export interface CspDirectiveInfo {
  /** ディレクティブ名 */
  name: string;
  /** 説明 */
  description: string;
  /** カテゴリ */
  category: "fetch" | "document" | "navigation" | "reporting" | "other";
  /** ソースリスト（値一覧）を取るかどうか */
  hasSourceList: boolean;
  /** 非推奨かどうか */
  deprecated?: boolean;
}

/**
 * CSP ソースの定義情報
 */
export interface CspSourceInfo {
  /** ソース値 */
  value: string;
  /** 説明 */
  description: string;
  /** セキュリティリスクあり */
  risky?: boolean;
}

/**
 * 有効化されたディレクティブの状態
 */
export interface CspDirectiveEntry {
  /** ディレクティブ名 */
  name: string;
  /** ソースリスト（hasSourceList=true の場合） */
  sources: string[];
  /** 有効かどうか */
  enabled: boolean;
}

/**
 * パース済み CSP
 */
export interface ParsedCsp {
  /** ディレクティブエントリの配列 */
  directives: CspDirectiveEntry[];
  /** パースエラー一覧 */
  errors: string[];
}

/**
 * 検証結果
 */
export interface CspValidationResult {
  /** 警告メッセージ一覧 */
  warnings: string[];
  /** 提案メッセージ一覧 */
  suggestions: string[];
}

/** Fetch ディレクティブ一覧 */
export const CSP_FETCH_DIRECTIVES: CspDirectiveInfo[] = [
  {
    name: "default-src",
    description: "すべてのリソースタイプのデフォルトポリシー（フォールバック）",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "script-src",
    description: "JavaScript のソースを制御（script タグ・eval など）",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "script-src-elem",
    description: "<script> 要素のソースを制御",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "script-src-attr",
    description: "インラインイベントハンドラーのソースを制御",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "style-src",
    description: "CSS スタイルシートのソースを制御",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "style-src-elem",
    description: '<style> 要素・<link rel="stylesheet"> のソースを制御',
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "style-src-attr",
    description: "インラインスタイル属性のソースを制御",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "img-src",
    description: "画像・ファビコンのソースを制御",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "font-src",
    description: "CSS @font-face で読み込むフォントのソースを制御",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "connect-src",
    description: "fetch・XHR・WebSocket・EventSource の接続先を制御",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "media-src",
    description: "<audio>・<video>・<track> のソースを制御",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "object-src",
    description: "<object>・<embed>・<applet> のソースを制御（Flash など）",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "frame-src",
    description: "<frame>・<iframe> のソースを制御",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "child-src",
    description:
      "Web Workers・<frame>/<iframe> のソースを制御（frame-src/worker-src のフォールバック）",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "worker-src",
    description: "Web Worker・SharedWorker・ServiceWorker のソースを制御",
    category: "fetch",
    hasSourceList: true,
  },
  {
    name: "manifest-src",
    description: "Web App Manifest のソースを制御",
    category: "fetch",
    hasSourceList: true,
  },
];

/** ドキュメント・ナビゲーションディレクティブ一覧 */
export const CSP_DOCUMENT_DIRECTIVES: CspDirectiveInfo[] = [
  {
    name: "base-uri",
    description: "<base> 要素の href に使える URL を制限",
    category: "document",
    hasSourceList: true,
  },
  {
    name: "sandbox",
    description: "iframe の sandbox 属性と同様の制限を適用",
    category: "document",
    hasSourceList: false,
  },
  {
    name: "form-action",
    description: "<form> の送信先 URL を制限",
    category: "navigation",
    hasSourceList: true,
  },
  {
    name: "frame-ancestors",
    description:
      "このページを <frame>/<iframe>/<embed> に埋め込める親オリジンを制限（X-Frame-Options の代替）",
    category: "navigation",
    hasSourceList: true,
  },
];

/** その他のディレクティブ一覧 */
export const CSP_OTHER_DIRECTIVES: CspDirectiveInfo[] = [
  {
    name: "upgrade-insecure-requests",
    description: "HTTP リソースを自動的に HTTPS にアップグレード（値不要）",
    category: "other",
    hasSourceList: false,
  },
  {
    name: "block-all-mixed-content",
    description: "HTTPS ページでの HTTP リソース読み込みをすべてブロック（値不要）",
    category: "other",
    hasSourceList: false,
  },
  {
    name: "report-uri",
    description: "違反レポートの送信先 URI（非推奨: report-to を使用推奨）",
    category: "reporting",
    hasSourceList: true,
    deprecated: true,
  },
  {
    name: "report-to",
    description: "違反レポートの送信先グループ名（Reporting API v1）",
    category: "reporting",
    hasSourceList: true,
  },
];

/** 全ディレクティブ一覧 */
export const ALL_CSP_DIRECTIVES: CspDirectiveInfo[] = [
  ...CSP_FETCH_DIRECTIVES,
  ...CSP_DOCUMENT_DIRECTIVES,
  ...CSP_OTHER_DIRECTIVES,
];

/** 定義済みソース一覧 */
export const CSP_COMMON_SOURCES: CspSourceInfo[] = [
  { value: "'none'", description: "すべてのソースをブロック" },
  { value: "'self'", description: "同一オリジンのみ許可" },
  { value: "'unsafe-inline'", description: "インラインコード（style/script）を許可", risky: true },
  { value: "'unsafe-eval'", description: "eval() などの動的コード実行を許可", risky: true },
  {
    value: "'strict-dynamic'",
    description: "信頼されたスクリプトが動的に追加するスクリプトを許可（nonce/hash 使用時）",
  },
  {
    value: "'unsafe-hashes'",
    description: "インラインイベントハンドラーのハッシュを許可",
    risky: true,
  },
  { value: "https:", description: "任意の HTTPS オリジンを許可" },
  { value: "http:", description: "任意の HTTP オリジンを許可（非推奨）", risky: true },
  { value: "data:", description: "data: URI を許可" },
  { value: "blob:", description: "blob: URI を許可" },
  { value: "filesystem:", description: "filesystem: URI を許可" },
  { value: "mediastream:", description: "mediastream: URI を許可" },
  { value: "*", description: "任意のオリジンを許可（nonce 不要の HTTPS/HTTP 全域）", risky: true },
];

/**
 * ディレクティブ名からディレクティブ情報を取得する
 * @param name ディレクティブ名
 * @returns ディレクティブ情報（見つからない場合は undefined）
 */
export function findDirectiveInfo(name: string): CspDirectiveInfo | undefined {
  return ALL_CSP_DIRECTIVES.find((d) => d.name === name.toLowerCase().trim());
}

/**
 * CSP ヘッダー文字列をパースする
 * @param headerValue CSP ヘッダー値（例: "default-src 'self'; script-src 'self' https://cdn.example.com"）
 * @returns パース済み CSP オブジェクト
 */
export function parseCsp(headerValue: string): ParsedCsp {
  const directives: CspDirectiveEntry[] = [];
  const errors: string[] = [];

  if (!headerValue.trim()) {
    return { directives, errors };
  }

  // セミコロンで区切りディレクティブに分割
  const parts = headerValue
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);

  const seen = new Set<string>();

  for (const part of parts) {
    const tokens = part.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    const name = tokens[0].toLowerCase();
    const sources = tokens.slice(1);

    if (seen.has(name)) {
      errors.push(`ディレクティブ "${name}" が重複しています。最初の定義のみ有効です。`);
      continue;
    }
    seen.add(name);

    directives.push({ name, sources, enabled: true });
  }

  return { directives, errors };
}

/**
 * ディレクティブエントリの配列から CSP ヘッダー値を生成する
 * @param directives ディレクティブエントリの配列
 * @returns CSP ヘッダー値文字列
 */
export function buildCsp(directives: CspDirectiveEntry[]): string {
  const parts: string[] = [];

  for (const entry of directives) {
    if (!entry.enabled) continue;
    if (!entry.name.trim()) continue;

    const info = findDirectiveInfo(entry.name);
    if (info && !info.hasSourceList) {
      // 値なしディレクティブ（upgrade-insecure-requests など）
      parts.push(entry.name);
    } else {
      const sources = entry.sources.filter((s) => s.trim());
      if (sources.length === 0) continue;
      parts.push(`${entry.name} ${sources.join(" ")}`);
    }
  }

  return parts.join("; ");
}

/**
 * CSP ディレクティブエントリを検証し警告・提案を返す
 * @param directives ディレクティブエントリの配列
 * @returns 検証結果
 */
export function validateCsp(directives: CspDirectiveEntry[]): CspValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const enabled = directives.filter((d) => d.enabled);
  const names = new Set(enabled.map((d) => d.name));

  // default-src の欠如チェック
  if (!names.has("default-src")) {
    suggestions.push(
      "'default-src' を設定することを推奨します。設定がない場合、他のディレクティブで明示されていないリソースはすべて許可されます。",
    );
  }

  for (const entry of enabled) {
    const sources = entry.sources;

    // unsafe-inline / unsafe-eval の警告
    if (sources.includes("'unsafe-inline'")) {
      warnings.push(
        `"${entry.name}": 'unsafe-inline' はインジェクション攻撃のリスクを高めます。nonce や hash ベースのアプローチを検討してください。`,
      );
    }
    if (sources.includes("'unsafe-eval'")) {
      warnings.push(
        `"${entry.name}": 'unsafe-eval' は XSS リスクを高めます。動的なコード評価を避けるよう設計の見直しを検討してください。`,
      );
    }

    // ワイルドカードの警告
    if (sources.includes("*")) {
      warnings.push(
        `"${entry.name}": ワイルドカード '*' は任意のオリジンを許可します。必要なオリジンを明示的に列挙することを推奨します。`,
      );
    }

    // http: スキームの警告
    if (sources.includes("http:")) {
      warnings.push(
        `"${entry.name}": 'http:' スキームは中間者攻撃のリスクがあります。'https:' の使用を推奨します。`,
      );
    }

    // object-src の推奨
    if (entry.name === "script-src" && !names.has("object-src")) {
      suggestions.push(
        "'object-src' を設定することを推奨します（Flash などのプラグインの XSS を防ぐため）。不要な場合は 'none' を設定してください。",
      );
    }

    // base-uri の推奨
    if (entry.name === "default-src" && !names.has("base-uri")) {
      suggestions.push(
        "'base-uri' を設定することで、<base> 要素を使ったリダイレクト攻撃を防げます。",
      );
    }

    // report-uri 非推奨警告
    if (entry.name === "report-uri") {
      warnings.push(
        "'report-uri' は非推奨です。代わりに 'report-to' ディレクティブと Reporting API の使用を推奨します。",
      );
    }

    // frame-ancestors と X-Frame-Options の関係
    if (entry.name === "frame-ancestors") {
      suggestions.push(
        "'frame-ancestors' は CSP Level 2 以降で X-Frame-Options の上位互換です。古いブラウザ向けに X-Frame-Options ヘッダーの併用を検討してください。",
      );
    }
  }

  return { warnings, suggestions };
}

/**
 * CSP ヘッダー文字列を整形（1ディレクティブ1行）する
 * @param headerValue CSP ヘッダー値
 * @returns 整形済み文字列（インデント付き複数行）
 */
export function formatCspMultiline(headerValue: string): string {
  const { directives } = parseCsp(headerValue);
  if (directives.length === 0) return headerValue;
  return directives
    .filter((d) => d.enabled)
    .map((d) => {
      if (d.sources.length === 0) return d.name + ";";
      return `${d.name} ${d.sources.join(" ")};`;
    })
    .join("\n");
}

/**
 * デフォルトのセキュアな CSP ポリシーを返す
 * @returns デフォルトポリシーのディレクティブエントリ
 */
export function getDefaultPolicy(): CspDirectiveEntry[] {
  return [
    { name: "default-src", sources: ["'self'"], enabled: true },
    { name: "script-src", sources: ["'self'"], enabled: true },
    { name: "style-src", sources: ["'self'"], enabled: true },
    { name: "img-src", sources: ["'self'", "data:"], enabled: true },
    { name: "font-src", sources: ["'self'"], enabled: true },
    { name: "connect-src", sources: ["'self'"], enabled: true },
    { name: "object-src", sources: ["'none'"], enabled: true },
    { name: "base-uri", sources: ["'self'"], enabled: true },
    { name: "form-action", sources: ["'self'"], enabled: true },
    { name: "frame-ancestors", sources: ["'none'"], enabled: true },
    { name: "upgrade-insecure-requests", sources: [], enabled: true },
  ];
}

/**
 * 厳格な CSP ポリシー（nonce ベース）のテンプレートを返す
 * @returns 厳格ポリシーのディレクティブエントリ
 */
export function getStrictPolicy(): CspDirectiveEntry[] {
  return [
    { name: "default-src", sources: ["'none'"], enabled: true },
    {
      name: "script-src",
      sources: ["'strict-dynamic'", "'nonce-REPLACE_WITH_NONCE'", "'unsafe-inline'", "https:"],
      enabled: true,
    },
    { name: "style-src", sources: ["'self'", "'unsafe-inline'"], enabled: true },
    { name: "img-src", sources: ["'self'", "data:", "https:"], enabled: true },
    { name: "font-src", sources: ["'self'"], enabled: true },
    { name: "connect-src", sources: ["'self'"], enabled: true },
    { name: "object-src", sources: ["'none'"], enabled: true },
    { name: "base-uri", sources: ["'self'"], enabled: true },
    { name: "form-action", sources: ["'self'"], enabled: true },
    { name: "frame-ancestors", sources: ["'none'"], enabled: true },
    { name: "upgrade-insecure-requests", sources: [], enabled: true },
  ];
}
