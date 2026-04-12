import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  sendHttpRequest,
  formatResponseBody,
  type HttpMethod,
  type HttpHeader,
  type HttpResponseData,
} from "../functions/http-client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/http-client")({
  head: () => ({
    meta: [
      { title: "HTTP APIテスター | Web ツール集" },
      {
        name: "description",
        content:
          "HTTP APIリクエストを送信してレスポンスを確認するツール。GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONSに対応。",
      },
      { property: "og:title", content: "HTTP APIテスター | Web ツール集" },
      {
        property: "og:description",
        content:
          "HTTP APIリクエストを送信してレスポンスを確認するツール。GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONSに対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/http-client` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "HTTP APIテスター | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "HTTP APIリクエストを送信してレスポンスを確認するツール。GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONSに対応。",
      },
    ],
  }),
  component: HttpClientTool,
});

/** HTTPメソッドの選択肢 */
const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

/** レスポンスタブの種類 */
type ResponseTab = "body" | "headers";

/**
 * ステータスコードに応じたCSSクラス名を返す
 * @param code - HTTPステータスコード
 * @returns CSSクラス名
 */
function getStatusClass(code: number): string {
  if (code >= 200 && code < 300) return "http-status-success";
  if (code >= 300 && code < 400) return "http-status-redirect";
  if (code >= 400 && code < 500) return "http-status-client-error";
  if (code >= 500) return "http-status-server-error";
  return "http-status-error";
}

/**
 * ステータスコードの説明テキストを返す
 * @param code - HTTPステータスコード
 * @returns ステータスの説明
 */
function getStatusDescription(code: number): string {
  if (code >= 200 && code < 300) return "成功";
  if (code >= 300 && code < 400) return "リダイレクト";
  if (code >= 400 && code < 500) return "クライアントエラー";
  if (code >= 500) return "サーバーエラー";
  return "エラー";
}

/**
 * HTTP APIテスタートールコンポーネント
 * HTTPリクエストを送信してレスポンスを確認できる
 */
