/**
 * ワールドクロックユーティリティ
 * 複数タイムゾーンのリアルタイム時刻表示に使用するユーティリティ関数群
 */

/** クロックカードに表示するデータ */
export interface ClockData {
  /** 時刻文字列 ("09:41:30" または "9:41:30 午前") */
  time: string;
  /** 日付文字列 ("2026/03/19") */
  date: string;
  /** 曜日略称 ("木") */
  weekday: string;
  /** UTCオフセット文字列 ("GMT+9") */
  offset: string;
  /** ローカル日付との差分（+1: 翌日、-1: 前日、0: 同日） */
  dayDiff: -1 | 0 | 1;
}

/** 曜日の日本語ラベル */
const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/**
 * 指定タイムゾーンの現在時刻データを取得する
 * @param now - 基準となる Date オブジェクト
 * @param timezone - IANAタイムゾーンID
 * @param hour12 - true で 12 時間表示
 * @param localTimezone - ローカルタイムゾーン（日付差分の基準）
 * @returns ClockData
 */
export function getClockData(
  now: Date,
  timezone: string,
  hour12: boolean,
  localTimezone: string,
): ClockData {
  // --- 時刻 ---
  const timeFmt = new Intl.DateTimeFormat('ja-JP', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12,
  });
  const time = timeFmt.format(now);

  // --- 日付 ---
  const datePartsFormatter = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateParts = Object.fromEntries(
    datePartsFormatter.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const date = `${dateParts.year}/${dateParts.month}/${dateParts.day}`;

  // --- 曜日 ---
  const weekdayFmt = new Intl.DateTimeFormat('ja-JP', {
    timeZone: timezone,
    weekday: 'short',
  });
  const weekdayRaw = weekdayFmt.format(now); // "木曜日" など
  const weekday = weekdayRaw.charAt(0); // "木"

  // --- UTCオフセット ---
  const offsetFmt = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });
  const offsetParts = offsetFmt.formatToParts(now);
  const offset = offsetParts.find((p) => p.type === 'timeZoneName')?.value ?? 'UTC';

  // --- 日付差分（ローカルとの比較） ---
  const localDateStr = new Intl.DateTimeFormat('sv-SE', { timeZone: localTimezone }).format(now);
  const tzDateStr = new Intl.DateTimeFormat('sv-SE', { timeZone: timezone }).format(now);
  const localDay = new Date(localDateStr).getTime();
  const tzDay = new Date(tzDateStr).getTime();
  const diffMs = tzDay - localDay;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const dayDiff: ClockData['dayDiff'] = diffDays > 0 ? 1 : diffDays < 0 ? -1 : 0;

  return { time, date, weekday, offset, dayDiff };
}

/**
 * ブラウザのローカルタイムゾーンIDを取得する
 * @returns IANAタイムゾーンID（例: "Asia/Tokyo"）
 */
export function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * 曜日番号（0=日〜6=土）から日本語略称を返す
 * @param dayOfWeek - 0〜6 の曜日番号
 * @returns 曜日略称（"日", "月", ...）
 */
export function weekdayLabel(dayOfWeek: number): string {
  return WEEKDAY_LABELS[dayOfWeek] ?? '';
}
