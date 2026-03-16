/** 日付差の結果 */
export interface DateDiffResult {
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isNegative: boolean;
}

/** 持続時間の単位 */
export type DurationUnit = "days" | "weeks" | "months" | "years" | "hours" | "minutes";

/** 加算/減算の操作 */
export type DateOperation = "add" | "subtract";

/** 日付詳細情報 */
export interface DateInfo {
  dayOfWeek: string;
  dayOfWeekEn: string;
  dayOfYear: number;
  weekNumber: number;
  quarter: number;
  isLeapYear: boolean;
  daysInMonth: number;
  unixTimestamp: number;
}

const DAY_NAMES_JA = ["日", "月", "火", "水", "木", "金", "土"];
const DAY_NAMES_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * 2つの日付の差を計算する
 */
export function calculateDateDiff(date1: Date, date2: Date): DateDiffResult {
  const ms = date2.getTime() - date1.getTime();
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);

  const totalSeconds = Math.floor(absMs / 1000);
  const totalMinutes = Math.floor(absMs / (1000 * 60));
  const totalHours = Math.floor(absMs / (1000 * 60 * 60));
  const totalDays = Math.floor(absMs / (1000 * 60 * 60 * 24));

  // 年・月・日の内訳を計算
  const d1 = isNegative ? new Date(date2) : new Date(date1);
  const d2 = isNegative ? new Date(date1) : new Date(date2);

  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  let days = d2.getDate() - d1.getDate();
  let hours = d2.getHours() - d1.getHours();
  let minutes = d2.getMinutes() - d1.getMinutes();
  let seconds = d2.getSeconds() - d1.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes -= 1;
  }
  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(d2.getFullYear(), d2.getMonth(), 0);
    days += prevMonthLastDay.getDate();
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return {
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds,
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    isNegative,
  };
}

/**
 * 日付に期間を加算または減算する
 */
export function addDuration(
  date: Date,
  amount: number,
  unit: DurationUnit,
  operation: DateOperation
): Date {
  const result = new Date(date);
  const n = operation === "add" ? amount : -amount;

  switch (unit) {
    case "minutes":
      result.setMinutes(result.getMinutes() + n);
      break;
    case "hours":
      result.setHours(result.getHours() + n);
      break;
    case "days":
      result.setDate(result.getDate() + n);
      break;
    case "weeks":
      result.setDate(result.getDate() + n * 7);
      break;
    case "months":
      result.setMonth(result.getMonth() + n);
      break;
    case "years":
      result.setFullYear(result.getFullYear() + n);
      break;
  }

  return result;
}

/**
 * 日付の詳細情報を取得する
 */
export function getDateInfo(date: Date): DateInfo {
  const year = date.getFullYear();
  const month = date.getMonth();

  // 年の何日目か
  const startOfYear = new Date(year, 0, 0);
  const diffFromYearStart = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffFromYearStart / (1000 * 60 * 60 * 24));

  // ISO週番号
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNumber =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );

  // 四半期
  const quarter = Math.ceil((month + 1) / 3);

  // 閏年
  const isLeapYear =
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  // 月の日数
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return {
    dayOfWeek: `${DAY_NAMES_JA[date.getDay()]}曜日`,
    dayOfWeekEn: DAY_NAMES_EN[date.getDay()],
    dayOfYear,
    weekNumber,
    quarter,
    isLeapYear,
    daysInMonth,
    unixTimestamp: Math.floor(date.getTime() / 1000),
  };
}

/**
 * 日付を日本語形式の文字列にフォーマットする
 */
export function formatDateJa(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const dow = DAY_NAMES_JA[date.getDay()];
  return `${year}年${month}月${day}日（${dow}）${hours}:${minutes}:${seconds}`;
}

/**
 * datetime-local input 向けの文字列を生成する
 */
export function toDatetimeLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
