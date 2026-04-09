import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useCopyWithFeedback } from "~/hooks/useCopyWithFeedback";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { encodeBase58, decodeBase58, validateBase58, type Base58Alphabet } from "~/utils/base58";
import "../styles/tools/base58.css";

export const Route = createFileRoute("/base58")({
  head: () => ({
    meta: [
      { title: "Base58エンコード・デコード | Web ツール集" },
      {
        name: "description",
        content:
          "テキストをBase58形式にエンコード・デコードするオンラインツール。Bitcoin（標準）とFlickrアルファベットに対応。視覚的に紛らわしい文字（0, O, I, l）を除いたエンコード方式。",
      },
      { property: "og:title", content: "Base58エンコード・デコード | Web ツール集" },
      {
        property: "og:description",
        content: "Base58エンコード・デコード。Bitcoin と Flickr アルファベットに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/base58` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "Base58エンコード・デコード | Web ツール集" },
      {
        name: "twitter:description",
        content: "Base58エンコード・デコード。Bitcoin アドレスや IPFS CID でよく使われる形式。",
      },
    ],
  }),
  component: Base58Converter,
});

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

type Mode = "encode" | "decode";

function Base58Converter() {
  const { statusRef, announceStatus, copyWithFeedback } = useCopyWithFeedback();

  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [alphabet, setAlphabet] = useState<Base58Alphabet>("bitcoin");

  // エンコード結果
  const encodeResult = useMemo(() => {
    if (mode !== "encode" || !input) return null;
    return encodeBase58(input, alphabet);
  }, [mode, input, alphabet]);

  // デコード結果・エラー
  const { decodeResult, decodeError } = useMemo(() => {
    if (mode !== "decode" || !input.trim()) {
      return { decodeResult: null, decodeError: null };
    }
    const validationError = validateBase58(input, alphabet);
    if (validationError) {
      return { decodeResult: null, decodeError: validationError };
    }
    const result = decodeBase58(input, alphabet);
    if (!result.success) {
      return { decodeResult: null, decodeError: result.error ?? "デコードに失敗しました" };
    }
    return { decodeResult: result, decodeError: null };
  }, [mode, input, alphabet]);

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
        <div className="b58-tabs" role="tablist" aria-label="変換モード">
          <button
            role="tab"
            aria-selected={mode === "encode"}
            className={`b58-tab-btn${mode === "encode" ? " active" : ""}`}
            onClick={() => handleModeChange("encode")}
          >
            エンコード
          </button>
          <button
            role="tab"
            aria-selected={mode === "decode"}
            className={`b58-tab-btn${mode === "decode" ? " active" : ""}`}
            onClick={() => handleModeChange("decode")}
          >
            デコード
          </button>
        </div>

        {/* オプション */}
        <div className="b58-options-row">
          <fieldset className="b58-fieldset">
            <legend className="b58-legend">アルファベット</legend>
            <label className="b58-radio-label">
              <input
                type="radio"
                name="alphabet"
                value="bitcoin"
                checked={alphabet === "bitcoin"}
                onChange={() => setAlphabet("bitcoin")}
              />
              Bitcoin（標準）
            </label>
            <label className="b58-radio-label">
              <input
                type="radio"
                name="alphabet"
                value="flickr"
                checked={alphabet === "flickr"}
                onChange={() => setAlphabet("flickr")}
              />
              Flickr
            </label>
          </fieldset>
        </div>

        {/* 入力 */}
        <div className="converter-section">
          <label htmlFor="b58-input" className="section-title">
            {mode === "encode" ? "入力テキスト" : "Base58 文字列"}
          </label>
          <textarea
            id="b58-input"
            className="b58-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "エンコードしたいテキストを入力..."
                : "デコードしたい Base58 文字列を入力..."
            }
            aria-label={mode === "encode" ? "エンコード入力テキスト" : "デコード入力Base58文字列"}
            spellCheck={false}
          />
        </div>

        {/* デコードエラー */}
        {mode === "decode" && decodeError && input.trim() && (
          <div className="b58-error" role="alert" aria-label="デコードエラー">
            <span className="b58-error-icon" aria-hidden="true">
              ⚠
            </span>
            {decodeError}
          </div>
        )}

        {/* ボタン */}
        <div className="b58-action-row">
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
            <div className="b58-output-header">
              <span className="b58-output-label">
                {mode === "encode" ? "Base58 出力" : "デコード結果"}
              </span>
              {mode === "encode" && encodeResult && (
                <span className="b58-output-meta">
                  {encodeResult.inputBytes} バイト → {encodeResult.outputLength} 文字
                </span>
              )}
              {mode === "decode" && decodeResult && (
                <span className="b58-output-meta">{decodeResult.bytes.length} バイト</span>
              )}
            </div>
            <textarea
              className="b58-textarea b58-textarea-output"
              readOnly
              value={output}
              aria-label={mode === "encode" ? "Base58エンコード出力" : "デコード結果"}
              aria-live="polite"
            />
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "Base58 について",
              items: [
                "視覚的に紛らわしい文字（0, O, I, l）を除いた 58 文字を使用します",
                "誤読・誤入力を防ぐため、Bitcoin アドレスで採用されました",
                "パディング文字（=）が不要なためコンパクトです",
                "Bitcoin アルファベット: 123456789ABCDEFGHJKLMNPQRSTUVWXYZ abcdefghijkmnopqrstuvwxyz",
                "Flickr アルファベット: 大文字・小文字の順序が逆になっています",
              ],
            },
            {
              title: "主な用途",
              items: [
                "Bitcoin ウォレットアドレス・WIF 秘密鍵の表現",
                "IPFS のコンテンツ識別子（CID v0 の Qm... 形式）",
                "Solana ウォレットアドレス",
                "短縮 URL サービス（Flickr アルファベット）",
                "人間が読み取り・入力するコードの生成",
              ],
            },
            {
              title: "Base58 vs Base64",
              items: [
                "Base64 より文字種が少ない（58 vs 64）",
                "Base64 の特殊文字（+, /, =）が不要",
                "URL・ファイル名にそのまま使用できます",
                "Base64 より約 10% 大きくなります",
                "チェックサム付き形式（Base58Check）もあります",
              ],
            },
          ]}
        />
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
