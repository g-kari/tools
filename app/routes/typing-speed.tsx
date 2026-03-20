import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

/** テスト時間の選択肢（秒） */
const DURATIONS = [15, 30, 60, 120] as const;
type Duration = (typeof DURATIONS)[number];

/** テキストカテゴリ */
const CATEGORIES = {
  english: "English",
  japanese: "日本語",
  programming: "コード",
} as const;
type Category = keyof typeof CATEGORIES;

/** サンプルテキスト */
const SAMPLE_TEXTS: Record<Category, string[]> = {
  english: [
    "The quick brown fox jumps over the lazy dog. Good programmers write code that humans can understand.",
    "First solve the problem then write the code. Any fool can write code that a computer can understand.",
    "Clean code is not written by following a set of rules. You know you are working on clean code when each routine you read turns out to be pretty much what you expected.",
    "Programming is the art of telling another human what one wants the computer to do. The most important property of a program is whether it accomplishes the intention of its user.",
  ],
  japanese: [
    "プログラミングとは、コンピュータに処理の手順を指示することです。コードの品質と可読性は非常に重要です。",
    "ウェブ開発では、フロントエンドとバックエンドの知識が求められます。パフォーマンスの最適化も欠かせません。",
    "良いコードを書くためには、まず問題をよく理解することが大切です。シンプルで読みやすいコードが最善です。",
    "オープンソースの世界では、多くの開発者が協力してソフトウェアを作り上げます。コードレビューは品質向上に欠かせません。",
  ],
  programming: [
    "const sum = (a, b) => a + b; const factorial = n => n <= 1 ? 1 : n * factorial(n - 1);",
    "function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }",
    "const unique = arr => [...new Set(arr)]; const flatten = arr => arr.reduce((a, b) => a.concat(b), []);",
    "async function fetchData(url) { try { const res = await fetch(url); return await res.json(); } catch (err) { console.error(err); throw err; } }",
  ],
};

/** 文字の入力状態 */
export type CharStatus = "pending" | "correct" | "incorrect";

/** テスト結果 */
export interface TestResult {
  /** WPM（Words Per Minute）*/
  wpm: number;
  /** 入力精度（%）*/
  accuracy: number;
  /** 正確に入力した文字数 */
  correctChars: number;
  /** ミスタイプした文字数 */
  incorrectChars: number;
  /** テスト時間（秒）*/
  duration: number;
  /** テキストカテゴリ */
  category: Category;
  /** タイムスタンプ */
  timestamp: number;
}

/**
 * WPMを計算する（1語=5文字換算）
 * @param correctChars - 正確に入力した文字数
 * @param elapsedSeconds - 経過時間（秒）
 * @returns WPM（0以上の整数）
 * @example
 * calculateWpm(300, 60) // 60 WPM
 * calculateWpm(0, 30)   // 0
 */
export function calculateWpm(
  correctChars: number,
  elapsedSeconds: number
): number {
  if (elapsedSeconds <= 0 || correctChars <= 0) return 0;
  return Math.round(correctChars / 5 / (elapsedSeconds / 60));
}

/**
 * 入力精度を計算する
 * @param correctChars - 正確に入力した文字数
 * @param totalTyped - 入力した合計文字数
 * @returns 精度（0〜100の整数）
 * @example
 * calculateAccuracy(90, 100) // 90
 * calculateAccuracy(0, 0)    // 100
 */
export function calculateAccuracy(
  correctChars: number,
  totalTyped: number
): number {
  if (totalTyped <= 0) return 100;
  return Math.round((correctChars / totalTyped) * 100);
}

/**
 * 各文字の入力状態を返す
 * @param target - 目標テキスト
 * @param typed - 入力済みテキスト
 * @returns 各文字のステータス配列
 * @example
 * getCharStatuses("hello", "helo") // ["correct","correct","correct","incorrect","pending"]
 */
