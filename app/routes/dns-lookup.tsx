import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useRef, useCallback } from "react";
import { lookupDns, type DnsLookupResult, type DnsRecordType } from "../functions/dns-lookup";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/dns-lookup")({
  head: () => ({
    meta: [
      { title: "DNS検索 | Web ツール集" },
      {
        name: "description",
        content: "ドメインのDNSレコード（A・AAAA・MX・TXT・CNAME等）を検索するツール。",
      },
      { property: "og:title", content: "DNS検索 | Web ツール集" },
      {
        property: "og:description",
        content: "ドメインのDNSレコード（A・AAAA・MX・TXT・CNAME等）を検索するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/dns-lookup` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "DNS検索 | Web ツール集" },
      {
        name: "twitter:description",
        content: "ドメインのDNSレコード（A・AAAA・MX・TXT・CNAME等）を検索するツール。",
      },
    ],
  }),
  component: DnsLookup,
});

/**
 * DNS record types supported by the DNS lookup tool
 *
 * Each record type includes:
 * - value: DnsRecordType enum value
 * - label: Display label in UI
 * - description: User-friendly description in Japanese
 */
const RECORD_TYPES: { value: DnsRecordType; label: string; description: string }[] = [
  { value: "A", label: "A", description: "IPv4アドレス" },
  { value: "AAAA", label: "AAAA", description: "IPv6アドレス" },
  { value: "CNAME", label: "CNAME", description: "正規名" },
  { value: "MX", label: "MX", description: "メールサーバー" },
  { value: "TXT", label: "TXT", description: "テキストレコード" },
  { value: "NS", label: "NS", description: "ネームサーバー" },
  { value: "SOA", label: "SOA", description: "権威レコード" },
  { value: "PTR", label: "PTR", description: "逆引き" },
  { value: "SRV", label: "SRV", description: "サービスレコード" },
  { value: "CAA", label: "CAA", description: "証明書認証局" },
];

/**
 * DNS Lookup Component
 *
 * Provides a UI for querying DNS records of a domain.
 * Supports multiple record types (A, AAAA, MX, TXT, etc.) with checkboxes.
 * Results are displayed in a table format with copy functionality.
 *
 * Features:
 * - Multi-type DNS record search
 * - Select all/deselect all functionality
 * - Keyboard shortcuts (Enter to search)
 * - Accessibility support with ARIA labels
 * - Real-time status announcements for screen readers
 *
 * @returns DNS lookup page component
 */
