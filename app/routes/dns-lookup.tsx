import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  lookupDns,
  type DnsLookupResult,
  type DnsRecordType,
} from "../functions/dns-lookup";
import { useToast } from "../components/Toast";

export const Route = createFileRoute("/dns-lookup")({
  head: () => ({
    meta: [{ title: "DNSレコード検索ツール" }],
  }),
  component: DnsLookup,
});

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
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
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
      const message =
        err instanceof Error ? err.message : "通信エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [domain, selectedTypes, announceStatus, showToast]);

  const handleCopyRecord = useCallback(
    (record: string) => {
      navigator.clipboard.writeText(record);
      showToast("コピーしました", "success");
    },
    [showToast]
  );

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

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">DNSレコード検索</h1>
        <p className="page-subtitle">
          ドメインのDNSレコード（A, AAAA, MX, TXT等）を検索します
        </p>
      </header>

      <div
        ref={statusRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      ></div>

      <main className="page-content">
        <section className="input-section" aria-labelledby="input-heading">
          <h2 id="input-heading" className="section-title">
            ドメイン入力
          </h2>
          <div className="input-group">
            <label htmlFor="domainInput" className="input-label">
              ドメイン名
            </label>
            <input
              ref={inputRef}
              type="text"
              id="domainInput"
              className="text-input"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              aria-required="true"
              aria-invalid={error !== null}
              aria-describedby={error ? "domain-error" : undefined}
            />
            {error && (
              <div id="domain-error" className="error-message" role="alert">
                {error}
              </div>
            )}
          </div>

          <div className="input-group">
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

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="primary-button"
            aria-label="DNS検索を実行"
          >
            {isLoading ? "検索中..." : "検索"}
          </button>
        </section>

        {result && (
          <section className="output-section" aria-labelledby="output-heading">
            <h2 id="output-heading" className="section-title">
              検索結果: {result.domain}
            </h2>
            <div className="result-timestamp">
              検索日時: {new Date(result.timestamp).toLocaleString("ja-JP")}
            </div>

            {result.results.map((typeResult) => {
              const hasRecords = typeResult.records.length > 0;
              const hasError = typeResult.error !== undefined;

              return (
                <div key={typeResult.type} className="dns-record-section">
                  <h3 className="dns-record-type">
                    {typeResult.type} レコード
                    {hasRecords && (
                      <span className="dns-record-count">
                        {" "}
                        ({typeResult.records.length}件)
                      </span>
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
      </main>
    </div>
  );
}