export function getCharStatuses(target: string, typed: string): CharStatus[] {
  return target.split("").map((char, i) => {
    if (i >= typed.length) return "pending";
    return typed[i] === char ? "correct" : "incorrect";
  });
}

export const Route = createFileRoute("/typing-speed")({
  head: () => ({
    meta: [
      { title: "タイピング速度測定 | Web ツール集" },
      {
        name: "description",
        content:
          "タイピング速度（WPM）と精度をリアルタイムで測定するツール。日本語・プログラミングコード・英語テキストに対応。15秒から120秒まで選択可能。",
      },
      { property: "og:title", content: "タイピング速度測定 | Web ツール集" },
      {
        property: "og:description",
        content:
          "タイピング速度（WPM）と精度をリアルタイムで測定するツール。日本語・英語・コードに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/typing-speed` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "タイピング速度測定 | Web ツール集" },
      {
        name: "twitter:description",
        content: "タイピング速度（WPM）と精度をリアルタイムで測定するツール。",
      },
    ],
  }),
  component: TypingSpeed,
});

/**
 * タイピング速度測定ページコンポーネント
 *
 * WPM（Words Per Minute）と入力精度をリアルタイムで測定するツール。
 *
 * 主な機能:
 * - テスト時間の選択（15/30/60/120秒）
 * - テキスト種類の選択（英語/日本語/プログラミングコード）
 * - リアルタイムWPM・精度表示
 * - 各文字のカラーハイライト（正確/ミス/未入力/カーソル）
 * - テスト結果と直近履歴表示
 * - Escキーでキャンセル
 */
function TypingSpeed() {
  const [testState, setTestState] = useState<"idle" | "running" | "completed">(
    "idle"
  );
  const [duration, setDuration] = useState<Duration>(60);
  const [category, setCategory] = useState<Category>("english");
  const [textIndex, setTextIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [results, setResults] = useState<TestResult[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);

  /** 現在の目標テキスト */
  const targetText = useMemo(() => {
    const texts = SAMPLE_TEXTS[category];
    return texts[textIndex % texts.length];
  }, [category, textIndex]);

  /** 各文字の状態 */
  const charStatuses = useMemo(
    () => getCharStatuses(targetText, typed),
    [targetText, typed]
  );

  /** 正確な文字数 */
  const correctChars = useMemo(
    () => charStatuses.filter((s) => s === "correct").length,
    [charStatuses]
  );

  const incorrectChars = typed.length - correctChars;
  const elapsedSeconds = Math.max(
    1,
    (Date.now() - startTimeRef.current) / 1000
  );
  const realtimeWpm =
    testState === "running" ? calculateWpm(correctChars, elapsedSeconds) : 0;
  const realtimeAccuracy = calculateAccuracy(correctChars, typed.length);

  /** テスト結果を保存する */
  const saveResult = useCallback(
    (currentTyped: string, elapsedSec: number) => {
      const statuses = getCharStatuses(targetText, currentTyped);
      const correct = statuses.filter((s) => s === "correct").length;
      const incorrect = currentTyped.length - correct;
      const wpm = calculateWpm(correct, Math.max(1, elapsedSec));
      const accuracy = calculateAccuracy(correct, currentTyped.length);
      setResults((prev) => [
        {
          wpm,
          accuracy,
          correctChars: correct,
          incorrectChars: incorrect,
          duration,
          category,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 4),
      ]);
    },
    [targetText, duration, category]
  );

  /** タイマー（runningのときだけ動く） */
  useEffect(() => {
    if (testState !== "running") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [testState]);

  /** 時間切れ処理 */
  useEffect(() => {
    if (testState === "running" && timeLeft === 0) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      saveResult(typed, elapsed);
      setTestState("completed");
    }
  }, [testState, timeLeft, typed, saveResult]);

  /** テスト開始 */
  const startTest = useCallback(() => {
    setTyped("");
    setTimeLeft(duration);
    setTestState("running");
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [duration]);

  /** テストリセット（次のテキストへ） */
  const resetTest = useCallback(() => {
    setTyped("");
    setTimeLeft(duration);
    setTestState("idle");
    setTextIndex((prev) => prev + 1);
  }, [duration]);

  /** 入力ハンドラ */
  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (testState !== "running") return;
      const value = e.target.value;
      if (value.length > targetText.length) return;
      setTyped(value);
      if (value === targetText) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        saveResult(value, elapsed);
        setTestState("completed");
      }
    },
    [testState, targetText, saveResult]
  );

  /** キーボードショートカット */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") resetTest();
    },
    [resetTest]
  );

  /** idleのときdurationに合わせてtimeLeftを更新 */
  useEffect(() => {
    if (testState === "idle") {
      setTimeLeft(duration);
    }
  }, [duration, testState]);

  const timerPercent = (timeLeft / duration) * 100;
  const currentIndex = typed.length;

  return (
    <>
      <div className="tool-container">
        {/* 設定 */}
        <div className="converter-section">
          <h2 className="section-title">設定</h2>
          <div className="typing-settings">
            <div className="typing-setting-group">
              <label>テスト時間:</label>
              <div
                className="preset-buttons"
                role="group"
                aria-label="テスト時間選択"
              >
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`btn-preset ${duration === d ? "active" : ""}`}
                    onClick={() => setDuration(d)}
                    disabled={testState === "running"}
                    aria-pressed={duration === d}
                  >
                    {d}秒
                  </button>
                ))}
              </div>
            </div>
            <div className="typing-setting-group">
              <label>テキスト:</label>
              <div
                className="preset-buttons"
                role="group"
                aria-label="テキスト種類選択"
              >
                {(Object.entries(CATEGORIES) as [Category, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`btn-preset ${category === key ? "active" : ""}`}
                      onClick={() => {
                        setCategory(key);
                        setTyped("");
                        setTextIndex(0);
                        setTimeLeft(duration);
                        setTestState("idle");
                      }}
                      disabled={testState === "running"}
                      aria-pressed={category === key}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* タイマー */}
        <div className="converter-section">
          <div className="typing-timer-bar">
            <div className="typing-timer-display">
              <span className="typing-timer-value" aria-live="off">
                {timeLeft}
              </span>
              <span className="typing-timer-unit">秒</span>
            </div>
            <div
              className="typing-timer-progress"
              role="progressbar"
              aria-valuenow={timeLeft}
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-label={`残り時間: ${timeLeft}秒`}
            >
              <div
                className="typing-timer-fill"
                style={{ '--timer-width': `${timerPercent}%` } as React.CSSProperties}
              />
            </div>
          </div>

          {testState === "running" && (
            <div
              className="typing-live-stats"
              role="status"
              aria-live="polite"
              aria-label={`WPM: ${realtimeWpm}, 精度: ${realtimeAccuracy}%`}
            >
              <div className="typing-stat">
                <span className="typing-stat-value">{realtimeWpm}</span>
                <span className="typing-stat-label">WPM</span>
              </div>
              <div className="typing-stat">
                <span className="typing-stat-value">{realtimeAccuracy}%</span>
                <span className="typing-stat-label">精度</span>
              </div>
              <div className="typing-stat">
                <span className="typing-stat-value typing-count-correct">
                  {correctChars}
                </span>
                <span className="typing-stat-label">正確</span>
              </div>
              <div className="typing-stat">
                <span
                  className={`typing-stat-value ${incorrectChars > 0 ? "typing-count-incorrect" : ""}`}
                >
                  {incorrectChars}
                </span>
                <span className="typing-stat-label">ミス</span>
              </div>
            </div>
          )}
        </div>

        {/* テキスト入力エリア */}
        {testState !== "completed" && (
          <div className="converter-section">
            <div
              className={`typing-text-display ${testState === "running" ? "typing-display-active" : ""}`}
              onClick={() =>
                testState === "running" && inputRef.current?.focus()
              }
              aria-label="タイピングテキスト"
              role="presentation"
            >
              {testState === "idle" && (
                <span className="typing-start-hint">
                  「テスト開始」をクリックして開始してください
                </span>
              )}
              {testState === "running" &&
                targetText.split("").map((char, i) => {
                  const status = charStatuses[i];
                  const isCursor = i === currentIndex;
                  return (
                    <span
                      key={i}
                      className={`typing-char typing-char-${status}${isCursor ? " typing-char-cursor" : ""}`}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  );
                })}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              disabled={testState !== "running"}
              className="typing-hidden-input"
              aria-label="タイピング入力"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-testid="typing-input"
            />

            <div className="typing-actions">
              {testState === "idle" && (
                <Button
                  type="button"
                  className="btn-large btn-primary"
                  onClick={startTest}
                >
                  テスト開始
                </Button>
              )}
              {testState === "running" && (
                <Button type="button" variant="outline" onClick={resetTest}>
                  キャンセル (Esc)
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 結果 */}
        {testState === "completed" && results.length > 0 && (
          <div className="converter-section">
            <h2 className="section-title">結果</h2>
            <div className="typing-result-card">
              <div className="typing-result-wpm-block">
                <span className="typing-result-wpm-value">
                  {results[0].wpm}
                </span>
                <span className="typing-result-wpm-label">WPM</span>
              </div>
              <div className="typing-result-stats">
                <div className="typing-result-stat">
                  <span className="typing-result-stat-label">精度</span>
                  <span className="typing-result-stat-value">
                    {results[0].accuracy}%
                  </span>
                </div>
                <div className="typing-result-stat">
                  <span className="typing-result-stat-label">正確な文字</span>
                  <span className="typing-result-stat-value typing-count-correct">
                    {results[0].correctChars}
                  </span>
                </div>
                <div className="typing-result-stat">
                  <span className="typing-result-stat-label">ミス</span>
                  <span
                    className={`typing-result-stat-value ${results[0].incorrectChars > 0 ? "typing-count-incorrect" : ""}`}
                  >
                    {results[0].incorrectChars}
                  </span>
                </div>
                <div className="typing-result-stat">
                  <span className="typing-result-stat-label">時間</span>
                  <span className="typing-result-stat-value">
                    {results[0].duration}秒
                  </span>
                </div>
              </div>
            </div>
            <div className="typing-actions">
              <Button
                type="button"
                className="btn-large btn-primary"
                onClick={resetTest}
              >
                もう一度
              </Button>
            </div>
          </div>
        )}

        {/* 履歴 */}
        {results.length > 1 && (
          <div className="converter-section">
            <h2 className="section-title">直近の結果</h2>
            <div className="typing-history" role="list">
              {results.map((result) => (
                <div
                  key={result.timestamp}
                  className="typing-history-item"
                  role="listitem"
                >
                  <span className="typing-history-wpm">{result.wpm} WPM</span>
                  <span className="typing-history-accuracy">
                    {result.accuracy}%
                  </span>
                  <span className="typing-history-meta">
                    {result.duration}秒 &bull; {CATEGORIES[result.category]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "タイピング速度について",
              items: [
                "WPM（Words Per Minute）は1分間の入力単語数（1語=5文字換算）",
                "一般的な成人の平均は35〜45 WPM程度",
                "プログラマーの平均は50〜80 WPM",
                "100 WPM以上は上級者レベル",
              ],
            },
            {
              title: "使い方",
              items: [
                "テスト時間とテキスト種類を選択",
                "「テスト開始」をクリックしてタイマーをスタート",
                "表示されたテキストを正確・素早く入力",
                "Escキーでキャンセル可能",
                "テキストを入力し終えるか時間切れで結果表示",
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
