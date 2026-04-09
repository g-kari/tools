/**
 * メールヘッダー解析ユーティリティ
 * 生のメールヘッダーをパースして構造化データに変換します
 */

/** 解析されたヘッダーエントリ */
export interface ParsedHeader {
  /** ヘッダー名 */
  name: string;
  /** ヘッダー値 */
  value: string;
}

/** Received ヘッダーの構造化情報 */
export interface ReceivedHop {
  /** 送信元 */
  from: string;
  /** 経由先 */
  by: string;
  /** プロトコル */
  with: string;
  /** タイムスタンプ */
  date: string;
  /** 遅延（ミリ秒）前のホップとの差 */
  delayMs: number | null;
  /** 生のReceived値 */
  raw: string;
}

/** 認証結果 */
export interface AuthResult {
  /** SPF結果 */
  spf: AuthStatus;
  /** DKIM結果 */
  dkim: AuthStatus;
  /** DMARC結果 */
  dmarc: AuthStatus;
  /** ARC結果 */
  arc: AuthStatus;
  /** 生のAuthentication-Results値 */
  raw: string;
}

/** 認証ステータス */
export type AuthStatus =
  | "pass"
  | "fail"
  | "softfail"
  | "neutral"
  | "none"
  | "unknown"
  | "permerror"
  | "temperror";

/** スパム情報 */
export interface SpamInfo {
  /** X-Spam-Status値 */
  status: string | null;
  /** スパムスコア */
  score: number | null;
  /** 閾値 */
  threshold: number | null;
  /** スパム判定フラグ */
  isSpam: boolean;
  /** 適用されたテスト一覧 */
  tests: string[];
}

/** 解析結果全体 */
export interface EmailHeaderAnalysis {
  /** 全ヘッダー一覧（出現順） */
  headers: ParsedHeader[];
  /** メール経路（Receivedヘッダー） */
  receivedHops: ReceivedHop[];
  /** 認証結果 */
  auth: AuthResult | null;
  /** スパム情報 */
  spam: SpamInfo;
  /** 主要ヘッダーのサマリー */
  summary: EmailSummary;
  /** 総配信時間（ミリ秒） */
  totalDeliveryMs: number | null;
}

/** 主要ヘッダーのサマリー */
export interface EmailSummary {
  from: string;
  to: string;
  subject: string;
  date: string;
  messageId: string;
  replyTo: string;
  contentType: string;
  xMailer: string;
  returnPath: string;
  mimeVersion: string;
}

/**
 * 生のメールヘッダー文字列をパースしてヘッダー配列に変換します
 * RFC 2822 に準拠した折り畳みヘッダー（folded headers）に対応
 *
 * @param rawHeaders - 生のメールヘッダー文字列
 * @returns パース済みヘッダー配列
 */
export function parseRawHeaders(rawHeaders: string): ParsedHeader[] {
  const headers: ParsedHeader[] = [];
  // 改行の正規化
  const normalized = rawHeaders.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // 折り畳みヘッダーを展開（行頭がスペース/タブの行は前の行の続き）
  const unfolded = normalized.replace(/\n[ \t]+/g, " ");
  const lines = unfolded.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx <= 0) continue;
    const name = line.substring(0, colonIdx).trim();
    const value = line.substring(colonIdx + 1).trim();
    if (name && value !== undefined) {
      headers.push({ name, value });
    }
  }
  return headers;
}

/**
 * Received ヘッダーを解析して経路情報を抽出します
 *
 * @param headers - パース済みヘッダー配列
 * @returns 経路情報配列（新しい順）
 */
export function parseReceivedHops(headers: ParsedHeader[]): ReceivedHop[] {
  const receivedHeaders = headers
    .filter((h) => h.name.toLowerCase() === "received")
    .map((h) => h.value);

  const hops: ReceivedHop[] = receivedHeaders.map((raw) => {
    const fromMatch = raw.match(/from\s+([^\s;]+(?:\s+\([^)]*\))?)/i);
    const byMatch = raw.match(/by\s+([^\s;]+(?:\s+\([^)]*\))?)/i);
    const withMatch = raw.match(/with\s+([^\s;]+)/i);
    const dateMatch = raw.match(/;\s*(.+)$/i);

    return {
      from: fromMatch ? fromMatch[1].trim() : "",
      by: byMatch ? byMatch[1].trim() : "",
      with: withMatch ? withMatch[1].trim() : "",
      date: dateMatch ? dateMatch[1].trim() : "",
      delayMs: null,
      raw,
    };
  });

  // 遅延計算（日付が解析できる場合）
  for (let i = 0; i < hops.length - 1; i++) {
    const current = new Date(hops[i].date).getTime();
    const next = new Date(hops[i + 1].date).getTime();
    if (!isNaN(current) && !isNaN(next)) {
      hops[i].delayMs = current - next;
    }
  }

  return hops;
}

/**
 * Authentication-Results ヘッダーを解析して認証情報を抽出します
 *
 * @param headers - パース済みヘッダー配列
 * @returns 認証結果、ヘッダーが存在しない場合は null
 */
export function parseAuthResults(headers: ParsedHeader[]): AuthResult | null {
  const authHeader = headers.find(
    (h) =>
      h.name.toLowerCase() === "authentication-results" ||
      h.name.toLowerCase() === "arc-authentication-results",
  );
  if (!authHeader) return null;

  const raw = authHeader.value;

  const extractStatus = (protocol: string): AuthStatus => {
    const escapedProtocol = protocol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`${escapedProtocol}\\s*=\\s*([\\w]+)`, "i");
    const match = raw.match(regex);
    if (!match) return "none";
    const val = match[1].toLowerCase();
    const valid: AuthStatus[] = [
      "pass",
      "fail",
      "softfail",
      "neutral",
      "none",
      "permerror",
      "temperror",
    ];
    return valid.includes(val as AuthStatus) ? (val as AuthStatus) : "unknown";
  };

  return {
    spf: extractStatus("spf"),
    dkim: extractStatus("dkim"),
    dmarc: extractStatus("dmarc"),
    arc: extractStatus("arc"),
    raw,
  };
}

