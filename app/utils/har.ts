/**
 * HAR (HTTP Archive) ファイル解析ユーティリティ
 * HARファイルのパース・統計計算・フォーマット変換を提供する
 */

// ===== HAR フォーマット型定義 =====

/** タイミング情報 */
export interface HarTimings {
  /** 送信時間（ms） */
  send: number;
  /** 待機時間（ms） */
  wait: number;
  /** 受信時間（ms） */
  receive: number;
  /** DNS解決時間（ms） */
  dns?: number;
  /** 接続時間（ms） */
  connect?: number;
  /** SSL時間（ms） */
  ssl?: number;
  /** ブロック時間（ms） */
  blocked?: number;
}

/** レスポンスコンテンツ情報 */
export interface HarContent {
  /** コンテンツサイズ（バイト） */
  size: number;
  /** MIMEタイプ */
  mimeType: string;
  /** テキストコンテンツ */
  text?: string;
  /** エンコード方式 */
  encoding?: string;
}

/** HTTPレスポンス情報 */
export interface HarResponse {
  /** HTTPステータスコード */
  status: number;
  /** ステータステキスト */
  statusText: string;
  /** レスポンスヘッダー */
  headers: { name: string; value: string }[];
  /** レスポンスコンテンツ */
  content: HarContent;
  /** リダイレクトURL */
  redirectURL: string;
  /** ヘッダーサイズ（バイト） */
  headersSize: number;
  /** ボディサイズ（バイト） */
  bodySize: number;
}

/** HTTPリクエスト情報 */
export interface HarRequest {
  /** HTTPメソッド */
  method: string;
  /** リクエストURL */
  url: string;
  /** リクエストヘッダー */
  headers: { name: string; value: string }[];
  /** クエリ文字列パラメーター */
  queryString: { name: string; value: string }[];
  /** POSTデータ */
  postData?: { mimeType: string; text: string };
  /** ヘッダーサイズ（バイト） */
  headersSize: number;
  /** ボディサイズ（バイト） */
  bodySize: number;
}

/** HARエントリー（1リクエスト分） */
export interface HarEntry {
  /** 開始日時 (ISO 8601) */
  startedDateTime: string;
  /** 合計時間（ms） */
  time: number;
  /** リクエスト情報 */
  request: HarRequest;
  /** レスポンス情報 */
  response: HarResponse;
  /** タイミング詳細 */
  timings: HarTimings;
}

/** HARログ本体 */
export interface HarLog {
  /** HARバージョン */
  version: string;
  /** 作成ツール情報 */
  creator: { name: string; version: string };
  /** エントリー一覧 */
  entries: HarEntry[];
}

/** HARファイル全体 */
export interface HarFile {
  /** ログデータ */
  log: HarLog;
}

/** HAR解析結果サマリー */
export interface HarAnalysis {
  /** 総リクエスト数 */
  totalRequests: number;
  /** 総コンテンツサイズ（バイト） */
  totalSize: number;
  /** 総転送サイズ（バイト） */
  totalTransferSize: number;
  /** 総時間（ms） */
  totalTime: number;
  /** エラー数（4xx + 5xx） */
  errorCount: number;
  /** 最も時間のかかったエントリー */
  slowestEntry: HarEntry | null;
  /** 最も大きなエントリー */
  largestEntry: HarEntry | null;
  /** コンテンツタイプ別分布 */
  contentTypeDistribution: Record<string, number>;
  /** ステータス別分布 */
  statusDistribution: Record<string, number>;
}

// ===== ユーティリティ関数 =====

/**
 * HARファイルのJSONテキストをパースする
 * @param text - HARファイルのJSON文字列
 * @returns パース済みHarFileオブジェクト
 * @throws JSONパースエラーまたは構造が無効な場合にエラーをスロー
 */
export function parseHar(text: string): HarFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("無効なJSONです。HARファイルを確認してください。");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("log" in parsed) ||
    typeof (parsed as { log: unknown }).log !== "object" ||
    (parsed as { log: unknown }).log === null ||
    !("entries" in (parsed as { log: object }).log) ||
    !Array.isArray((parsed as { log: { entries: unknown } }).log.entries)
  ) {
    throw new Error("無効なHARフォーマットです。log.entriesが見つかりません。");
  }

  return parsed as HarFile;
}

