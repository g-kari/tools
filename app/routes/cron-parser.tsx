import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useToast } from "../components/Toast";

export const Route = createFileRoute("/cron-parser")({
  head: () => ({
    meta: [
      { title: "Cron式パーサー | Web ツール集" },
      {
        name: "description",
        content: "Cron式を人間が読みやすい形式に変換・次回実行時刻を表示するツール。",
      },
      { property: "og:title", content: "Cron式パーサー | Web ツール集" },
      {
        property: "og:description",
        content: "Cron式を人間が読みやすい形式に変換・次回実行時刻を表示するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/cron-parser` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Cron式パーサー | Web ツール集" },
      {
        name: "twitter:description",
        content: "Cron式を人間が読みやすい形式に変換・次回実行時刻を表示するツール。",
      },
    ],
  }),
  component: CronParser,
});

/** よく使われる Cron 式のプリセット一覧 */
const PRESETS = [
  { label: "毎分", expr: "* * * * *" },
  { label: "毎時0分", expr: "0 * * * *" },
  { label: "毎日0時0分", expr: "0 0 * * *" },
  { label: "毎日9時0分", expr: "0 9 * * *" },
  { label: "毎週月曜0時", expr: "0 0 * * 1" },
  { label: "毎月1日0時", expr: "0 0 1 * *" },
  { label: "毎15分", expr: "*/15 * * * *" },
  { label: "平日9時", expr: "0 9 * * 1-5" },
];

/** 曜日名（0=日〜6=土） */
const WEEKDAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

/** 月名（インデックス0=1月〜11=12月） */
const MONTH_NAMES = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

/**
 * cron フィールドをパースして有効な値の配列を返す
 *
 * @param field - cron フィールドの文字列（例: アスタリスク、アスタリスク/15、0-5、1,2,3）
 * @param min - フィールドの最小値
 * @param max - フィールドの最大値
 * @returns 有効な値の配列、または無効な場合は null
 */
export function parseCronField(field: string, min: number, max: number): number[] | null {
  const values = new Set<number>();

  const parts = field.split(",");
  for (const part of parts) {
    // ワイルドカード: *
    if (part === "*") {
      for (let i = min; i <= max; i++) values.add(i);
      continue;
    }

    // ステップ付きワイルドカード: */n
    const stepWildcardMatch = part.match(/^\*\/(\d+)$/);
    if (stepWildcardMatch) {
      const step = parseInt(stepWildcardMatch[1], 10);
      if (step <= 0) return null;
      for (let i = min; i <= max; i += step) values.add(i);
      continue;
    }

    // 範囲 + ステップ: a-b/n
    const rangeStepMatch = part.match(/^(\d+)-(\d+)\/(\d+)$/);
    if (rangeStepMatch) {
      const start = parseInt(rangeStepMatch[1], 10);
      const end = parseInt(rangeStepMatch[2], 10);
      const step = parseInt(rangeStepMatch[3], 10);
      if (start < min || end > max || start > end || step <= 0) return null;
      for (let i = start; i <= end; i += step) values.add(i);
      continue;
    }

    // 範囲: a-b
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start < min || end > max || start > end) return null;
      for (let i = start; i <= end; i++) values.add(i);
      continue;
    }

    // 単一数値
    const singleMatch = part.match(/^(\d+)$/);
    if (singleMatch) {
      const val = parseInt(singleMatch[1], 10);
      if (val < min || val > max) return null;
      values.add(val);
      continue;
    }

    // 不明なパターン
    return null;
  }

  if (values.size === 0) return null;
  return Array.from(values).sort((a, b) => a - b);
}

/**
 * cron 式をパースして検証する
 *
 * @param expr - cron 式（5フィールド: 分 時 日 月 曜日）
 * @returns パース結果（valid, error, fields）
 */
