import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useToast } from "~/components/Toast";
import { useClipboard } from "~/hooks/useClipboard";
import {
  SEQUENCE_DEFINITIONS,
  generateSequence,
  type SequenceType,
} from "../utils/sequences";

export const Route = createFileRoute("/sequences")({
  head: () => ({
    meta: [
      { title: "数列ジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "フィボナッチ・リュカ・素数・三角数・等差・等比・コラッツなど各種数列をブラウザ内で生成。CSV・JSON・改行区切りで出力可能。",
      },
      { property: "og:title", content: "数列ジェネレーター | Web ツール集" },
      {
        property: "og:description",
        content:
          "フィボナッチ・リュカ・素数・三角数・等差・等比・コラッツなど各種数列をブラウザ内で生成。CSV・JSON・改行区切りで出力可能。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/sequences` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "数列ジェネレーター | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "フィボナッチ・リュカ・素数・三角数・等差・等比・コラッツなど各種数列をブラウザ内で生成。CSV・JSON・改行区切りで出力可能。",
      },
    ],
  }),
  component: SequencesPage,
});

/** 出力フォーマット */
type OutputFormat = "csv" | "newline" | "json" | "tags";

/**
 * 数列ジェネレーターページ
 */
function SequencesPage() {
  const [selectedType, setSelectedType] = useState<SequenceType>("fibonacci");
  const [count, setCount] = useState(20);
  const [params, setParams] = useState<number[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("csv");
  const { copy } = useClipboard();
  const { showToast } = useToast();

  const selectedDef = useMemo(
    () =>
      SEQUENCE_DEFINITIONS.find((d) => d.id === selectedType) ??
      SEQUENCE_DEFINITIONS[0],
    [selectedType]
  );

  // パラメーターのデフォルト値を初期化
  const effectiveParams = useMemo(() => {
    if (!selectedDef.hasParams || !selectedDef.paramDefaults) return [];
    return selectedDef.paramDefaults.map((def, i) =>
      params[i] !== undefined ? params[i] : def
    );
  }, [selectedDef, params]);

  /** 数列の生成 */
  const sequence = useMemo(() => {
    const isCollatz = selectedType === "collatz";
    const effectiveCount = isCollatz ? 10000 : count;
    return generateSequence(selectedType, effectiveCount, effectiveParams);
  }, [selectedType, count, effectiveParams]);

  /** 出力文字列の生成 */
  const outputText = useMemo(() => {
    if (sequence.length === 0) return "";
    switch (outputFormat) {
      case "csv":
        return sequence.join(", ");
      case "newline":
        return sequence.join("\n");
      case "json":
        return JSON.stringify(sequence);
      default:
        return sequence.join(", ");
    }
  }, [sequence, outputFormat]);

  /** 統計情報 */
  const stats = useMemo(() => {
    if (sequence.length === 0) return null;
    const isCollatz = selectedType === "collatz";
    const nums = sequence;
    const last = nums[nums.length - 1];
    const max = nums.reduce((a, b) => (BigInt(a) > BigInt(b) ? a : b));
    const evenCount = nums.filter(
      (n) => BigInt(n) % 2n === 0n
    ).length;
    const oddCount = nums.length - evenCount;
    return {
      count: nums.length,
      last,
      max,
      evenCount: isCollatz ? evenCount : null,
      oddCount: isCollatz ? oddCount : null,
    };
  }, [sequence, selectedType]);

  const handleTypeSelect = useCallback(
    (type: SequenceType) => {
      setSelectedType(type);
      setParams([]);
      // Collatz の場合はデフォルト開始値をリセット
    },
    []
  );

  const handleParamChange = useCallback((index: number, value: string) => {
    const n = Number(value);
    if (!isNaN(n)) {
      setParams((prev) => {
        const next = [...prev];
        next[index] = n;
        return next;
      });
    }
  }, []);

  const handleCopy = useCallback(async () => {
    const ok = await copy(outputText);
    showToast(
      ok ? "数列をコピーしました" : "コピーに失敗しました",
      ok ? "success" : "error"
    );
  }, [outputText, copy, showToast]);

  const isCollatz = selectedType === "collatz";

  return (
    <div className="tool-container">
      <h2 className="section-title">数列ジェネレーター</h2>

      <div className="sequences-layout">
        {/* 数列種類選択サイドバー */}
        <aside className="sequences-sidebar" aria-label="数列の種類を選択">
          <p className="sequences-sidebar-heading">数列の種類</p>
          {SEQUENCE_DEFINITIONS.map((def) => (
            <button
              key={def.id}
              type="button"
              className={`sequences-type-btn${selectedType === def.id ? " active" : ""}`}
              onClick={() => handleTypeSelect(def.id)}
              aria-pressed={selectedType === def.id}
            >
              <span className="sequences-type-name">{def.label}</span>
              <span className="sequences-type-formula">{def.formula}</span>
            </button>
          ))}
        </aside>

        {/* メインコンテンツ */}
        <div className="sequences-main">
          {/* 数列説明 */}
          <div className="sequences-info-card">
            <h3 className="sequences-info-title">{selectedDef.label}</h3>
            <p className="sequences-info-desc">{selectedDef.description}</p>
            <span className="sequences-formula-badge">{selectedDef.formula}</span>
            <p className="sequences-example">例: {selectedDef.example}</p>
          </div>

          {/* コントロール */}
          <div className="sequences-controls">
            {/* 項数 (Collatz 以外) */}
            {!isCollatz && (
              <div className="sequences-control-group">
                <label htmlFor="seq-count" className="sequences-control-label">
                  項数
                </label>
                <input
                  id="seq-count"
                  type="number"
                  min={1}
                  max={200}
                  value={count}
                  onChange={(e) => {
                    const v = Math.min(200, Math.max(1, Number(e.target.value)));
                    setCount(v);
                  }}
                  className="sequences-input"
                  aria-label="生成する項数"
                />
              </div>
            )}

            {/* パラメーター入力 (等差・等比・Collatz) */}
            {selectedDef.hasParams &&
              selectedDef.paramLabels?.map((label, i) => (
                <div key={i} className="sequences-control-group">
                  <label
                    htmlFor={`seq-param-${i}`}
                    className="sequences-control-label"
                  >
                    {label}
                  </label>
                  <input
                    id={`seq-param-${i}`}
                    type="number"
                    value={effectiveParams[i] ?? selectedDef.paramDefaults?.[i] ?? 0}
                    onChange={(e) => handleParamChange(i, e.target.value)}
                    className="sequences-input wide"
                    placeholder={selectedDef.paramPlaceholders?.[i]}
                    aria-label={label}
                  />
                </div>
              ))}

            {/* 出力フォーマット */}
            <div className="sequences-control-group">
              <span className="sequences-control-label">出力形式</span>
              <div
                className="sequences-format-tabs"
                role="group"
                aria-label="出力形式を選択"
              >
                {(
                  [
                    { id: "csv" as const, label: "CSV" },
                    { id: "newline" as const, label: "改行" },
                    { id: "json" as const, label: "JSON" },
                    { id: "tags" as const, label: "タグ" },
                  ] satisfies { id: OutputFormat; label: string }[]
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    className={`sequences-format-btn${outputFormat === fmt.id ? " active" : ""}`}
                    onClick={() => setOutputFormat(fmt.id)}
                    aria-pressed={outputFormat === fmt.id}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Collatz 統計 */}
          {isCollatz && stats?.evenCount !== null && (
            <div className="sequences-collatz-info">
              <span className="sequences-collatz-badge even">
                偶数ステップ: {stats?.evenCount}
              </span>
              <span className="sequences-collatz-badge odd">
                奇数ステップ: {stats?.oddCount}
              </span>
            </div>
          )}

          {/* 結果ヘッダー */}
          <div>
            <div className="sequences-result-header">
              <span className="sequences-result-meta">
                {isCollatz
                  ? `${sequence.length} ステップ (開始値: ${effectiveParams[0] ?? 27})`
                  : `${sequence.length} 項`}
              </span>
              <div className="sequences-result-actions">
                <Button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopy}
                  disabled={sequence.length === 0}
                >
                  コピー
                </Button>
              </div>
            </div>

            {/* 出力 */}
            {outputFormat === "tags" ? (
              <div
                className="sequences-tags"
                role="list"
                aria-label="数列の各項"
              >
                {sequence.map((val, i) => (
                  <span key={i} className="sequences-tag" role="listitem">
                    <span className="sequences-tag-index">{i + 1}</span>
                    {val}
                  </span>
                ))}
              </div>
            ) : (
              <pre className="sequences-output" aria-label="数列の出力">
                {outputText}
              </pre>
            )}
          </div>

          {/* 統計 */}
          {stats && (
            <div className="sequences-stats-grid">
              <div className="sequences-stat-card">
                <p className="sequences-stat-label">項数 / ステップ数</p>
                <p className="sequences-stat-value">{stats.count}</p>
              </div>
              <div className="sequences-stat-card">
                <p className="sequences-stat-label">最終項</p>
                <p className="sequences-stat-value">{stats.last}</p>
              </div>
              <div className="sequences-stat-card">
                <p className="sequences-stat-label">最大値</p>
                <p className="sequences-stat-value">{stats.max}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "数列の種類",
            items: [
              "フィボナッチ: F(n)=F(n-1)+F(n-2)。自然界・黄金比・暗号に登場",
              "素数列: 2, 3, 5, 7, 11... エラトステネスの篩で高速生成",
              "等差数列: 公差が一定。等比数列: 公比が一定",
              "コラッツ: 偶数÷2、奇数×3+1。必ず1に収束する（未証明）",
              "カタラン数: 括弧の組合せ・二分木などの組合せ論に登場",
            ],
          },
          {
            title: "出力形式",
            items: [
              "CSV: カンマ区切り（スプレッドシートへの貼り付けに便利）",
              "改行: 1行1項（データ分析・スクリプトへの入力に便利）",
              "JSON: 配列形式（プログラムへの直接利用に便利）",
              "タグ: インデックス付きカード表示（視覚的確認に便利）",
              "フィボナッチ・2の冪乗・カタランは BigInt で正確計算",
            ],
          },
        ]}
      />
    </div>
  );
}
