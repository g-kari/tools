import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { parseCron, CRON_FIELDS, CRON_PRESETS, type CronParseResult } from "../utils/cron";

export const Route = createFileRoute("/cron")({
  head: () => ({
    meta: [
      { title: "Cron式パーサー | Web ツール集" },
      {
        name: "description",
        content: "Cron式を入力して次回実行時刻を計算するツール。プリセット選択・日本語説明表示対応",
      },
      {
        property: "og:title",
        content: "Cron式パーサー | Web ツール集",
      },
      {
        property: "og:description",
        content: "Cron式を入力して次回実行時刻を計算するツール。プリセット選択・日本語説明表示対応",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/cron` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: CronParserPage,
});

/** 次回実行時刻の表示フォーマット */
function formatDateTime(date: Date): string {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const wd = weekdays[date.getDay()];
  return `${y}/${mo}/${d}（${wd}） ${h}:${m}`;
}

/**
 * Cron式パーサーコンポーネント
 * Cron式の入力・バリデーション・次回実行時刻の表示を行う
 */
function CronParserPage() {
  const [cronInput, setCronInput] = useState<string>("");
  const [parseResult, setParseResult] = useState<CronParseResult | null>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();
  const { showToast } = useToast();

  /** リアルタイムパース: 入力変更時に自動解析 */
  useEffect(() => {
    if (!cronInput.trim()) {
      setParseResult(null);
      return;
    }
    const result = parseCron(cronInput);
    setParseResult(result);
  }, [cronInput]);

  /** プリセット選択時の処理 */
  const handlePreset = useCallback(
    (value: string) => {
      setCronInput(value);
      announceStatus(`プリセット「${value}」を選択しました`);
    },
    [announceStatus],
  );

  /** クリアボタン押下時の処理 */
  const handleClear = useCallback(() => {
    setCronInput("");
    setParseResult(null);
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  /** Cron式をクリップボードにコピー */
  const handleCopyCron = useCallback(async () => {
    if (!cronInput.trim()) return;
    const success = await copy(cronInput);
    if (success) {
      showToast("Cron式をコピーしました", "success");
      announceStatus("Cron式をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [cronInput, copy, showToast, announceStatus]);

  /** 次回実行時刻一覧をクリップボードにコピー */
  const handleCopyTimes = useCallback(async () => {
    if (!parseResult?.isValid || parseResult.nextRuns.length === 0) return;
    const text = parseResult.nextRuns.map(formatDateTime).join("\n");
    const success = await copy(text);
    if (success) {
      showToast("次回実行時刻をコピーしました", "success");
      announceStatus("次回実行時刻をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [parseResult, copy, showToast, announceStatus]);

  return (
    <>
      <div className="tool-container">
        <h2 className="section-title">Cron式パーサー</h2>

        {/* プリセット選択セクション */}
        <section className="cron-preset-section" aria-label="プリセット選択">
          <h3 className="cron-subsection-title">プリセット</h3>
          <div
            className="cron-preset-grid"
            role="group"
            aria-label="よく使うCron式のプリセット一覧"
          >
            {CRON_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`cron-preset-btn${cronInput === preset.value ? " cron-preset-btn--active" : ""}`}
                onClick={() => handlePreset(preset.value)}
                aria-label={`${preset.label}（${preset.value}）`}
                aria-pressed={cronInput === preset.value}
              >
                <span className="cron-preset-label">{preset.label}</span>
                <span className="cron-preset-value">{preset.value}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Cron式入力セクション */}
        <section className="cron-input-section" aria-label="Cron式入力">
          <div className="cron-input-header">
            <label htmlFor="cron-expression" className="cron-subsection-title">
              Cron式を入力
            </label>
            <Button
              variant="outline"
              onClick={handleCopyCron}
              disabled={!cronInput.trim()}
              aria-label="Cron式をクリップボードにコピー"
            >
              コピー
            </Button>
          </div>

          {/* フィールドラベル */}
          <div className="cron-field-hint" aria-hidden="true">
            {CRON_FIELDS.map((field) => (
              <span key={field.name} className="cron-field-hint-item">
                <span className="cron-field-hint-label">{field.label}</span>
                <span className="cron-field-hint-range">{field.description}</span>
              </span>
            ))}
          </div>

          <input
            id="cron-expression"
            type="text"
            className="cron-input"
            value={cronInput}
            onChange={(e) => setCronInput(e.target.value)}
            placeholder="* * * * *"
            aria-describedby={
              parseResult?.error
                ? "cron-error-msg"
                : parseResult?.isValid
                  ? "cron-desc-msg"
                  : "cron-field-hint"
            }
            aria-invalid={parseResult && !parseResult.isValid ? "true" : "false"}
            aria-label="Cron式入力フィールド（分 時 日 月 曜日）"
            autoComplete="off"
            spellCheck="false"
          />

          <span id="cron-field-hint" className="sr-only">
            5フィールド形式（分 時 日 月 曜日）でCron式を入力してください。例: 0 9 * * *
          </span>

          {/* エラーメッセージ */}
          {parseResult && !parseResult.isValid && (
            <div id="cron-error-msg" className="cron-error" role="alert" aria-live="assertive">
              {parseResult.error}
            </div>
          )}

          {/* 日本語説明 */}
          {parseResult?.isValid && parseResult.description && (
            <div id="cron-desc-msg" className="cron-description" aria-live="polite">
              {parseResult.description}
            </div>
          )}
        </section>

        {/* 次回実行時刻セクション */}
        <section className="cron-result-section" aria-label="次回実行時刻">
          <div className="cron-result-header">
            <h3 className="cron-subsection-title" id="cron-next-runs-title">
              次回実行時刻（10件）
            </h3>
            {parseResult?.isValid && parseResult.nextRuns.length > 0 && (
              <Button
                variant="outline"
                onClick={handleCopyTimes}
                aria-label="次回実行時刻一覧をクリップボードにコピー"
              >
                一覧コピー
              </Button>
            )}
          </div>

          {parseResult?.isValid && parseResult.nextRuns.length > 0 ? (
            <ol
              className="cron-next-runs"
              aria-labelledby="cron-next-runs-title"
              aria-live="polite"
            >
              {parseResult.nextRuns.map((date, index) => (
                <li key={index} className="cron-next-run-item">
                  <span className="cron-next-run-index" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="cron-next-run-value">{formatDateTime(date)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="cron-empty" aria-live="polite">
              {!cronInput.trim()
                ? "Cron式を入力すると次回実行時刻が表示されます"
                : parseResult && !parseResult.isValid
                  ? "有効なCron式を入力してください"
                  : "次回実行予定はありません"}
            </p>
          )}
        </section>

        {/* アクションボタン */}
        <div className="cron-actions">
          <Button variant="outline" onClick={handleClear} aria-label="入力をリセット">
            リセット
          </Button>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "プリセットから選択するか、Cron式を直接入力してください",
                "入力と同時にリアルタイムで次回実行時刻10件を表示します",
                "「コピー」でCron式をクリップボードにコピーできます",
                "「一覧コピー」で次回実行時刻を一括コピーできます",
              ],
            },
            {
              title: "Cron式の書き方",
              items: [
                "書式: 分(0-59) 時(0-23) 日(1-31) 月(1-12) 曜日(0-7)",
                "* : 全ての値（例: * * * * * = 毎分実行）",
                "*/n : n ごと（例: */15 = 15分ごと）",
                "a-b : 範囲（例: 1-5 = 月〜金曜日）",
                "a,b,c : 列挙（例: 0,30 = 0分と30分）",
                "曜日: 0と7が日曜、1=月、2=火、3=水、4=木、5=金、6=土",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