/**
 * バイト数を人間が読みやすい文字列にフォーマットする
 * @param bytes - バイト数
 * @returns フォーマット済み文字列（例: "1.5 KB", "2.3 MB"）
 */
export function formatBytes(bytes: number): string {
  if (bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * ミリ秒を人間が読みやすい文字列にフォーマットする
 * @param ms - ミリ秒
 * @returns フォーマット済み文字列（例: "150ms", "1.5s"）
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * HTTPステータスコードのカテゴリを返す
 * @param status - HTTPステータスコード
 * @returns ステータスカテゴリ文字列
 */
export function getStatusCategory(
  status: number,
): "success" | "redirect" | "client-error" | "server-error" | "other" {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "redirect";
  if (status >= 400 && status < 500) return "client-error";
  if (status >= 500 && status < 600) return "server-error";
  return "other";
}

/**
 * MIMEタイプから短いラベル文字列を返す
 * @param mimeType - MIMEタイプ文字列（例: "application/json"）
 * @returns 短いラベル（例: "JSON", "HTML", "JS"）
 */
export function getContentTypeLabel(mimeType: string): string {
  const lower = mimeType.toLowerCase().split(";")[0].trim();

  if (lower.includes("json")) return "JSON";
  if (lower.includes("html")) return "HTML";
  if (lower === "application/javascript" || lower === "text/javascript") return "JS";
  if (lower.includes("javascript")) return "JS";
  if (lower === "text/css") return "CSS";
  if (lower.startsWith("image/")) return "Image";
  if (lower.includes("xml")) return "XML";
  if (lower === "text/plain") return "Text";
  if (lower.includes("font")) return "Font";
  if (lower.includes("wasm")) return "WASM";
  if (lower.startsWith("video/")) return "Video";
  if (lower.startsWith("audio/")) return "Audio";
  return "Other";
}

/**
 * HARファイルを解析してサマリー統計を返す
 * @param har - 解析対象のHarFileオブジェクト
 * @returns 解析結果のHarAnalysisオブジェクト
 */
export function analyzeHar(har: HarFile): HarAnalysis {
  const entries = har.log.entries;

  if (entries.length === 0) {
    return {
      totalRequests: 0,
      totalSize: 0,
      totalTransferSize: 0,
      totalTime: 0,
      errorCount: 0,
      slowestEntry: null,
      largestEntry: null,
      contentTypeDistribution: {},
      statusDistribution: {},
    };
  }

  let totalSize = 0;
  let totalTransferSize = 0;
  let totalTime = 0;
  let errorCount = 0;
  let slowestEntry: HarEntry | null = null;
  let largestEntry: HarEntry | null = null;
  const contentTypeDistribution: Record<string, number> = {};
  const statusDistribution: Record<string, number> = {};

  for (const entry of entries) {
    const time = entry.time ?? 0;
    const contentSize = entry.response.content.size ?? 0;
    const headersSize = entry.response.headersSize >= 0 ? entry.response.headersSize : 0;
    const bodySize = entry.response.bodySize >= 0 ? entry.response.bodySize : 0;
    const transferSize = headersSize + bodySize;

    totalTime += time;
    totalSize += contentSize;
    totalTransferSize += transferSize;

    // エラーカウント
    const status = entry.response.status;
    if (status >= 400) {
      errorCount++;
    }

    // 最も遅いエントリー
    if (slowestEntry === null || time > slowestEntry.time) {
      slowestEntry = entry;
    }

    // 最も大きなエントリー
    if (largestEntry === null || contentSize > (largestEntry.response.content.size ?? 0)) {
      largestEntry = entry;
    }

    // コンテンツタイプ別分布
    const mimeType = entry.response.content.mimeType ?? "";
    const label = getContentTypeLabel(mimeType);
    contentTypeDistribution[label] = (contentTypeDistribution[label] ?? 0) + 1;

    // ステータス別分布
    const statusGroup = `${Math.floor(status / 100)}xx`;
    statusDistribution[statusGroup] = (statusDistribution[statusGroup] ?? 0) + 1;
  }

  return {
    totalRequests: entries.length,
    totalSize,
    totalTransferSize,
    totalTime,
    errorCount,
    slowestEntry,
    largestEntry,
    contentTypeDistribution,
    statusDistribution,
  };
}
