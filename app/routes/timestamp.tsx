import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/timestamp")({
  head: () => ({
    meta: [{ title: "タイムスタンプ変換ツール" }],
  }),
  component: TimestampConverter,
});

/**
 * タイムスタンプ文字列を解析して秒・ミリ秒を返す
 * 13桁以上の数値はミリ秒、それ未満は秒として扱う
 * @param input - 入力文字列（数値文字列）
 * @returns 秒とミリ秒のオブジェクト、または無効な場合はnull
 */
export function parseTimestamp(
  input: string
): { seconds: number; milliseconds: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const num = Number(trimmed);
  if (!Number.isFinite(num) || isNaN(num)) return null;

  // 13桁以上はミリ秒、それ未満は秒（先頭のマイナス符号を除いて桁数を判定）
  const isMilliseconds = trimmed.replace(/^-/, "").length >= 13;
  const seconds = isMilliseconds ? Math.floor(num / 1000) : Math.floor(num);
  const milliseconds = isMilliseconds ? num : num * 1000;

  return { seconds, milliseconds };
}

/**
 * Unixタイムスタンプ（秒）からUTC・JST・相対時刻の文字列を生成する
 * @param seconds - Unixタイムスタンプ（秒）
 * @returns UTC日時文字列・JST日時文字列・相対時刻文字列のオブジェクト
 */
export function formatTimestampResult(seconds: number): {
  utc: string;
  jst: string;
  relative: string;
} {
  const date = new Date(seconds * 1000);

  const utc = date.toISOString().replace("T", " ").replace("Z", " UTC");

  const jst = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\//g, "-")
    .concat(" JST");

  const relative = formatRelativeTime(seconds);

  return { utc, jst, relative };
}

/**
 * Unixタイムスタンプ（秒）から相対時刻文字列を生成する
 * @param seconds - Unixタイムスタンプ（秒）
 * @returns 「2時間前」「3日後」などの相対時刻文字列
 */
export function formatRelativeTime(seconds: number): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const diffSeconds = seconds - nowSeconds;
  const absDiff = Math.abs(diffSeconds);
  const isFuture = diffSeconds > 0;

  const suffix = isFuture ? "後" : "前";

  if (absDiff < 60) {
    return `${absDiff}秒${suffix}`;
  } else if (absDiff < 3600) {
    const minutes = Math.floor(absDiff / 60);
    return `${minutes}分${suffix}`;
  } else if (absDiff < 86400) {
    const hours = Math.floor(absDiff / 3600);
    return `${hours}時間${suffix}`;
  } else if (absDiff < 86400 * 30) {
    const days = Math.floor(absDiff / 86400);
    return `${days}日${suffix}`;
  } else if (absDiff < 86400 * 365) {
    const months = Math.floor(absDiff / (86400 * 30));
    return `${months}ヶ月${suffix}`;
  } else {
    const years = Math.floor(absDiff / (86400 * 365));
    return `${years}年${suffix}`;
  }
}

/**
 * datetime-local形式の文字列からUnixタイムスタンプ（秒・ミリ秒）を生成する
 * @param dateStr - datetime-local形式の文字列（例: "2024-01-01T12:00"）
 * @returns 秒とミリ秒のオブジェクト
 */
export function dateToTimestamp(dateStr: string): {
  seconds: number;
  milliseconds: number;
} {
  const date = new Date(dateStr);
  const milliseconds = date.getTime();
  const seconds = Math.floor(milliseconds / 1000);
  return { seconds, milliseconds };
}

/**
 * Unixタイムスタンプ ↔ 日時形式の変換コンポーネント
 */