function DnsLookup() {
  const { showToast } = useToast();
  const [domain, setDomain] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<DnsRecordType[]>([
    "A",
    "AAAA",
    "CNAME",
    "MX",
    "TXT",
    "NS",
  ]);
  const [result, setResult] = useState<DnsLookupResult | null>(null);
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

  const handleTypeToggle = (type: DnsRecordType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleSelectAll = () => {
    setSelectedTypes(RECORD_TYPES.map((t) => t.value));
  };

  const handleDeselectAll = () => {
    setSelectedTypes([]);
  };

  const handleSearch = useCallback(async () => {
    if (!domain.trim()) {
      announceStatus("エラー: ドメイン名を入力してください");
      showToast("ドメイン名を入力してください", "error");
      inputRef.current?.focus();
      return;
    }

    if (selectedTypes.length === 0) {
      announceStatus("エラー: 少なくとも1つのレコードタイプを選択してください");
      showToast("少なくとも1つのレコードタイプを選択してください", "error");
      return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);
    announceStatus("検索中...");

    try {
      const data = await lookupDns({
        data: { domain: domain.trim(), types: selectedTypes },
      });

      setResult(data);
      announceStatus("検索が完了しました");
    } catch (err) {
      const message = err instanceof Error ? err.message : "通信エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [domain, selectedTypes, announceStatus, showToast]);

  /**
   * Copy DNS record data to clipboard
   *
   * @param record - DNS record data to copy
   */
  const handleCopyRecord = useCallback(
    (record: string) => {
      navigator.clipboard
        .writeText(record)
        .then(() => showToast("コピーしました", "success"))
        .catch(() => showToast("コピーに失敗しました", "error"));
    },
    [showToast],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.target as HTMLElement)?.id === "domainInput") {
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

  return (
    <>
      <div className="tool-container">
        <p className="page-subtitle">ドメインのDNSレコード（A, AAAA, MX, TXT等）を検索します</p>

        <form onSubmit={(e) => e.preventDefault()} aria-label="DNS検索フォーム">
          <div className="converter-section">
            <h2 id="input-heading" className="sr-only">
              ドメイン入力
            </h2>
            <div className="search-form-row">
              <div className="search-input-wrapper">
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
                  aria-required="true"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <Button
                type="submit"
                className="btn-primary primary-button"
                onClick={handleSearch}
                disabled={isLoading}
                aria-label="DNS情報を検索"
              >
                {isLoading ? "検索中..." : "検索"}
              </Button>
            </div>
            <span id="domain-help" className="sr-only">
              example.comのような形式でドメイン名を入力してください
            </span>

            <div className="checkbox-group-header">
              <label className="input-label">レコードタイプ</label>
              <div className="checkbox-controls">
                <button
                  type="button"
                  className="text-button"
                  onClick={handleSelectAll}
                  aria-label="すべて選択"
                >
                  すべて選択
                </button>
                <span className="checkbox-controls-separator">|</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={handleDeselectAll}
                  aria-label="すべて解除"
                >
                  すべて解除
                </button>
              </div>
            </div>
            <div className="checkbox-grid" role="group" aria-label="レコードタイプ選択">
              {RECORD_TYPES.map((recordType) => (
                <label
                  key={recordType.value}
                  className="checkbox-label"
                  title={recordType.description}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(recordType.value)}
                    onChange={() => handleTypeToggle(recordType.value)}
                    aria-label={`${recordType.label} - ${recordType.description}`}
                  />
                  <span className="checkbox-text">
                    <span className="checkbox-type">{recordType.label}</span>
                    <span className="checkbox-desc">{recordType.description}</span>
                  </span>
                </label>
              ))}
            </div>
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
            <div className="result-timestamp">
              ドメイン: {result.domain} | 検索日時:{" "}
              {new Date(result.timestamp).toLocaleString("ja-JP")}
            </div>

            {result.results.map((typeResult) => {
              const hasRecords = typeResult.records.length > 0;
              const hasError = typeResult.error !== undefined;

              return (
                <div key={typeResult.type} className="dns-record-section">
                  <h3 className="dns-record-type">
                    {typeResult.type} レコード
                    {hasRecords && (
                      <span className="dns-record-count"> ({typeResult.records.length}件)</span>
                    )}
                  </h3>

                  {hasError && (
                    <div className="info-message" role="status">
                      {typeResult.error}
                    </div>
                  )}

                  {!hasError && !hasRecords && (
                    <div className="info-message" role="status">
                      レコードが見つかりませんでした
                    </div>
                  )}

                  {hasRecords && (
                    <div className="dns-records-table-container">
                      <table className="dns-records-table">
                        <thead>
                          <tr>
                            <th scope="col">名前</th>
                            <th scope="col">TTL</th>
                            <th scope="col">データ</th>
                            <th scope="col">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {typeResult.records.map((record, index) => (
                            <tr key={index}>
                              <td className="dns-record-name">{record.name}</td>
                              <td className="dns-record-ttl">{record.TTL}秒</td>
                              <td className="dns-record-data">{record.data}</td>
                              <td>
                                <button
                                  onClick={() => handleCopyRecord(record.data)}
                                  className="icon-button"
                                  aria-label={`${record.data}をコピー`}
                                  title="コピー"
                                >
                                  📋
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "ドメイン名を入力して検索したいレコードタイプを選択",
                "「検索」ボタンをクリックしてDNSレコードを取得",
                "例: google.com, github.com",
                "複数のレコードタイプを同時に検索可能",
                "キーボードショートカット: Enterキーで検索実行",
              ],
            },
            {
              title: "対応レコードタイプ",
              items: [
                "A (IPv4アドレス), AAAA (IPv6アドレス)",
                "CNAME (正規名), MX (メールサーバー)",
                "TXT (テキストレコード), NS (ネームサーバー)",
                "SOA (権威レコード), PTR (逆引き)",
                "SRV (サービスレコード), CAA (証明書認証局)",
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
