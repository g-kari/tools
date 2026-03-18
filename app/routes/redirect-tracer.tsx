import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";
import { useToast } from "~/components/Toast";
import { useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import {
  traceRedirects,
  getStatusLabel,
  isRedirectStatus,
  type RedirectTraceResult,
  type RedirectHop,
} from "~/functions/redirect-tracer";

export const Route = createFileRoute("/redirect-tracer")({
  head: () => ({
    meta: [
      { title: "URLリダイレクトトレーサー | Web ツール集" },
      {
        name: "description",
        content:
          "URLのHTTPリダイレクトチェーンを可視化するツール。301/302/307/308などのリダイレクトを最大15ホップまで追跡し、各ステータスコード・Location・レスポンス時間を表示します。",
      },
      {
        property: "og:title",
        content: "URLリダイレクトトレーサー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "URLのHTTPリダイレクトチェーンを可視化するツール。301/302/307/308などのリダイレクトを追跡し、ステータスコードとLocation情報を表示します。",
      },
      {
        property: "og:url",
        content: `${SITE_BASE_URL}/redirect-tracer`,
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "URLリダイレクトトレーサー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "URLのHTTPリダイレクトチェーンを可視化するツール。301/302/307/308などのリダイレクトを追跡。",
      },
    ],
  }),
  component: RedirectTracer,
});

/**
 * ステータスコードに対応するバッジ CSS クラスを返す
 * @param statusCode - HTTPステータスコード
 * @returns CSS クラス文字列
 */
function getStatusBadgeClass(statusCode: number): string {
  if (statusCode === 0) return "redirect-tracer-status-badge status-error";
  if (statusCode >= 500) return "redirect-tracer-status-badge status-5xx";
  if (statusCode >= 400) return "redirect-tracer-status-badge status-4xx";
  if (statusCode >= 300) return "redirect-tracer-status-badge status-3xx";
  return "redirect-tracer-status-badge status-2xx";
}

/**
 * ホップ情報をテキスト形式に変換する
 * @param result - トレース結果
 * @returns クリップボードコピー用のテキスト
 */
function formatResultAsText(result: RedirectTraceResult): string {
  const lines: string[] = [
    "=== URLリダイレクトトレース ===",
    "",
  ];

  result.hops.forEach((hop, i) => {
    const isFinal = i === result.hops.length - 1;
    const isRedirect = isRedirectStatus(hop.statusCode) && !!hop.location;
    lines.push(
      `[${i + 1}${isFinal && !isRedirect ? " 最終" : ""}] ${hop.url}`
    );
    lines.push(
      `    ステータス: ${hop.statusCode} ${getStatusLabel(hop.statusCode)}`
    );
    lines.push(`    レスポンス時間: ${hop.responseTime}ms`);
    if (hop.location) {
      lines.push(`    Location: ${hop.location}`);
    }
    lines.push("");
  });

  lines.push(`合計時間: ${result.totalTime}ms`);
  if (result.error) {
    lines.push(`エラー: ${result.error}`);
  }

  return lines.join("\n");
}

/** 1ホップ分の表示コンポーネント */
function HopCard({
  hop,
  index,
  isFinal,
}: {
  hop: RedirectHop;
  index: number;
  isFinal: boolean;
}) {
  const isRedirect = isRedirectStatus(hop.statusCode) && !!hop.location;

  return (
    <div
      className="redirect-tracer-hop"
      role="listitem"
      aria-label={`ホップ ${index + 1}: ${hop.url}`}
    >
      <div className="redirect-tracer-hop-header">
        <span
          className={`redirect-tracer-hop-index${isFinal && !isRedirect ? " is-final" : ""}`}
          aria-hidden="true"
        >
          {index + 1}
        </span>

        <span className="redirect-tracer-hop-url">{hop.url}</span>

        <span
          className={getStatusBadgeClass(hop.statusCode)}
          aria-label={`ステータス: ${hop.statusCode} ${getStatusLabel(hop.statusCode)}`}
        >
          {hop.statusCode === 0
            ? "エラー"
            : `${hop.statusCode} ${getStatusLabel(hop.statusCode)}`}
        </span>

        <span
          className="redirect-tracer-hop-time"
          aria-label={`レスポンス時間: ${hop.responseTime}ミリ秒`}
        >
          {hop.responseTime}ms
        </span>
      </div>

      {hop.location && (
        <div className="redirect-tracer-hop-location">
          <span className="redirect-tracer-hop-location-label">Location:</span>
          <span className="redirect-tracer-hop-location-url">
            {hop.location}
          </span>
        </div>
      )}
    </div>
  );
}

/** URLリダイレクトトレーサーページコンポーネント */
function RedirectTracer() {
  const { showToast } = useToast();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<RedirectTraceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleTrace = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      showToast("URLを入力してください", "error");
      announceStatus("エラー: URLを入力してください");
      urlInputRef.current?.focus();
      return;
    }

    setResult(null);
    setIsLoading(true);
    announceStatus("トレース中...");

    try {
      const data = await traceRedirects({ data: trimmed });
      setResult(data);

      const hopCount = data.hops.length;
      const redirectCount = data.hops.filter(
        (h) => isRedirectStatus(h.statusCode) && !!h.location
      ).length;

      if (data.error) {
        announceStatus(
          `トレース完了 (エラー): ${hopCount}ホップ, ${redirectCount}リダイレクト`
        );
      } else {
        announceStatus(
          `トレース完了: ${hopCount}ホップ, ${redirectCount}リダイレクト, ${data.totalTime}ms`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "トレースに失敗しました";
      showToast(message, "error");
      announceStatus("エラー: " + message);
    } finally {
      setIsLoading(false);
    }
  }, [url, showToast, announceStatus]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(formatResultAsText(result));
      showToast("結果をクリップボードにコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [result, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleTrace();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleTrace]);

  useEffect(() => {
    urlInputRef.current?.focus();
  }, []);

  const redirectCount =
    result?.hops.filter((h) => isRedirectStatus(h.statusCode) && !!h.location)
      .length ?? 0;

  return (
    <>
      {/* スクリーンリーダー用 ライブリージョン */}
      <div ref={statusRef} className="sr-only" aria-live="polite" />

      <div className="tool-container">
        {/* 入力フォーム */}
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="リダイレクトトレースフォーム"
        >
          <div className="converter-section">
            <div className="redirect-tracer-form-group">
              <label htmlFor="urlInput">トレースするURL</label>
              <div className="redirect-tracer-input-row">
                <Input
                  type="url"
                  id="urlInput"
                  ref={urlInputRef}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isLoading}
                  aria-label="URLを入力"
                  autoComplete="url"
                  className="input-field"
                />
                <Button
                  type="submit"
                  onClick={handleTrace}
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? "トレース中..." : "トレース"}
                </Button>
              </div>
              <p className="input-hint">
                Ctrl+Enter でトレース実行 / HTTP・HTTPS に対応
              </p>
            </div>
          </div>
        </form>

        {/* トレース結果 */}
        {result && (
          <div className="converter-section">
            <div className="redirect-tracer-result-header">
              <h2 className="section-title">トレース結果</h2>
              <button
                type="button"
                className="redirect-tracer-copy-btn"
                onClick={handleCopy}
                aria-label="結果をクリップボードにコピー"
              >
                コピー
              </button>
            </div>

            <div
              className="redirect-tracer-result-meta"
              aria-label="トレースのサマリー"
            >
              <span>
                <strong>ホップ数:</strong> {result.hops.length}
              </span>
              <span>
                <strong>リダイレクト:</strong> {redirectCount}
              </span>
              <span>
                <strong>合計時間:</strong> {result.totalTime}ms
              </span>
            </div>

            {/* ホップチェーン */}
            <div
              className="redirect-tracer-chain"
              role="list"
              aria-label="リダイレクトチェーン"
            >
              {result.hops.map((hop, i) => {
                const isFinal = i === result.hops.length - 1;
                const isLast = i === result.hops.length - 1;
                return (
                  <div key={`${hop.url}-${i}`}>
                    <HopCard hop={hop} index={i} isFinal={isFinal} />
                    {!isLast && (
                      <div
                        className="redirect-tracer-arrow"
                        aria-hidden="true"
                      >
                        ↓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* エラーバナー */}
            {result.error && (
              <div
                className="redirect-tracer-error"
                role="alert"
                aria-label={`エラー: ${result.error}`}
              >
                <span aria-hidden="true">⚠</span>
                <span>{result.error}</span>
              </div>
            )}

            {/* 最終到達URLバナー（エラーなし・リダイレクトあり） */}
            {!result.error && redirectCount > 0 && (
              <div
                className="redirect-tracer-final"
                aria-label={`最終到達URL: ${result.finalUrl}`}
              >
                <span className="redirect-tracer-final-label">最終URL:</span>
                <span className="redirect-tracer-final-url">
                  {result.finalUrl}
                </span>
              </div>
            )}
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "リダイレクトの種類",
              items: [
                "301: 恒久リダイレクト（SEO評価を引き継ぐ）",
                "302: 一時リダイレクト（SEO評価は引き継がない）",
                "307: 一時リダイレクト（HTTPメソッドを保持）",
                "308: 恒久リダイレクト（HTTPメソッドを保持）",
              ],
            },
            {
              title: "使い方",
              items: [
                "URLを入力して「トレース」をクリック",
                "Ctrl+Enter でも実行可能",
                "各ホップのURL・ステータスコード・レスポンス時間を確認",
                "リダイレクトチェーンが多すぎる場合はループの可能性あり",
                "URLの手入力も可能（https:// は省略可）",
              ],
            },
            {
              title: "活用シーン",
              items: [
                "短縮URLの最終到達先を確認",
                "SEOリダイレクト設定の検証",
                "HTTPからHTTPSへのリダイレクト確認",
                "www/非wwwリダイレクトのチェック",
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
