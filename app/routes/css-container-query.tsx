import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type ContainerConfig,
  type QueryConfig,
  type QueryCondition,
  type ConditionType,
  type CssUnit,
  type ContainerType,
  defaultContainerConfig,
  defaultQueryConfig,
  createDefaultCondition,
  generateFullCSS,
  formatCondition,
  checkAllConditions,
} from "~/utils/css-container-query";

export const Route = createFileRoute("/css-container-query")({
  head: () => ({
    meta: [
      { title: "CSS Container Query ビルダー | Web ツール集" },
      {
        name: "description",
        content:
          "CSS Container Queries をビジュアルに構築するツール。container-type・container-name の設定、条件（min-width・max-width・range・aspect-ratio）の組み合わせ、ライブプレビューでコンテナー幅を変えながら CSS を即座に生成。",
      },
      {
        property: "og:title",
        content: "CSS Container Query ビルダー | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS Container Queries をビジュアルに構築するツール。条件をGUIで設定し、CSSコードを即座に生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-container-query` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Container Query ビルダー | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS Container Queries をビジュアルに構築するツール。ライブプレビューつき。",
      },
    ],
  }),
  component: CssContainerQueryBuilder,
});

const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  "min-width": "min-width（最小幅）",
  "max-width": "max-width（最大幅）",
  "width-range": "width range（幅の範囲）",
  "min-height": "min-height（最小高さ）",
  "max-height": "max-height（最大高さ）",
  "aspect-ratio": "aspect-ratio（アスペクト比）",
};

const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  "inline-size": "inline-size（幅のみ計測）",
  size: "size（幅・高さ両方）",
  normal: "normal（スタイルのみ）",
};

const UNITS: CssUnit[] = ["px", "em", "rem", "%"];
const MAX_PREVIEW_WIDTH = 800;