function TimestampConverter() {
  const { showToast } = useToast();
  const [tsInput, setTsInput] = useState("");
  const [tsResult, setTsResult] = useState<{
    utc: string;
    jst: string;
    relative: string;
    seconds: number;
    milliseconds: number;
  } | null>(null);

  const [dateInput, setDateInput] = useState("");
  const [dateResult, setDateResult] = useState<{
    seconds: number;
    milliseconds: number;
  } | null>(null);

  const tsInputRef = useRef<HTMLInputElement>(null);
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleConvertToDate = useCallback(() => {
    if (!tsInput.trim()) {
      announceStatus("エラー: タイムスタンプを入力してください");
      showToast("タイムスタンプを入力してください", "error");
      tsInputRef.current?.focus();
      return;
    }

    const parsed = parseTimestamp(tsInput);
    if (!parsed) {
      announceStatus("エラー: 有効な数値を入力してください");
      showToast("有効な数値を入力してください", "error");
      tsInputRef.current?.focus();
      return;
    }

    const formatted = formatTimestampResult(parsed.seconds);
    setTsResult({
      ...formatted,
      seconds: parsed.seconds,
      milliseconds: parsed.milliseconds,
    });
    announceStatus("日時への変換が完了しました");
  }, [tsInput, announceStatus, showToast]);

  const handleSetCurrentTime = useCallback(() => {
    const nowMs = Date.now();
    setTsInput(String(Math.floor(nowMs / 1000)));
    announceStatus("現在時刻のタイムスタンプを設定しました");
  }, [announceStatus]);

  const handleConvertToTimestamp = useCallback(() => {
    if (!dateInput) {
      announceStatus("エラー: 日時を入力してください");
      showToast("日時を入力してください", "error");
      return;
    }

    const result = dateToTimestamp(dateInput);
    if (!Number.isFinite(result.seconds)) {
      announceStatus("エラー: 有効な日時を入力してください");
      showToast("有効な日時を入力してください", "error");
      return;
    }

    setDateResult(result);
    announceStatus("タイムスタンプへの変換が完了しました");
  }, [dateInput, announceStatus, showToast]);

  const handleCopyToClipboard = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label}をコピーしました`, "success");
        announceStatus(`${label}をクリップボードにコピーしました`);
      } catch {
        showToast("コピーに失敗しました", "error");
      }
    },
    [showToast, announceStatus]
  );

  // Ctrl+Enter でタイムスタンプ→日時変換
  useKeyboardShortcut("Enter", handleConvertToDate, { ctrl: true });

  useEffect(() => {
    tsInputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="timestamp-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="タイムスタンプ変換フォーム">
          {/* タイムスタンプ → 日時 */}
          <section
            className="timestamp-section"
            aria-labelledby="ts-to-date-heading"
          >
            <h2 id="ts-to-date-heading" className="section-title">
              タイムスタンプ → 日時
            </h2>

            <div className="timestamp-input-row">
              <label htmlFor="ts-input" className="sr-only">
                Unixタイムスタンプ
              </label>
              <input
                id="ts-input"
                ref={tsInputRef}
                type="text"
                className="timestamp-input"
                value={tsInput}
                onChange={(e) => setTsInput(e.target.value)}
                placeholder="例: 1700000000 または 1700000000000"
                aria-describedby="ts-input-help"
                aria-label="Unixタイムスタンプを入力"
                inputMode="numeric"
              />
              <Button
                type="button"
                variant="secondary"
                className="btn-secondary"
                onClick={handleSetCurrentTime}
                aria-label="現在時刻のタイムスタンプを入力欄に設定"
              >
                現在時刻
              </Button>
            </div>
            <span id="ts-input-help" className="sr-only">
              秒またはミリ秒のUnixタイムスタンプを入力してください。13桁以上はミリ秒として自動判定されます
            </span>

            <div className="button-group" role="group" aria-label="変換操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleConvertToDate}
                aria-label="タイムスタンプを日時形式に変換"
              >
                → 日時に変換
              </Button>
            </div>

            {tsResult && (
              <div
                className="timestamp-result"
                aria-live="polite"
                aria-label="変換結果"
              >
                <div className="timestamp-result-row">
                  <span className="timestamp-result-label">UTC</span>
                  <span className="timestamp-result-value">{tsResult.utc}</span>
                  <button
                    type="button"
                    className="timestamp-copy-button"
                    onClick={() => handleCopyToClipboard(tsResult.utc, "UTC日時")}
                    aria-label="UTC日時をコピー"
                  >
                    コピー
                  </button>
                </div>
                <div className="timestamp-result-row">
                  <span className="timestamp-result-label">JST</span>
                  <span className="timestamp-result-value">{tsResult.jst}</span>
                  <button
                    type="button"
                    className="timestamp-copy-button"
                    onClick={() => handleCopyToClipboard(tsResult.jst, "JST日時")}
                    aria-label="JST日時をコピー"
                  >
                    コピー
                  </button>
                </div>
                <div className="timestamp-result-row">
                  <span className="timestamp-result-label">相対</span>
                  <span className="timestamp-result-value">
                    {tsResult.relative}
                  </span>
                </div>
                <div className="timestamp-result-row">
                  <span className="timestamp-result-label">秒</span>
                  <span className="timestamp-result-value">
                    {tsResult.seconds}
                  </span>
                  <button
                    type="button"
                    className="timestamp-copy-button"
                    onClick={() =>
                      handleCopyToClipboard(
                        String(tsResult.seconds),
                        "秒タイムスタンプ"
                      )
                    }
                    aria-label="秒タイムスタンプをコピー"
                  >
                    コピー
                  </button>
                </div>
                <div className="timestamp-result-row">
                  <span className="timestamp-result-label">ミリ秒</span>
                  <span className="timestamp-result-value">
                    {tsResult.milliseconds}
                  </span>
                  <button
                    type="button"
                    className="timestamp-copy-button"
                    onClick={() =>
                      handleCopyToClipboard(
                        String(tsResult.milliseconds),
                        "ミリ秒タイムスタンプ"
                      )
                    }
                    aria-label="ミリ秒タイムスタンプをコピー"
                  >
                    コピー
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="timestamp-divider" role="separator" aria-hidden="true" />

          {/* 日時 → タイムスタンプ */}
          <section
            className="timestamp-section"
            aria-labelledby="date-to-ts-heading"
          >
            <h2 id="date-to-ts-heading" className="section-title">
              日時 → タイムスタンプ
            </h2>

            <div className="timestamp-input-row">
              <label htmlFor="date-input" className="sr-only">
                日時入力
              </label>
              <input
                id="date-input"
                type="datetime-local"
                className="timestamp-input"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                aria-describedby="date-input-help"
                aria-label="変換する日時を入力"
              />
            </div>
            <span id="date-input-help" className="sr-only">
              変換したい日時を選択または入力してください
            </span>

            <div className="button-group" role="group" aria-label="変換操作">
              <Button
                type="button"
                className="btn-primary"
                onClick={handleConvertToTimestamp}
                aria-label="日時をUnixタイムスタンプに変換"
              >
                → タイムスタンプに変換
              </Button>
            </div>

            {dateResult && (
              <div
                className="timestamp-result"
                aria-live="polite"
                aria-label="変換結果"
              >
                <div className="timestamp-result-row">
                  <span className="timestamp-result-label">秒</span>
                  <span className="timestamp-result-value">
                    {dateResult.seconds}
                  </span>
                  <button
                    type="button"
                    className="timestamp-copy-button"
                    onClick={() =>
                      handleCopyToClipboard(
                        String(dateResult.seconds),
                        "秒タイムスタンプ"
                      )
                    }
                    aria-label="秒タイムスタンプをコピー"
                  >
                    コピー
                  </button>
                </div>
                <div className="timestamp-result-row">
                  <span className="timestamp-result-label">ミリ秒</span>
                  <span className="timestamp-result-value">
                    {dateResult.milliseconds}
                  </span>
                  <button
                    type="button"
                    className="timestamp-copy-button"
                    onClick={() =>
                      handleCopyToClipboard(
                        String(dateResult.milliseconds),
                        "ミリ秒タイムスタンプ"
                      )
                    }
                    aria-label="ミリ秒タイムスタンプをコピー"
                  >
                    コピー
                  </button>
                </div>
              </div>
            )}
          </section>
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「タイムスタンプ」欄に秒またはミリ秒のUnix時刻を入力して「→ 日時に変換」",
                "「現在時刻」ボタンで現在のUnixタイムスタンプを入力欄に自動入力",
                "13桁以上の数値は自動的にミリ秒として判定されます",
                "「日時 → タイムスタンプ」では日時ピッカーで日時を選択して変換",
                "各値の右側の「コピー」ボタンでクリップボードにコピー可能",
                "キーボードショートカット: Ctrl+Enter でタイムスタンプ→日時変換",
              ],
            },
            {
              title: "Unixタイムスタンプとは",
              items: [
                "1970年1月1日 00:00:00 UTC（UNIXエポック）からの経過秒数",
                "秒単位 (10桁): 1700000000 → 2023-11-14 22:13:20 UTC",
                "ミリ秒単位 (13桁): 1700000000000 → 2023-11-14 22:13:20 UTC",
                "プログラミングやデータベースで広く使われる日時表現形式",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
