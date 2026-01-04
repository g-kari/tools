import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  lookupIpGeolocation,
  type IpGeolocationResult,
} from "../functions/ip-geolocation";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/ip-geolocation")({
  head: () => ({
    meta: [{ title: "IPアドレス位置情報検索ツール" }],
  }),
  component: IpGeolocationLookup,
});

function IpGeolocationLookup() {
  const { showToast } = useToast();
  const [ipAddress, setIpAddress] = useState("");
  const [result, setResult] = useState<IpGeolocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleSearch = useCallback(async () => {
    if (!ipAddress.trim()) {
      announceStatus("エラー: IPアドレスを入力してください");
      showToast("IPアドレスを入力してください", "error");
      inputRef.current?.focus();
      return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);
    announceStatus("検索中...");

    try {
      const data = await lookupIpGeolocation({ data: ipAddress.trim() });

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
  }, [ipAddress, announceStatus, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.target as HTMLElement)?.id === "ipInput") {
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
    }> = [{ label: "IPアドレス", value: result.ip || "-" }];

    // Location info
    if (result.country) {
      const countryDisplay = result.countryCode
        ? `${result.country} (${result.countryCode})`
        : result.country;
      rows.push({ label: "国", value: countryDisplay });
    }

    if (result.regionName) {
      const regionDisplay = result.region
        ? `${result.regionName} (${result.region})`
        : result.regionName;
      rows.push({ label: "地域", value: regionDisplay });
    }

    if (result.city) {
      rows.push({ label: "都市", value: result.city });
    }

    if (result.zip) {
      rows.push({ label: "郵便番号", value: result.zip });
    }

    if (result.lat !== undefined && result.lon !== undefined) {
      rows.push({
        label: "座標",
        value: `緯度: ${result.lat}, 経度: ${result.lon}`,
      });
    }

    if (result.timezone) {
      rows.push({ label: "タイムゾーン", value: result.timezone });
    }

    // Provider info
    if (result.isp) {
      rows.push({ label: "プロバイダー (ISP)", value: result.isp });
    }

    if (result.org) {
      rows.push({ label: "組織", value: result.org });
    }

    if (result.as) {
      const asDisplay = result.asname ? `${result.as} (${result.asname})` : result.as;
      rows.push({ label: "AS番号", value: asDisplay });
    }

    if (result.reverse) {
      rows.push({ label: "逆引きホスト名", value: result.reverse });
    }

    // Connection type flags
    const flags: string[] = [];
    if (result.mobile) flags.push("モバイル接続");
    if (result.proxy) flags.push("プロキシ/VPN");
    if (result.hosting) flags.push("ホスティング/データセンター");
    if (flags.length > 0) {
      rows.push({ label: "接続タイプ", value: flags, isList: true });
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
      <div className="tool-container">
        <form
          onSubmit={(e) => e.preventDefault()}
          aria-label="IPアドレス検索フォーム"
        >
          <div className="converter-section">
            <div className="search-form-row">
              <div className="search-input-wrapper">
                <label htmlFor="ipInput">IPアドレス</label>
                <Input
                  type="text"
                  id="ipInput"
                  ref={inputRef}
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="8.8.8.8"
                  aria-describedby="ip-help"
                  aria-label="検索するIPアドレス"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <Button
                type="submit"
                className="btn-primary"
                onClick={handleSearch}
                disabled={isLoading}
                aria-label="IP情報を検索"
              >
                検索
              </Button>
            </div>
            <span id="ip-help" className="sr-only">
              IPv4またはIPv6アドレスを入力してください
            </span>
          </div>
        </form>

        <LoadingSpinner isLoading={isLoading} message="検索中..." />

        <ErrorMessage message={error} />

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

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "IPアドレスを入力して「検索」ボタンをクリック",
                "例: 8.8.8.8, 1.1.1.1",
                "位置情報、プロバイダー、組織名などを表示",
                "IPv4とIPv6の両方に対応",
                "キーボードショートカット: Enterキーで検索実行",
              ],
            },
            {
              title: "利用サービス",
              items: [
                "このツールは ip-api.com のAPIを利用しています",
                "無料版のため、1分間に45リクエストまでの制限があります",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
