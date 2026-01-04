import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  getServerEnv,
  type ServerEnvResult,
  type EnvItem,
} from "../functions/server-env";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";

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

  const { statusRef, announceStatus } = useStatusAnnouncement();

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

          <LoadingSpinner isLoading={isLoading} message="取得中..." />

          <ErrorMessage message={error} />

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
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-secondary"
                  onClick={fetchEnv}
                  disabled={isLoading}
                  aria-label="環境情報を再取得"
                >
                  再取得
                </Button>
              </div>
            </div>
          )}
        </div>

        <TipsCard
          sections={[
            {
              title: "サーバー環境情報とは",
              items: [
                "このページはサーバー側で取得できる情報を表示します",
                "Cloudflareのエッジサーバーで処理されるリクエスト情報を確認できます",
                "開発者がデバッグや環境確認に利用できます",
              ],
            },
            {
              title: "カテゴリについて",
              items: [
                "Cloudflare 位置情報: IPアドレスから推測される地理情報（国、都市、緯度経度など）",
                "Cloudflare ネットワーク情報: ASN、データセンター、HTTPプロトコルなど",
                "Cloudflare セキュリティ情報: TLSバージョン、暗号スイート、Bot検出情報など",
                "リクエストURL情報: リクエストのURL、ホスト、パス、クライアントIP",
                "リクエストヘッダー: ブラウザから送信された標準的なHTTPヘッダー",
                "Client Hints: ブラウザの詳細情報を提供するClient Hintsヘッダー",
                "ランタイム情報: サーバーのランタイム環境とタイムスタンプ",
              ],
            },
            {
              title: "セキュリティについて",
              items: [
                "Cookie、Authorization、API Keyなどの機密性の高いヘッダーは表示されません",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
