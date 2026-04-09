import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/pomodoro")({
  head: () => ({
    meta: [
      { title: "ポモドーロタイマー | Web ツール集" },
      {
        name: "description",
        content:
          "ポモドーロ・テクニックに基づく集中タイマー。25分の作業と短い休憩を繰り返して生産性を高めます。",
      },
      { property: "og:title", content: "ポモドーロタイマー | Web ツール集" },
      {
        property: "og:description",
        content:
          "ポモドーロ・テクニックに基づく集中タイマー。25分の作業と短い休憩を繰り返して生産性を高めます。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/pomodoro` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "ポモドーロタイマー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "ポモドーロ・テクニックに基づく集中タイマー。25分の作業と短い休憩を繰り返して生産性を高めます。",
      },
    ],
  }),
  component: PomodoroTimer,
});

/** タイマーのフェーズ型 */
type Phase = "work" | "shortBreak" | "longBreak";

/**
 * 秒数を "MM:SS" 形式の文字列にフォーマットする
 * @param seconds - フォーマットする秒数（0以上の整数）
 * @returns "MM:SS" 形式の文字列（例: "25:00"）
 * @example
 * formatTime(1500) // "25:00"
 * formatTime(65)   // "01:05"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * 経過時間から進捗率（0〜100）を計算する
 * @param elapsed - 経過時間（秒）
 * @param total - 合計時間（秒）
 * @returns 0〜100の進捗率。totalが0の場合は0を返す
 * @example
 * calculateProgress(750, 1500) // 50
 * calculateProgress(0, 1500)   // 0
 */
