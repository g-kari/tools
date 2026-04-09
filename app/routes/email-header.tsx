import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  analyzeEmailHeaders,
  formatDeliveryTime,
  getAuthStatusLabel,
  getAuthStatusColor,
  type EmailHeaderAnalysis,
  type AuthStatus,
} from "../utils/email-header";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { useKeyboardShortcut } from "~/hooks/useKeyboardShortcut";

export const Route = createFileRoute("/email-header")({
  head: () => ({
    meta: [
      { title: "メールヘッダー解析 | Web ツール集" },
      {
        name: "description",
        content:
          "生のメールヘッダーを貼り付けて解析。SPF・DKIM・DMARC認証結果、メール経路（Received）、スパムスコアを可視化。",
      },
      { property: "og:title", content: "メールヘッダー解析 | Web ツール集" },
      {
        property: "og:description",
        content:
          "生のメールヘッダーを貼り付けて解析。SPF・DKIM・DMARC認証結果、メール経路、スパムスコアを可視化。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/email-header` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "メールヘッダー解析 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "生のメールヘッダーを貼り付けて解析。SPF・DKIM・DMARC認証結果、メール経路、スパムスコアを可視化。",
      },
    ],
  }),
  component: EmailHeaderAnalyzer,
});

/** Auth status badge component */
function AuthBadge({ protocol, status }: { protocol: string; status: AuthStatus }) {
  const colorClass = getAuthStatusColor(status);
  return (
    <div className={`auth-card ${colorClass}`} role="status" aria-label={`${protocol}: ${status}`}>
      <span className="auth-card-protocol">{protocol}</span>
      <span className="auth-card-status">{getAuthStatusLabel(status)}</span>
    </div>
  );
}

/**
 * Email Header Analyzer component.
 * Parses raw email headers and visualizes routing, authentication, and spam info.
 */
