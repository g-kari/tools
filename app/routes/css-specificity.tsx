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
  calculateSpecificity,
  specificityToString,
  specificityToNumber,
  compareSpecificity,
  SPECIFICITY_SAMPLES,
  type SpecificityValue,
} from "~/utils/css-specificity";

export const Route = createFileRoute("/css-specificity")({
  head: () => ({
    meta: [
      { title: "CSS詳細度計算機 | Web ツール集" },
      {
        name: "description",
        content:
          "CSSセレクターの詳細度（specificity）を計算するツール。IDセレクター・クラス・タイプの (a, b, c) 表記で表示。複数セレクターの比較も可能。",
      },
      { property: "og:title", content: "CSS詳細度計算機 | Web ツール集" },
      {
        property: "og:description",
        content:
          "CSSセレクターの詳細度を計算・比較。(a, b, c) 表記でビジュアル表示。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-specificity` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS詳細度計算機 | Web ツール集",
      },
      {
        name: "twitter:description",
        content: "CSSセレクターの詳細度を計算するツール。",
      },
    ],
  }),
  component: CssSpecificityCalculator,
});

/** 詳細度の棒グラフ（ビジュアル表示） */
function SpecificityBar({
  spec,
  maxValue,
}: {
  spec: SpecificityValue;
  maxValue: number;
}) {
  const safeMax = Math.max(maxValue, 1);
  const total = specificityToNumber(spec);
  const idsW = spec.ids > 0 ? Math.max((spec.ids * 10000 / safeMax) * 100, 4) : 0;
  const classesW = spec.classes > 0 ? Math.max((spec.classes * 100 / safeMax) * 100, 2) : 0;
  const typesW = spec.types > 0 ? Math.max((spec.types / safeMax) * 100, 1) : 0;

  return (
    <div className="cssp-bar-row" aria-hidden="true">
      <div
        className="cssp-bar-track"
        style={
          {
            "--bar-ids-w": `${idsW}%`,
            "--bar-classes-w": `${classesW}%`,
            "--bar-types-w": `${typesW}%`,
            "--bar-zero": total === 0 ? "100%" : "0%",
          } as React.CSSProperties
        }
      >
        <div className="cssp-bar-ids" />
        <div className="cssp-bar-classes" />
        <div className="cssp-bar-types" />
        {total === 0 && <div className="cssp-bar-zero" />}
      </div>
      <span className="cssp-bar-total" aria-label={`合計スコア: ${total}`}>
        {total}
      </span>
    </div>
  );
}

/** 詳細度バッジ (a, b, c) */
function SpecificityBadge({ spec }: { spec: SpecificityValue }) {
  return (
    <div
      className="cssp-badge"
      role="group"
      aria-label={`詳細度: ID=${spec.ids}, クラス=${spec.classes}, タイプ=${spec.types}`}
    >
      <div className="cssp-badge-cell cssp-badge-ids" aria-label={`IDセレクター: ${spec.ids}`}>
        <span className="cssp-badge-value">{spec.ids}</span>
        <span className="cssp-badge-label">ID</span>
      </div>
      <div className="cssp-badge-sep" aria-hidden="true">,</div>
      <div className="cssp-badge-cell cssp-badge-classes" aria-label={`クラス・属性・擬似クラス: ${spec.classes}`}>
        <span className="cssp-badge-value">{spec.classes}</span>
        <span className="cssp-badge-label">クラス</span>
      </div>
      <div className="cssp-badge-sep" aria-hidden="true">,</div>
      <div className="cssp-badge-cell cssp-badge-types" aria-label={`タイプ・擬似要素: ${spec.types}`}>
        <span className="cssp-badge-value">{spec.types}</span>
        <span className="cssp-badge-label">タイプ</span>
      </div>
    </div>
  );
}