export function calculateProgress(elapsed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

/**
 * フェーズの日本語ラベルを返す
 * @param phase - タイマーのフェーズ
 * @returns フェーズに対応する日本語ラベル
 * @example
 * getPhaseLabel('work')       // "作業"
 * getPhaseLabel('shortBreak') // "短い休憩"
 * getPhaseLabel('longBreak')  // "長い休憩"
 */
export function getPhaseLabel(phase: Phase): string {
  switch (phase) {
    case "work":
      return "作業";
    case "shortBreak":
      return "短い休憩";
    case "longBreak":
      return "長い休憩";
  }
}

/**
 * 現在のフェーズとセッション数から次のフェーズを決定する
 * @param currentPhase - 現在のフェーズ
 * @param sessionCount - 完了した作業セッションの数（1以上）
 * @returns 次のフェーズ。4セッション完了後の作業フェーズ終了時は長い休憩になる
 * @example
 * getNextPhase('work', 1)       // "shortBreak"
 * getNextPhase('work', 4)       // "longBreak"
 * getNextPhase('shortBreak', 1) // "work"
 * getNextPhase('longBreak', 4)  // "work"
 */
export function getNextPhase(currentPhase: Phase, sessionCount: number): Phase {
  if (currentPhase === "work") {
    return sessionCount % 4 === 0 ? "longBreak" : "shortBreak";
  }
  return "work";
}

/**
 * ポモドーロタイマーページコンポーネント
 *
 * ポモドーロ・テクニックに基づく集中管理タイマーを提供します。
 * 25分の作業セッションと短い/長い休憩を交互に繰り返します。
 *
 * 主な機能:
 * - 作業（25分）、短い休憩（5分）、長い休憩（15分）の3フェーズ
 * - 4セッション完了後に長い休憩を自動挿入
 * - 開始/一時停止/リセット操作
 * - プログレスバーによる視覚的な進捗表示
 * - セッション数の表示
 * - カスタム時間設定
 * - Web Audio APIによるビープ音（タイマー完了時）
 * - スクリーンリーダー対応
 *
 * @returns ポモドーロタイマーページのReactコンポーネント
 */
function PomodoroTimer() {
  const DEFAULT_WORK_MINUTES = 25;
  const DEFAULT_SHORT_BREAK_MINUTES = 5;
  const DEFAULT_LONG_BREAK_MINUTES = 15;

  const [workMinutes, setWorkMinutes] = useState(DEFAULT_WORK_MINUTES);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(DEFAULT_SHORT_BREAK_MINUTES);
  const [longBreakMinutes, setLongBreakMinutes] = useState(DEFAULT_LONG_BREAK_MINUTES);

  const [phase, setPhase] = useState<Phase>("work");
  const [sessionCount, setSessionCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);

  /** 現在のフェーズの合計秒数を返す */
  const getTotalSeconds = useCallback(
    (p: Phase): number => {
      switch (p) {
        case "work":
          return workMinutes * 60;
        case "shortBreak":
          return shortBreakMinutes * 60;
        case "longBreak":
          return longBreakMinutes * 60;
      }
    },
    [workMinutes, shortBreakMinutes, longBreakMinutes],
  );

  const totalSeconds = getTotalSeconds(phase);
  const remaining = totalSeconds - elapsed;
  const progress = calculateProgress(elapsed, totalSeconds);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 5000);
    }
  }, []);

  /** Web Audio APIでビープ音を再生する */
  const playBeep = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioContext: typeof window.AudioContext =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof window.AudioContext })
          .webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.8);
    } catch {
      // Web Audio APIが使えない環境では無視
    }
  }, []);

  /** タイマー完了時の処理 */
  const handleTimerComplete = useCallback(
    (completedPhase: Phase, currentSessionCount: number) => {
      playBeep();
      let newSessionCount = currentSessionCount;
      if (completedPhase === "work") {
        newSessionCount = currentSessionCount + 1;
        setSessionCount(newSessionCount);
      }
      const next = getNextPhase(completedPhase, newSessionCount);
      setPhase(next);
      setElapsed(0);
      setIsRunning(false);
      announceStatus(
        `${getPhaseLabel(completedPhase)}が終了しました。次は${getPhaseLabel(next)}です。`,
      );
    },
    [playBeep, announceStatus],
  );

  // タイマーのインターバル制御
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= totalSeconds) {
            // フェーズ完了 - setStateをネストして呼ぶのを避けるためフラグで処理
            return next;
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, totalSeconds]);

  // elapsed が totalSeconds に達したときの処理
  useEffect(() => {
    if (elapsed >= totalSeconds && totalSeconds > 0 && isRunning) {
      setIsRunning(false);
      handleTimerComplete(phase, sessionCount);
    }
  }, [elapsed, totalSeconds, isRunning, phase, sessionCount, handleTimerComplete]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  // プログレスバーの幅をrefで更新
  useEffect(() => {
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${progress}%`;
    }
  }, [progress]);

  const handleStartPause = useCallback(() => {
    setIsRunning((prev) => {
      const next = !prev;
      announceStatus(next ? "タイマーを開始しました" : "タイマーを一時停止しました");
      return next;
    });
  }, [announceStatus]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    announceStatus("タイマーをリセットしました");
  }, [announceStatus]);

  const handleFullReset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setPhase("work");
    setSessionCount(0);
    announceStatus("全てリセットしました");
  }, [announceStatus]);

  /** セッションインジケーター（4個の丸）*/
  const sessionDots = Array.from({ length: 4 }, (_, i) => i + 1);
  const currentSessionInCycle = sessionCount % 4 || (phase !== "work" ? 4 : 0);

  return (
    <>
      <div className="tool-container">
        <div className="pomodoro-container">
          {/* フェーズインジケーター */}
          <div
            className={`pomodoro-phase-indicator ${phase === "work" ? "phase-work" : "phase-break"}`}
            role="status"
            aria-label={`現在のフェーズ: ${getPhaseLabel(phase)}`}
          >
            <span className="pomodoro-phase-label">{getPhaseLabel(phase)}</span>
          </div>

          {/* タイマー表示 */}
          <div
            className="pomodoro-timer-display"
            aria-label={`残り時間: ${formatTime(Math.max(0, remaining))}`}
          >
            <span className="pomodoro-time" aria-live="off">
              {formatTime(Math.max(0, remaining))}
            </span>
          </div>

          {/* プログレスバー */}
          <div
            className="pomodoro-progress-bar"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`進捗: ${Math.round(progress)}%`}
          >
            <div
              ref={progressFillRef}
              className={`pomodoro-progress-fill ${phase === "work" ? "progress-work" : "progress-break"}`}
            />
          </div>

          {/* セッション数 */}
          <div className="pomodoro-sessions" aria-label={`セッション: ${currentSessionInCycle}/4`}>
            <span className="pomodoro-sessions-label">セッション</span>
            <div className="pomodoro-session-dots" role="list" aria-label="セッション進捗">
              {sessionDots.map((dot) => (
                <span
                  key={dot}
                  role="listitem"
                  className={`pomodoro-session-dot ${dot <= currentSessionInCycle ? "dot-filled" : "dot-empty"}`}
                  aria-label={dot <= currentSessionInCycle ? "完了" : "未完了"}
                />
              ))}
            </div>
            <span className="pomodoro-sessions-count">{sessionCount} セッション完了</span>
          </div>

          {/* コントロールボタン */}
          <div className="pomodoro-controls" role="group" aria-label="タイマー操作">
            <Button
              type="button"
              className={`btn-large ${isRunning ? "btn-secondary" : "btn-primary"}`}
              onClick={handleStartPause}
              aria-pressed={isRunning}
            >
              {isRunning ? "一時停止" : "開始"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-medium"
              onClick={handleReset}
              aria-label="現在のフェーズをリセット"
            >
              リセット
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-medium btn-clear"
              onClick={handleFullReset}
              aria-label="全てをリセット（セッション数も含む）"
            >
              全リセット
            </Button>
          </div>

          {/* 設定セクション */}
          <div className="pomodoro-settings">
            <h2 className="section-title">時間設定</h2>
            <div className="pomodoro-setting-group">
              <label htmlFor="work-minutes">作業時間（分）:</label>
              <input
                type="number"
                id="work-minutes"
                min="1"
                max="60"
                value={workMinutes}
                disabled={isRunning}
                onChange={(e) =>
                  setWorkMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 25)))
                }
                aria-describedby="work-minutes-help"
              />
              <span id="work-minutes-help" className="sr-only">
                1から60分の間で作業時間を指定できます
              </span>
            </div>
            <div className="pomodoro-setting-group">
              <label htmlFor="short-break-minutes">短い休憩（分）:</label>
              <input
                type="number"
                id="short-break-minutes"
                min="1"
                max="30"
                value={shortBreakMinutes}
                disabled={isRunning}
                onChange={(e) =>
                  setShortBreakMinutes(Math.max(1, Math.min(30, parseInt(e.target.value) || 5)))
                }
                aria-describedby="short-break-help"
              />
              <span id="short-break-help" className="sr-only">
                1から30分の間で短い休憩時間を指定できます
              </span>
            </div>
            <div className="pomodoro-setting-group">
              <label htmlFor="long-break-minutes">長い休憩（分）:</label>
              <input
                type="number"
                id="long-break-minutes"
                min="1"
                max="60"
                value={longBreakMinutes}
                disabled={isRunning}
                onChange={(e) =>
                  setLongBreakMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 15)))
                }
                aria-describedby="long-break-help"
              />
              <span id="long-break-help" className="sr-only">
                1から60分の間で長い休憩時間を指定できます
              </span>
            </div>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "ポモドーロ・テクニックとは",
              items: [
                "フランチェスコ・シリロが1980年代に考案した時間管理術です",
                "25分の集中作業と5分の短い休憩を繰り返します",
                "4セッション完了後は15〜30分の長い休憩を取ります",
                "集中力の維持と疲労の軽減に効果的とされています",
              ],
            },
            {
              title: "使い方",
              items: [
                "「開始」ボタンでタイマーをスタートします",
                "25分間は作業に集中してください",
                "タイマーが鳴ったら短い休憩を取ります",
                "4セッション完了後は長い休憩を取ります",
                "時間設定から各フェーズの時間をカスタマイズできます",
              ],
            },
          ]}
        />
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}