function HttpClientTool() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<HttpHeader[]>([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<HttpResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ResponseTab>("body");
  const urlInputRef = useRef<HTMLInputElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  useEffect(() => {
    urlInputRef.current?.focus();
  }, []);

  /**
   * ヘッダー行を追加する
   */
  const addHeader = useCallback(() => {
    setHeaders((prev) => [...prev, { key: "", value: "" }]);
  }, []);

  /**
   * 指定インデックスのヘッダー行を削除する
   * @param index - 削除するヘッダーのインデックス
   */
  const removeHeader = useCallback((index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * ヘッダーのキーまたは値を更新する
   * @param index - 更新するヘッダーのインデックス
   * @param field - 更新するフィールド（key or value）
   * @param value - 新しい値
   */
  const updateHeader = useCallback((index: number, field: "key" | "value", value: string) => {
    setHeaders((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  }, []);

  /**
   * HTTPリクエストを送信する
   */
  const handleSend = useCallback(async () => {
    if (!url.trim()) {
      setError("URLを入力してください");
      announceStatus("エラー: URLを入力してください");
      urlInputRef.current?.focus();
      return;
    }

    setError(null);
    setResponse(null);
    setIsLoading(true);
    announceStatus("リクエスト送信中...");

    try {
      const result = await sendHttpRequest({
        data: {
          url: url.trim(),
          method,
          headers: headers.filter((h) => h.key.trim() && h.value.trim()),
          body: body || undefined,
        },
      });

      if (result.error) {
        setError(result.error);
        announceStatus("エラー: " + result.error);
        return;
      }

      setResponse(result);
      setActiveTab("body");
      announceStatus(`レスポンスを受信しました: ${result.statusCode} ${result.statusText}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "通信エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
    } finally {
      setIsLoading(false);
    }
  }, [url, method, headers, body, announceStatus]);

  // Ctrl+Enter でリクエスト送信
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSend();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSend]);

  const methodHasBody = method !== "GET" && method !== "HEAD";

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          aria-label="HTTPリクエストフォーム"
        >
          {/* URL入力とメソッド選択 */}
          <div className="converter-section">
            <div className="http-client-url-row">
              <div className="http-client-method-wrapper">
                <label htmlFor="httpMethod">メソッド</label>
                <select
                  id="httpMethod"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  aria-label="HTTPメソッドを選択"
                  className="http-client-method-select"
                >
                  {HTTP_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="http-client-url-wrapper">
                <label htmlFor="httpUrl">URL</label>
                <Input
                  type="text"
                  id="httpUrl"
                  ref={urlInputRef}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/endpoint"
                  aria-label="リクエスト先URL"
                  aria-describedby="url-hint"
                  autoComplete="off"
                  spellCheck="false"
                />
                <span id="url-hint" className="sr-only">
                  HTTPまたはHTTPSのURLを入力してください
                </span>
              </div>
            </div>
          </div>

          {/* ヘッダー設定 */}
          <div className="converter-section">
            <div className="http-client-section-header">
              <span className="section-title">カスタムヘッダー</span>
              <Button
                type="button"
                className="btn-secondary http-client-add-btn"
                onClick={addHeader}
                aria-label="ヘッダーを追加"
              >
                + 追加
              </Button>
            </div>
            <div
              className="http-client-headers-list"
              role="group"
              aria-label="カスタムヘッダー一覧"
            >
              {headers.map((header, index) => (
                <div key={index} className="http-client-header-row">
                  <Input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(index, "key", e.target.value)}
                    placeholder="キー（例: Content-Type）"
                    aria-label={`ヘッダー ${index + 1} のキー`}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <Input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(index, "value", e.target.value)}
                    placeholder="値（例: application/json）"
                    aria-label={`ヘッダー ${index + 1} の値`}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button
                    type="button"
                    className="http-client-remove-btn"
                    onClick={() => removeHeader(index)}
                    aria-label={`ヘッダー ${index + 1} を削除`}
                    disabled={headers.length === 1 && !header.key && !header.value}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* リクエストボディ */}
          {methodHasBody && (
            <div className="converter-section">
              <label htmlFor="httpBody">リクエストボディ</label>
              <textarea
                id="httpBody"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                aria-label="リクエストボディ（JSON/テキスト）"
                className="http-client-body-textarea"
              />
            </div>
          )}

          <div className="http-client-submit-row">
            <Button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              aria-label="HTTPリクエストを送信（Ctrl+Enter）"
            >
              {isLoading ? "送信中..." : "送信 (Ctrl+Enter)"}
            </Button>
          </div>
        </form>

        {isLoading && <LoadingSpinner message="リクエスト送信中..." />}

        <ErrorMessage message={error} />

        {/* レスポンス表示 */}
        {response && !error && (
          <section aria-labelledby="response-title">
            <h2 id="response-title" className="section-title">
              レスポンス
            </h2>

            {/* ステータスとレスポンス時間 */}
            <div className="http-client-response-meta">
              <div className="http-client-status-wrapper">
                <span
                  className={`http-client-status-badge ${getStatusClass(response.statusCode)}`}
                  aria-label={`ステータスコード ${response.statusCode}`}
                >
                  {response.statusCode}
                </span>
                <span className="http-client-status-text">
                  {response.statusText || getStatusDescription(response.statusCode)}
                </span>
              </div>
              <span className="http-client-response-time">{response.responseTime}ms</span>
            </div>

            {/* タブ切り替え */}
            <div
              className="http-client-tabs"
              role="tablist"
              aria-label="レスポンスの表示内容を切り替え"
            >
              <button
                id="tab-body"
                role="tab"
                type="button"
                className={`http-client-tab ${activeTab === "body" ? "active" : ""}`}
                aria-selected={activeTab === "body"}
                aria-controls="response-body-panel"
                onClick={() => setActiveTab("body")}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") setActiveTab("headers");
                  else if (e.key === "ArrowLeft") setActiveTab("headers");
                }}
              >
                ボディ
              </button>
              <button
                id="tab-headers"
                role="tab"
                type="button"
                className={`http-client-tab ${activeTab === "headers" ? "active" : ""}`}
                aria-selected={activeTab === "headers"}
                aria-controls="response-headers-panel"
                onClick={() => setActiveTab("headers")}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") setActiveTab("body");
                  else if (e.key === "ArrowLeft") setActiveTab("body");
                }}
              >
                ヘッダー ({Object.keys(response.headers).length})
              </button>
            </div>

            {/* ボディパネル */}
            <div
              id="response-body-panel"
              role="tabpanel"
              aria-labelledby="tab-body"
              hidden={activeTab !== "body"}
            >
              {method === "HEAD" ? (
                <p className="http-client-no-body">
                  HEADリクエストにはレスポンスボディがありません
                </p>
              ) : response.body ? (
                <pre className="http-client-response-body">
                  <code>{formatResponseBody(response.body)}</code>
                </pre>
              ) : (
                <p className="http-client-no-body">レスポンスボディが空です</p>
              )}
            </div>

            {/* ヘッダーパネル */}
            <div
              id="response-headers-panel"
              role="tabpanel"
              aria-labelledby="tab-headers"
              hidden={activeTab !== "headers"}
            >
              {Object.keys(response.headers).length > 0 ? (
                <div className="result-card">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="result-row">
                      <div className="result-label">{key}</div>
                      <div className="result-value">{value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="http-client-no-body">レスポンスヘッダーがありません</p>
              )}
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "メソッド（GET/POST等）を選択してURLを入力し「送信」をクリック",
                "カスタムヘッダーを追加するには「+ 追加」ボタンをクリック",
                "POST/PUT/PATCHリクエストにはボディ入力エリアが表示されます",
                "レスポンスのボディとヘッダーをタブで切り替えて確認できます",
                "JSONレスポンスは自動的に整形されます",
                "キーボードショートカット: Ctrl+Enter でリクエスト送信",
              ],
            },
            {
              title: "制限事項",
              items: [
                "サーバーサイドでリクエストを実行するためCORS制限を回避できます",
                "ローカルホストやプライベートIPへのアクセスはセキュリティ上拒否されます",
                "タイムアウトは15秒です",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
