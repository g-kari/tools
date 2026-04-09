import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useMemo, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";
import { useClipboard } from "~/hooks/useClipboard";
import {
  detectLineEnding,
  convertLineEnding,
  LINE_ENDING_LABELS,
  type LineEnding,
} from "~/utils/line-ending";
import "~/styles/tools/line-ending.css";

export const Route = createFileRoute("/line-ending")({
  head: () => ({
    meta: [
      { title: "改行コード変換 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストの改行コード（CRLF・LF・CR）を検出して相互変換するツール。Windows/Unix/旧Mac形式に対応。",
      },
      { property: "og:title", content: "改行コード変換 | Web ツール集" },
      {
        property: "og:description",
        content:
          "テキストの改行コード（CRLF・LF・CR）を検出して相互変換するツール。Windows/Unix/旧Mac形式に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/line-ending` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "改行コード変換 | Web ツール集" },
      {
        name: "twitter:description",
        content: "テキストの改行コード（CRLF・LF・CR）を検出して相互変換するツール。",
      },
    ],
  }),
  component: LineEndingTool,
});

const TARGET_OPTIONS: { value: LineEnding; label: string }[] = [
  { value: "LF", label: "LF (Unix)" },
  { value: "CRLF", label: "CRLF (Win)" },
  { value: "CR", label: "CR (旧Mac)" },
];

/**
 * 改行コード変換ツールコンポーネント
 *
 * テキストの改行コードを自動検出し、指定した形式（CRLF / LF / CR）に変換する。
 *
 * @returns 改行コード変換ツールの React コンポーネント
 */
function LineEndingTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();

  const [input, setInput] = useState("");
  const [target, setTarget] = useState<LineEnding>("LF");

  const info = useMemo(() => detectLineEnding(input), [input]);
  const output = useMemo(() => (input ? convertLineEnding(input, target) : ""), [input, target]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const ok = await copy(output);
    showToast(ok ? "コピーしました" : "コピーに失敗しました", ok ? "success" : "error");
  }, [copy, output, showToast]);

  const handleClear = useCallback(() => {
    setInput("");
  }, []);

  const badgeClass =
    info.type === "Mixed"
      ? "le-badge le-badge--mixed"
      : info.type === "None"
        ? "le-badge le-badge--none"
        : "le-badge";

  return (
    <div className="tool-container">
      <h2 className="tool-title">改行コード変換</h2>
      <p className="tool-description">
        テキストの改行コード（CRLF / LF / CR）を検出して変換します。
      </p>

      <section aria-label="入力">
        <label htmlFor="le-input" className="sr-only">
          変換するテキスト
        </label>
        <Textarea
          id="le-input"
          className="le-textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={"テキストをここに貼り付けてください…\n改行コードを自動で検出します。"}
          aria-label="変換するテキスト"
          data-testid="le-input"
        />
      </section>

      {/* 検出結果 */}
      <div className="le-detect-row" aria-live="polite" aria-atomic="true">
        <span className="le-detect-label">検出:</span>
        <span className={badgeClass} data-testid="le-detected-type">
          {info.type}
        </span>
        <div className="le-stats">
          <div className="le-stat-item">
            <span className="le-stat-value" data-testid="le-crlf-count">
              {info.crlfCount}
            </span>
            <span className="le-stat-label">CRLF</span>
          </div>
          <div className="le-stat-item">
            <span className="le-stat-value" data-testid="le-lf-count">
              {info.lfCount}
            </span>
            <span className="le-stat-label">LF</span>
          </div>
          <div className="le-stat-item">
            <span className="le-stat-value" data-testid="le-cr-count">
              {info.crCount}
            </span>
            <span className="le-stat-label">CR</span>
          </div>
          <div className="le-stat-item">
            <span className="le-stat-value" data-testid="le-line-count">
              {info.lineCount}
            </span>
            <span className="le-stat-label">行数</span>
          </div>
        </div>
      </div>

      {/* 変換先選択 */}
      <div className="le-options-row" role="group" aria-label="変換先の改行コード">
        <span className="le-option-label">変換先:</span>
        {TARGET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`le-option-btn${target === opt.value ? " active" : ""}`}
            onClick={() => setTarget(opt.value)}
            aria-pressed={target === opt.value}
            title={LINE_ENDING_LABELS[opt.value]}
            data-testid={`le-target-${opt.value.toLowerCase()}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="le-action-row">
        <Button
          onClick={handleCopy}
          disabled={!output}
          aria-label="変換結果をコピー"
          data-testid="le-copy-btn"
        >
          コピー
        </Button>
        <Button
          variant="outline"
          onClick={handleClear}
          disabled={!input}
          aria-label="入力をクリア"
          data-testid="le-clear-btn"
        >
          クリア
        </Button>
      </div>

      {/* 出力 */}
      {output && (
        <section aria-label="変換結果">
          <div className="le-output-header">
            <span className="le-output-label">変換結果</span>
          </div>
          <Textarea
            className="le-textarea le-textarea-output"
            value={output}
            readOnly
            aria-label="変換結果"
            aria-live="polite"
            data-testid="le-output"
          />
        </section>
      )}

      <TipsCard
        tips={[
          "CRLF (\\r\\n) は Windows 系のテキストエディタや HTTP ヘッダーで使われます。",
          "LF (\\n) は Unix / Linux / macOS の標準形式です。Git は通常 LF で管理します。",
          "CR (\\r) は古い Mac OS (9 以前) の形式で、現在はほぼ使われません。",
          "混在（Mixed）の場合でも、選択した形式に統一変換できます。",
        ]}
      />
    </div>
  );
}
