/**
 * @fileoverview 変換系ツールの共通レイアウトコンポーネント
 *
 * モード切替タブ・オプション領域・入出力テキストエリア・アクションボタン（コピー/入替/クリア）・
 * 出力メタ情報・TipsCard を一つのレイアウトに統合する。
 * 振る舞いは {@link useConversionTool} フックで管理し、このコンポーネントは UI だけを担当する。
 */

import type { ReactNode } from "react";
import { useCallback } from "react";
import { TipsCard } from "~/components/TipsCard";
import { StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useCopyWithFeedback } from "~/hooks/useCopyWithFeedback";
import type { ConversionMode } from "~/types/converter";
import "../styles/components/conversion-tool.css";

interface TipsSection {
  title: string;
  items: string[];
}

export interface ConversionToolProps {
  /** 現在のモード */
  mode: ConversionMode;
  /** モード切替ハンドラ */
  onModeChange: (mode: ConversionMode) => void;
  /** 入力テキスト */
  input: string;
  /** 入力テキスト変更ハンドラ */
  onInputChange: (text: string) => void;
  /** 出力テキスト（空ならボタンが disabled になる） */
  output: string;
  /** 入出力入れ替えハンドラ */
  onSwap: () => void;
  /** 入力クリアハンドラ */
  onClear: () => void;
  /** エンコード時のラベル（例: "Base64 エンコード"） */
  encodeLabel?: string;
  /** デコード時のラベル（例: "Base64 デコード"） */
  decodeLabel?: string;
  /** エンコード時の入力プレースホルダ */
  encodePlaceholder?: string;
  /** デコード時の入力プレースホルダ */
  decodePlaceholder?: string;
  /** エンコード時の入力欄ラベル */
  encodeInputLabel?: string;
  /** デコード時の入力欄ラベル */
  decodeInputLabel?: string;
  /** エンコード時の出力欄ラベル */
  encodeOutputLabel?: string;
  /** デコード時の出力欄ラベル */
  decodeOutputLabel?: string;
  /** 出力に表示するメタ情報（例: "5 バイト → 8 文字"） */
  outputMeta?: string | null;
  /** エラーメッセージ（null で非表示） */
  error?: string | null;
  /** タブとオプションの間に差し込む要素（ツール固有のオプション UI） */
  optionsSlot?: ReactNode;
  /** 入力欄の下・ボタンの下などに表示する追加情報（任意） */
  belowInput?: ReactNode;
  /** TipsCard に渡すセクション群（省略時は TipsCard を表示しない） */
  tips?: TipsSection[];
}

export function ConversionTool({
  mode,
  onModeChange,
  input,
  onInputChange,
  output,
  onSwap,
  onClear,
  encodeLabel = "エンコード",
  decodeLabel = "デコード",
  encodePlaceholder = "エンコードしたいテキストを入力...",
  decodePlaceholder = "デコードしたい文字列を入力...",
  encodeInputLabel = "入力テキスト",
  decodeInputLabel = "入力文字列",
  encodeOutputLabel = "エンコード結果",
  decodeOutputLabel = "デコード結果",
  outputMeta,
  error,
  optionsSlot,
  belowInput,
  tips,
}: ConversionToolProps) {
  const { statusRef, copyWithFeedback, announceStatus } = useCopyWithFeedback();

  const handleCopy = useCallback(async () => {
    await copyWithFeedback(output, "出力をコピーしました");
  }, [output, copyWithFeedback]);

  const handleSwap = useCallback(() => {
    onSwap();
    announceStatus("入出力を入れ替えました");
  }, [onSwap, announceStatus]);

  const handleClear = useCallback(() => {
    onClear();
    announceStatus("入力をクリアしました");
  }, [onClear, announceStatus]);

  const handleModeChange = useCallback(
    (next: ConversionMode) => {
      if (next === mode) return;
      onModeChange(next);
      announceStatus(
        next === "encode" ? "エンコードモードに切り替えました" : "デコードモードに切り替えました",
      );
    },
    [mode, onModeChange, announceStatus],
  );

  const hasOutput = !!output;
  const inputLabel = mode === "encode" ? encodeInputLabel : decodeInputLabel;
  const outputLabel = mode === "encode" ? encodeOutputLabel : decodeOutputLabel;
  const placeholder = mode === "encode" ? encodePlaceholder : decodePlaceholder;

  return (
    <>
      <div className="tool-container">
        <div className="conv-tabs" role="tablist" aria-label="変換モード">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "encode"}
            className={`conv-tab-btn${mode === "encode" ? " active" : ""}`}
            onClick={() => handleModeChange("encode")}
          >
            {encodeLabel}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "decode"}
            className={`conv-tab-btn${mode === "decode" ? " active" : ""}`}
            onClick={() => handleModeChange("decode")}
          >
            {decodeLabel}
          </button>
        </div>

        {optionsSlot && <div className="conv-options-row">{optionsSlot}</div>}

        <div className="converter-section">
          <label htmlFor="conv-input" className="section-title">
            {inputLabel}
          </label>
          <textarea
            id="conv-input"
            className="conv-textarea"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={placeholder}
            aria-label={inputLabel}
            spellCheck={false}
          />
        </div>

        {belowInput}

        {error && input.trim() && (
          <div className="conv-error" role="alert">
            <span className="conv-error-icon" aria-hidden="true">
              ⚠
            </span>
            {error}
          </div>
        )}

        <div className="conv-action-row">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCopy}
            disabled={!hasOutput}
            aria-label="出力をコピー"
          >
            コピー
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSwap}
            disabled={!hasOutput}
            aria-label="入出力を入れ替える"
            title="出力を入力に入れ替え"
          >
            ⇄ 入れ替え
          </button>
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            disabled={!input}
            aria-label="入力をクリア"
          >
            クリア
          </button>
        </div>

        {hasOutput && (
          <div className="converter-section">
            <div className="conv-output-header">
              <span className="conv-output-label">{outputLabel}</span>
              {outputMeta && <span className="conv-output-meta">{outputMeta}</span>}
            </div>
            <textarea
              className="conv-textarea conv-textarea-output"
              readOnly
              value={output}
              aria-label={outputLabel}
              aria-live="polite"
            />
          </div>
        )}

        {tips && tips.length > 0 && <TipsCard sections={tips} />}
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
