import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type MediaCondition,
  type MediaQueryRule,
  type MediaType,
  type MediaFeatureName,
  type MediaUnit,
  type OutputType,
  MEDIA_FEATURES,
  COMMON_BREAKPOINTS,
  defaultMediaQueryRule,
  createDefaultMediaCondition,
  formatMediaCondition,
  formatMediaQueryOutput,
  checkMediaQueryMatch,
} from "~/utils/css-media-query";

export const Route = createFileRoute("/css-media-query")({
  head: () => ({
    meta: [
      { title: "CSSメディアクエリビルダー | Web ツール集" },
      {
        name: "description",
        content:
          "CSSメディアクエリをビジュアルに構築するツール。ブレイクポイント、デバイス特性（orientation・hover・pointer）、カラースキームなどの条件をGUIで設定し、CSS・SCSS・JSON形式でコードを生成。ライブプレビューつき。",
      },
      {
        property: "og:title",
        content: "CSSメディアクエリビルダー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSSメディアクエリをビジュアルに構築するツール。条件をGUIで設定し、CSSコードを即座に生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-media-query` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSSメディアクエリビルダー | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "CSSメディアクエリをビジュアルに構築するツール。ライブプレビューつき。",
      },
    ],
  }),
  component: CssMediaQueryBuilder,
});

const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: "all", label: "all" },
  { value: "screen", label: "screen" },
  { value: "print", label: "print" },
];

const OUTPUT_TYPES: { value: OutputType; label: string }[] = [
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "json", label: "JSON" },
];

const UNITS: MediaUnit[] = ["px", "em", "rem"];
const MAX_PREVIEW_WIDTH = 1200;
const MIN_PREVIEW_WIDTH = 320;

