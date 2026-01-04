import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { getGlobalIp, type GlobalIpResult } from "../functions/global-ip";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";

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
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
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

    const success = await copy(result.ip);
    if (success) {
      setCopied(true);
      announceStatus("IPアドレスをコピーしました");
      // Clear previous timeout
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } else {
      announceStatus("コピーに失敗しました");
    }
  }, [result?.ip, copy, announceStatus]);

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">あなたのグローバルIPアドレス</h2>

          <LoadingSpinner isLoading={isLoading} message="取得中..." />

          <ErrorMessage message={error} />

          {result && !error && result.ip && (
            <div className="ip-display-container" aria-live="polite">
              <div className="ip-display" aria-label="あなたのIPアドレス">
                {result.ip}
              </div>
              <div className="ip-actions">
                <Button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopy}
                  aria-label="IPアドレスをコピー"
                >
                  {copied ? "コピーしました" : "コピー"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-secondary"
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

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
