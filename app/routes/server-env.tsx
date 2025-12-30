import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  getServerEnv,
  type ServerEnvResult,
  type EnvItem,
} from "../functions/server-env";

export const Route = createFileRoute("/server-env")({
  head: () => ({
    meta: [{ title: "サーバー環境情報" }],
  }),
  component: ServerEnvPage,
});

function ServerEnvPage() {
  const [result, setResult] = useState<ServerEnvResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      // Clear previous timeout
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  const fetchEnv = useCallback(async () => {
    setError(null);
    setResult(null);
    setIsLoading(true);
    announceStatus("サーバー環境情報を取得中...");

    try {
      const data = await getServerEnv();

      if (data.error) {
        setError(data.error);
        announceStatus("エラー: " + data.error);
        return;
      }

      setResult(data);
      announceStatus("サーバー環境情報を取得しました");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "通信エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
    } finally {
      setIsLoading(false);
    }
  }, [announceStatus]);

  useEffect(() => {
    fetchEnv();
  }, [fetchEnv]);

  const groupByCategory = (items: EnvItem[]) => {
    const groups: Record<string, EnvItem[]> = {
      "cloudflare-geo": [],
      "cloudflare-network": [],
      "cloudflare-security": [],
      "request-url": [],
      "request-headers": [],
      "request-client-hints": [],
      runtime: [],
    };
    for (const item of items) {
      if (groups[item.category]) {
        groups[item.category].push(item);
      }
    }
    return groups;
  };

  const categoryLabels: Record<string, string> = {
    "cloudflare-geo": "Cloudflare 位置情報",
    "cloudflare-network": "Cloudflare ネットワーク情報",
    "cloudflare-security": "Cloudflare セキュリティ情報",
    "request-url": "リクエストURL情報",
    "request-headers": "リクエストヘッダー",
    "request-client-hints": "Client Hints",
    runtime: "ランタイム情報",
  };

  const categoryOrder = [
    "cloudflare-geo",
    "cloudflare-network",
    "cloudflare-security",
    "request-url",
    "request-headers",
    "request-client-hints",
    "runtime",
  ];

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">サーバー環境情報</h2>

          {isLoading && (
            <div className="loading" aria-live="polite">
              <div className="spinner" aria-hidden="true" />
              <span>取得中...</span>
            </div>
          )}

          {error && (
            <div className="error-message" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          {result && !error && result.items && (
            <div className="env-results" aria-live="polite">
              {(() => {
                const groups = groupByCategory(result.items);
                return categoryOrder.map(
                  (category) =>
                    groups[category] &&
                    groups[category].length > 0 && (
                      <div key={category} className="env-category">
                        <h3 className="env-category-title">
                          {categoryLabels[category]}
                        </h3>
                        <div className="env-table-wrapper">
                          <table
                            className="env-table"
                            aria-label={categoryLabels[category]}
                          >
                            <thead>
                              <tr>
                                <th scope="col">項目</th>
                                <th scope="col">値</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groups[category].map((item, index) => (
                                <tr key={index}>
                                  <td className="env-key">{item.key}</td>
                                  <td className="env-value">{item.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                );
              })()}

              <div className="env-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={fetchEnv}
                  disabled={isLoading}
                  aria-label="環境情報を再取得"
                >
                  再取得
                </button>
              </div>
            </div>
          )}
        </div>

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">サーバー環境情報とは</h3>
          <ul>
            <li>このページはサーバー側で取得できる情報を表示します</li>
            <li>
              Cloudflareのエッジサーバーで処理されるリクエスト情報を確認できます
            </li>
            <li>開発者がデバッグや環境確認に利用できます</li>
          </ul>

          <h3>カテゴリについて</h3>
          <dl className="info-dl">
            <dt>Cloudflare 位置情報</dt>
            <dd>IPアドレスから推測される地理情報（国、都市、緯度経度など）</dd>

            <dt>Cloudflare ネットワーク情報</dt>
            <dd>ASN、データセンター、HTTPプロトコルなどのネットワーク情報</dd>

            <dt>Cloudflare セキュリティ情報</dt>
            <dd>TLSバージョン、暗号スイート、Bot検出情報など</dd>

            <dt>リクエストURL情報</dt>
            <dd>リクエストのURL、ホスト、パス、クライアントIP</dd>

            <dt>リクエストヘッダー</dt>
            <dd>ブラウザから送信された標準的なHTTPヘッダー</dd>

            <dt>Client Hints</dt>
            <dd>ブラウザの詳細情報を提供するClient Hintsヘッダー</dd>

            <dt>ランタイム情報</dt>
            <dd>サーバーのランタイム環境とタイムスタンプ</dd>
          </dl>

          <h3>セキュリティについて</h3>
          <p>
            Cookie、Authorization、API
            Keyなどの機密性の高いヘッダーは表示されません。
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

      <style>{`
        .env-results {
          padding: 1rem;
        }

        .env-category {
          margin-bottom: 2rem;
        }

        .env-category-title {
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--md-sys-color-on-surface);
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--md-sys-color-outline-variant);
        }

        .env-table-wrapper {
          overflow-x: auto;
        }

        .env-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .env-table th,
        .env-table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--md-sys-color-outline-variant);
        }

        .env-table th {
          font-weight: 500;
          color: var(--md-sys-color-on-surface-variant);
          background-color: var(--md-sys-color-surface-variant);
        }

        .env-key {
          font-weight: 500;
          color: var(--md-sys-color-on-surface);
          white-space: nowrap;
          min-width: 200px;
        }

        .env-value {
          font-family: 'Roboto Mono', monospace;
          word-break: break-all;
          color: var(--md-sys-color-on-surface);
        }

        .env-actions {
          margin-top: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .info-dl {
          margin: 0.5rem 0;
        }

        .info-dl dt {
          font-weight: 500;
          color: var(--md-sys-color-on-surface);
          margin-top: 0.75rem;
        }

        .info-dl dd {
          margin-left: 0;
          color: var(--md-sys-color-on-surface-variant);
          font-size: 0.9rem;
        }

        @media (max-width: 600px) {
          .env-table th,
          .env-table td {
            padding: 0.5rem;
            font-size: 0.85rem;
          }

          .env-key {
            white-space: normal;
            min-width: auto;
          }
        }
      `}</style>
    </>
  );
}
