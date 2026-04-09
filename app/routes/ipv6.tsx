import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import { StatusAnnouncer, useStatusAnnouncement } from "~/hooks/useStatusAnnouncement";
import { TipsCard } from "~/components/TipsCard";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { parseIPv6, type IPv6Info, type IPv6AddressType } from "~/utils/ipv6";
import "../styles/tools/ipv6.css";

export const Route = createFileRoute("/ipv6")({
  head: () => ({
    meta: [
      { title: "IPv6アドレス解析・変換 | Web ツール集" },
      {
        name: "description",
        content:
          "IPv6アドレスを展開・圧縮・解析するオンラインツール。RFC 5952 準拠の圧縮形式変換、アドレスタイプ判定（ループバック・リンクローカル・マルチキャスト等）、IPv4射影アドレスの抽出、2進数表示に対応。",
      },
      { property: "og:title", content: "IPv6アドレス解析・変換 | Web ツール集" },
      {
        property: "og:description",
        content:
          "IPv6アドレスの展開・圧縮・解析ツール。アドレスタイプ判定、IPv4射影抽出、2進数表示対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/ipv6` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "IPv6アドレス解析・変換 | Web ツール集" },
      {
        name: "twitter:description",
        content: "IPv6アドレスの展開・圧縮・解析。アドレスタイプ判定・IPv4射影抽出対応。",
      },
    ],
  }),
  component: IPv6Tool,
});

// ---------------------------------------------------------------------------
// サンプルアドレス
// ---------------------------------------------------------------------------

const SAMPLES: { label: string; value: string }[] = [
  { label: "ループバック", value: "::1" },
  { label: "リンクローカル", value: "fe80::1" },
  { label: "グローバル", value: "2001:db8::1" },
  { label: "IPv4射影", value: "::ffff:192.168.1.1" },
  { label: "マルチキャスト", value: "ff02::1" },
  { label: "未指定", value: "::" },
  { label: "フル形式", value: "2001:0db8:0000:0000:0000:0000:0000:0001" },
];

// ---------------------------------------------------------------------------
// アドレスタイプのCSSクラスマッピング
// ---------------------------------------------------------------------------

const TYPE_CLASS: Record<IPv6AddressType, string> = {
  loopback: "type-loopback",
  "link-local": "type-link-local",
  "unique-local": "type-unique-local",
  multicast: "type-multicast",
  "ipv4-mapped": "type-ipv4-mapped",
  "ipv4-compatible": "type-ipv4-compatible",
  unspecified: "type-unspecified",
  documentation: "type-documentation",
  benchmarking: "type-benchmarking",
  "global-unicast": "type-global-unicast",
};

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

function IPv6Tool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [input, setInput] = useState("");

  const { result, error } = useMemo<{ result: IPv6Info | null; error: string | null }>(() => {
    if (!input.trim()) return { result: null, error: null };
    try {
      return { result: parseIPv6(input), error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : "解析に失敗しました" };
    }
  }, [input]);

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      const ok = await copy(text);
      if (ok) {
        showToast("コピーしました", "success");
        announceStatus(`${label}をコピーしました`);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, showToast, announceStatus],
  );

  const handleSample = useCallback(
    (value: string) => {
      setInput(value);
      announceStatus(`サンプル "${value}" をセットしました`);
    },
    [announceStatus],
  );

  const handleClear = useCallback(() => {
    setInput("");
    announceStatus("入力をクリアしました");
  }, [announceStatus]);

  return (
    <>
      <div className="tool-container">
        {/* 入力 */}
        <div className="ipv6-input-section">
          <label htmlFor="ipv6-input" className="section-title">
            IPv6 アドレス
          </label>
          <div className="ipv6-input-row">
            <input
              id="ipv6-input"
              type="text"
              className={`ipv6-input${error ? " has-error" : ""}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例: 2001:db8::1 または ::ffff:192.168.1.1"
              aria-label="IPv6アドレス入力"
              aria-invalid={!!error}
              aria-describedby={error ? "ipv6-error" : undefined}
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="button"
              className="btn-clear"
              onClick={handleClear}
              disabled={!input}
              aria-label="入力をクリア"
            >
              クリア
            </button>
          </div>
        </div>

        {/* エラー */}
        {error && input.trim() && (
          <div id="ipv6-error" className="ipv6-error" role="alert">
            <span className="ipv6-error-icon" aria-hidden="true">
              ⚠
            </span>
            {error}
          </div>
        )}

        {/* サンプル */}
        <div className="ipv6-samples" role="group" aria-label="サンプルアドレス">
          <span className="ipv6-samples-label" aria-hidden="true">
            サンプル:
          </span>
          {SAMPLES.map((s) => (
            <button
              key={s.value}
              type="button"
              className="ipv6-sample-btn"
              onClick={() => handleSample(s.value)}
              aria-label={`${s.label} (${s.value})`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 解析結果 */}
        {result && <IPv6Result result={result} onCopy={handleCopy} />}
      </div>
      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}

// ---------------------------------------------------------------------------
// 結果表示コンポーネント
// ---------------------------------------------------------------------------

interface IPv6ResultProps {
  result: IPv6Info;
  onCopy: (text: string, label: string) => void;
}

function IPv6Result({ result, onCopy }: IPv6ResultProps) {
  const typeClass = TYPE_CLASS[result.type] ?? "type-global-unicast";

  return (
    <section aria-label="解析結果">
      {/* アドレスタイプバッジ */}
      <div className={`ipv6-type-badge ${typeClass}`} role="status" aria-live="polite">
        <span aria-hidden="true">🏷</span>
        {result.typeLabel}
      </div>
      <p className="ipv6-type-description">{result.typeDescription}</p>

      {/* IPv4射影アドレス情報 */}
      {result.isIPv4Mapped && result.ipv4Mapped && (
        <div className="ipv6-ipv4-badge" aria-label={`埋め込みIPv4アドレス: ${result.ipv4Mapped}`}>
          <span className="ipv6-ipv4-badge-label">埋め込み IPv4:</span>
          <span className="ipv6-ipv4-badge-value">{result.ipv4Mapped}</span>
          <button
            type="button"
            className="ipv6-copy-btn"
            onClick={() => onCopy(result.ipv4Mapped!, "IPv4アドレス")}
            aria-label={`IPv4アドレス ${result.ipv4Mapped} をコピー`}
          >
            コピー
          </button>
        </div>
      )}

      {/* 変換結果テーブル */}
      <table className="ipv6-result-table" aria-label="アドレス変換結果">
        <tbody>
          <ResultRow label="圧縮形式" value={result.compressed} highlight onCopy={onCopy} />
          <ResultRow label="展開形式" value={result.expanded} onCopy={onCopy} />
          <ResultRow label="16進数" value={result.hexadecimal} onCopy={onCopy} />
          {result.scopeId && <ResultRow label="ゾーン ID" value={result.scopeId} onCopy={onCopy} />}
        </tbody>
      </table>

      {/* グループビジュアライザー */}
      <div className="ipv6-groups-section" aria-label="グループ分割">
        <p className="ipv6-groups-title">グループ（16進数 × 8）</p>
        <div className="ipv6-groups-grid" role="list">
          {result.groups.map((group, i) => (
            <div
              key={i}
              className={`ipv6-group-item${group === "0000" ? " zero-group" : ""}`}
              role="listitem"
              aria-label={`グループ${i + 1}: ${group}`}
            >
              <span className="ipv6-group-hex">{group}</span>
              <span className="ipv6-group-label">G{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2進数グループ表示 */}
      <div className="ipv6-binary-section" aria-label="2進数表現">
        <p className="ipv6-binary-title">2進数（16ビット × 8）</p>
        <div className="ipv6-binary-display" aria-label="128ビット2進数表現">
          {result.binaryGroups.map((bits, i) => (
            <div key={i} className="ipv6-binary-group">
              <span className="ipv6-binary-bits">{bits}</span>
              <span className="ipv6-binary-label">G{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TipsCard */}
      <TipsCard
        sections={[
          {
            title: "IPv6 アドレスの基本",
            items: [
              "128ビット = 16進数8グループ（各16ビット）をコロンで区切る",
              "連続するゼログループは :: で省略可能（1回のみ）",
              "各グループの先頭ゼロは省略可能（0000 → 0）",
              "RFC 5952 で最短表記ルールが定義されている",
            ],
          },
          {
            title: "代表的なアドレスタイプ",
            items: [
              "::1/128 — ループバック（自ホスト宛）",
              ":: /128 — 未指定アドレス",
              "fe80::/10 — リンクローカル（セグメント内通信）",
              "fc00::/7 — ユニークローカル（プライベート）",
              "ff00::/8 — マルチキャスト",
              "2000::/3 — グローバルユニキャスト（インターネット）",
              "::ffff:0:0/96 — IPv4射影アドレス",
            ],
          },
          {
            title: "IPv4射影アドレスとは",
            items: [
              "::ffff:x.x.x.x 形式でIPv4アドレスをIPv6で表現",
              "デュアルスタック環境でIPv4クライアントをIPv6ソケットで受け付ける際に使用",
              "Linuxの /proc/net/tcp6 などで確認できる",
            ],
          },
        ]}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// 結果行コンポーネント
// ---------------------------------------------------------------------------

interface ResultRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  onCopy: (text: string, label: string) => void;
}

function ResultRow({ label, value, highlight, onCopy }: ResultRowProps) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        <div className="ipv6-copy-cell">
          <span className={highlight ? "ipv6-highlight" : undefined}>{value}</span>
          <button
            type="button"
            className="ipv6-copy-btn"
            onClick={() => onCopy(value, label)}
            aria-label={`${label}をコピー`}
          >
            コピー
          </button>
        </div>
      </td>
    </tr>
  );
}
