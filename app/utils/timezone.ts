/**
 * タイムゾーン変換ユーティリティ
 * Intl APIを使用した、タイムゾーン間の日時変換を提供する
 */

/** タイムゾーン情報の型定義 */
export interface TimezoneInfo {
  /** IANAタイムゾーンID */
  id: string;
  /** 表示ラベル（略称とオフセット） */
  label: string;
  /** 代表都市名（日本語） */
  city: string;
}

/** 変換結果の型定義 */
export interface ConversionResult {
  /** タイムゾーン情報 */
  timezone: TimezoneInfo;
  /** フォーマット済み日時文字列 */
  datetime: string;
  /** UTCオフセット文字列 */
  offset: string;
  /** 日付文字列 */
  date: string;
  /** 時刻文字列 */
  time: string;
}

/**
 * 主要タイムゾーン一覧
 * 東→西の順で並べる
 */
export const TIMEZONES: TimezoneInfo[] = [
  { id: "Pacific/Auckland", label: "NZST +12/+13", city: "オークランド" },
  { id: "Pacific/Fiji", label: "FJT +12", city: "フィジー" },
  { id: "Asia/Magadan", label: "MAGT +11", city: "マガダン" },
  { id: "Australia/Sydney", label: "AEDT +10/+11", city: "シドニー" },
  { id: "Asia/Tokyo", label: "JST +9", city: "東京" },
  { id: "Asia/Seoul", label: "KST +9", city: "ソウル" },
  { id: "Asia/Shanghai", label: "CST +8", city: "上海" },
  { id: "Asia/Singapore", label: "SGT +8", city: "シンガポール" },
  { id: "Asia/Bangkok", label: "ICT +7", city: "バンコク" },
  { id: "Asia/Kolkata", label: "IST +5:30", city: "ムンバイ" },
  { id: "Asia/Dubai", label: "GST +4", city: "ドバイ" },
  { id: "Europe/Moscow", label: "MSK +3", city: "モスクワ" },
  { id: "Africa/Nairobi", label: "EAT +3", city: "ナイロビ" },
  { id: "Europe/Istanbul", label: "TRT +3", city: "イスタンブール" },
  { id: "Europe/Paris", label: "CET +1/+2", city: "パリ" },
  { id: "Europe/London", label: "GMT/BST", city: "ロンドン" },
  { id: "UTC", label: "UTC +0", city: "協定世界時" },
  { id: "Atlantic/Azores", label: "AZOT -1", city: "アゾレス" },
  { id: "America/Sao_Paulo", label: "BRT -3", city: "サンパウロ" },
  { id: "America/New_York", label: "EST/EDT -5/-4", city: "ニューヨーク" },
  { id: "America/Chicago", label: "CST/CDT -6/-5", city: "シカゴ" },
  { id: "America/Denver", label: "MST/MDT -7/-6", city: "デンバー" },
  { id: "America/Los_Angeles", label: "PST/PDT -8/-7", city: "ロサンゼルス" },
  { id: "America/Anchorage", label: "AKST -9", city: "アンカレッジ" },
  { id: "Pacific/Honolulu", label: "HST -10", city: "ホノルル" },
];

/**
 * デフォルトで選択する主要タイムゾーンIDセット
 */
export const DEFAULT_SELECTED_TIMEZONES = new Set([
  "UTC",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Pacific/Auckland",
]);

/**
 * UTCオフセット文字列を取得する
 * @param date - 対象の日時
 * @param timezone - IANAタイムゾーンID
 * @returns "GMT+9:00" 形式のオフセット文字列
 */
export function getUtcOffset(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * 指定タイムゾーンでの日時をフォーマットする
 * @param date - 対象の日時（Dateオブジェクト）
 * @param timezone - IANAタイムゾーンID
 * @returns 日付・時刻・日時の文字列オブジェクト
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
): { date: string; time: string; datetime: string } {
  try {
    const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const dateStr = dateFormatter.format(date);
    const timeStr = timeFormatter.format(date);
    return {
      date: dateStr,
      time: timeStr,
      datetime: `${dateStr} ${timeStr}`,
    };
  } catch {
    return { date: "", time: "", datetime: "" };
  }
}

/**
 * 複数のタイムゾーンへの変換結果を生成する
 * @param date - 変換元の日時
 * @param targetTimezones - 変換先タイムゾーン情報の配列
 * @returns 各タイムゾーンの変換結果配列
 */
export function convertToTimezones(
  date: Date,
  targetTimezones: TimezoneInfo[],
): ConversionResult[] {
  return targetTimezones.map((tz) => {
    const { date: d, time, datetime } = formatInTimezone(date, tz.id);
    const offset = getUtcOffset(date, tz.id);
    return { timezone: tz, datetime, offset, date: d, time };
  });
}

/**
 * Intl.DateTimeFormat.formatToParts を使って ISO 形式の文字列を構築する
 * en-CA ロケールのフォーマット依存を避けるためのヘルパー関数
 * @param date - 対象の日時
 * @param timezone - IANAタイムゾーンID
 * @returns "YYYY-MM-DDTHH:mm:ssZ" 形式の文字列
 */
function formatPartsToISOString(date: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`;
}

/**
 * タイムゾーンのUTCオフセット（ミリ秒）を取得する
 * @param date - 基準の日時
 * @param timezone - IANAタイムゾーンID
 * @returns UTCとの差分（ミリ秒）
 */
export function getTimezoneOffsetMs(date: Date, timezone: string): number {
  try {
    const utcStr = formatPartsToISOString(date, "UTC");
    const tzStr = formatPartsToISOString(date, timezone);

    const utcDate = new Date(utcStr);
    const tzDate = new Date(tzStr);

    return tzDate.getTime() - utcDate.getTime();
  } catch {
    return 0;
  }
}

/**
 * datetime-local inputの値とタイムゾーン指定からDateオブジェクトを生成する
 * @param datetimeLocal - "YYYY-MM-DDTHH:mm" 形式の文字列
 * @param timezone - 入力値が属するIANAタイムゾーンID
 * @returns 対応するDateオブジェクト、またはnull（パース失敗時）
 */
export function parseDateTimeWithTimezone(datetimeLocal: string, timezone: string): Date | null {
  if (!datetimeLocal) return null;
  try {
    const [datePart, timePart] = datetimeLocal.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    // まずUTCとして仮のDateを作成
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    // 1回目のオフセット補正
    const offsetMs1 = getTimezoneOffsetMs(utcDate, timezone);
    const candidate = new Date(utcDate.getTime() - offsetMs1);
    // 2回目: 補正後の時刻で再計算（DST境界でより正確）
    const offsetMs2 = getTimezoneOffsetMs(candidate, timezone);
    return new Date(utcDate.getTime() - offsetMs2);
  } catch {
    return null;
  }
}

/**
 * タイムゾーンIDの有効性を検証する
 * @param tz - 検証するIANAタイムゾーンID
 * @returns 有効な場合true
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * 現在時刻をdatetime-local input用の文字列にフォーマットする
 * @returns "YYYY-MM-DDTHH:mm" 形式の文字列
 */
export function getCurrentDatetimeLocal(): string {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
