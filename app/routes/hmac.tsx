import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  computeAllHmacs,
  textToBytes,
  type HmacResult,
  type HmacOutputFormat,
} from "~/utils/hmac";

export const Route = createFileRoute("/hmac")({
  head: () => ({
    meta: [
      { title: "HMAC 生成 | Web ツール集" },
      {
        name: "description",
        content:
          "テキストと秘密鍵から HMAC-SHA-1・SHA-256・SHA-384・SHA-512 の署名値を生成するツール。Webhook 検証・API 認証・メッセージ認証に対応。HEX/Base64 出力。",
      },
      { property: "og:title", content: "HMAC 生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "テキストと秘密鍵から HMAC-SHA-1・SHA-256・SHA-384・SHA-512 の署名値を生成するツール。Webhook 検証・API 認証・メッセージ認証に対応。HEX/Base64 出力。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/hmac` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "HMAC 生成 | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "テキストと秘密鍵から HMAC-SHA-256 などの署名値を生成するツール。HEX/Base64 出力対応。",
      },
    ],
  }),
  component: HmacGenerator,
});

function HmacGenerator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [message, setMessage] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [outputFormat, setOutputFormat] = useState<HmacOutputFormat>("hex");
  const [hmacResults, setHmacResults] = useState<HmacResult[]>([]);
  const [isComputing, setIsComputing] = useState(false);

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const computeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // メッセージまたはキーが変更されたときにリアルタイムで HMAC を計算する（デバウンス付き）
  useEffect(() => {
    if (computeTimerRef.current) {
      clearTimeout(computeTimerRef.current);
    }

    if (!message && !secretKey) {
      setHmacResults([]);
      return;
    }

    computeTimerRef.current = setTimeout(async () => {
      setIsComputing(true);
      try {
        const messageBytes = textToBytes(message);
        const keyBytes = textToBytes(secretKey);
        const results = await computeAllHmacs(messageBytes, keyBytes, outputFormat);
        setHmacResults(results);
      } finally {
        setIsComputing(false);
      }
    }, 150);

    return () => {
      if (computeTimerRef.current) {
        clearTimeout(computeTimerRef.current);
      }
    };
  }, [message, secretKey, outputFormat]);

  // 初期フォーカス
  useEffect(() => {
    messageRef.current?.focus();
  }, []);

  const handleCopy = useCallback(
    async (value: string, label: string) => {
      if (!value) return;
      const success = await copy(value);
      if (success) {
        showToast(`${label} をコピーしました`, "success");
        announceStatus(`${label} をコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus]
  );

  const handleClear = useCallback(() => {
    setMessage("");
    setSecretKey("");
    setHmacResults([]);
    announceStatus("入力をクリアしました");
    messageRef.current?.focus();
  }, [announceStatus]);

  const hasInput = message.length > 0 || secretKey.length > 0;

  return (
    <>
      <div className="tool-container">
        {/* 出力形式切り替えタブ */}
        <div className="hash-format-tabs" role="tablist" aria-label="出力形式">
          <button
            role="tab"
            aria-selected={outputFormat === "hex"}
            className={`hash-format-tab ${outputFormat === "hex" ? "active" : ""}`}
            onClick={() => setOutputFormat("hex")}
          >
            HEX
          </button>
          <button
            role="tab"
            aria-selected={outputFormat === "base64"}
            className={`hash-format-tab ${outputFormat === "base64" ? "active" : ""}`}
            onClick={() => setOutputFormat("base64")}
          >
            Base64
          </button>
        </div>

        {/* メッセージ入力 */}
        <div className="converter-section">
          <div className="option-group">
            <label htmlFor="hmac-message">メッセージ</label>
            <textarea
              id="hmac-message"
              ref={messageRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="HMAC を計算するメッセージを入力..."
              aria-label="メッセージ入力"
              rows={4}
            />
          </div>

          {/* 秘密鍵入力 */}
          <div className="option-group">
            <label htmlFor="hmac-secret">秘密鍵 (Secret Key)</label>
            <input
              id="hmac-secret"
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="秘密鍵を入力..."
              aria-label="秘密鍵入力"
            />
          </div>
        </div>

        {/* ボタングループ */}
        <div className="button-group" role="group" aria-label="ツール操作">
          <button
            type="button"
            className="btn-clear"
            onClick={handleClear}
            aria-label="入力をクリア"
            disabled={!hasInput}
          >
            クリア
          </button>
        </div>

        {/* HMAC 結果 */}
        {isComputing && (
          <div className="hash-empty-state" aria-live="polite" aria-busy="true">
            <p>計算中...</p>
          </div>
        )}

        {!isComputing && hasInput && hmacResults.length > 0 && (
          <div
            className="hash-results-grid"
            aria-label="HMAC 計算結果"
            aria-live="polite"
          >
            {hmacResults.map((result) => (
              <div key={result.algorithmName} className="hash-result-item">
                <div className="hash-result-header">
                  <span className="hash-result-algorithm">
                    {result.algorithmName}
                  </span>
                  {result.deprecated && (
                    <span
                      className="hash-result-badge hash-result-badge-deprecated"
                      title="セキュリティ上の理由から非推奨のアルゴリズムです"
                    >
                      非推奨
                    </span>
                  )}
                  <span className="hash-result-meta">{result.bits} bits</span>
                </div>
                <div className="hash-result-value-wrapper">
                  <span className="hash-result-value">{result.value}</span>
                  <button
                    type="button"
                    className="hash-copy-btn"
                    onClick={() =>
                      handleCopy(result.value, result.algorithmName)
                    }
                    aria-label={`${result.algorithmName} の値をコピー`}
                    disabled={!result.value}
                  >
                    コピー
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isComputing && !hasInput && (
          <div className="hash-empty-state" aria-live="polite">
            <p>メッセージと秘密鍵を入力すると HMAC が計算されます</p>
          </div>
        )}
      </div>

      <TipsCard
        title="HMAC とは"
        items={[
          "HMAC（Hash-based Message Authentication Code）はメッセージの完全性と認証を保証する仕組みです",
          "Webhook 検証（GitHub・Stripe・Slack 等）では HMAC-SHA-256 が広く使われています",
          "秘密鍵が空の場合でも計算できますが、実用上は必ず秘密鍵を設定してください",
          "HMAC-SHA-1 はセキュリティ上の理由から非推奨です。新規利用は HMAC-SHA-256 以上を推奨します",
          "ブラウザ内で計算されるため、メッセージや秘密鍵がサーバーに送信されることはありません",
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