/** 条件カードコンポーネント */
function ConditionCard({
  cond,
  index,
  total,
  logicalOp,
  onChange,
  onRemove,
  onToggleLogic,
}: {
  cond: QueryCondition;
  index: number;
  total: number;
  logicalOp: "and" | "or";
  onChange: (id: string, updates: Partial<QueryCondition>) => void;
  onRemove: (id: string) => void;
  onToggleLogic: () => void;
}) {
  const isRange = cond.type === "width-range";
  const isRatio = cond.type === "aspect-ratio";
  const isHeightType =
    cond.type === "min-height" || cond.type === "max-height";

  return (
    <>
      <div className="ccq-condition-card" aria-label={`条件 ${index + 1}`}>
        {/* タイプ選択 */}
        <div className="ccq-condition-header">
          <select
            className="ccq-condition-type-select"
            value={cond.type}
            onChange={(e) =>
              onChange(cond.id, { type: e.target.value as ConditionType })
            }
            aria-label={`条件 ${index + 1} のタイプ`}
          >
            {(Object.keys(CONDITION_TYPE_LABELS) as ConditionType[]).map(
              (t) => (
                <option key={t} value={t}>
                  {CONDITION_TYPE_LABELS[t]}
                </option>
              )
            )}
          </select>
          <button
            type="button"
            className="ccq-condition-remove"
            onClick={() => onRemove(cond.id)}
            aria-label={`条件 ${index + 1} を削除`}
            disabled={total <= 1}
          >
            ×
          </button>
        </div>

        {/* 値入力 */}
        {isRatio ? (
          <div className="ccq-condition-body ccq-range">
            <input
              type="number"
              className="ccq-value-input"
              value={cond.ratioW}
              min={1}
              onChange={(e) =>
                onChange(cond.id, { ratioW: Number(e.target.value) })
              }
              aria-label="アスペクト比の幅"
            />
            <span className="ccq-range-sep">/</span>
            <input
              type="number"
              className="ccq-value-input"
              value={cond.ratioH}
              min={1}
              onChange={(e) =>
                onChange(cond.id, { ratioH: Number(e.target.value) })
              }
              aria-label="アスペクト比の高さ"
            />
            <span className="ccq-range-sep" aria-hidden="true" />
          </div>
        ) : isRange ? (
          <div className="ccq-condition-body ccq-range">
            <input
              type="number"
              className="ccq-value-input"
              value={cond.value}
              min={0}
              onChange={(e) =>
                onChange(cond.id, { value: Number(e.target.value) })
              }
              aria-label="最小幅"
            />
            <span className="ccq-range-sep">〜</span>
            <input
              type="number"
              className="ccq-value-input"
              value={cond.maxValue}
              min={0}
              onChange={(e) =>
                onChange(cond.id, { maxValue: Number(e.target.value) })
              }
              aria-label="最大幅"
            />
            <select
              className="ccq-unit-select"
              value={cond.unit}
              onChange={(e) =>
                onChange(cond.id, { unit: e.target.value as CssUnit })
              }
              aria-label="単位"
            >
              {UNITS.filter((u) => u !== "%").map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="ccq-condition-body">
            <input
              type="number"
              className="ccq-value-input"
              value={cond.value}
              min={0}
              onChange={(e) =>
                onChange(cond.id, { value: Number(e.target.value) })
              }
              aria-label="値"
            />
            <select
              className="ccq-unit-select"
              value={cond.unit}
              onChange={(e) =>
                onChange(cond.id, { unit: e.target.value as CssUnit })
              }
              aria-label="単位"
            >
              {(isHeightType ? UNITS : UNITS).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 生成される条件プレビュー */}
        <div className="ccq-condition-preview">
          {formatCondition(cond)}
        </div>
      </div>

      {/* 論理演算子バッジ（最後の条件には表示しない） */}
      {index < total - 1 && (
        <div className="ccq-logic-row">
          <div className="ccq-logic-line" aria-hidden="true" />
          <button
            type="button"
            className="ccq-logic-badge"
            onClick={onToggleLogic}
            title={`クリックして ${logicalOp === "and" ? "OR" : "AND"} に切り替え`}
            aria-label={`論理演算子: ${logicalOp}。クリックで切り替え`}
          >
            {logicalOp}
          </button>
          <div className="ccq-logic-line" aria-hidden="true" />
        </div>
      )}
    </>
  );
}

/** CSS Container Query ビルダー メインコンポーネント */
function CssContainerQueryBuilder() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [containerConfig, setContainerConfig] = useState<ContainerConfig>(
    defaultContainerConfig
  );
  const [queryConfig, setQueryConfig] = useState<QueryConfig>(defaultQueryConfig);
  const [previewWidth, setPreviewWidth] = useState(300);

  /** コンテナー設定を更新する */
  const updateContainer = useCallback((updates: Partial<ContainerConfig>) => {
    setContainerConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  /** クエリ設定を更新する */
  const updateQuery = useCallback((updates: Partial<QueryConfig>) => {
    setQueryConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  /** 条件を更新する */
  const updateCondition = useCallback(
    (id: string, updates: Partial<QueryCondition>) => {
      setQueryConfig((prev) => ({
        ...prev,
        conditions: prev.conditions.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }));
    },
    []
  );

  /** 条件を追加する */
  const addCondition = useCallback(() => {
    const newCond = createDefaultCondition();
    setQueryConfig((prev) => ({
      ...prev,
      conditions: [...prev.conditions, newCond],
    }));
    announceStatus("条件を追加しました");
  }, [announceStatus]);

  /** 条件を削除する */
  const removeCondition = useCallback(
    (id: string) => {
      setQueryConfig((prev) => {
        if (prev.conditions.length <= 1) return prev;
        return { ...prev, conditions: prev.conditions.filter((c) => c.id !== id) };
      });
      announceStatus("条件を削除しました");
    },
    [announceStatus]
  );

  /** 論理演算子を切り替える */
  const toggleLogicOp = useCallback(() => {
    setQueryConfig((prev) => ({
      ...prev,
      logicalOp: prev.logicalOp === "and" ? "or" : "and",
    }));
  }, []);

  /** 設定をリセットする */
  const handleReset = useCallback(() => {
    setContainerConfig(defaultContainerConfig);
    setQueryConfig(defaultQueryConfig);
    setPreviewWidth(300);
    announceStatus("設定をリセットしました");
  }, [announceStatus]);

  /** CSS をコピーする */
  const handleCopyCSS = useCallback(async () => {
    const css = generateFullCSS(containerConfig, queryConfig);
    const success = await copy(css);
    if (success) {
      showToast("CSS をコピーしました", "success");
      announceStatus("CSS をクリップボードにコピーしました");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, containerConfig, queryConfig, showToast, announceStatus]);

  const generatedCSS = useMemo(
    () => generateFullCSS(containerConfig, queryConfig),
    [containerConfig, queryConfig]
  );

  const queryActive = useMemo(
    () =>
      checkAllConditions(
        queryConfig.conditions,
        queryConfig.logicalOp,
        previewWidth
      ),
    [queryConfig.conditions, queryConfig.logicalOp, previewWidth]
  );

  return (
    <>
      <div className="tool-container">
        <div className="ccq-layout">
          {/* ── 左パネル: 設定 ── */}
          <div aria-label="コンテナークエリ設定パネル">
            {/* コンテナー定義 */}
            <section
              className="ccq-section"
              aria-labelledby="ccq-container-title"
            >
              <h2 className="ccq-section-title" id="ccq-container-title">
                コンテナー定義
              </h2>

              <div className="ccq-prop-row">
                <label htmlFor="ccq-container-selector" className="ccq-prop-label">
                  コンテナーセレクタ
                </label>
                <input
                  id="ccq-container-selector"
                  type="text"
                  className="ccq-input"
                  value={containerConfig.containerSelector}
                  onChange={(e) =>
                    updateContainer({ containerSelector: e.target.value })
                  }
                  placeholder=".container"
                  aria-label="コンテナーの CSS セレクタ"
                  spellCheck={false}
                />
              </div>

              <div className="ccq-prop-row">
                <label htmlFor="ccq-container-type" className="ccq-prop-label">
                  <code>container-type</code>
                </label>
                <select
                  id="ccq-container-type"
                  className="ccq-select"
                  value={containerConfig.containerType}
                  onChange={(e) =>
                    updateContainer({
                      containerType: e.target.value as ContainerType,
                    })
                  }
                  aria-label="container-type の値"
                >
                  {(Object.keys(CONTAINER_TYPE_LABELS) as ContainerType[]).map(
                    (t) => (
                      <option key={t} value={t}>
                        {CONTAINER_TYPE_LABELS[t]}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="ccq-prop-row">
                <label htmlFor="ccq-container-name" className="ccq-prop-label">
                  <code>container-name</code>
                  <span className="ccq-optional-label">
                    （省略可）
                  </span>
                </label>
                <input
                  id="ccq-container-name"
                  type="text"
                  className="ccq-input"
                  value={containerConfig.containerName}
                  onChange={(e) =>
                    updateContainer({ containerName: e.target.value })
                  }
                  placeholder="例: sidebar"
                  aria-label="container-name の値"
                  spellCheck={false}
                />
              </div>
            </section>

            {/* クエリ条件 */}
            <section
              className="ccq-section"
              aria-labelledby="ccq-conditions-title"
            >
              <h2 className="ccq-section-title" id="ccq-conditions-title">
                クエリ条件
              </h2>

              {queryConfig.conditions.map((cond, index) => (
                <ConditionCard
                  key={cond.id}
                  cond={cond}
                  index={index}
                  total={queryConfig.conditions.length}
                  logicalOp={queryConfig.logicalOp}
                  onChange={updateCondition}
                  onRemove={removeCondition}
                  onToggleLogic={toggleLogicOp}
                />
              ))}

              <button
                type="button"
                className="ccq-add-condition"
                onClick={addCondition}
                aria-label="条件を追加"
              >
                ＋ 条件を追加
              </button>
            </section>

            {/* クエリ内容 */}
            <section
              className="ccq-section"
              aria-labelledby="ccq-inner-title"
            >
              <h2 className="ccq-section-title" id="ccq-inner-title">
                クエリ内のスタイル
              </h2>

              <div className="ccq-prop-row">
                <label htmlFor="ccq-target-selector" className="ccq-prop-label">
                  ターゲットセレクタ
                </label>
                <input
                  id="ccq-target-selector"
                  type="text"
                  className="ccq-input"
                  value={queryConfig.targetSelector}
                  onChange={(e) =>
                    updateQuery({ targetSelector: e.target.value })
                  }
                  placeholder=".card"
                  aria-label="クエリ内のターゲットセレクタ"
                  spellCheck={false}
                />
              </div>

              <div className="ccq-prop-row">
                <label htmlFor="ccq-inner-css" className="ccq-prop-label">
                  適用するスタイル
                </label>
                <textarea
                  id="ccq-inner-css"
                  className="ccq-input"
                  value={queryConfig.innerCSS}
                  onChange={(e) => updateQuery({ innerCSS: e.target.value })}
                  placeholder="  display: flex;&#10;  flex-direction: row;"
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

          {/* ── 右パネル: プレビュー + CSS 出力 ── */}
          <div className="ccq-right">
            {/* ライブプレビュー */}
            <section
              className="ccq-preview-section"
              aria-labelledby="ccq-preview-title"
            >
              <h2 className="ccq-section-title" id="ccq-preview-title">
                ライブプレビュー
              </h2>

              {/* 幅スライダー */}
              <div className="ccq-preview-controls">
                <span className="ccq-preview-label">コンテナー幅:</span>
                <input
                  type="range"
                  className="ccq-preview-slider"
                  min={100}
                  max={MAX_PREVIEW_WIDTH}
                  value={previewWidth}
                  onChange={(e) => setPreviewWidth(Number(e.target.value))}
                  aria-label={`コンテナー幅 ${previewWidth}px`}
                  aria-valuemin={100}
                  aria-valuemax={MAX_PREVIEW_WIDTH}
                  aria-valuenow={previewWidth}
                />
                <span className="ccq-preview-width-badge">{previewWidth}px</span>
              </div>

              {/* コンテナープレビュー */}
              <div className="ccq-preview-wrapper">
                <div
                  className="ccq-preview-outer"
                  style={{ width: `${previewWidth}px` }}
                  aria-label={`コンテナー（幅 ${previewWidth}px）`}
                >
                  <span className="ccq-preview-outer-label">
                    {containerConfig.containerSelector || ".container"}
                  </span>
                  <div
                    className={`ccq-preview-inner${queryActive ? " ccq-query-active" : ""}`}
                  >
                    <div className="ccq-preview-card">
                      <strong>カード 1</strong>
                      <p>
                        コンテンツ
                      </p>
                    </div>
                    <div className="ccq-preview-card">
                      <strong>カード 2</strong>
                      <p>
                        コンテンツ
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* クエリ適用状態 */}
              <div
                className="ccq-preview-status"
                role="status"
                aria-live="polite"
              >
                <span
                  className={`ccq-preview-status-dot ${queryActive ? "active" : "inactive"}`}
                  aria-hidden="true"
                />
                <span className="ccq-preview-status-text">
                  {queryActive
                    ? `@container クエリが適用されています（${previewWidth}px ≥ 条件）`
                    : `@container クエリは未適用です（条件を満たしていません）`}
                </span>
              </div>
            </section>

            {/* 生成 CSS */}
            <section
              className="ccq-css-section"
              aria-labelledby="ccq-css-title"
            >
              <div className="ccq-css-header">
                <h2 className="ccq-section-title" id="ccq-css-title">
                  生成 CSS
                </h2>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopyCSS}
                  aria-label="生成された CSS をクリップボードにコピー"
                >
                  コピー
                </button>
              </div>
              <pre
                className="ccq-css-output"
                aria-label="生成された CSS コード"
                aria-live="polite"
              >
                {generatedCSS}
              </pre>
            </section>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "CSS Container Queries とは",
              items: [
                "コンテナークエリは、ビューポートではなく親要素のサイズに基づいてスタイルを適用するCSS機能",
                "2023年にすべてのモダンブラウザでサポート開始（Chrome 105+, Firefox 110+, Safari 16+）",
                "メディアクエリより細かい粒度でコンポーネントをレスポンシブに設計できる",
                "コンポーネントは自身のコンテナーサイズを感知してスタイルを変化させられる",
              ],
            },
            {
              title: "使い方",
              items: [
                "1. コンテナー定義: container-type を設定して要素をコンテナーとして登録",
                "2. クエリ条件: min-width や max-width で条件を設定（複数条件も可）",
                "3. ターゲットセレクタ: クエリ内で変化させたい要素のセレクタを指定",
                "4. スライダーでプレビューのコンテナー幅を変えて動作を確認",
              ],
            },
            {
              title: "container-type の選択ガイド",
              items: [
                "inline-size: 幅のみ計測（横方向のレスポンシブ対応に最もよく使う）",
                "size: 幅・高さ両方を計測（高さ条件も使いたい場合）",
                "normal: スタイルクエリ専用（サイズクエリは使えない）",
                "container-name: 複数のコンテナーを区別するための名前（省略可）",
              ],
            },
            {
              title: "よく使うパターン",
              items: [
                "カードレイアウト: 狭い時は縦積み、広い時は横並び",
                "サイドバー内コンポーネント: サイドバー幅に応じてレイアウト変更",
                "リスト → グリッド: コンテナーが広くなったら display:grid に切り替え",
                "範囲クエリ（CSS 2023）: (300px <= width <= 600px) で特定幅の範囲に適用",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
