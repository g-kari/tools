/**
 * Cron式のパース・バリデーション・次回実行時刻計算ユーティリティ
 * cronerパッケージを使用してCron式を処理する
 */
import { Cron } from "croner";

/** Cron式パース結果 */
export interface CronParseResult {
  /** パース成功かどうか */
  isValid: boolean;
  /** エラーメッセージ（isValid=falseの場合） */
  error?: string;
  /** 次回実行時刻の配列（isValid=trueの場合、最大10件） */
  nextRuns: Date[];
  /** Cron式の日本語説明 */
  description: string;
}

/** Cronフィールド定義 */
export interface CronField {
  /** フィールド名 */
  name: string;
  /** 表示ラベル（日本語） */
  label: string;
  /** 有効な値の範囲説明 */
  description: string;
}

/** Cron式の各フィールド定義 */
export const CRON_FIELDS: CronField[] = [
  { name: "minute", label: "分", description: "0-59" },
  { name: "hour", label: "時", description: "0-23" },
  { name: "day", label: "日", description: "1-31" },
  { name: "month", label: "月", description: "1-12" },
  { name: "weekday", label: "曜日", description: "0-7 (0,7=日曜)" },
];

/** よく使うCron式のプリセット */
export const CRON_PRESETS = [
  { label: "毎分", value: "* * * * *" },
  { label: "毎時0分", value: "0 * * * *" },
  { label: "毎日午前9時", value: "0 9 * * *" },
  { label: "毎日午前0時", value: "0 0 * * *" },
  { label: "毎週月曜午前9時", value: "0 9 * * 1" },
  { label: "毎週日曜午前0時", value: "0 0 * * 0" },
  { label: "毎月1日午前0時", value: "0 0 1 * *" },
  { label: "毎年1月1日午前0時", value: "0 0 1 1 *" },
  { label: "5分ごと", value: "*/5 * * * *" },
  { label: "30分ごと", value: "*/30 * * * *" },
  { label: "平日午前9時", value: "0 9 * * 1-5" },
];

/**
 * Cron式をパースして結果を返す
 *
 * @param expression - Cron式（5フィールド形式）
 * @returns パース結果（有効性、エラー、次回実行時刻、説明）
 */
export function parseCron(expression: string): CronParseResult {
  const trimmed = expression.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: "Cron式を入力してください",
      nextRuns: [],
      description: "",
    };
  }

  try {
    const job = new Cron(trimmed, { legacyMode: false });
    const nextRuns = job.nextRuns(10);
    const description = generateDescription(trimmed);
    return { isValid: true, nextRuns, description };
  } catch (e) {
    return {
      isValid: false,
      error: e instanceof Error ? e.message : "無効なCron式です",
      nextRuns: [],
      description: "",
    };
  }
}

/**
 * Cron式の日本語説明を生成する
 *
 * @param expression - Cron式（5フィールド形式）
 * @returns 日本語説明文字列
 */
export function generateDescription(expression: string): string {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return "不明なスケジュール";

  const [min, hour, day, month, weekday] = parts;

  // 毎分
  if (
    min === "*" &&
    hour === "*" &&
    day === "*" &&
    month === "*" &&
    weekday === "*"
  ) {
    return "毎分実行";
  }

  // 毎時N分
  if (hour === "*" && day === "*" && month === "*" && weekday === "*") {
    if (min === "*") return "毎分実行";
    if (min.startsWith("*/")) return `${min.slice(2)}分ごとに実行`;
    return `毎時 ${min} 分に実行`;
  }

  // 時間の説明
  const hourStr = hour === "*" ? "毎時" : `${hour}時`;
  const minStr = min === "*" ? "毎分" : `${min}分`;

  let base = `毎日 ${hourStr}${minStr}に実行`;

  // 曜日指定
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  if (weekday !== "*") {
    if (weekday === "1-5") {
      base = `平日（月〜金） ${hourStr}${minStr}に実行`;
    } else if (weekday === "0-6" || weekday === "0-7") {
      base = `毎日 ${hourStr}${minStr}に実行`;
    } else {
      const dayNums = weekday.split(",");
      const dayStr = dayNums
        .map((d) => {
          const n = parseInt(d);
          return isNaN(n) ? d : days[n % 7] ?? d;
        })
        .join("・");
      base = `毎週${dayStr}曜 ${hourStr}${minStr}に実行`;
    }
  } else if (day !== "*") {
    base = `毎月${day}日 ${hourStr}${minStr}に実行`;
  }

  // 月指定
  if (month !== "*") {
    base = `${month}月 ` + base.replace("毎日 ", "").replace("毎月", "");
  }

  return base;
}
