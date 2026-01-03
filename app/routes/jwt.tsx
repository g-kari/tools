import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { decodeJWT, type DecodedJWT } from "../utils/jwt";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/jwt")({
  head: () => ({
    meta: [{ title: "JWT デコーダー" }],
  }),
  component: JwtDecoder,
});

/**
 * JWT Decoder component that allows users to decode and inspect JWT tokens.
 * Displays the header, payload, and signature in a user-friendly format.
 */
function JwtDecoder() {
  const [inputToken, setInputToken] = useState("");
  const [decodedResult, setDecodedResult] = useState<DecodedJWT | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  /**
   * Announces a status message to screen readers via ARIA live region.
   * The message is cleared after 3 seconds.
   * @param message - The status message to announce
   */
  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  /**
   * Handles the JWT decode operation.
   * Validates input, decodes the JWT, and updates the UI with results or errors.
   */
  const handleDecode = useCallback(() => {
    if (!inputToken.trim()) {
      const message = "JWTトークンを入力してください";
      setErrorMessage(message);
      announceStatus(`エラー: ${message}`);
      inputRef.current?.focus();
      return;
    }

    try {
      const result = decodeJWT(inputToken);
      setDecodedResult(result);
      setErrorMessage("");
      announceStatus("JWTのデコードが完了しました");
    } catch (error) {
      const message = error instanceof Error ? error.message : "デコードに失敗しました";
      setErrorMessage(message);
      setDecodedResult(null);
      announceStatus(`エラー: ${message}`);
    }
  }, [inputToken, announceStatus]);

  /**
   * Clears all input and output fields and resets the component state.
   */
  const handleClear = useCallback(() => {
    setInputToken("");
    setDecodedResult(null);
    setErrorMessage("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  /**
   * Copies the specified text to the clipboard.
   * @param text - The text to copy
   * @param label - A label describing what was copied (for status announcements)
   */
  const handleCopyToClipboard = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        announceStatus(`${label}をクリップボードにコピーしました`);
      } catch (error) {
        announceStatus(`コピーに失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
      }
    },
    [announceStatus]
  );

  // Keyboard shortcut: Ctrl/Cmd+Enter to decode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleDecode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleDecode]);

  // Focus input field on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="JWTデコーダーフォーム">
          <div className="converter-section">
            <label htmlFor="inputToken" className="section-title">
              JWT トークン
            </label>
            <Textarea
              id="inputToken"
              ref={inputRef}
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="JWTトークンを入力してください...&#10;例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
              aria-describedby="input-help"
              aria-label="JWTトークン入力欄"
              className="jwt-monospace-output"
            />
            <span id="input-help" className="sr-only">
              このフィールドにJWTトークンを入力してデコードできます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="デコード操作">
            <Button
              type="button"
              onClick={handleDecode}
              aria-label="JWTトークンをデコード"
            >
              デコード
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              aria-label="入力と出力をクリア"
            >
              クリア
            </Button>
          </div>

          {errorMessage && (
            <div
              className="error-message"
              role="alert"
              aria-live="assertive"
            >
              {errorMessage}
            </div>
          )}

          {decodedResult && (
            <>
              <div className="jwt-output-section">
                <div className="jwt-output-header">
                  <label htmlFor="outputHeader" className="section-title">
                    ヘッダー (Header)
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    className="jwt-copy-button"
                    onClick={() => handleCopyToClipboard(decodedResult.header, "ヘッダー")}
                    aria-label="ヘッダーをコピー"
                  >
                    コピー
                  </Button>
                </div>
                <Textarea
                  id="outputHeader"
                  value={decodedResult.header}
                  readOnly
                  aria-label="デコードされたヘッダー"
                  aria-live="polite"
                  className="jwt-monospace-output"
                />
              </div>

              <div className="jwt-output-section">
                <div className="jwt-output-header">
                  <label htmlFor="outputPayload" className="section-title">
                    ペイロード (Payload)
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    className="jwt-copy-button"
                    onClick={() => handleCopyToClipboard(decodedResult.payload, "ペイロード")}
                    aria-label="ペイロードをコピー"
                  >
                    コピー
                  </Button>
                </div>
                <Textarea
                  id="outputPayload"
                  value={decodedResult.payload}
                  readOnly
                  aria-label="デコードされたペイロード"
                  aria-live="polite"
                  className="jwt-monospace-output"
                />
              </div>

              <div className="jwt-output-section">
                <div className="jwt-output-header">
                  <label htmlFor="outputSignature" className="section-title">
                    署名 (Signature)
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    className="jwt-copy-button"
                    onClick={() => handleCopyToClipboard(decodedResult.signature, "署名")}
                    aria-label="署名をコピー"
                  >
                    コピー
                  </Button>
                </div>
                <Textarea
                  id="outputSignature"
                  value={decodedResult.signature}
                  readOnly
                  aria-label="JWT署名"
                  aria-live="polite"
                  className="jwt-monospace-output jwt-signature-output"
                />
              </div>
            </>
          )}
        </form>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "「JWT トークン」欄にJWTトークンを入力します",
                "「デコード」ボタンでヘッダー、ペイロード、署名を表示",
                "各セクションの「コピー」ボタンでクリップボードにコピー可能",
                "キーボードショートカット: Ctrl+Enter でデコード実行",
              ],
            },
            {
              title: "JWTについて",
              items: [
                "JWT (JSON Web Token) は、ヘッダー、ペイロード、署名の3つの部分で構成されます",
                "このツールではJWTをデコードして内容を確認できますが、署名の検証は行いません",
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
