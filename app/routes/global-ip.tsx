import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { getGlobalIp, type GlobalIpResult } from "../functions/global-ip";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

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
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
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
      // Use Clipboard API if available, fallback to execCommand
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(result.ip);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = result.ip;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      announceStatus("IPアドレスをコピーしました");
      // Clear previous timeout
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
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

          {result && !error && result.ip && (
            <div className="ip-display-container" aria-live="polite">
              <div className="ip-display" aria-label="あなたのIPアドレス">
                {result.ip}
              </div>
              <div className="ip-actions">
                <Button
                  type="button"
                  onClick={handleCopy}
                  aria-label="IPアドレスをコピー"
                >
                  {copied ? "コピーしました" : "コピー"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={fetchIp}
                  disabled={isLoading}
                  aria-label="IPアドレスを再取得"
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
              title: "グローバルIPアドレスとは",
              items: [
                "インターネット上であなたのデバイスを識別するアドレスです",
                "プロバイダーから割り当てられます",
                "VPNやプロキシを使用すると異なるIPが表示されます",
              ],
            },
            {
              title: "このツールについて",
              items: [
                "サーバーに接続した際のIPアドレスを表示します",
                "Cloudflare経由でアクセスしている場合、実際のIPアドレスが正確に取得されます",
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
