import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "~/components/ui/button";

export const Route = createFileRoute("/stopwatch")({
  head: () => ({
    meta: [
      { title: "ストップウォッチ | Web ツール集" },
      {
        name: "description",
        content:
          "ミリ秒精度のストップウォッチ。ラップタイムの記録・比較に対応。スポーツ計測、ベンチマーク計測などに便利です。",
      },
      { property: "og:title", content: "ストップウォッチ | Web ツール集" },
      {
        property: "og:description",
        content:
          "ミリ秒精度のストップウォッチ。ラップタイムの記録・比較に対応。スポーツ計測、ベンチマーク計測などに便利です。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/stopwatch` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ストップウォッチ | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "ミリ秒精度のストップウォッチ。ラップタイムの記録・比較に対応。スポーツ計測、ベンチマーク計測などに便利です。",
      },
    ],
  }),
  component: Stopwatch,
});

/**
 * ラップタイムを表す型
 */
export interface LapTime {
  /** ラップ番号（1始まり） */
  lap: number;
  /** ラップタイム（ms） */
  lapMs: number;
  /** 合計タイム（ms） */
  totalMs: number;
}

/**
 * ミリ秒を MM:SS.ms 形式の文字列に変換する
 * @param ms - ミリ秒数（0以上）
 * @returns "MM:SS.ms" 形式の文字列
 * @example
 * formatElapsed(0)      // "00:00.000"
 * formatElapsed(1500)   // "00:01.500"
 * formatElapsed(65432)  // "01:05.432"
 */
export function formatElapsed(ms: number): string {
  const totalMs = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

/**
 * ラップタイムの差分ミリ秒から評価を返す
 * @param lapMs - 対象ラップのタイム（ms）
 * @param laps - 全ラップ一覧
 * @returns "best" | "worst" | "normal"
 */
export function getLapRating(lapMs: number, laps: LapTime[]): "best" | "worst" | "normal" {
  if (laps.length < 2) return "normal";
  const times = laps.map((l) => l.lapMs);
  const min = Math.min(...times);
  const max = Math.max(...times);
  if (lapMs === min) return "best";
  if (lapMs === max) return "worst";
  return "normal";
}

/**
 * ストップウォッチコンポーネント
 * 開始・一時停止・リセット・ラップ記録に対応したストップウォッチ
 */
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<LapTime[]>([]);
  const startRef = useRef<number | null>(null);
  const baseRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (startRef.current === null) return;
    setElapsed(baseRef.current + (Date.now() - startRef.current));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleStart = () => {
    startRef.current = Date.now();
    setRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  };

  const handlePause = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    baseRef.current = elapsed;
    startRef.current = null;
    setRunning(false);
  };

  const handleReset = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startRef.current = null;
    baseRef.current = 0;
    setElapsed(0);
    setRunning(false);
    setLaps([]);
  };

  const handleLap = () => {
    const prevTotal = laps.length > 0 ? laps[laps.length - 1].totalMs : 0;
    const lapMs = elapsed - prevTotal;
    setLaps((prev) => [...prev, { lap: prev.length + 1, lapMs, totalMs: elapsed }]);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const allLapsWithRating = laps.map((l) => ({
    ...l,
    rating: getLapRating(l.lapMs, laps),
  }));

  return (
    <main className="tool-layout">
      <h1 className="tool-title">ストップウォッチ</h1>
      <p className="tool-description">
        ミリ秒精度のストップウォッチです。ラップタイムの記録・比較に対応しています。
      </p>

      {/* 時間表示 */}
      <section className="stopwatch-display" aria-label="経過時間">
        <time
          className="stopwatch-time"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`経過時間 ${formatElapsed(elapsed)}`}
        >
          {formatElapsed(elapsed)}
        </time>
      </section>

      {/* コントロールボタン */}
      <section className="stopwatch-controls" aria-label="ストップウォッチ操作">
        {!running ? (
          <Button
            className="stopwatch-btn stopwatch-btn-start"
            onClick={handleStart}
            aria-label="計測開始"
          >
            {elapsed === 0 ? "▶ スタート" : "▶ 再開"}
          </Button>
        ) : (
          <Button
            className="stopwatch-btn stopwatch-btn-pause"
            onClick={handlePause}
            aria-label="一時停止"
          >
            ⏸ 一時停止
          </Button>
        )}
        <Button
          variant="outline"
          className="stopwatch-btn stopwatch-btn-lap"
          onClick={handleLap}
          disabled={!running}
          aria-label="ラップタイム記録"
        >
          🏁 ラップ
        </Button>
        <Button
          variant="outline"
          className="stopwatch-btn stopwatch-btn-reset"
          onClick={handleReset}
          disabled={running}
          aria-label="リセット"
        >
          ↺ リセット
        </Button>
      </section>

      {/* ラップタイム一覧 */}
      {laps.length > 0 && (
        <section className="stopwatch-laps" aria-label="ラップタイム一覧">
          <h2 className="stopwatch-laps-title">ラップタイム</h2>
          <div className="stopwatch-laps-header" aria-hidden="true">
            <span>ラップ</span>
            <span>ラップタイム</span>
            <span>合計タイム</span>
          </div>
          <ol className="stopwatch-laps-list" reversed>
            {[...allLapsWithRating].reverse().map((l) => (
              <li
                key={l.lap}
                className={`stopwatch-lap-row stopwatch-lap-${l.rating}`}
                aria-label={`ラップ ${l.lap}: ${formatElapsed(l.lapMs)}`}
              >
                <span className="stopwatch-lap-num">
                  {l.rating === "best" && (
                    <span className="stopwatch-lap-badge best" aria-label="最速">
                      最速
                    </span>
                  )}
                  {l.rating === "worst" && (
                    <span className="stopwatch-lap-badge worst" aria-label="最遅">
                      最遅
                    </span>
                  )}
                  #{l.lap}
                </span>
                <span className="stopwatch-lap-time">{formatElapsed(l.lapMs)}</span>
                <span className="stopwatch-lap-total">{formatElapsed(l.totalMs)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
