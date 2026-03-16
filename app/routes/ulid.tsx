import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import { generateULID, parseULID, type ULIDParsed } from "~/utils/ulid";

export const Route = createFileRoute("/ulid")({
  head: () => ({
    meta: [
      { title: "ULID ジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "ULID（Universally Unique Lexicographically Sortable Identifier）を生成・パースするツール。辞書順ソート可能な UUID 代替識別子。タイムスタンプ抽出・複数同時生成対応。",
      },
      { property: "og:title", content: "ULID ジェネレーター | Web ツール集" },
      {
        property: "og:description",
        content:
          "ULID（Universally Unique Lexicographically Sortable Identifier）を生成・パースするツール。辞書順ソート可能な UUID 代替識別子。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/ulid` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "ULID ジェネレーター | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ULID（Universally Unique Lexicographically Sortable Identifier）を生成・パースするツール。",
      },
    ],
  }),
  component: ULIDGenerator,
});

/** ULID の表示コンポーネント（タイムスタンプ部とランダム部を色分け） */
function ULIDDisplay({ ulid }: { ulid: string }) {
  return (
    <code className="ulid-value">
      <span className="ulid-value-ts">{ulid.slice(0, 10)}</span>
      <span className="ulid-value-rnd">{ulid.slice(10)}</span>
    </code>
  );
}

/** パーサー結果の表示コンポーネント */
function ParseResult({ parsed }: { parsed: ULIDParsed }) {
  if (!parsed.valid) {
    return (
      <div
        className="ulid-parser-error"
        role="alert"
        aria-live="polite"
      >
        {parsed.error}
      </div>
    );
  }

  const dateStr = parsed.timestamp.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    timeZoneName: "short",
  });
  const isoStr = parsed.timestamp.toISOString();

  return (
    <div className="ulid-parser-result" aria-label="ULID パース結果">
      <div className="ulid-parser-row">
        <span className="ulid-parser-label">正規化</span>
        <span className="ulid-parser-value">
          <span className="ulid-parser-value-ts">{parsed.timestampPart}</span>
          {parsed.randomnessPart}
        </span>
        <span
          className="ulid-parser-valid-badge ulid-parser-valid-ok"
          aria-label="有効な ULID"
        >
          ✓ 有効
        </span>
      </div>
      <div className="ulid-parser-row">
        <span className="ulid-parser-label">タイムスタンプ</span>
        <span className="ulid-parser-value ulid-parser-value-ts">
          {parsed.timestampPart}
        </span>
      </div>
      <div className="ulid-parser-row">
        <span className="ulid-parser-label">ランダム</span>
        <span className="ulid-parser-value">{parsed.randomnessPart}</span>
      </div>
      <div className="ulid-parser-row">
        <span className="ulid-parser-label">日時 (ローカル)</span>
        <span className="ulid-parser-value">{dateStr}</span>
      </div>
      <div className="ulid-parser-row">
        <span className="ulid-parser-label">ISO 8601</span>
        <span className="ulid-parser-value">{isoStr}</span>
      </div>
      <div className="ulid-parser-row">
        <span className="ulid-parser-label">Unix ms</span>
        <span className="ulid-parser-value">{parsed.unixMs}</span>
      </div>
    </div>
  );
}