/**
 * X-Spam-Status / X-Spam-Score ヘッダーを解析してスパム情報を抽出します
 *
 * @param headers - パース済みヘッダー配列
 * @returns スパム情報
 */
export function parseSpamInfo(headers: ParsedHeader[]): SpamInfo {
  const statusHeader = headers.find((h) => h.name.toLowerCase() === "x-spam-status");
  const scoreHeader = headers.find((h) => h.name.toLowerCase() === "x-spam-score");

  if (!statusHeader && !scoreHeader) {
    return { status: null, score: null, threshold: null, isSpam: false, tests: [] };
  }

  const raw = statusHeader?.value ?? "";
  const isSpam = /^yes\b/i.test(raw);

  // score=X.XX
  const scoreMatch = raw.match(/score=(-?\d+(?:\.\d+)?)/i);
  const score = scoreMatch
    ? parseFloat(scoreMatch[1])
    : scoreHeader
      ? parseFloat(scoreHeader.value)
      : null;

  // required=X.XX
  const thresholdMatch = raw.match(/required=(-?\d+(?:\.\d+)?)/i);
  const threshold = thresholdMatch ? parseFloat(thresholdMatch[1]) : null;

  // tests=TEST1,TEST2,...
  const testsMatch = raw.match(/tests=([^\s]+)/i);
  const tests = testsMatch ? testsMatch[1].split(",").filter(Boolean) : [];

  return {
    status: raw || null,
    score: isNaN(score as number) ? null : score,
    threshold,
    isSpam,
    tests,
  };
}

/**
 * 主要ヘッダーからサマリー情報を抽出します
 *
 * @param headers - パース済みヘッダー配列
 * @returns サマリー情報
 */
export function extractSummary(headers: ParsedHeader[]): EmailSummary {
  const get = (name: string): string =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  return {
    from: get("From"),
    to: get("To"),
    subject: get("Subject"),
    date: get("Date"),
    messageId: get("Message-ID"),
    replyTo: get("Reply-To"),
    contentType: get("Content-Type"),
    xMailer: get("X-Mailer"),
    returnPath: get("Return-Path"),
    mimeVersion: get("MIME-Version"),
  };
}

/**
 * 総配信時間を計算します
 *
 * @param hops - 経路情報配列
 * @param dateHeader - Dateヘッダーの値
 * @returns 総配信時間（ミリ秒）、計算不能な場合は null
 */
export function calcTotalDeliveryMs(hops: ReceivedHop[], dateHeader: string): number | null {
  if (hops.length === 0) return null;

  const lastHopDate = new Date(hops[hops.length - 1].date).getTime();
  const firstHopDate = new Date(hops[0].date).getTime();
  const sentDate = new Date(dateHeader).getTime();

  if (!isNaN(firstHopDate) && !isNaN(sentDate)) {
    const diff = firstHopDate - sentDate;
    if (diff >= 0) return diff;
  }
  if (!isNaN(firstHopDate) && !isNaN(lastHopDate)) {
    const diff = firstHopDate - lastHopDate;
    if (diff >= 0) return diff;
  }
  return null;
}

/**
 * 生のメールヘッダー文字列を総合解析します
 *
 * @param rawHeaders - 生のメールヘッダー文字列
 * @returns 解析結果
 */
export function analyzeEmailHeaders(rawHeaders: string): EmailHeaderAnalysis {
  const headers = parseRawHeaders(rawHeaders);
  const receivedHops = parseReceivedHops(headers);
  const auth = parseAuthResults(headers);
  const spam = parseSpamInfo(headers);
  const summary = extractSummary(headers);
  const totalDeliveryMs = calcTotalDeliveryMs(receivedHops, summary.date);

  return { headers, receivedHops, auth, spam, summary, totalDeliveryMs };
}

/**
 * 配信時間を人間が読みやすい文字列に変換します
 *
 * @param ms - ミリ秒
 * @returns フォーマット済み文字列
 */
export function formatDeliveryTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}秒`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}分`;
  return `${(ms / 3600000).toFixed(1)}時間`;
}

/**
 * 認証ステータスに対応する色クラスを返します
 *
 * @param status - 認証ステータス
 * @returns CSSクラス名
 */
export function getAuthStatusColor(status: AuthStatus): string {
  switch (status) {
    case "pass":
      return "auth-pass";
    case "fail":
      return "auth-fail";
    case "softfail":
      return "auth-softfail";
    case "neutral":
      return "auth-neutral";
    case "none":
      return "auth-none";
    default:
      return "auth-unknown";
  }
}

/**
 * 認証ステータスの日本語ラベルを返します
 *
 * @param status - 認証ステータス
 * @returns 日本語ラベル
 */
export function getAuthStatusLabel(status: AuthStatus): string {
  switch (status) {
    case "pass":
      return "✓ pass";
    case "fail":
      return "✗ fail";
    case "softfail":
      return "△ softfail";
    case "neutral":
      return "○ neutral";
    case "none":
      return "- なし";
    case "permerror":
      return "! permerror";
    case "temperror":
      return "? temperror";
    default:
      return "? 不明";
  }
}
