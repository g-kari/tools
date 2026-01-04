import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  checkSecurityHeaders,
  type SecurityHeadersResult,
  type HeaderCheck,
  type SecurityLevel,
} from "../functions/security-headers";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/security-headers")({
  head: () => ({
    meta: [{ title: "セキュリティヘッダーチェック" }],
  }),
  component: SecurityHeadersChecker,
});

function SecurityHeadersChecker() {
  const { showToast } = useToast();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<SecurityHeadersResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const handleCheck = useCallback(async () => {
    if (!url.trim()) {
      announceStatus("エラー: URLを入力してください");
      showToast("URLを入力してください", "error");
      inputRef.current?.focus();
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError("無効なURL形式です");
      announceStatus("エラー: 無効なURL形式です");
      inputRef.current?.focus();
      return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);
    announceStatus("チェック中...");

    try {
      const data = await checkSecurityHeaders({ data: url.trim() });

      if (data.error) {
        setError(data.error);
        announceStatus("エラー: " + data.error);
        return;
      }

      setResult(data);
      announceStatus("チェックが完了しました");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "通信エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
    } finally {
      setIsLoading(false);
    }
  }, [url, announceStatus, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        (e.target as HTMLElement)?.id === "urlInput"
      ) {
        e.preventDefault();
        handleCheck();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCheck]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getLevelColor = (level: SecurityLevel): string => {
    switch (level) {
      case "pass":
        return "security-pass";
      case "warning":
        return "security-warning";
      case "danger":
        return "security-danger";
      default:
        return "";
    }
  };

  const getLevelIcon = (level: SecurityLevel): string => {
    switch (level) {
      case "pass":
        return "✓";
      case "warning":
        return "⚠";
      case "danger":
        return "✗";
      default:
        return "";
    }
  };

  const getLevelLabel = (level: SecurityLevel): string => {
    switch (level) {
      case "pass":
        return "合格";
      case "warning":
        return "警告";
      case "danger":
        return "危険";
      default:
        return "";
    }
  };

  const getScoreLevel = (score: number): SecurityLevel => {
    if (score >= 80) return "pass";
    if (score >= 50) return "warning";
    return "danger";
  };

  const renderCheckResult = (check: HeaderCheck, index: number) => {
    return (
      <div key={index} className={`security-check-item ${getLevelColor(check.level)}`}>
        <div className="security-check-header">
          <span className="security-check-icon" aria-hidden="true">
            {getLevelIcon(check.level)}
          </span>
          <h3 className="security-check-name">{check.name}</h3>
          <span className="security-check-level">
            {getLevelLabel(check.level)}
          </span>
        </div>
        {check.value && (
          <div className="security-check-value">
            <strong>現在の値:</strong>
            <code>{check.value}</code>
          </div>
        )}
        <div className="security-check-message">{check.message}</div>
        {check.recommendation && (
          <div className="security-check-recommendation">
            <strong>推奨設定:</strong>
            <code>{check.recommendation}</code>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="セキュリティヘッダーチェックフォーム"
        >
          <div className="converter-section">
            <div className="search-form-row">
              <div className="search-input-wrapper">
                <label htmlFor="urlInput">チェック対象URL</label>
                <input
                  type="text"
                  id="urlInput"
                  ref={inputRef}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  aria-describedby="url-help"
                  aria-label="チェックするURL"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <Button
                type="submit"
                className="btn-primary"
                onClick={handleCheck}
                disabled={isLoading}
                aria-label="セキュリティヘッダーをチェック"
              >
                チェック
              </Button>
            </div>
            <span id="url-help" className="sr-only">
              https://example.comのような形式でURLを入力してください
            </span>
          </div>
        </form>

        {isLoading && (
          <div className="loading" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <span>チェック中...</span>
          </div>
        )}

        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        {result && !error && (
          <section aria-labelledby="result-title">
            <h2 id="result-title" className="section-title">
              チェック結果
            </h2>

            <div className={`security-score ${getLevelColor(getScoreLevel(result.score))}`}>
              <div className="security-score-value">{result.score}</div>
              <div className="security-score-label">セキュリティスコア</div>
              <div className="security-score-description">
                {result.score >= 80 && "優れたセキュリティ設定です"}
                {result.score >= 50 && result.score < 80 && "改善の余地があります"}
                {result.score < 50 && "セキュリティ対策が不足しています"}
              </div>
            </div>

            <div className="security-checks" aria-live="polite">
              {result.checks.map((check, index) => renderCheckResult(check, index))}
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "チェックしたいWebサイトのURLを入力",
                "「チェック」ボタンをクリックしてセキュリティヘッダーを検証",
                "各ヘッダーの状態と推奨設定を確認",
                "チェック項目: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection",
              ],
            },
            {
              title: "セキュリティヘッダーについて",
              items: [
                "Content-Security-Policy (CSP): XSS攻撃を防ぐためのヘッダー。信頼できるコンテンツソースを指定します",
                "Strict-Transport-Security (HSTS): HTTPS接続を強制し、中間者攻撃を防ぎます",
                "X-Content-Type-Options: ブラウザのMIME sniffingを防止します",
                "X-Frame-Options: クリックジャッキング攻撃を防ぐために、iframe内での表示を制御します",
                "Referrer-Policy: リファラー情報の送信方法を制御します",
                "Permissions-Policy: ブラウザの機能（カメラ、マイクなど）へのアクセスを制御します",
                "X-XSS-Protection: 古いブラウザのXSSフィルターを制御します（現在は非推奨、CSP使用を推奨）",
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