function EmailHeaderAnalyzer() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<EmailHeaderAnalysis | null>(null);
  const [error, setError] = useState("");
  const [headerFilter, setHeaderFilter] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();
  const { copy } = useClipboard();

  /** Analyze headers */
  const handleAnalyze = useCallback(() => {
    if (!input.trim()) {
      setError("メールヘッダーを入力してください");
      announceStatus("エラー: メールヘッダーを入力してください");
      inputRef.current?.focus();
      return;
    }
    try {
      const analysis = analyzeEmailHeaders(input);
      if (analysis.headers.length === 0) {
        setError("ヘッダーが見つかりませんでした。正しいメールヘッダーを入力してください");
        setResult(null);
        return;
      }
      setResult(analysis);
      setError("");
      announceStatus(`解析完了: ${analysis.headers.length}件のヘッダーを検出しました`);
    } catch {
      setError("解析に失敗しました。メールヘッダーの形式を確認してください");
      setResult(null);
    }
  }, [input, announceStatus]);

  /** Clear all */
  const handleClear = useCallback(() => {
    setInput("");
    setResult(null);
    setError("");
    setHeaderFilter("");
    announceStatus("クリアしました");
    inputRef.current?.focus();
  }, [announceStatus]);

  /** Copy full header text */
  const handleCopy = useCallback(
    async (text: string, label: string) => {
      const success = await copy(text);
      announceStatus(success ? `${label}をコピーしました` : "コピーに失敗しました");
    },
    [copy, announceStatus],
  );

  // Ctrl+Enter で解析実行
  useKeyboardShortcut("Enter", handleAnalyze, { ctrl: true });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // フィルター適用済みヘッダー
  const filteredHeaders = useMemo(() => {
    if (!result) return [];
    if (!headerFilter.trim()) return result.headers;
    const q = headerFilter.toLowerCase();
    return result.headers.filter(
      (h) => h.name.toLowerCase().includes(q) || h.value.toLowerCase().includes(q),
    );
  }, [result, headerFilter]);

  return (
    <>
      <div className="tool-container">
        <StatusAnnouncer statusRef={statusRef} />

        <form onSubmit={(e) => e.preventDefault()} aria-label="メールヘッダー解析フォーム">
          <div className="converter-section">
            <label htmlFor="emailHeaderInput" className="section-title">
              メールヘッダー
            </label>
            <Textarea
              id="emailHeaderInput"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Received: from mail.example.com ...\nFrom: sender@example.com\nTo: recipient@example.org\nSubject: Test\nDate: Thu, 20 Mar 2026 10:00:00 +0900\nAuthentication-Results: mx.example.org; spf=pass; dkim=pass\n...`}
              aria-label="メールヘッダー入力欄"
              className="jwt-monospace-output"
              rows={10}
            />
          </div>

          <div className="button-group" role="group" aria-label="操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleAnalyze}
              aria-label="ヘッダーを解析"
            >
              解析 (Ctrl+Enter)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleClear}
              aria-label="クリア"
            >
              クリア
            </Button>
          </div>

          <ErrorMessage message={error} />
        </form>

        {result && (
          <div aria-live="polite" aria-label="解析結果">
            {/* Summary */}
            <div className="result-card">
              <h2 className="email-header-section-title">📧 サマリー</h2>
              <div className="email-header-summary-grid">
                {[
                  { label: "From", value: result.summary.from },
                  { label: "To", value: result.summary.to },
                  { label: "Subject", value: result.summary.subject },
                  { label: "Date", value: result.summary.date },
                  { label: "Message-ID", value: result.summary.messageId },
                  { label: "Return-Path", value: result.summary.returnPath },
                  { label: "Content-Type", value: result.summary.contentType },
                  { label: "MIME-Version", value: result.summary.mimeVersion },
                ]
                  .filter((item) => item.value)
                  .map((item) => (
                    <div key={item.label} className="email-header-summary-item">
                      <div className="email-header-summary-label">{item.label}</div>
                      <div className="email-header-summary-value">{item.value}</div>
                    </div>
                  ))}
              </div>

              {result.totalDeliveryMs !== null && (
                <div>
                  <span className="delivery-time-badge">
                    ⏱ 総配信時間: {formatDeliveryTime(result.totalDeliveryMs)}
                  </span>
                </div>
              )}
            </div>

            {/* Authentication */}
            {result.auth && (
              <div className="result-card">
                <h2 className="email-header-section-title">🔐 認証結果（SPF / DKIM / DMARC）</h2>
                <div className="auth-grid" role="list" aria-label="認証結果">
                  <AuthBadge protocol="SPF" status={result.auth.spf} />
                  <AuthBadge protocol="DKIM" status={result.auth.dkim} />
                  <AuthBadge protocol="DMARC" status={result.auth.dmarc} />
                  <AuthBadge protocol="ARC" status={result.auth.arc} />
                </div>
                <details>
                  <summary className="auth-details-summary">
                    生の Authentication-Results を表示
                  </summary>
                  <pre
                    className="jwt-monospace-output auth-raw-pre"
                    aria-label="Authentication-Results 生テキスト"
                  >
                    {result.auth.raw}
                  </pre>
                </details>
              </div>
            )}

            {/* Spam */}
            {(result.spam.score !== null || result.spam.status) && (
              <div className="result-card">
                <h2 className="email-header-section-title">🛡 スパム情報</h2>
                <div
                  className={`spam-status-badge ${result.spam.isSpam ? "is-spam" : "not-spam"}`}
                  role="status"
                  aria-label={`スパム判定: ${result.spam.isSpam ? "スパム" : "正常"}`}
                >
                  {result.spam.isSpam ? "⚠ スパム判定" : "✓ 正常"}
                </div>

                {result.spam.score !== null && (
                  <div className="spam-score-bar-wrapper">
                    <div className="spam-score-labels">
                      <span>スコア: {result.spam.score}</span>
                      {result.spam.threshold !== null && <span>閾値: {result.spam.threshold}</span>}
                    </div>
                    {result.spam.threshold !== null && (
                      <div
                        className="spam-score-bar"
                        role="progressbar"
                        aria-valuenow={result.spam.score}
                        aria-valuemax={result.spam.threshold * 2}
                        aria-label="スパムスコアバー"
                      >
                        <div
                          className={`spam-score-fill ${
                            result.spam.score < 0
                              ? "safe"
                              : result.spam.score < result.spam.threshold
                                ? "warn"
                                : "danger"
                          }`}
                          style={
                            {
                              "--spam-score-width": `${Math.min(100, Math.max(0, ((result.spam.score + result.spam.threshold) / (result.spam.threshold * 2)) * 100))}%`,
                            } as React.CSSProperties
                          }
                        />
                        <div
                          className="spam-threshold-marker"
                          title={`閾値: ${result.spam.threshold}`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {result.spam.tests.length > 0 && (
                  <div>
                    <div className="email-header-summary-label email-header-summary-label--spaced">
                      適用テスト ({result.spam.tests.length}件)
                    </div>
                    <div className="spam-tests" aria-label="スパムテスト一覧">
                      {result.spam.tests.map((t) => (
                        <span key={t} className="spam-test-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Routing */}
            {result.receivedHops.length > 0 && (
              <div className="result-card">
                <h2 className="email-header-section-title">
                  🗺 メール経路 ({result.receivedHops.length} ホップ)
                </h2>
                <div className="routing-timeline" aria-label="メール経路">
                  {result.receivedHops.map((hop, i) => (
                    <div key={i} className="routing-hop">
                      <div className="routing-hop-header">
                        <span className="routing-hop-index">ホップ {i + 1}</span>
                        {hop.delayMs !== null && (
                          <span className="routing-hop-delay">
                            +{formatDeliveryTime(hop.delayMs)}
                          </span>
                        )}
                      </div>
                      {hop.from && (
                        <div className="routing-hop-field">
                          <span className="routing-hop-field-label">from</span>
                          <span className="routing-hop-field-value">{hop.from}</span>
                        </div>
                      )}
                      {hop.by && (
                        <div className="routing-hop-field">
                          <span className="routing-hop-field-label">by</span>
                          <span className="routing-hop-field-value">{hop.by}</span>
                        </div>
                      )}
                      {hop.with && (
                        <div className="routing-hop-field">
                          <span className="routing-hop-field-label">with</span>
                          <span className="routing-hop-field-value">{hop.with}</span>
                        </div>
                      )}
                      {hop.date && <div className="routing-hop-date">{hop.date}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Headers */}
            <div className="result-card">
              <div className="headers-title-row">
                <h2 className="email-header-section-title email-header-section-title--no-margin">
                  📋 全ヘッダー ({result.headers.length}件)
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  className="btn-secondary"
                  onClick={() =>
                    handleCopy(
                      result.headers.map((h) => `${h.name}: ${h.value}`).join("\n"),
                      "全ヘッダー",
                    )
                  }
                  aria-label="全ヘッダーをコピー"
                >
                  コピー
                </Button>
              </div>

              <div className="headers-filter-bar">
                <Input
                  type="search"
                  value={headerFilter}
                  onChange={(e) => setHeaderFilter(e.target.value)}
                  placeholder="ヘッダー名・値でフィルター..."
                  aria-label="ヘッダーフィルター"
                />
              </div>

              <div className="headers-table-wrapper">
                <table className="headers-table" aria-label="メールヘッダー一覧">
                  <thead>
                    <tr>
                      <th scope="col">ヘッダー名</th>
                      <th scope="col">値</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHeaders.length > 0 ? (
                      filteredHeaders.map((h, i) => (
                        <tr key={i}>
                          <td className="headers-table-name">{h.name}</td>
                          <td className="headers-table-value">{h.value}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="email-header-no-data email-header-no-data--center"
                        >
                          一致するヘッダーが見つかりません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "メールクライアントで「メッセージのソースを表示」または「生のメッセージを表示」を選択してヘッダーをコピーできます",
                "Gmail では「…」メニュー→「メッセージのソースを表示」でヘッダーを確認できます",
                "SPF・DKIM・DMARC がすべて pass であればメールの送信元は正規のサーバーです",
                "Received ヘッダーは下から上の順に読みます（最初に受信したサーバーが最下部）",
                "X-Spam-Status でスパムフィルターのスコアと適用ルールを確認できます",
              ],
            },
          ]}
        />
      </div>
    </>
  );
}