export function parseCronExpression(expr: string): {
  valid: boolean;
  error?: string;
  fields?: {
    minute: number[];
    hour: number[];
    day: number[];
    month: number[];
    weekday: number[];
    /** 日フィールドがワイルドカード（*）だったか */
    dayWildcard: boolean;
    /** 曜日フィールドがワイルドカード（*）だったか */
    weekdayWildcard: boolean;
  };
} {
  const trimmed = expr.trim();
  if (!trimmed) {
    return { valid: false, error: "Cron式を入力してください" };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    return {
      valid: false,
      error: `フィールド数が不正です（${parts.length}個）。5フィールド（分 時 日 月 曜日）が必要です`,
    };
  }

  const [minuteStr, hourStr, dayStr, monthStr, weekdayStr] = parts;

  const minute = parseCronField(minuteStr, 0, 59);
  if (!minute) {
    return { valid: false, error: `分フィールドが不正です: "${minuteStr}"` };
  }

  const hour = parseCronField(hourStr, 0, 23);
  if (!hour) {
    return { valid: false, error: `時フィールドが不正です: "${hourStr}"` };
  }

  const day = parseCronField(dayStr, 1, 31);
  if (!day) {
    return { valid: false, error: `日フィールドが不正です: "${dayStr}"` };
  }

  const month = parseCronField(monthStr, 1, 12);
  if (!month) {
    return { valid: false, error: `月フィールドが不正です: "${monthStr}"` };
  }

  // 曜日: 0-7（7は0=日曜日と同義）
  const weekdayRaw = parseCronField(weekdayStr, 0, 7);
  if (!weekdayRaw) {
    return { valid: false, error: `曜日フィールドが不正です: "${weekdayStr}"` };
  }

  // 7 を 0（日曜日）に統一
  const weekdaySet = new Set(weekdayRaw.map((v) => (v === 7 ? 0 : v)));
  const weekday = Array.from(weekdaySet).sort((a, b) => a - b);

  // ワイルドカードかどうかを記録（標準cron仕様のOR条件判定に使用）
  const dayWildcard = dayStr === "*";
  const weekdayWildcard = weekdayStr === "*";

  return {
    valid: true,
    fields: { minute, hour, day, month, weekday, dayWildcard, weekdayWildcard },
  };
}

/**
 * 次回実行時刻を count 件返す
 *
 * @param expr - cron 式（5フィールド）
 * @param count - 返す件数（デフォルト: 10）
 * @param from - 基準日時（デフォルト: 現在時刻+1分）
 * @returns 次回実行時刻の配列、または無効な式の場合は null
 */