/** セレクター行（比較モード用） */
function SelectorRow({
  index,
  selector,
  isHighest,
  maxValue,
  onRemove,
  onCopy,
}: {
  index: number;
  selector: string;
  isHighest: boolean;
  maxValue: number;
  onRemove: (i: number) => void;
  onCopy: (text: string, label: string) => void;
}) {
  const spec = useMemo(() => calculateSpecificity(selector), [selector]);
  const specStr = specificityToString(spec);

  return (
    <div className={`cssp-compare-row${isHighest ? " highest" : ""}`}>
      <div className="cssp-compare-selector">
        <code className="cssp-selector-code">{selector}</code>
        {isHighest && (
          <span className="cssp-highest-badge" aria-label="最も高い詳細度">
            最高
          </span>
        )}
      </div>
      <SpecificityBadge spec={spec} />
      <SpecificityBar spec={spec} maxValue={maxValue} />
      <div className="cssp-compare-actions">
        <button
          type="button"
          className="cssp-btn-copy"
          onClick={() => onCopy(specStr, selector)}
          aria-label={`${selector} の詳細度 ${specStr} をコピー`}
        >
          コピー
        </button>
        <button
          type="button"
          className="cssp-btn-remove"
          onClick={() => onRemove(index)}
          aria-label={`${selector} を削除`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function CssSpecificityCalculator() {
  const [singleInput, setSingleInput] = useState("div.class > #id:hover");
  const [compareSelectors, setCompareSelectors] = useState<string[]>([
    ".nav > li.active",
    "#header .nav li:first-child",
    "ul li",
    ".wrapper p.text",
  ]);
  const [newSelector, setNewSelector] = useState("");
  const [activeTab, setActiveTab] = useState<"single" | "compare">("single");

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  // シングルモード
  const singleSpec = useMemo(
    () => calculateSpecificity(singleInput),
    [singleInput]
  );
  const singleSpecStr = specificityToString(singleSpec);

  const handleCopySingle = useCallback(async () => {
    const success = await copy(singleSpecStr);
    if (success) {
      announceStatus(`${singleSpecStr} をコピーしました`);
      showToast(`${singleSpecStr} をコピーしました`, "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [singleSpecStr, copy, announceStatus, showToast]);

  // 比較モード
  const compareSpecs = useMemo(
    () => compareSelectors.map((sel) => calculateSpecificity(sel)),
    [compareSelectors]
  );

  const maxCompareValue = useMemo(
    () => Math.max(...compareSpecs.map(specificityToNumber), 1),
    [compareSpecs]
  );

  const highestIndex = useMemo(() => {
    let maxIdx = 0;
    let maxVal = -1;
    compareSpecs.forEach((spec, i) => {
      const val = specificityToNumber(spec);
      if (val > maxVal) {
        maxVal = val;
        maxIdx = i;
      }
    });
    return compareSpecs.length > 0 ? maxIdx : -1;
  }, [compareSpecs]);

  const handleAddSelector = useCallback(() => {
    const trimmed = newSelector.trim();
    if (!trimmed) return;
    setCompareSelectors((prev) => [...prev, trimmed]);
    setNewSelector("");
  }, [newSelector]);

  const handleRemoveSelector = useCallback((index: number) => {
    setCompareSelectors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCopyCompare = useCallback(
    async (specStr: string, selector: string) => {
      const success = await copy(specStr);
      if (success) {
        announceStatus(`${selector} の詳細度 ${specStr} をコピーしました`);
        showToast(`コピーしました: ${specStr}`, "success");
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, announceStatus, showToast]
  );

  const handleSampleClick = useCallback(
    (selector: string) => {
      if (activeTab === "single") {
        setSingleInput(selector);
      } else {
        if (!compareSelectors.includes(selector)) {
          setCompareSelectors((prev) => [...prev, selector]);
        }
      }
    },
    [activeTab, compareSelectors]
  );

  // サンプルセレクターのソート済みリスト（詳細度の高い順）
  const sortedSamples = useMemo(() => {
    return [...SPECIFICITY_SAMPLES].sort((a, b) =>
      compareSpecificity(
        calculateSpecificity(b.selector),
        calculateSpecificity(a.selector)
      )
    );
  }, []);

  return (
    <>
      <div className="tool-container">
        <div className="cssp-layout">
          {/* 左: タブとメインコンテンツ */}
          <div className="cssp-main">
            {/* タブ切り替え */}
            <div className="cssp-tabs" role="tablist" aria-label="モード選択">
              <button
                role="tab"
                type="button"
                className={`cssp-tab${activeTab === "single" ? " active" : ""}`}
                aria-selected={activeTab === "single"}
                onClick={() => setActiveTab("single")}
              >
                単一セレクター
              </button>
              <button
                role="tab"
                type="button"
                className={`cssp-tab${activeTab === "compare" ? " active" : ""}`}
                aria-selected={activeTab === "compare"}
                onClick={() => setActiveTab("compare")}
              >
                比較モード
              </button>
            </div>

            {/* 単一セレクターモード */}
            {activeTab === "single" && (
              <section
                className="cssp-panel"
                aria-labelledby="cssp-single-title"
              >
                <h2 className="cssp-section-title" id="cssp-single-title">
                  セレクターを入力
                </h2>
                <div className="cssp-single-input-row">
                  <input
                    type="text"
                    className="cssp-selector-input"
                    value={singleInput}
                    onChange={(e) => setSingleInput(e.target.value)}
                    placeholder="例: .nav > li.active:hover"
                    aria-label="CSSセレクター入力"
                    spellCheck={false}
                  />
                </div>

                {singleInput.trim() ? (
                  <div
                    className="cssp-single-result"
                    role="region"
                    aria-label="詳細度の計算結果"
                  >
                    <SpecificityBadge spec={singleSpec} />
                    <div className="cssp-single-notation">
                      <span className="cssp-notation-text">
                        {singleSpecStr}
                      </span>
                      <button
                        type="button"
                        className="cssp-btn-copy"
                        onClick={handleCopySingle}
                        aria-label={`詳細度 ${singleSpecStr} をコピー`}
                      >
                        コピー
                      </button>
                    </div>

                    {/* 内訳 */}
                    <div
                      className="cssp-breakdown"
                      aria-label="詳細度の内訳"
                    >
                      <div className="cssp-breakdown-item">
                        <span className="cssp-breakdown-dot dot-ids" aria-hidden="true" />
                        <span className="cssp-breakdown-label">
                          IDセレクター <code>#id</code>
                        </span>
                        <span className="cssp-breakdown-count">
                          {singleSpec.ids}
                        </span>
                      </div>
                      <div className="cssp-breakdown-item">
                        <span className="cssp-breakdown-dot dot-classes" aria-hidden="true" />
                        <span className="cssp-breakdown-label">
                          クラス・属性・擬似クラス <code>.class [attr] :hover</code>
                        </span>
                        <span className="cssp-breakdown-count">
                          {singleSpec.classes}
                        </span>
                      </div>
                      <div className="cssp-breakdown-item">
                        <span className="cssp-breakdown-dot dot-types" aria-hidden="true" />
                        <span className="cssp-breakdown-label">
                          タイプ・擬似要素 <code>div ::before</code>
                        </span>
                        <span className="cssp-breakdown-count">
                          {singleSpec.types}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="cssp-placeholder">
                    CSSセレクターを入力してください
                  </p>
                )}
              </section>
            )}

            {/* 比較モード */}
            {activeTab === "compare" && (
              <section
                className="cssp-panel"
                aria-labelledby="cssp-compare-title"
              >
                <h2 className="cssp-section-title" id="cssp-compare-title">
                  セレクターを比較
                </h2>

                {/* 新しいセレクター追加 */}
                <div
                  className="cssp-add-row"
                  role="group"
                  aria-label="セレクターを追加"
                >
                  <input
                    type="text"
                    className="cssp-selector-input"
                    value={newSelector}
                    onChange={(e) => setNewSelector(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSelector();
                    }}
                    placeholder="セレクターを入力して追加..."
                    aria-label="追加するセレクター"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    className="cssp-btn-add"
                    onClick={handleAddSelector}
                    disabled={!newSelector.trim()}
                    aria-label="セレクターを追加"
                  >
                    追加
                  </button>
                </div>

                {/* 凡例 */}
                <div className="cssp-legend" aria-label="凡例">
                  <span className="cssp-legend-item">
                    <span className="cssp-breakdown-dot dot-ids" aria-hidden="true" />
                    ID
                  </span>
                  <span className="cssp-legend-item">
                    <span className="cssp-breakdown-dot dot-classes" aria-hidden="true" />
                    クラス
                  </span>
                  <span className="cssp-legend-item">
                    <span className="cssp-breakdown-dot dot-types" aria-hidden="true" />
                    タイプ
                  </span>
                </div>

                {/* セレクター一覧 */}
                {compareSelectors.length > 0 ? (
                  <div
                    className="cssp-compare-list"
                    role="list"
                    aria-label="比較セレクター一覧"
                  >
                    {compareSelectors.map((sel, i) => (
                      <div role="listitem" key={`${sel}-${i}`}>
                        <SelectorRow
                          index={i}
                          selector={sel}
                          isHighest={i === highestIndex}
                          maxValue={maxCompareValue}
                          onRemove={handleRemoveSelector}
                          onCopy={handleCopyCompare}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="cssp-placeholder">
                    比較するセレクターを追加してください
                  </p>
                )}
              </section>
            )}
          </div>

          {/* 右: サンプルとTips */}
          <div className="cssp-sidebar">
            <section className="cssp-panel" aria-labelledby="cssp-samples-title">
              <h2 className="cssp-section-title" id="cssp-samples-title">
                セレクターサンプル
              </h2>
              <p className="cssp-samples-hint">
                クリックすると{activeTab === "single" ? "入力欄に" : "比較リストに"}追加されます
              </p>
              <ul className="cssp-samples-list" aria-label="サンプルセレクター（詳細度の高い順）">
                {sortedSamples.map((sample) => {
                  const spec = calculateSpecificity(sample.selector);
                  return (
                    <li key={sample.selector}>
                      <button
                        type="button"
                        className="cssp-sample-btn"
                        onClick={() => handleSampleClick(sample.selector)}
                        aria-label={`${sample.selector} を使用（詳細度: ${specificityToString(spec)}）`}
                      >
                        <code className="cssp-sample-selector">
                          {sample.selector}
                        </code>
                        <span className="cssp-sample-spec">
                          {specificityToString(spec)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <TipsCard
              sections={[
                {
                  title: "詳細度の計算規則",
                  items: [
                    "(a, b, c) の3つの数値で表現されます",
                    "a = IDセレクター (#id) の数",
                    "b = クラス (.class)・属性 ([attr])・擬似クラス (:hover) の数",
                    "c = タイプ (div)・擬似要素 (::before) の数",
                    "ユニバーサルセレクター (*) とコンビネーターは詳細度0",
                  ],
                },
                {
                  title: "特殊な擬似クラス",
                  items: [
                    ":where() → 詳細度は常に 0",
                    ":is(), :not(), :has() → 括弧内で最も高い詳細度を使用",
                    "例: :not(#id) → a=1 (:not(div) → c=1)",
                  ],
                },
                {
                  title: "比較のルール",
                  items: [
                    "左から (a, b, c) の順に比較します",
                    "a が大きい方が優先されます",
                    "a が同じ場合は b を比較します",
                    "同率なら後に書かれたスタイルが適用されます",
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>

      <StatusAnnouncer ref={statusRef} />
    </>
  );
}