function ULIDGenerator() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [ulids, setUlids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [lowercase, setLowercase] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const [parseInput, setParseInput] = useState("");
  const parsedResult: ULIDParsed | null = parseInput.trim()
    ? parseULID(parseInput)
    : null;

  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedAllTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      if (copiedAllTimeoutRef.current) clearTimeout(copiedAllTimeoutRef.current);
    };
  }, []);

  const formatULID = useCallback(
    (ulid: string) => (lowercase ? ulid.toLowerCase() : ulid),
    [lowercase]
  );

  const handleGenerate = useCallback(() => {
    const generated: string[] = [];
    for (let i = 0; i < count; i++) {
      generated.push(generateULID());
    }
    setUlids(generated);
    setCopiedIndex(null);
    setCopiedAll(false);
    announceStatus(`${count} 個の ULID を生成しました`);
  }, [count, announceStatus]);

  const handleCopy = useCallback(
    async (index: number) => {
      const success = await copy(formatULID(ulids[index]));
      if (success) {
        setCopiedIndex(index);
        announceStatus("ULID をコピーしました");
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [ulids, formatULID, copy, announceStatus, showToast]
  );

  const handleCopyAll = useCallback(async () => {
    const all = ulids.map(formatULID).join("\n");
    const success = await copy(all);
    if (success) {
      setCopiedAll(true);
      announceStatus("すべての ULID をコピーしました");
      if (copiedAllTimeoutRef.current) clearTimeout(copiedAllTimeoutRef.current);
      copiedAllTimeoutRef.current = setTimeout(() => setCopiedAll(false), 2000);
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [ulids, formatULID, copy, announceStatus, showToast]);

  const handleClear = useCallback(() => {
    setUlids([]);
    setCopiedIndex(null);
    setCopiedAll(false);
    announceStatus("ULID をクリアしました");
  }, [announceStatus]);

  // 初回マウント時に1件生成
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      handleGenerate();
    }
  }, [handleGenerate]);

  return (
    <>
      <div className="tool-container">
        {/* ── 生成セクション ── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          aria-label="ULID 生成フォーム"
        >
          <div className="converter-section">
            <h2 className="section-title">ULID 生成設定</h2>
            <div className="ulid-options">
              <div className="option-group">
                <label htmlFor="ulid-count">生成数:</label>
                <input
                  id="ulid-count"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) =>
                    setCount(
                      Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                    )
                  }
                  aria-describedby="ulid-count-help"
                  className="w-20"
                />
                <span id="ulid-count-help" className="sr-only">
                  1 から 100 の間で生成数を指定できます
                </span>
              </div>
              <div className="option-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={lowercase}
                    onChange={(e) => setLowercase(e.target.checked)}
                  />
                  小文字で表示
                </label>
              </div>
            </div>

            <div className="button-group" role="group" aria-label="ULID 操作">
              <button type="submit" className="btn-primary">
                ULID 生成
              </button>
              <button
                type="button"
                className="btn-clear"
                onClick={handleClear}
                disabled={ulids.length === 0}
              >
                クリア
              </button>
            </div>
          </div>

          {ulids.length > 0 && (
            <div className="converter-section">
              <div className="ulid-result-header">
                <h2 className="section-title">生成結果</h2>
                {ulids.length > 1 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCopyAll}
                  >
                    {copiedAll ? "コピーしました" : "すべてコピー"}
                  </button>
                )}
              </div>

              <div className="ulid-legend" aria-hidden="true">
                <span className="ulid-legend-item">
                  <span className="ulid-legend-dot ulid-legend-dot-ts" />
                  タイムスタンプ（10 文字）
                </span>
                <span className="ulid-legend-item">
                  <span className="ulid-legend-dot ulid-legend-dot-rnd" />
                  ランダム（16 文字）
                </span>
              </div>

              <div
                className="ulid-list"
                role="list"
                aria-live="polite"
                aria-label="生成した ULID"
              >
                {ulids.map((ulid, index) => (
                  <div key={index} className="ulid-item" role="listitem">
                    {lowercase ? (
                      <code className="ulid-value">{ulid.toLowerCase()}</code>
                    ) : (
                      <ULIDDisplay ulid={ulid} />
                    )}
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() => handleCopy(index)}
                      aria-label={`ULID ${index + 1} をコピー`}
                    >
                      {copiedIndex === index ? "済" : "コピー"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        {/* ── パーサーセクション ── */}
        <div className="ulid-parser-section">
          <h2 className="section-title">ULID パーサー</h2>
          <div className="converter-section">
            <label htmlFor="ulid-parse-input" className="section-title">
              ULID 文字列
            </label>
            <input
              id="ulid-parse-input"
              type="text"
              value={parseInput}
              onChange={(e) => setParseInput(e.target.value)}
              placeholder="例: 01ARZ3NDEKTSV4RRFFQ69G5FAV"
              aria-describedby="ulid-parse-hint"
              autoComplete="off"
              spellCheck={false}
            />
            <p id="ulid-parse-hint" className="text-case-hint">
              ULID を入力するとタイムスタンプ・ランダム部を解析します
            </p>
          </div>
          {parsedResult && <ParseResult parsed={parsedResult} />}
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "ULID とは",
            items: [
              "ULID（Universally Unique Lexicographically Sortable Identifier）は UUID の代替識別子です",
              "26 文字の Crockford Base32 文字列で、UUID の 32 文字より短く人間が読みやすい形式です",
              "辞書順ソート可能（先頭にタイムスタンプが含まれるため）",
              "同一ミリ秒内でも複数生成可能（80 ビットのランダム性）",
              "大文字小文字を区別しない（I/L/O/U を除外した Crockford Base32）",
            ],
          },
          {
            title: "UUID との比較",
            items: [
              "UUID v4: ランダムのみ、ソート不可、ハイフン区切りで 36 文字",
              "ULID: タイムスタンプ + ランダム、ソート可能、26 文字",
              "データベースのインデックス効率が ULID の方が良い場合がある",
              "タイムスタンプからいつ生成されたかを確認できる",
            ],
          },
          {
            title: "使い方",
            items: [
              "「ULID 生成」ボタンで新しい ULID を生成します",
              "生成数を変更して複数の ULID を一度に生成できます",
              "各 ULID の「コピー」ボタンでクリップボードにコピーできます",
              "パーサーに ULID を貼り付けてタイムスタンプを確認できます",
            ],
          },
        ]}
      />

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
