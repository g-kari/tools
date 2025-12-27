import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { getGlobalIp, type GlobalIpResult } from "../functions/global-ip";

export const Route = createFileRoute("/global-ip")({
  head: () => ({
    meta: [{ title: "グローバルIP確認ツール" }],
  }),
  component: GlobalIpLookup,
});

function GlobalIpLookup() {
  const [result, setResult] = useState<GlobalIpResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const fetchIp = useCallback(async () => {
    setError(null);
    setResult(null);
    setIsLoading(true);
    setCopied(false);
    announceStatus("IPアドレスを取得中...");

    try {
      const data = await getGlobalIp();

      if (data.error) {
        setError(data.error);
        announceStatus("エラー: " + data.error);
        return;
      }

      setResult(data);
      announceStatus("IPアドレスを取得しました: " + data.ip);
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
    fetchIp();
  }, [fetchIp]);

  const handleCopy = useCallback(async () => {
    if (!result?.ip) return;

    try {
      await navigator.clipboard.writeText(result.ip);
      setCopied(true);
      announceStatus("IPアドレスをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      announceStatus("コピーに失敗しました");
    }
  }, [result?.ip, announceStatus]);

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">あなたのグローバルIPアドレス</h2>

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

          {result && !error && (
            <div className="ip-display-container" aria-live="polite">
              <div className="ip-display" aria-label="あなたのIPアドレス">
                {result.ip}
              </div>
              <div className="ip-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopy}
                  aria-label="IPアドレスをコピー"
                >
                  {copied ? "コピーしました" : "コピー"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={fetchIp}
                  disabled={isLoading}
                  aria-label="IPアドレスを再取得"
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
          <h3 id="usage-title">グローバルIPアドレスとは</h3>
          <ul>
            <li>インターネット上であなたのデバイスを識別するアドレスです</li>
            <li>プロバイダーから割り当てられます</li>
            <li>VPNやプロキシを使用すると異なるIPが表示されます</li>
          </ul>
          <h3>このツールについて</h3>
          <p>
            サーバーに接続した際のIPアドレスを表示します。Cloudflare経由でアクセスしている場合、実際のIPアドレスが正確に取得されます。
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
        .ip-display-container {
          text-align: center;
          padding: 2rem;
        }

        .ip-display {
          font-family: 'Roboto Mono', monospace;
          font-size: 2rem;
          font-weight: 500;
          color: var(--on-surface);
          background-color: var(--surface-container);
          padding: 1.5rem 2rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          user-select: all;
          word-break: break-all;
        }

        .ip-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        @media (max-width: 480px) {
          .ip-display {
            font-size: 1.25rem;
            padding: 1rem 1.5rem;
          }
        }
      `}</style>
    </>
  );
}