/** 条件カードコンポーネント */
function MediaConditionCard({
  cond,
  index,
  total,
  onChange,
  onRemove,
}: {
  cond: MediaCondition;
  index: number;
  total: number;
  onChange: (id: string, updates: Partial<MediaCondition>) => void;
  onRemove: (id: string) => void;
}) {
  const featureDef = MEDIA_FEATURES.find((f) => f.name === cond.feature);
  const valueType = featureDef?.valueType ?? "length";

  return (
    <>
      <div className="cmq-condition-card" aria-label={`条件 ${index + 1}`}>
        {/* フィーチャー選択 */}
        <div className="cmq-condition-header">
          <select
            className="cmq-condition-type-select"
            value={cond.feature}
            onChange={(e) => {
              const newFeature = e.target.value as MediaFeatureName;
              const newDef = MEDIA_FEATURES.find((f) => f.name === newFeature);
              const defaultKeyword = newDef?.keywords?.[0] ?? "";
              onChange(cond.id, { feature: newFeature, keyword: defaultKeyword });
            }}
            aria-label={`条件 ${index + 1} のフィーチャー`}
          >
            {MEDIA_FEATURES.map((f) => (
              <option key={f.name} value={f.name}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="cmq-condition-remove"
            onClick={() => onRemove(cond.id)}
            aria-label={`条件 ${index + 1} を削除`}
            disabled={total <= 1}
          >
            ×
          </button>
        </div>

        {/* 値入力エリア（valueType に応じて切替） */}
        {valueType === "ratio" ? (
          <div className="cmq-condition-body cmq-ratio">
            <input
              type="number"
              className="cmq-value-input"
              value={cond.ratioW}
              min={1}
              onChange={(e) => onChange(cond.id, { ratioW: Number(e.target.value) })}
              aria-label="アスペクト比の幅"
            />
            <span className="cmq-range-sep" aria-hidden="true">
              /
            </span>
            <input
              type="number"
              className="cmq-value-input"
              value={cond.ratioH}
              min={1}
              onChange={(e) => onChange(cond.id, { ratioH: Number(e.target.value) })}
              aria-label="アスペクト比の高さ"
            />
          </div>
        ) : valueType === "keyword" ? (
          <div className="cmq-condition-body cmq-number-only">
            <select
              className="cmq-keyword-select"
              value={cond.keyword}
              onChange={(e) => onChange(cond.id, { keyword: e.target.value })}
              aria-label={`条件 ${index + 1} のキーワード値`}
            >
              {(featureDef?.keywords ?? []).map((kw) => (
                <option key={kw} value={kw}>
                  {kw}
                </option>
              ))}
            </select>
          </div>
        ) : valueType === "number" ? (
          <div className="cmq-condition-body cmq-number-only">
            <input
              type="number"
              className="cmq-value-input"
              value={cond.value}
              min={0}
              onChange={(e) => onChange(cond.id, { value: Number(e.target.value) })}
              aria-label="値"
            />
          </div>
        ) : (
          /* length */
          <div className="cmq-condition-body">
            <input
              type="number"
              className="cmq-value-input"
              value={cond.value}
              min={0}
              onChange={(e) => onChange(cond.id, { value: Number(e.target.value) })}
              aria-label="値"
            />
            <select
              className="cmq-unit-select"
              value={cond.unit}
              onChange={(e) => onChange(cond.id, { unit: e.target.value as MediaUnit })}
              aria-label="単位"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 条件プレビュー文字列 */}
        <div className="cmq-condition-preview" aria-live="polite">
          {formatMediaCondition(cond)}
        </div>
      </div>

      {/* 条件間の AND バッジ（最後の条件以外） */}
      {index < total - 1 && (
        <div className="cmq-logic-row">
          <div className="cmq-logic-line" aria-hidden="true" />
          <span className="cmq-logic-badge" aria-label="論理演算子: and">
            and
          </span>
          <div className="cmq-logic-line" aria-hidden="true" />
        </div>
      )}
    </>
  );
}

/** CSS メディアクエリ ビルダー メインコンポーネント */
function CssMediaQueryBuilder() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [rule, setRule] = useState<MediaQueryRule>(defaultMediaQueryRule);
  const [previewWidth, setPreviewWidth] = useState(768);
  const [outputType, setOutputType] = useState<OutputType>("css");

  /** プレビュー幅を CSS カスタムプロパティとして反映（インラインスタイル禁止ルール対応） */
  const previewOuterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    previewOuterRef.current?.style.setProperty("--cmq-preview-width", `${previewWidth}px`);
  }, [previewWidth]);

  /** ルール全体を部分更新する */
  const updateRule = useCallback((updates: Partial<MediaQueryRule>) => {
    setRule((prev) => ({ ...prev, ...updates }));
  }, []);

  /** 個別条件を更新する */
  const updateCondition = useCallback((id: string, updates: Partial<MediaCondition>) => {
    setRule((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  }, []);

  /** 条件を追加する */
  const addCondition = useCallback(() => {
    const newCond = createDefaultMediaCondition();
    setRule((prev) => ({
      ...prev,
      conditions: [...prev.conditions, newCond],
    }));
    announceStatus("条件を追加しました");
  }, [announceStatus]);

  /** 条件を削除する */
  const removeCondition = useCallback(
    (id: string) => {
      setRule((prev) => {
        if (prev.conditions.length <= 1) return prev;
        return {
          ...prev,
          conditions: prev.conditions.filter((c) => c.id !== id),
        };
      });
      announceStatus("条件を削除しました");
    },
    [announceStatus],
  );

  /** ブレイクポイントを最初の length 条件に適用する */
  const applyBreakpoint = useCallback(
    (value: number, unit: MediaUnit) => {
      setRule((prev) => {
        const conditions = prev.conditions.map((c, i) => {
          if (i === 0) return { ...c, value, unit };
          return c;
        });
        return { ...prev, conditions };
      });
      announceStatus(`ブレイクポイント ${value}${unit} を適用しました`);
    },
    [announceStatus],
  );

  /** 設定をリセットする */
  const handleReset = useCallback(() => {
    setRule(defaultMediaQueryRule);
    setPreviewWidth(768);
    setOutputType("css");
    announceStatus("設定をリセットしました");
  }, [announceStatus]);

  /** 出力をコピーする */
  const handleCopy = useCallback(async () => {
    const text = formatMediaQueryOutput(rule, outputType);
    const success = await copy(text);
    if (success) {
      const label = OUTPUT_TYPES.find((t) => t.value === outputType)?.label ?? "";
      showToast(`${label} 形式でコピーしました`, "success");
      announceStatus(`${label} 形式の出力をクリップボードにコピーしました`);
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, rule, outputType, showToast, announceStatus]);

  const outputText = useMemo(() => formatMediaQueryOutput(rule, outputType), [rule, outputType]);

  const queryActive = useMemo(() => checkMediaQueryMatch(rule, previewWidth), [rule, previewWidth]);

  return (
    <>
      <div className="tool-container">
        <div className="cmq-layout">
          {/* ── 左パネル: 設定 ── */}
          <div aria-label="メディアクエリ設定パネル">
            {/* メディアタイプ */}
            <section className="cmq-section" aria-labelledby="cmq-media-type-title">
              <h2 className="cmq-section-title" id="cmq-media-type-title">
                メディアタイプ
              </h2>
              <div className="cmq-media-type-group" role="group" aria-label="メディアタイプを選択">
                {MEDIA_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`cmq-media-type-btn${rule.mediaType === t.value ? " active" : ""}`}
                    onClick={() => updateRule({ mediaType: t.value })}
                    aria-pressed={rule.mediaType === t.value}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </section>

            {/* クエリ条件 */}
            <section className="cmq-section" aria-labelledby="cmq-conditions-title">
              <h2 className="cmq-section-title" id="cmq-conditions-title">
                クエリ条件
              </h2>

              {rule.conditions.map((cond, index) => (
                <MediaConditionCard
                  key={cond.id}
                  cond={cond}
                  index={index}
                  total={rule.conditions.length}
                  onChange={updateCondition}
                  onRemove={removeCondition}
                />
              ))}

              <button
                type="button"
                className="cmq-add-condition"
                onClick={addCondition}
                aria-label="条件を追加"
              >
                ＋ 条件を追加
              </button>

              {/* ブレイクポイント早見表 */}
              <p className="cmq-breakpoints-title">
                ブレイクポイント早見表（クリックで条件1に適用）
              </p>
              <div className="cmq-breakpoints" aria-label="一般的なブレイクポイント一覧">
                {COMMON_BREAKPOINTS.map((bp) => (
                  <button
                    key={`${bp.value}${bp.unit}`}
                    type="button"
                    className="cmq-bp-item"
                    onClick={() => applyBreakpoint(bp.value, bp.unit)}
                    aria-label={`${bp.label} を条件1に適用`}
                  >
                    {bp.label}
                  </button>
                ))}
              </div>
            </section>

            {/* クエリ内スタイル */}
            <section className="cmq-section" aria-labelledby="cmq-inner-title">
              <h2 className="cmq-section-title" id="cmq-inner-title">
                クエリ内のスタイル
              </h2>

              <div className="cmq-prop-row">
                <label htmlFor="cmq-target-selector" className="cmq-prop-label">
                  ターゲットセレクタ
                </label>
                <input
                  id="cmq-target-selector"
                  type="text"
                  className="cmq-input"
                  value={rule.targetSelector}
                  onChange={(e) => updateRule({ targetSelector: e.target.value })}
                  placeholder=".container"
                  aria-label="クエリ内のターゲットセレクタ"
                  spellCheck={false}
                />
              </div>

              <div className="cmq-prop-row">
                <label htmlFor="cmq-inner-css" className="cmq-prop-label">
                  適用するスタイル
                </label>
                <textarea
                  id="cmq-inner-css"
                  className="cmq-input"
                  value={rule.innerCSS}
                  onChange={(e) => updateRule({ innerCSS: e.target.value })}
                  placeholder={"  display: flex;\n  flex-direction: row;"}
                  rows={5}
                  aria-label="クエリ内で適用する CSS プロパティ"
                  spellCheck={false}
                />
              </div>
            </section>

            {/* リセット */}
            <button
              type="button"
              className="btn-clear"
              onClick={handleReset}
              aria-label="すべての設定をリセット"
            >
              リセット
            </button>
          </div>

          {/* ── 右パネル: プレビュー + 出力 ── */}
          <div className="cmq-right">
            {/* ライブプレビュー */}
            <section className="cmq-preview-section" aria-labelledby="cmq-preview-title">
              <h2 className="cmq-section-title" id="cmq-preview-title">
                ライブプレビュー
              </h2>

              {/* 幅スライダー */}
              <div className="cmq-preview-controls">
                <span className="cmq-preview-label">仮想ビューポート幅:</span>
                <input
                  type="range"
                  className="cmq-preview-slider"
                  min={MIN_PREVIEW_WIDTH}
                  max={MAX_PREVIEW_WIDTH}
                  value={previewWidth}
                  onChange={(e) => setPreviewWidth(Number(e.target.value))}
                  aria-label={`仮想ビューポート幅 ${previewWidth}px`}
                  aria-valuemin={MIN_PREVIEW_WIDTH}
                  aria-valuemax={MAX_PREVIEW_WIDTH}
                  aria-valuenow={previewWidth}
                />
                <span className="cmq-preview-width-badge">{previewWidth}px</span>
              </div>

              {/* プレビューボックス */}
              <div className="cmq-preview-wrapper">
                <div
                  ref={previewOuterRef}
                  className="cmq-preview-outer"
                  aria-label={`仮想ビューポート（幅 ${previewWidth}px）`}
                >
                  <div className={`cmq-preview-inner${queryActive ? " cmq-preview-active" : ""}`}>
                    <div className="cmq-preview-card">
                      <strong>カード 1</strong>
                      <p className="cmq-preview-card-body">コンテンツ</p>
                    </div>
                    <div className="cmq-preview-card">
                      <strong>カード 2</strong>
                      <p className="cmq-preview-card-body">コンテンツ</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 適用状態 */}
              <div className="cmq-preview-status" role="status" aria-live="polite">
                <span
                  className={`cmq-preview-status-dot ${queryActive ? "active" : "inactive"}`}
                  aria-hidden="true"
                />
                <span>
                  {queryActive
                    ? `@media クエリが適用されています（${previewWidth}px）`
                    : `@media クエリは未適用です（条件を満たしていません）`}
                </span>
              </div>
            </section>

            {/* 出力 */}
            <section className="cmq-output-section" aria-labelledby="cmq-output-title">
              <div className="cmq-output-header">
                <h2 className="cmq-section-title" id="cmq-output-title">
                  生成コード
                </h2>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopy}
                  aria-label="生成されたコードをクリップボードにコピー"
                >
                  コピー
                </button>
              </div>

              {/* フォーマットタブ */}
              <div className="cmq-output-tabs" role="tablist" aria-label="出力フォーマット">
                {OUTPUT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    id={`cmq-tab-${t.value}`}
                    type="button"
                    role="tab"
                    aria-selected={outputType === t.value}
                    aria-controls={`cmq-panel-${t.value}`}
                    className={`cmq-output-tab${outputType === t.value ? " active" : ""}`}
                    onClick={() => setOutputType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 出力エリア */}
              <div
                id={`cmq-panel-${outputType}`}
                role="tabpanel"
                aria-labelledby={`cmq-tab-${outputType}`}
              >
                <pre
                  className="cmq-output-pre"
                  aria-label={`${OUTPUT_TYPES.find((t) => t.value === outputType)?.label} 形式の出力`}
                  aria-live="polite"
                >
                  {outputText}
                </pre>
              </div>
            </section>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "CSS メディアクエリとは",
              items: [
                "ビューポートの幅・高さ・向き・解像度などの条件に応じてスタイルを切り替えるCSS機能",
                "レスポンシブデザインの基盤となる技術で、全モダンブラウザで完全サポート",
                "print・screen などのメディアタイプと組み合わせて印刷用スタイルも定義可能",
                "@media screen and (min-width: 768px) { ... } の形式で記述",
              ],
            },
            {
              title: "よく使うフィーチャー",
              items: [
                "min-width / max-width: デバイス幅によるブレイクポイント（最もよく使う）",
                "orientation: portrait（縦向き）または landscape（横向き）で切り替え",
                "hover: マウスなどホバー操作に対応するデバイスかを判定",
                "prefers-color-scheme: OSのダーク/ライトモード設定に応じたテーマ切り替え",
                "prefers-reduced-motion: アニメーション低減設定に対応するアクセシビリティ対応",
              ],
            },
            {
              title: "ブレイクポイントの選び方",
              items: [
                "px 単位: sm=640px, md=768px, lg=1024px, xl=1280px が Tailwind CSS の標準",
                "em 単位: フォントサイズに相対的で、ユーザーのフォント設定に追随する",
                "モバイルファースト（min-width）で設計すると CSS が小さく管理しやすい",
                "コンテナクエリ（@container）も組み合わせてコンポーネント単位で対応可能",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
