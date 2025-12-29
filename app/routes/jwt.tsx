import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";

export const Route = createFileRoute("/jwt")({
  head: () => ({
    meta: [{ title: "JWT デコーダー" }],
  }),
  component: JwtDecoder,
});

interface DecodedJWT {
  header: string;
  payload: string;
  signature: string;
  headerRaw: string;
  payloadRaw: string;
}

function base64UrlDecode(str: string): string {
  // Base64URL to Base64
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

  // パディングを追加
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }

  try {
    // Base64デコード
    const decoded = atob(base64);
    // UTF-8デコード
    return decodeURIComponent(
      decoded
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (error) {
    throw new Error("Base64URLデコードに失敗しました");
  }
}

function decodeJWT(token: string): DecodedJWT {
  const parts = token.trim().split(".");

  if (parts.length !== 3) {
    throw new Error("JWTは3つのパート（ヘッダー.ペイロード.署名）で構成されている必要があります");
  }

  const [headerPart, payloadPart, signaturePart] = parts;

  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error("JWTの各パートが空です");
  }

  try {
    const headerRaw = base64UrlDecode(headerPart);
    const payloadRaw = base64UrlDecode(payloadPart);

    // JSONとして整形
    const headerJson = JSON.parse(headerRaw);
    const payloadJson = JSON.parse(payloadRaw);

    return {
      header: JSON.stringify(headerJson, null, 2),
      payload: JSON.stringify(payloadJson, null, 2),
      signature: signaturePart,
      headerRaw,
      payloadRaw,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`デコードエラー: ${error.message}`);
    }
    throw new Error("JWTのデコードに失敗しました");
  }
}

function JwtDecoder() {
  const [inputToken, setInputToken] = useState("");
  const [decodedResult, setDecodedResult] = useState<DecodedJWT | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

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

  const handleDecode = useCallback(() => {
    if (!inputToken.trim()) {
      const message = "エラー: JWTトークンを入力してください";
      setErrorMessage(message);
      announceStatus(message);
      alert("JWTトークンを入力してください");
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

  const handleClear = useCallback(() => {
    setInputToken("");
    setDecodedResult(null);
    setErrorMessage("");
    announceStatus("入力と出力をクリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

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
            <textarea
              id="inputToken"
              ref={inputRef}
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="JWTトークンを入力してください...&#10;例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
              aria-describedby="input-help"
              aria-label="JWTトークン入力欄"
              style={{ fontFamily: "Roboto Mono, monospace", fontSize: "14px" }}
            />
            <span id="input-help" className="sr-only">
              このフィールドにJWTトークンを入力してデコードできます
            </span>
          </div>

          <div className="button-group" role="group" aria-label="デコード操作">
            <button
              type="button"
              className="btn-primary"
              onClick={handleDecode}
              aria-label="JWTトークンをデコード"
            >
              デコード
            </button>
            <button
              type="button"
              className="btn-clear"
              onClick={handleClear}
              aria-label="入力と出力をクリア"
            >
              クリア
            </button>
          </div>

          {errorMessage && (
            <div
              className="error-message"
              role="alert"
              aria-live="assertive"
              style={{
                color: "#d32f2f",
                backgroundColor: "#ffebee",
                padding: "12px 16px",
                borderRadius: "4px",
                marginBottom: "20px",
                border: "1px solid #ef9a9a",
              }}
            >
              {errorMessage}
            </div>
          )}

          {decodedResult && (
            <>
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label htmlFor="outputHeader" className="section-title">
                    ヘッダー (Header)
                  </label>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleCopyToClipboard(decodedResult.header, "ヘッダー")}
                    style={{ fontSize: "12px", padding: "4px 12px" }}
                    aria-label="ヘッダーをコピー"
                  >
                    コピー
                  </button>
                </div>
                <textarea
                  id="outputHeader"
                  value={decodedResult.header}
                  readOnly
                  aria-label="デコードされたヘッダー"
                  aria-live="polite"
                  style={{ fontFamily: "Roboto Mono, monospace", fontSize: "14px" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label htmlFor="outputPayload" className="section-title">
                    ペイロード (Payload)
                  </label>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleCopyToClipboard(decodedResult.payload, "ペイロード")}
                    style={{ fontSize: "12px", padding: "4px 12px" }}
                    aria-label="ペイロードをコピー"
                  >
                    コピー
                  </button>
                </div>
                <textarea
                  id="outputPayload"
                  value={decodedResult.payload}
                  readOnly
                  aria-label="デコードされたペイロード"
                  aria-live="polite"
                  style={{ fontFamily: "Roboto Mono, monospace", fontSize: "14px" }}
                />
              </div>

              <div style={{ marginBottom: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label htmlFor="outputSignature" className="section-title">
                    署名 (Signature)
                  </label>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleCopyToClipboard(decodedResult.signature, "署名")}
                    style={{ fontSize: "12px", padding: "4px 12px" }}
                    aria-label="署名をコピー"
                  >
                    コピー
                  </button>
                </div>
                <textarea
                  id="outputSignature"
                  value={decodedResult.signature}
                  readOnly
                  aria-label="JWT署名"
                  aria-live="polite"
                  style={{
                    fontFamily: "Roboto Mono, monospace",
                    fontSize: "14px",
                    minHeight: "60px"
                  }}
                />
              </div>
            </>
          )}
        </form>

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>「JWT トークン」欄にJWTトークンを入力します</li>
            <li>「デコード」ボタンでヘッダー、ペイロード、署名を表示</li>
            <li>各セクションの「コピー」ボタンでクリップボードにコピー可能</li>
            <li>キーボードショートカット: Ctrl+Enter でデコード実行</li>
          </ul>
          <h3 style={{ marginTop: "20px" }}>JWTについて</h3>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#666" }}>
            JWT (JSON Web Token) は、ヘッダー、ペイロード、署名の3つの部分で構成されます。
            このツールではJWTをデコードして内容を確認できますが、署名の検証は行いません。
          </p>
        </aside>
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
