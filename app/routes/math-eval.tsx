import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import {
  StatusAnnouncer,
  useStatusAnnouncement,
} from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import { useToast } from "~/components/Toast";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import {
  evaluateExpression,
  addToHistory,
  getSampleExpressions,
  getSupportedConstants,
  type HistoryEntry,
} from "~/utils/math-eval";

export const Route = createFileRoute("/math-eval")({
  head: () => ({
    meta: [
      { title: "数式評価ツール | Web ツール集" },
      {
        name: "description",
        content:
          "数式をリアルタイムで評価するツール。四則演算・三角関数・対数・べき乗など多彩な演算に対応。",
      },
      {
        property: "og:title",
        content: "数式評価ツール | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "数式をリアルタイムで評価するツール。sin・cos・sqrt・log・PI・Eなどに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/math-eval` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
    ],
  }),
  component: MathEval,
});

/**
 * 数式評価ツールページコンポーネント
 */
function MathEval() {
  const { copy } = useClipboard();
  const { showToast } = useToast();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const samples = useMemo(() => getSampleExpressions(), []);
  const supportedConstants = useMemo(() => getSupportedConstants(), []);

  const result = useMemo(
    () => (expression.trim() ? evaluateExpression(expression) : null),
    [expression]
  );

  const handleEvaluate = useCallback(() => {
    if (!result || result.error || result.value === null) return;
    setHistory((prev) =>
      addToHistory(prev, expression, result.formatted)
    );
    announceStatus(`計算結果: ${result.formatted}`);
  }, [result, expression, announceStatus]);

  const handleCopy = useCallback(async () => {
    if (!result?.formatted) return;
    const success = await copy(result.formatted);
    if (success) {
      showToast("結果をコピーしました", "success");
      announceStatus("結果をコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [result, copy, showToast, announceStatus]);

  const handleHistoryClick = useCallback((entry: HistoryEntry) => {
    setExpression(entry.expression);
  }, []);

  const handleSampleClick = useCallback((expr: string) => {
    setExpression(expr);
  }, []);

  useKeyboardShortcut("Enter", handleEvaluate, {
    ctrl: true,
    disabled: !result || !!result.error || result.value === null,
  });

  const hasResult = result !== null && result.error === null && result.value !== null;
  const hasError = result !== null && result.error !== null;

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <label htmlFor="math-input" className="section-title">
            数式を入力
          </label>
          <input
            id="math-input"
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="例: sqrt(3^2 + 4^2)"
            aria-describedby="math-input-hint"
            aria-invalid={hasError ? "true" : undefined}
          />
          <p id="math-input-hint" className="me-input-hint">
            入力すると自動的に評価されます。Ctrl+Enterで履歴に追加。
          </p>
        </div>

        <div className="me-sample-buttons" role="group" aria-label="サンプル数式">
          {samples.map((sample) => (
            <button
              key={sample.label}
              className="me-sample-btn"
              onClick={() => handleSampleClick(sample.expression)}
              aria-label={`サンプル: ${sample.label} (${sample.expression})`}
              title={sample.expression}
            >
              {sample.label}
            </button>
          ))}
        </div>

        {hasResult && (
          <div
            className="me-result-wrapper"
            aria-label="計算結果"
            aria-live="polite"
          >
            <div className="me-result-header">
              <span className="me-result-label">結果</span>
            </div>
            <span className="me-result-value" aria-label={`計算結果: ${result.formatted}`}>
              {result.formatted}
            </span>
            <div className="me-result-action-row">
              <button
                className="me-copy-btn"
                onClick={handleCopy}
                aria-label="結果をクリップボードにコピー"
              >
                コピー
              </button>
            </div>
          </div>
        )}

        {hasError && (
          <div
            className="me-error-wrapper"
            role="alert"
            aria-live="assertive"
            aria-label="エラー"
          >
            <p className="me-error-message">⚠ {result.error}</p>
          </div>
        )}

        {!expression.trim() && (
          <div className="me-empty-state" aria-live="polite">
            <p>数式を入力すると、結果がリアルタイムで表示されます</p>
          </div>
        )}

        {history.length > 0 && (
          <div className="me-history-section">
            <p className="me-history-title">計算履歴</p>
            <ul className="me-history-list" aria-label="計算履歴">
              {history.map((entry) => (
                <li
                  key={entry.timestamp}
                  className="me-history-item"
                  onClick={() => handleHistoryClick(entry)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleHistoryClick(entry);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${entry.expression} = ${entry.result}（クリックで数式を再入力）`}
                >
                  <span className="me-history-expr">{entry.expression}</span>
                  <span className="me-history-result">= {entry.result}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "数式を入力すると自動的に評価されます",
                "Ctrl+Enterで計算結果を履歴に追加できます",
                "サンプルボタンをクリックするとサンプル数式を入力できます",
                "履歴の行をクリックすると数式を再入力できます",
              ],
            },
            {
              title: "サポートする演算子",
              items: [
                "+ - * / : 四則演算",
                "^ : べき乗（例: 2^10 = 1024）",
                "% : 剰余（例: 10 % 3 = 1）",
                "括弧 () で優先順位を指定",
              ],
            },
            {
              title: "サポートする関数",
              items: [
                "三角関数: sin, cos, tan, asin, acos, atan",
                "べき乗・根: sqrt, cbrt, pow, exp",
                "対数: log, log2, log10",
                "その他: abs, ceil, floor, round, max, min",
                `定数: ${Object.entries(supportedConstants).map(([k, v]) => `${k} = ${typeof v === "number" && !Number.isInteger(v) ? v.toFixed(4) : v}`).join(", ")}`,
              ],
            },
            {
              title: "使用例",
              items: samples.map((s) => `${s.label}: ${s.expression}`),
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
