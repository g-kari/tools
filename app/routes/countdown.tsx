import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/countdown")({
  head: () => ({
    meta: [
      { title: "カウントダウンタイマー | Web ツール集" },
      {
        name: "description",
        content:
          "指定した日時までのカウントダウンを表示するツール。日・時・分・秒をリアルタイムで表示します。",
      },
      { property: "og:title", content: "カウントダウンタイマー | Web ツール集" },
      {
        property: "og:description",
        content:
          "指定した日時までのカウントダウンを表示するツール。日・時・分・秒をリアルタイムで表示します。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/countdown` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "カウントダウンタイマー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "指定した日時までのカウントダウンを表示するツール。日・時・分・秒をリアルタイムで表示します。",
      },
    ],
  }),
  component: CountdownTimer,
});

/**
 * カウントダウンの残り時間を表す型
 */
export interface CountdownTime {
  /** 残り日数 */
  days: number;
  /** 残り時間（0-23） */
  hours: number;
  /** 残り分（0-59） */
  minutes: number;
  /** 残り秒（0-59） */
  seconds: number;
  /** 期限切れかどうか */
  expired: boolean;
}

/**
 * ミリ秒を日・時・分・秒に変換する
 * @param ms - 残りミリ秒数（負の場合は期限切れとして扱う）
 * @returns 日・時・分・秒と期限切れフラグ
 * @example
 * formatCountdown(90061000) // { days: 1, hours: 1, minutes: 1, seconds: 1, expired: false }
 * formatCountdown(-1000)    // { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
 */
export function formatCountdown(ms: number): CountdownTime {
  if (ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: false };
}

/**
 * 対象日時文字列をDateオブジェクトに変換する
 * @param dateStr - 日付文字列（YYYY-MM-DD形式）
 * @param timeStr - 時刻文字列（HH:MM形式）
 * @returns Dateオブジェクト。不正な形式の場合はnull
 */
export function parseTargetDate(dateStr: string, timeStr: string): Date | null {
  if (!dateStr) return null;
  const time = timeStr || "00:00";
  const dt = new Date(`${dateStr}T${time}:00`);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

/** プリセット定義 */
interface CountdownPreset {
  label: string;
  getDate: () => { date: string; time: string };
}

/**
 * 今年または来年の指定月日のISO日付文字列を返す
 * @param month - 月（1-12）
 * @param day - 日（1-31）
 * @returns YYYY-MM-DD 形式の文字列
 */
function getYearlyDate(month: number, day: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const target = new Date(year, month - 1, day);
  if (target <= now) {
    target.setFullYear(year + 1);
  }
  return target.toISOString().slice(0, 10);
}

/** カウントダウンプリセット一覧 */
const PRESETS: CountdownPreset[] = [
  {
    label: "🎍 元日",
    getDate: () => ({ date: getYearlyDate(1, 1), time: "00:00" }),
  },
  {
    label: "🌸 春分の日",
    getDate: () => ({ date: getYearlyDate(3, 20), time: "00:00" }),
  },
  {
    label: "🎑 秋分の日",
    getDate: () => ({ date: getYearlyDate(9, 23), time: "00:00" }),
  },
  {
    label: "🎃 ハロウィン",
    getDate: () => ({ date: getYearlyDate(10, 31), time: "00:00" }),
  },
  {
    label: "🎄 クリスマス",
    getDate: () => ({ date: getYearlyDate(12, 25), time: "00:00" }),
  },
  {
    label: "🎉 大晦日",
    getDate: () => ({ date: getYearlyDate(12, 31), time: "23:59" }),
  },
];

/**
 * カウントダウンタイマーコンポーネント
 * 指定した日時までのカウントダウンを日・時・分・秒でリアルタイム表示する
 */
function CountdownTimer() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateStr, setDateStr] = useState(today);
  const [timeStr, setTimeStr] = useState("00:00");
  const [label, setLabel] = useState("");
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  const targetDate = parseTargetDate(dateStr, timeStr);

  const tick = useCallback(() => {
    if (!targetDate) return;
    const remaining = targetDate.getTime() - Date.now();
    setCountdown(formatCountdown(remaining));
  }, [targetDate]);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const applyPreset = (preset: CountdownPreset) => {
    const { date, time } = preset.getDate();
    setDateStr(date);
    setTimeStr(time);
    setLabel(preset.label);
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <main className="tool-layout">
      <h1 className="tool-title">カウントダウンタイマー</h1>
      <p className="tool-description">指定した日時までのカウントダウンを表示します。</p>

      {/* 入力セクション */}
      <section className="countdown-input-section" aria-label="カウントダウン設定">
        <div className="countdown-inputs">
          <div className="countdown-field">
            <label htmlFor="countdown-date" className="countdown-label">
              日付
            </label>
            <input
              id="countdown-date"
              type="date"
              className="countdown-date-input"
              value={dateStr}
              min={today}
              onChange={(e) => {
                setDateStr(e.target.value);
                setLabel("");
              }}
              aria-label="カウントダウン対象日付"
            />
          </div>
          <div className="countdown-field">
            <label htmlFor="countdown-time" className="countdown-label">
              時刻
            </label>
            <input
              id="countdown-time"
              type="time"
              className="countdown-time-input"
              value={timeStr}
              onChange={(e) => {
                setTimeStr(e.target.value);
                setLabel("");
              }}
              aria-label="カウントダウン対象時刻"
            />
          </div>
        </div>

        {/* プリセットボタン */}
        <div className="countdown-presets" role="group" aria-label="プリセット">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              className={`countdown-preset-btn${label === preset.label ? " active" : ""}`}
              onClick={() => applyPreset(preset)}
              aria-pressed={label === preset.label}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </section>

      {/* カウントダウン表示 */}
      <section
        className={`countdown-display${countdown.expired ? " expired" : ""}`}
        aria-label="カウントダウン表示"
        aria-live="polite"
        aria-atomic="true"
      >
        {!targetDate ? (
          <p className="countdown-placeholder">日付を入力してください</p>
        ) : countdown.expired ? (
          <p className="countdown-expired-text">期限切れ</p>
        ) : (
          <>
            {label && <p className="countdown-event-label">{label}</p>}
            <div className="countdown-units">
              <div className="countdown-unit">
                <span className="countdown-number">{countdown.days}</span>
                <span className="countdown-unit-label">日</span>
              </div>
              <span className="countdown-separator" aria-hidden="true">
                :
              </span>
              <div className="countdown-unit">
                <span className="countdown-number">{pad(countdown.hours)}</span>
                <span className="countdown-unit-label">時間</span>
              </div>
              <span className="countdown-separator" aria-hidden="true">
                :
              </span>
              <div className="countdown-unit">
                <span className="countdown-number">{pad(countdown.minutes)}</span>
                <span className="countdown-unit-label">分</span>
              </div>
              <span className="countdown-separator" aria-hidden="true">
                :
              </span>
              <div className="countdown-unit">
                <span className="countdown-number">{pad(countdown.seconds)}</span>
                <span className="countdown-unit-label">秒</span>
              </div>
            </div>
            <p className="countdown-target-info">
              目標:{" "}
              {targetDate.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "short",
              })}{" "}
              {timeStr}
            </p>
          </>
        )}
      </section>

      <TipsCard
        sections={[
          {
            title: "使い方",
            items: [
              "日付と時刻を入力するとカウントダウンが始まります",
              "プリセットから年中行事をワンクリックで設定できます",
              "カウントが0になると「期限切れ」と表示されます",
              "複数のタブを開いて複数のイベントを同時に管理できます",
            ],
          },
        ]}
      />
    </main>
  );
}
