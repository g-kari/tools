import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  checkPorts,
  type PortCheckResult,
  type PortResult,
  validateHost,
  parsePorts,
} from "../functions/port-check";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TipsCard } from "~/components/TipsCard";
import { ErrorMessage } from "~/components/ErrorMessage";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";

export const Route = createFileRoute("/port-check")({
  head: () => ({
    meta: [
      { title: "ポートチェック | Web ツール集" },
      {
        name: "description",
        content: "指定したホスト・IPアドレスのポートが開いているか確認するツール。",
      },
      { property: "og:title", content: "ポートチェック | Web ツール集" },
      {
        property: "og:description",
        content: "指定したホスト・IPアドレスのポートが開いているか確認するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/port-check` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ポートチェック | Web ツール集" },
      {
        name: "twitter:description",
        content: "指定したホスト・IPアドレスのポートが開いているか確認するツール。",
      },
    ],
  }),
  component: PortCheck,
});

/** プリセットポートセット */
const PORT_PRESETS = [
  { label: "Web", ports: "80,443" },
  { label: "SSH", ports: "22" },
  { label: "FTP", ports: "21" },
  { label: "DB", ports: "3306,5432,6379" },
  { label: "メール", ports: "25,587" },
] as const;

/**
 * ポートチェック結果を人間が読みやすいテキスト形式に変換
 * @param result - チェック結果データ
 * @returns テキスト形式の結果文字列
 */
function formatResultAsText(result: PortCheckResult): string {
  const lines: string[] = [
    `ホスト: ${result.host}`,
    `チェック日時: ${new Date(result.checkTime).toLocaleString("ja-JP")}`,
    "",
    "ポート\t状態\t\tサービス\t応答時間",
    "─".repeat(50),
  ];

  for (const r of result.results) {
    const status = r.isOpen ? "OPEN" : "CLOSED";
    const service = r.serviceName ?? "-";
    const responseTime =
      r.isOpen && r.responseTime !== undefined ? `${r.responseTime}ms` : (r.error ?? "-");
    lines.push(`${r.port}\t${status}\t\t${service}\t${responseTime}`);
  }

  return lines.join("\n");
}

/**
 * 単一ポート結果の行コンポーネント
 */
function PortResultRow({ result }: { result: PortResult }) {
  return (
    <tr className="port-check-table-row">
      <td className="port-check-table-cell port-check-table-cell-port">{result.port}</td>
      <td className="port-check-table-cell">
        <span
          className={result.isOpen ? "port-status-open" : "port-status-closed"}
          aria-label={result.isOpen ? "オープン" : "クローズ"}
        >
          {result.isOpen ? "Open" : "Closed"}
        </span>
      </td>
      <td className="port-check-table-cell">
        {result.serviceName ?? <span className="port-check-no-service">-</span>}
      </td>
      <td className="port-check-table-cell port-check-table-cell-time">
        {result.isOpen && result.responseTime !== undefined
          ? `${result.responseTime}ms`
          : (result.error ?? "-")}
      </td>
    </tr>
  );
}

/**
 * ポートチェックメインコンポーネント
 */
