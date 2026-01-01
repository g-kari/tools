import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { lookupEmailDNS, DOMAIN_REGEX, type EmailDNSResult } from "../functions/email-dns";

export const Route = createFileRoute("/email-dns")({
  head: () => ({
    meta: [{ title: "メールDNS検証ツール" }],
  }),
  component: EmailDNSChecker,
});

function EmailDNSChecker() {
  const [domain, setDomain] = useState("");
  const [dkimSelector, setDkimSelector] = useState("");
  const [result, setResult] = useState<EmailDNSResult | null>(null);
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
    if (!domain.trim()) {
      setError("ドメイン名を入力してください");
      announceStatus("エラー: ドメイン名を入力してください");
      inputRef.current?.focus();
      return;
    }

    if (!DOMAIN_REGEX.test(domain.trim())) {
      setError("無効なドメイン形式です");
      announceStatus("エラー: 無効なドメイン形式です");
      inputRef.current?.focus();
      return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);
    announceStatus("検証中...");

    try {
      const data = await lookupEmailDNS({
        data: {
          domain: domain.trim(),
          dkimSelector: dkimSelector.trim() || undefined,
        },
      });

      setResult(data);
      announceStatus("検証が完了しました");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "通信エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
    } finally {
      setIsLoading(false);
    }
  }, [domain, dkimSelector, announceStatus]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCheck();
    }
  }, [handleCheck]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getStatusIcon = (status: "success" | "error" | "not_found") => {
    switch (status) {
      case "success":
        return "✓";
      case "not_found":
        return "⚠";
      case "error":
        return "✗";
    }
  };

  const getStatusClass = (status: "success" | "error" | "not_found") => {
    switch (status) {
      case "success":
        return "status-success";
      case "not_found":
        return "status-warning";
      case "error":
        return "status-error";
    }
  };

  return (
    <>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="メールDNS検証フォーム"
        >
          <div className="converter-section">
            <div className="search-form-row">
              <div className="search-input-wrapper">
                <label htmlFor="domainInput">ドメイン名</label>
                <input
                  type="text"
                  id="domainInput"
                  ref={inputRef}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="example.com"
                  aria-describedby="domain-help"
                  aria-label="検証するドメイン名"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <div className="search-input-wrapper">
                <label htmlFor="dkimSelectorInput">
                  DKIMセレクタ（オプション）
                </label>
                <input
                  type="text"
                  id="dkimSelectorInput"
                  value={dkimSelector}
                  onChange={(e) => setDkimSelector(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="default, google, など"
                  aria-describedby="dkim-help"
                  aria-label="DKIMセレクタ"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                onClick={handleCheck}
                disabled={isLoading}
                aria-label="メールDNS設定を検証"
              >
                {isLoading ? "検証中..." : "検証"}
              </button>
            </div>
            <span id="domain-help" className="sr-only">
              example.comのような形式でドメイン名を入力してください
            </span>
            <span id="dkim-help" className="sr-only">
              DKIMセレクタを入力してください（任意）
            </span>
          </div>
        </form>

        {isLoading && (
          <div className="loading" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <span>検証中...</span>
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
              検証結果: {result.domain}
            </h2>

            {/* MX Records */}
            <div className="result-card" aria-live="polite">
              <div className="dns-record-header">
                <h3>
                  <span
                    className={`status-icon ${getStatusClass(result.mx.status)}`}
                  >
                    {getStatusIcon(result.mx.status)}
                  </span>
                  MXレコード（メールサーバー）
                </h3>
              </div>
              {result.mx.status === "success" && result.mx.records.length > 0 && (
                <div className="dns-record-content">
                  <table className="dns-table">
                    <thead>
                      <tr>
                        <th>優先度</th>
                        <th>メールサーバー</th>
                        <th>IPアドレス</th>
                        <th>PTR</th>
                        <th>TTL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.mx.records.map((record, index) => (
                        <tr key={index}>
                          <td>{record.priority}</td>
                          <td className="monospace">{record.exchange}</td>
                          <td className="monospace">
                            {record.ipAddresses
                              ? record.ipAddresses.join(", ")
                              : "-"}
                          </td>
                          <td className="monospace">
                            {record.ptr ? record.ptr.join(", ") : "-"}
                          </td>
                          <td>{record.ttl || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.mx.warnings && result.mx.warnings.length > 0 && (
                    <div className="dns-warnings">
                      {result.mx.warnings.map((warning, idx) => (
                        <div key={idx} className="warning-item">
                          ⚠ {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {result.mx.error && (
                <div className="dns-record-error">{result.mx.error}</div>
              )}
            </div>

            {/* SPF Record */}
            <div className="result-card" aria-live="polite">
              <div className="dns-record-header">
                <h3>
                  <span
                    className={`status-icon ${getStatusClass(result.spf.status)}`}
                  >
                    {getStatusIcon(result.spf.status)}
                  </span>
                  SPFレコード（送信元認証）
                </h3>
              </div>
              {result.spf.status === "success" && result.spf.record && (
                <div className="dns-record-content">
                  <div className="result-row">
                    <div className="result-label">レコード</div>
                    <div className="result-value monospace">
                      {result.spf.record}
                    </div>
                  </div>
                  {result.spf.details && (
                    <>
                      <div className="result-row">
                        <div className="result-label">バージョン</div>
                        <div className="result-value">
                          {result.spf.details.version || "-"}
                        </div>
                      </div>
                      <div className="result-row">
                        <div className="result-label">有効性</div>
                        <div className="result-value">
                          {result.spf.details.isValid ? "✓ 有効" : "✗ 無効"}
                        </div>
                      </div>
                      {result.spf.details.lookupCount !== undefined && (
                        <div className="result-row">
                          <div className="result-label">DNSルックアップ回数</div>
                          <div className="result-value">
                            {result.spf.details.lookupCount}/10
                          </div>
                        </div>
                      )}
                      {result.spf.details.mechanisms &&
                        result.spf.details.mechanisms.length > 0 && (
                          <div className="result-row">
                            <div className="result-label">メカニズム</div>
                            <div className="result-value list">
                              {result.spf.details.mechanisms.map((m, i) => (
                                <span key={i} className="monospace">
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {result.spf.details.expandedIncludes &&
                        result.spf.details.expandedIncludes.length > 0 && (
                          <div className="result-row">
                            <div className="result-label">展開されたinclude</div>
                            <div className="result-value list">
                              {result.spf.details.expandedIncludes.map((inc, i) => (
                                <span key={i} className="monospace">
                                  {inc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {result.spf.details.warnings &&
                        result.spf.details.warnings.length > 0 && (
                          <div className="dns-warnings">
                            {result.spf.details.warnings.map((warning, idx) => (
                              <div key={idx} className="warning-item">
                                ⚠ {warning}
                              </div>
                            ))}
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
              {result.spf.error && (
                <div className="dns-record-error">{result.spf.error}</div>
              )}
            </div>

            {/* DMARC Record */}
            <div className="result-card" aria-live="polite">
              <div className="dns-record-header">
                <h3>
                  <span
                    className={`status-icon ${getStatusClass(result.dmarc.status)}`}
                  >
                    {getStatusIcon(result.dmarc.status)}
                  </span>
                  DMARCレコード（ポリシー設定）
                </h3>
              </div>
              {result.dmarc.status === "success" && result.dmarc.record && (
                <div className="dns-record-content">
                  <div className="result-row">
                    <div className="result-label">レコード</div>
                    <div className="result-value monospace">
                      {result.dmarc.record}
                    </div>
                  </div>
                  {result.dmarc.details && (
                    <>
                      <div className="result-row">
                        <div className="result-label">有効性</div>
                        <div className="result-value">
                          {result.dmarc.details.isValid ? "✓ 有効" : "✗ 無効"}
                        </div>
                      </div>
                      {result.dmarc.details.policy && (
                        <div className="result-row">
                          <div className="result-label">ポリシー</div>
                          <div className="result-value">
                            {result.dmarc.details.policy}
                          </div>
                        </div>
                      )}
                      {result.dmarc.details.subdomainPolicy && (
                        <div className="result-row">
                          <div className="result-label">サブドメインポリシー</div>
                          <div className="result-value">
                            {result.dmarc.details.subdomainPolicy}
                          </div>
                        </div>
                      )}
                      {result.dmarc.details.percentage !== undefined && (
                        <div className="result-row">
                          <div className="result-label">適用率</div>
                          <div className="result-value">
                            {result.dmarc.details.percentage}%
                          </div>
                        </div>
                      )}
                      {result.dmarc.details.rua &&
                        result.dmarc.details.rua.length > 0 && (
                          <div className="result-row">
                            <div className="result-label">集計レポート送信先 (rua)</div>
                            <div className="result-value list">
                              {result.dmarc.details.rua.map((r, i) => (
                                <span key={i} className="monospace">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {result.dmarc.details.ruf &&
                        result.dmarc.details.ruf.length > 0 && (
                          <div className="result-row">
                            <div className="result-label">失敗レポート送信先 (ruf)</div>
                            <div className="result-value list">
                              {result.dmarc.details.ruf.map((r, i) => (
                                <span key={i} className="monospace">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {result.dmarc.details.warnings &&
                        result.dmarc.details.warnings.length > 0 && (
                          <div className="dns-warnings">
                            {result.dmarc.details.warnings.map((warning, idx) => (
                              <div key={idx} className="warning-item">
                                ⚠ {warning}
                              </div>
                            ))}
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
              {result.dmarc.error && (
                <div className="dns-record-error">{result.dmarc.error}</div>
              )}
            </div>

            {/* DKIM Record */}
            {result.dkim && (
              <div className="result-card" aria-live="polite">
                <div className="dns-record-header">
                  <h3>
                    <span
                      className={`status-icon ${getStatusClass(result.dkim.status)}`}
                    >
                      {getStatusIcon(result.dkim.status)}
                    </span>
                    DKIMレコード（署名検証）
                  </h3>
                </div>
                {result.dkim.status === "success" && result.dkim.record && (
                  <div className="dns-record-content">
                    <div className="result-row">
                      <div className="result-label">セレクタ</div>
                      <div className="result-value monospace">
                        {result.dkim.selector}
                      </div>
                    </div>
                    <div className="result-row">
                      <div className="result-label">レコード</div>
                      <div className="result-value monospace word-break">
                        {result.dkim.record}
                      </div>
                    </div>
                  </div>
                )}
                {result.dkim.error && (
                  <div className="dns-record-error">{result.dkim.error}</div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="result-card recommendations-card">
                <h3 className="section-title">推奨事項</h3>
                <ul className="recommendations-list">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* SMTP Check Instructions */}
            {result.smtpCheckInstructions && (
              <div className="result-card smtp-instructions-card">
                <h3 className="section-title">
                  SMTP接続チェック（ローカル確認方法）
                </h3>
                <p className="smtp-instructions-intro">
                  以下のコマンドをターミナルで実行して、メールサーバーへの接続とTLS対応を確認できます：
                </p>

                <div className="smtp-check-section">
                  <h4>Telnetでの基本チェック</h4>
                  <pre className="code-block">
                    {result.smtpCheckInstructions.telnet.join("\n")}
                  </pre>
                </div>

                <div className="smtp-check-section">
                  <h4>curlでのSMTPチェック</h4>
                  <pre className="code-block">
                    {result.smtpCheckInstructions.curl.join("\n")}
                  </pre>
                </div>

                <div className="smtp-check-section">
                  <h4>OpenSSLでのTLS/SSL確認</h4>
                  <pre className="code-block">
                    {result.smtpCheckInstructions.openssl.join("\n")}
                  </pre>
                  <p className="smtp-note">
                    ※ STARTTLS対応の確認には25番ポート、SMTPS対応の確認には465番ポートを使用します
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>ドメイン名を入力して「検証」ボタンをクリック</li>
            <li>例: gmail.com, yahoo.co.jp</li>
            <li>MX、SPF、DMARC、DKIMレコードを検証</li>
            <li>DKIMは任意のセレクタを指定（例: default, google）</li>
            <li>キーボードショートカット: Enterキーで検証実行</li>
          </ul>
          <h3>各レコードについて</h3>
          <ul>
            <li>
              <strong>MX</strong>: メール配送先サーバーを指定
            </li>
            <li>
              <strong>SPF</strong>: 送信元IPアドレスを認証
            </li>
            <li>
              <strong>DMARC</strong>: SPF/DKIM失敗時の処理を定義
            </li>
            <li>
              <strong>DKIM</strong>: 電子署名でメールの改ざんを検知
            </li>
          </ul>
        </aside>
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
