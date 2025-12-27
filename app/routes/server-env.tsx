import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  getServerEnv,
  type ServerEnvResult,
  type EnvItem,
} from "../functions/server-env";

export const Route = createFileRoute("/server-env")({
  head: () => ({
    meta: [{ title: "サーバー環境変数確認ツール" }],
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
      cloudflare: [],
      request: [],
      runtime: [],
    };
    for (const item of items) {
      groups[item.category].push(item);
    }
    return groups;
  };

  const categoryLabels: Record<string, string> = {
    cloudflare: "Cloudflare情報",
    request: "リクエスト情報",
    runtime: "ランタイム情報",
  };

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
              {Object.entries(groupByCategory(result.items)).map(
                ([category, items]) =>
                  items.length > 0 && (
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
                            {items.map((item, index) => (
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
              )}

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
            <li>
              このページはサーバー側で取得できる情報を表示します
            </li>
            <li>
              Cloudflareのエッジサーバーで処理されるリクエスト情報を確認できます
            </li>
            <li>
              開発者がデバッグや環境確認に利用できます
            </li>
          </ul>
          <h3 id="about-cloudflare-title">Cloudflare情報について</h3>
          <p>
            CF-Ray:
            リクエストを識別するユニークなID。サポート問い合わせ時に役立ちます。
          </p>
          <p>
            CF-IPCountry:
            アクセス元の国コード（ISO 3166-1 alpha-2形式）。
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

        @media (max-width: 600px) {
          .env-table th,
          .env-table td {
            padding: 0.5rem;
            font-size: 0.85rem;
          }

          .env-key {
            white-space: normal;
          }
        }
      `}</style>
    </>
  );
}