function PortCheck() {
  const { showToast } = useToast();
  const [host, setHost] = useState("");
  const [portsInput, setPortsInput] = useState("80,443");
  const [timeoutSeconds, setTimeoutSeconds] = useState(5);
  const [result, setResult] = useState<PortCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hostInputRef = useRef<HTMLInputElement>(null);

  const { statusRef, announceStatus } = useStatusAnnouncement();

  const handleCheck = useCallback(async () => {
    const trimmedHost = host.trim();
    if (!trimmedHost) {
      showToast("ホスト名またはIPアドレスを入力してください", "error");
      announceStatus("エラー: ホスト名またはIPアドレスを入力してください");
      hostInputRef.current?.focus();
      return;
    }

    if (!validateHost(trimmedHost)) {
      showToast("無効なホスト名またはIPアドレスです", "error");
      announceStatus("エラー: 無効なホスト名またはIPアドレスです");
      hostInputRef.current?.focus();
      return;
    }

    const ports = parsePorts(portsInput);
    if (ports.length === 0) {
      showToast("有効なポート番号を入力してください（1〜65535）", "error");
      announceStatus("エラー: 有効なポート番号を入力してください");
      return;
    }

    if (ports.length > 50) {
      showToast("一度にチェックできるポートは50個までです", "error");
      announceStatus("エラー: ポート数が多すぎます");
      return;
    }

    setError(null);
    setResult(null);
    setIsLoading(true);
    announceStatus("チェック中...");

    try {
      const data = await checkPorts({
        data: {
          host: trimmedHost,
          ports,
          timeout: timeoutSeconds,
        },
      });

      if (data.error) {
        setError(data.error);
        announceStatus("エラー: " + data.error);
        return;
      }

      setResult(data);
      const openCount = data.results.filter((r) => r.isOpen).length;
      announceStatus(`チェック完了: ${data.results.length}ポート中${openCount}ポートがオープン`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "通信エラーが発生しました";
      setError(message);
      announceStatus("エラー: " + message);
    } finally {
      setIsLoading(false);
    }
  }, [host, portsInput, timeoutSeconds, showToast, announceStatus]);

  const handleCopyResult = useCallback(async () => {
    if (!result) return;
    const text = formatResultAsText(result);
    try {
      await navigator.clipboard.writeText(text);
      showToast("結果をクリップボードにコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [result, showToast]);

  const handlePreset = useCallback((ports: string) => {
    setPortsInput(ports);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        handleCheck();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCheck]);

  useEffect(() => {
    hostInputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="tool-container">
        <form onSubmit={(e) => e.preventDefault()} aria-label="ポートチェックフォーム">
          <div className="converter-section">
            <div className="port-check-form-group">
              <label htmlFor="hostInput">ホスト名 / IPアドレス</label>
              <Input
                type="text"
                id="hostInput"
                ref={hostInputRef}
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="example.com または 192.168.1.1"
                aria-describedby="host-help"
                aria-label="チェックするホスト名またはIPアドレス"
                autoComplete="off"
                spellCheck="false"
              />
              <span id="host-help" className="sr-only">
                ドメイン名またはIPv4アドレスを入力してください
              </span>
            </div>

            <div className="port-check-form-group">
              <label htmlFor="portsInput">ポート番号（カンマ区切り）</label>
              <div className="port-preset-buttons" role="group" aria-label="プリセットポートセット">
                {PORT_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="port-preset-btn"
                    onClick={() => handlePreset(preset.ports)}
                    aria-label={`${preset.label}（${preset.ports}）をセット`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <Input
                type="text"
                id="portsInput"
                value={portsInput}
                onChange={(e) => setPortsInput(e.target.value)}
                placeholder="80,443,22,3306"
                aria-describedby="ports-help"
                aria-label="チェックするポート番号（カンマ区切り）"
                autoComplete="off"
              />
              <span id="ports-help" className="sr-only">
                ポート番号をカンマ区切りで入力してください（例: 80,443,22）。最大50ポートまで。
              </span>
            </div>

            <div className="port-check-form-row">
              <div className="port-check-timeout-group">
                <label htmlFor="timeoutInput">タイムアウト（秒）</label>
                <Input
                  type="number"
                  id="timeoutInput"
                  value={timeoutSeconds}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) {
                      setTimeoutSeconds(Math.min(Math.max(v, 1), 30));
                    }
                  }}
                  min={1}
                  max={30}
                  aria-describedby="timeout-help"
                  aria-label="タイムアウト秒数（1〜30秒）"
                  className="port-check-timeout-input"
                />
                <span id="timeout-help" className="sr-only">
                  1〜30秒の範囲で指定してください。デフォルトは5秒です。
                </span>
              </div>

              <Button
                type="submit"
                className="btn-primary"
                onClick={handleCheck}
                disabled={isLoading}
                aria-label="ポートをチェック"
              >
                チェック
              </Button>
            </div>
          </div>
        </form>

        <LoadingSpinner isLoading={isLoading} message="チェック中..." />

        <ErrorMessage message={error} />

        {result && !error && (
          <section aria-labelledby="result-title">
            <div className="port-check-result-header">
              <h2 id="result-title" className="section-title">
                チェック結果
              </h2>
              <button
                type="button"
                className="port-check-copy-btn"
                onClick={handleCopyResult}
                aria-label="結果をテキストとしてコピー"
              >
                コピー
              </button>
            </div>
            <div className="port-check-result-meta" aria-live="polite">
              <span>ホスト: {result.host}</span>
              <span>チェック日時: {new Date(result.checkTime).toLocaleString("ja-JP")}</span>
              <span>
                結果: <strong>{result.results.filter((r) => r.isOpen).length}</strong> /{" "}
                {result.results.length} ポートがオープン
              </span>
            </div>
            <div className="port-check-table-wrapper" aria-live="polite">
              <table className="port-check-table" aria-label="ポートチェック結果テーブル">
                <thead>
                  <tr>
                    <th scope="col" className="port-check-table-header">
                      ポート
                    </th>
                    <th scope="col" className="port-check-table-header">
                      状態
                    </th>
                    <th scope="col" className="port-check-table-header">
                      サービス
                    </th>
                    <th scope="col" className="port-check-table-header">
                      応答時間 / エラー
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r) => (
                    <PortResultRow key={r.port} result={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "ホスト名またはIPアドレスを入力",
                "チェックするポートをカンマ区切りで入力（例: 80,443,22）",
                "プリセットボタンで一般的なポートセットをすばやく設定",
                "「チェック」ボタンをクリックまたは Ctrl+Enter で実行",
                "最大50ポートまで同時にチェック可能",
              ],
            },
            {
              title: "注意事項",
              items: [
                "このツールはCloudflare Workersから接続チェックを行います",
                "ファイアウォールやロードバランサーの設定により結果が異なる場合があります",
                "許可を得たホストに対してのみ使用してください",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
