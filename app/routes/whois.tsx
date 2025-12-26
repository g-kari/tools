import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { lookupWhois, type WhoisResult } from "../functions/whois";

export const Route = createFileRoute("/whois")({
  head: () => ({
    meta: [{ title: "WHOIS検索ツール" }],
  }),
  component: WhoisLookup,
});

interface ContactInfo {
  name?: string;
  organization?: string;
  email?: string;
  phone?: string;
  address?: string;
}

function formatDate(dateString?: string): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function formatContact(contact?: ContactInfo): string[] | null {
  if (!contact) return null;
  const parts: string[] = [];
  if (contact.name) parts.push(contact.name);
  if (contact.organization) parts.push(contact.organization);
  if (contact.email) parts.push(contact.email);
  if (contact.phone) parts.push(contact.phone);
  if (contact.address) parts.push(contact.address);
  return parts.length > 0 ? parts : null;
}

function WhoisLookup() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<WhoisResult | null>(null);
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

  const handleSearch = useCallback(async () => {
    if (!domain.trim()) {
      announceStatus("エラー: ドメイン名を入力してください");
      alert("ドメイン名を入力してください");
      inputRef.current?.focus();
      return;
    }

    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain.trim())) {
      setError("無効なドメイン形式です");
      announceStatus("エラー: 無効なドメイン形式です");
      inputRef.current?.focus();
      return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);
    announceStatus("検索中...");

    try {
      const data = await lookupWhois({ data: domain.trim() });

      if (data.error) {
        setError(data.error);
        announceStatus("エラー: " + data.error);
        return;
      }

      setResult(data);
      announceStatus("検索が完了しました");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "通信エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
    } finally {
      setIsLoading(false);
    }
  }, [domain, announceStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        (e.target as HTMLElement)?.id === "domainInput"
      ) {
        e.preventDefault();
        handleSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const renderResultRows = () => {
    if (!result) return null;

    const rows: Array<{
      label: string;
      value: string | string[];
      isList?: boolean;
    }> = [
      { label: "ドメイン名", value: result.domain || "-" },
      { label: "レジストラ", value: result.registrar || "-" },
      { label: "登録日", value: formatDate(result.createdDate) },
      { label: "有効期限", value: formatDate(result.expiryDate) },
      { label: "更新日", value: formatDate(result.updatedDate) },
    ];

    if (result.nameServers && result.nameServers.length > 0) {
      rows.push({
        label: "ネームサーバー",
        value: result.nameServers,
        isList: true,
      });
    }

    const registrantInfo = formatContact(result.registrant);
    if (registrantInfo) {
      rows.push({ label: "登録者", value: registrantInfo, isList: true });
    }

    const adminInfo = formatContact(result.administrative);
    if (adminInfo) {
      rows.push({ label: "管理連絡先", value: adminInfo, isList: true });
    }

    const techInfo = formatContact(result.technical);
    if (techInfo) {
      rows.push({ label: "技術連絡先", value: techInfo, isList: true });
    }

    const abuseInfo = formatContact(result.abuse);
    if (abuseInfo) {
      rows.push({ label: "不正利用連絡先", value: abuseInfo, isList: true });
    }

    if (result.status && result.status.length > 0) {
      rows.push({
        label: "ステータス",
        value: result.status.slice(0, 5),
        isList: true,
      });
    }

    return rows.map((row, index) => (
      <div key={index} className="result-row">
        <div className="result-label">{row.label}</div>
        {row.isList && Array.isArray(row.value) ? (
          <div className="result-value list">
            {row.value.map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        ) : (
          <div className="result-value">{String(row.value)}</div>
        )}
      </div>
    ));
  };

  return (
    <>
      <style>{`@import "/styles.css";`}</style>
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="WHOIS検索フォーム"
        >
          <div style={{ marginBottom: "30px" }}>
            <div
              style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}
            >
              <div style={{ flex: 1 }}>
                <label htmlFor="domainInput">ドメイン名</label>
                <input
                  type="text"
                  id="domainInput"
                  ref={inputRef}
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                  aria-describedby="domain-help"
                  aria-label="検索するドメイン名"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                onClick={handleSearch}
                disabled={isLoading}
                aria-label="WHOIS情報を検索"
                style={{ minWidth: "120px" }}
              >
                検索
              </button>
            </div>
            <span id="domain-help" className="sr-only">
              example.comのような形式でドメイン名を入力してください
            </span>
          </div>
        </form>

        {isLoading && (
          <div className="loading" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <span>検索中...</span>
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
              検索結果
            </h2>
            <div className="result-card" aria-live="polite">
              {renderResultRows()}
            </div>
          </section>
        )}

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">使い方</h3>
          <ul>
            <li>ドメイン名を入力して「検索」ボタンをクリック</li>
            <li>例: google.com, github.com</li>
            <li>登録者、有効期限、ネームサーバーなどの情報を表示</li>
            <li>キーボードショートカット: Enterキーで検索実行</li>
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
