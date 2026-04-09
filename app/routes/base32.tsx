import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useCopyWithFeedback } from "~/hooks/useCopyWithFeedback";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { encodeBase32, decodeBase32, validateBase32, type Base32Variant } from "~/utils/base32";
import "../styles/tools/base32.css";

export const Route = createFileRoute("/base32")({
  head: () => ({
    meta: [
      { title: "Base32エンコード・デコード | Web ツール集" },
      {
        name: "description",
        content:
          "テキストをBase32形式（RFC 4648）にエンコード・デコードするオンラインツール。Standard（A–Z, 2–7）とBase32hex（0–9, A–V）に対応。TOTPシークレットキーの確認にも便利。",
      },
      { property: "og:title", content: "Base32エンコード・デコード | Web ツール集" },
      {
        property: "og:description",
        content: "Base32（RFC 4648）エンコード・デコード。Standard と Base32hex に対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/base32` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Base32エンコード・デコード | Web ツール集" },
      {
        name: "twitter:description",
        content: "Base32（RFC 4648）エンコード・デコード。TOTPシークレットキーの確認にも。",
      },
    ],
  }),
  component: Base32Converter,
});

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

type Mode = "encode" | "decode";

function Base32Converter() {
  const { statusRef, announceStatus, copyWithFeedback } = useCopyWithFeedback();

  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [variant, setVariant] = useState<Base32Variant>("standard");
  const [padding, setPadding] = useState(true);

  // エンコード結果
  const encodeResult = useMemo(() => {
    if (mode !== "encode" || !input) return null;
    return encodeBase32(input, variant, padding);
  }, [mode, input, variant, padding]);

  // デコード結果・エラー
  const { decodeResult, decodeError } = useMemo(() => {
    if (mode !== "decode" || !input.trim()) {
      return { decodeResult: null, decodeError: null };
    }
    const validationError = validateBase32(input, variant);
    if (validationError) {
      return { decodeResult: null, decodeError: validationError };
    }
    const result = decodeBase32(input, variant);
    if (!result.success) {
      return { decodeResult: null, decodeError: result.error ?? "デコードに失敗しました" };
    }
    return { decodeResult: result, decodeError: null };
  }, [mode, input, variant]);

  const output = mode === "encode" ? (encodeResult?.encoded ?? "") : (decodeResult?.decoded ?? "");
  const hasOutput = !!output;

  const handleCopyOutput = useCallback(async () => {
    await copyWithFeedback(output, "出力をコピーしました");
  }, [output, copyWithFeedback]);

  const handleClear = useCallback(() => {
    setInput("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      setInput("");
      announceStatus(
        newMode === "encode"
          ? "エンコードモードに切り替えました"
          : "デコードモードに切り替えました",
      );
    },
    [announceStatus],
  );

  const handleSwap = useCallback(() => {
    if (!output) return;
    const newMode = mode === "encode" ? "decode" : "encode";
    setMode(newMode);
    setInput(output);
    announceStatus("入出力を入れ替えました");
  }, [mode, output, announceStatus]);

  return (
    <>
      <div className="tool-container">
        {/* モード切替 */}
        <div className="b32-tabs" role="tablist" aria-label="変換モード">
          <button
            role="tab"
            aria-selected={mode === "encode"}
            className={`b32-tab-btn${mode === "encode" ? " active" : ""}`}
            onClick={() => handleModeChange("encode")}
          >
            エンコード
          </button>
          <button
            role="tab"
            aria-selected={mode === "decode"}
            className={`b32-tab-btn${mode === "decode" ? " active" : ""}`}
            onClick={() => handleModeChange("decode")}
          >
            デコード
          </button>
        </div>

        {/* オプション */}
        <div className="b32-options-row">
          <fieldset className="b32-fieldset">
            <legend className="b32-legend">方式</legend>
            <label className="b32-radio-label">
              <input
                type="radio"
                name="variant"
                value="standard"
                checked={variant === "standard"}
                onChange={() => setVariant("standard")}
              />
              Standard (A–Z, 2–7)
            </label>
            <label className="b32-radio-label">
              <input
                type="radio"
                name="variant"
                value="hex"
                checked={variant === "hex"}
                onChange={() => setVariant("hex")}
              />
              Base32hex (0–9, A–V)
            </label>
          </fieldset>
          {mode === "encode" && (
            <label className="b32-checkbox-label">
              <input
                type="checkbox"
                checked={padding}
                onChange={(e) => setPadding(e.target.checked)}
                aria-label="パディング文字 '=' を付加する"
              />
              パディング（=）を付加
            </label>
          )}
        </div>

        {/* 入力 */}
        <div className="converter-section">
          <label htmlFor="b32-input" className="section-title">
            {mode === "encode" ? "入力テキスト" : "Base32 文字列"}
          </label>
          <textarea
            id="b32-input"
            className="b32-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "エンコードしたいテキストを入力..."
                : "デコードしたい Base32 文字列を入力..."
            }
            aria-label={mode === "encode" ? "エンコード入力テキスト" : "デコード入力Base32文字列"}
            spellCheck={false}
          />
        </div>

        {/* デコードエラー */}
        {mode === "decode" && decodeError && input.trim() && (
          <div className="b32-error" role="alert" aria-label="デコードエラー">
            <span className="b32-error-icon" aria-hidden="true">
              ⚠
            </span>
            {decodeError}
          </div>
        )}

        {/* ボタン */}
        <div className="b32-action-row">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCopyOutput}
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

        {/* 出力 */}
        {hasOutput && (
          <div className="converter-section">
            <div className="b32-output-header">
              <span className="b32-output-label">
                {mode === "encode" ? "Base32 出力" : "デコード結果"}
              </span>
              {mode === "encode" && encodeResult && (
                <span className="b32-output-meta">
                  {encodeResult.inputBytes} バイト → {encodeResult.outputLength} 文字
                </span>
              )}
              {mode === "decode" && decodeResult && (
                <span className="b32-output-meta">{decodeResult.bytes.length} バイト</span>
              )}
            </div>
            <textarea
              className="b32-textarea b32-textarea-output"
              readOnly
              value={output}
              aria-label={mode === "encode" ? "Base32エンコード出力" : "デコード結果"}
              aria-live="polite"
            />
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "Base32 について",
              items: [
                "RFC 4648 で定義されたエンコード方式です",
                "Standard: A–Z と 2–7 の 32 文字を使用",
                "Base32hex: 0–9 と A–V の 32 文字を使用（数字・文字順が保存）",
                "5バイトを8文字（40ビット → 8×5ビット）に変換します",
                "入力長が5の倍数でない場合、末尾に = を付けてパディングします",
              ],
            },
            {
              title: "主な用途",
              items: [
                "TOTP（Google Authenticator など）のシークレットキー形式",
                "大文字小文字を区別しないシステムへのデータ転送",
                "Base64 が使えない環境（英数字のみ許可）",
                "DNS名や証明書のフィンガープリントなど",
              ],
            },
            {
              title: "Base64 との違い",
              items: [
                "Base32 は文字種が少ない（32種 vs 64種）",
                "Base64 より約 20% 大きくなる（5バイト→8文字 vs 3バイト→4文字）",
                "大文字小文字を区別しない環境でも安全に使える",
                "記号（+, /）が含まれないため URL 等でも安全",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