export function getNextExecutionTimes(expr: string, count = 10, from?: Date): Date[] | null {
  const result = parseCronExpression(expr);
  if (!result.valid || !result.fields) return null;

  const { minute, hour, day, month, weekday, dayWildcard, weekdayWildcard } = result.fields;

  const minuteSet = new Set(minute);
  const hourSet = new Set(hour);
  const daySet = new Set(day);
  const monthSet = new Set(month);
  const weekdaySet = new Set(weekday);

  // 標準cron仕様: 日と曜日の両方が非ワイルドカードの場合はOR条件
  const useDayOrWeekday = !dayWildcard && !weekdayWildcard;

  const baseDate = from ? new Date(from) : new Date();
  baseDate.setSeconds(0, 0);
  if (!from) {
    baseDate.setMinutes(baseDate.getMinutes() + 1);
  }

  const times: Date[] = [];
  // 最大イテレーション: 2年分 = 1051200分
  const maxIterations = 1051200;
  let current = new Date(baseDate);

  for (let i = 0; i < maxIterations && times.length < count; i++) {
    const m = current.getMonth() + 1; // 1-12
    const d = current.getDate();
    const h = current.getHours();
    const min = current.getMinutes();
    const wd = current.getDay(); // 0=日〜6=土

    // 日/曜日マッチ: 両方が非ワイルドカードの場合はOR、それ以外はAND
    const dayMatch = useDayOrWeekday
      ? daySet.has(d) || weekdaySet.has(wd)
      : daySet.has(d) && weekdaySet.has(wd);

    if (monthSet.has(m) && dayMatch && hourSet.has(h) && minuteSet.has(min)) {
      times.push(new Date(current));
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  return times;
}

/**
 * 数値の配列をコンパクトな日本語文字列にフォーマットする
 * @param values - 数値の配列
 * @param allMin - 最小値（全値の場合の判定用）
 * @param allMax - 最大値（全値の場合の判定用）
 * @param labels - 各値に対応するラベル配列（省略可）
 * @returns フォーマットされた文字列、または null（全値の場合）
 */
function formatValues(
  values: number[],
  allMin: number,
  allMax: number,
  labels?: string[],
): string | null {
  if (values.length === allMax - allMin + 1) return null; // 全値

  if (labels) {
    return values.map((v) => labels[v - allMin] ?? String(v)).join("、");
  }
  return values.map((v) => String(v)).join("、");
}

/**
 * cron 式の日本語説明を生成する
 *
 * @param expr - cron 式（5フィールド）
 * @returns 日本語説明文字列、または無効な式の場合は null
 */
export function describeCronExpression(expr: string): string | null {
  const result = parseCronExpression(expr);
  if (!result.valid || !result.fields) return null;

  const { minute, hour, day, month, weekday } = result.fields;

  const isAllMinutes = minute.length === 60;
  const isAllHours = hour.length === 24;
  const isAllDays = day.length === 31;
  const isAllMonths = month.length === 12;
  const isAllWeekdays = weekday.length === 7;

  // 全フィールドが全値 => 毎分実行
  if (isAllMinutes && isAllHours && isAllDays && isAllMonths && isAllWeekdays) {
    return "毎分実行";
  }

  const parts: string[] = [];

  // 月
  if (!isAllMonths) {
    const monthStr = formatValues(month, 1, 12, MONTH_NAMES);
    if (monthStr) parts.push(`${monthStr}の`);
  }

  // 曜日
  if (!isAllWeekdays) {
    const wdStr = weekday.map((v) => WEEKDAY_NAMES[v]).join("、");
    parts.push(`曜日（${wdStr}）の`);
  }

  // 日
  if (!isAllDays) {
    const dayStr = formatValues(day, 1, 31);
    if (dayStr) parts.push(`${dayStr}日の`);
  }

  // 時
  let timeStr = "";
  if (isAllHours && isAllMinutes) {
    timeStr = "毎分";
  } else if (isAllHours && !isAllMinutes) {
    const minStr = minute.map((v) => String(v)).join("、");
    timeStr = `毎時${minStr}分`;
  } else if (!isAllHours && isAllMinutes) {
    const hourStr = hour.map((v) => String(v)).join("、");
    timeStr = `${hourStr}時の毎分`;
  } else {
    const hourStr = hour.map((v) => String(v)).join("、");
    const minStr = minute.map((v) => String(v)).join("、");
    timeStr = `${hourStr}時${minStr}分`;
  }

  parts.push(timeStr);

  return parts.join("") + "に実行";
}

/** 次回実行時刻の表示フォーマット */
function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const wd = WEEKDAY_NAMES[date.getDay()];
  return `${y}/${mo}/${d}（${wd}） ${h}:${m}`;
}

/**
 * Cron スケジュールパーサーコンポーネント
 * Cron 式の入力・バリデーション・次回実行時刻の表示を行う
 */
function CronParser() {
  const { showToast } = useToast();
  const [cronInput, setCronInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [nextTimes, setNextTimes] = useState<Date[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  /** リアルタイムバリデーション: 入力中にエラーを表示 */
  useEffect(() => {
    if (!cronInput.trim()) {
      setValidationError(null);
      setDescription(null);
      return;
    }

    const result = parseCronExpression(cronInput);
    if (!result.valid) {
      setValidationError(result.error ?? "無効なCron式です");
      setDescription(null);
    } else {
      setValidationError(null);
      setDescription(describeCronExpression(cronInput));
    }
  }, [cronInput]);

  /** プリセット選択時の処理 */
  const handlePreset = useCallback(
    (expr: string) => {
      setCronInput(expr);
      setNextTimes(null);
      announceStatus(`プリセット「${expr}」を選択しました`);
      inputRef.current?.focus();
    },
    [announceStatus],
  );

  /** 解析ボタン押下時の処理 */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!cronInput.trim()) {
        showToast("Cron式を入力してください", "error");
        announceStatus("エラー: Cron式を入力してください");
        inputRef.current?.focus();
        return;
      }

      const result = parseCronExpression(cronInput);
      if (!result.valid) {
        showToast(result.error ?? "無効なCron式です", "error");
        announceStatus("エラー: " + (result.error ?? "無効なCron式です"));
        return;
      }

      const times = getNextExecutionTimes(cronInput, 10);
      setNextTimes(times);

      if (times && times.length > 0) {
        announceStatus(`次回実行時刻を${times.length}件取得しました`);
      } else {
        announceStatus("次回実行時刻が見つかりませんでした");
      }
    },
    [cronInput, showToast, announceStatus],
  );

  /** クリアボタン押下時の処理 */
  const handleClear = useCallback(() => {
    setCronInput("");
    setValidationError(null);
    setDescription(null);
    setNextTimes(null);
    announceStatus("入力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={handleSubmit} aria-label="Cronパーサーフォーム">
          {/* プリセット選択 */}
          <div className="converter-section">
            <h2 className="section-title">プリセット</h2>
            <div className="preset-buttons" role="group" aria-label="Cronプリセット一覧">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.expr}
                  type="button"
                  variant="outline"
                  className="preset-btn"
                  onClick={() => handlePreset(preset.expr)}
                  aria-label={`プリセット: ${preset.label}（${preset.expr}）`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Cron式入力 */}
          <div className="converter-section">
            <label htmlFor="cronInput" className="section-title">
              Cron式を入力
            </label>
            <div className="cron-field-labels" aria-hidden="true">
              <span>分</span>
              <span>時</span>
              <span>日</span>
              <span>月</span>
              <span>曜日</span>
            </div>
            <Input
              id="cronInput"
              ref={inputRef}
              type="text"
              value={cronInput}
              onChange={(e) => setCronInput(e.target.value)}
              placeholder="例: 0 9 * * 1-5"
              aria-describedby={
                validationError ? "cron-error" : description ? "cron-description" : "cron-help"
              }
              aria-invalid={validationError ? "true" : "false"}
              aria-label="Cron式入力フィールド（分 時 日 月 曜日）"
              autoComplete="off"
              spellCheck="false"
            />
            <span id="cron-help" className="sr-only">
              5フィールド形式（分 時 日 月 曜日）でCron式を入力してください。例: 0 9 * * 1-5
            </span>

            {/* バリデーションエラー */}
            {validationError && (
              <div
                id="cron-error"
                className="cron-error-message"
                role="alert"
                aria-live="assertive"
              >
                {validationError}
              </div>
            )}

            {/* 日本語説明 */}
            {description && !validationError && (
              <div id="cron-description" className="cron-description" aria-live="polite">
                {description}
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className="button-group" role="group" aria-label="Cronパーサー操作">
            <Button
              type="submit"
              className="btn-primary"
              aria-label="Cron式を解析して次回実行時刻を表示"
            >
              解析
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力をクリア"
            >
              クリア
            </Button>
          </div>

          {/* 次回実行時刻 */}
          {nextTimes && (
            <div className="converter-section" aria-live="polite">
              <h2 className="section-title" id="next-times-title">
                次回実行予定時刻
              </h2>
              {nextTimes.length > 0 ? (
                <ol className="cron-next-times" aria-labelledby="next-times-title">
                  {nextTimes.map((date, index) => (
                    <li key={index} className="cron-next-time-item">
                      <span className="cron-next-time-index">{index + 1}</span>
                      <span className="cron-next-time-value">{formatDateTime(date)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="cron-no-times">今後2年以内に実行予定はありません</p>
              )}
            </div>
          )}
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "プリセットボタンから定型的なCron式を選択",
                "または「Cron式を入力」欄に直接入力（5フィールド形式）",
                "入力中にリアルタイムでバリデーションと説明を表示",
                "「解析」ボタンで次回実行予定時刻10件を表示",
                "フィールド順: 分（0-59） 時（0-23） 日（1-31） 月（1-12） 曜日（0-7）",
              ],
            },
            {
              title: "Cron式の書き方",
              items: [
                "* : 全ての値（毎分、毎時など）",
                "*/n : n ごと（例: */15 = 15分ごと）",
                "a-b : 範囲（例: 1-5 = 月〜金）",
                "a,b,c : 列挙（例: 0,30 = 0分と30分）",
                "曜日: 0と7が日曜日、1=月、2=火、3=水、4=木、5=金、6=土",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
