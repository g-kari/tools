import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type FlexContainerConfig,
  type FlexItemConfig,
  defaultContainerConfig,
  createDefaultItem,
  createDefaultItems,
  generateFullCSS,
  getContainerStyles,
  getItemStyles,
  ITEM_COLORS,
} from "~/utils/css-flexbox";

export const Route = createFileRoute("/css-flexbox")({
  head: () => ({
    meta: [
      { title: "CSSフレックスボックスジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "flexbox のコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。justify-content・align-items・flex-wrap などを直感的に試せるオンラインツール。",
      },
      {
        property: "og:title",
        content: "CSSフレックスボックスジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "flexbox のコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-flexbox` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSSフレックスボックスジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "flexbox のコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。",
      },
    ],
  }),
  component: CssFlexboxGenerator,
});

const FLEX_DIRECTIONS: { id: FlexContainerConfig["flexDirection"]; label: string }[] = [
  { id: "row", label: "row" },
  { id: "row-reverse", label: "row-reverse" },
  { id: "column", label: "column" },
  { id: "column-reverse", label: "column-reverse" },
];

const JUSTIFY_CONTENT_OPTIONS: {
  id: FlexContainerConfig["justifyContent"];
  label: string;
}[] = [
  { id: "flex-start", label: "flex-start" },
  { id: "flex-end", label: "flex-end" },
  { id: "center", label: "center" },
  { id: "space-between", label: "space-between" },
  { id: "space-around", label: "space-around" },
  { id: "space-evenly", label: "space-evenly" },
];

const ALIGN_ITEMS_OPTIONS: {
  id: FlexContainerConfig["alignItems"];
  label: string;
}[] = [
  { id: "stretch", label: "stretch" },
  { id: "flex-start", label: "flex-start" },
  { id: "flex-end", label: "flex-end" },
  { id: "center", label: "center" },
  { id: "baseline", label: "baseline" },
];

const FLEX_WRAP_OPTIONS: { id: FlexContainerConfig["flexWrap"]; label: string }[] = [
  { id: "nowrap", label: "nowrap" },
  { id: "wrap", label: "wrap" },
  { id: "wrap-reverse", label: "wrap-reverse" },
];

const ALIGN_CONTENT_OPTIONS: {
  id: FlexContainerConfig["alignContent"];
  label: string;
}[] = [
  { id: "normal", label: "normal" },
  { id: "flex-start", label: "flex-start" },
  { id: "flex-end", label: "flex-end" },
  { id: "center", label: "center" },
  { id: "space-between", label: "space-between" },
  { id: "space-around", label: "space-around" },
  { id: "stretch", label: "stretch" },
];

const ALIGN_SELF_OPTIONS: {
  id: FlexItemConfig["alignSelf"];
  label: string;
}[] = [
  { id: "auto", label: "auto" },
  { id: "flex-start", label: "flex-start" },
  { id: "flex-end", label: "flex-end" },
  { id: "center", label: "center" },
  { id: "baseline", label: "baseline" },
  { id: "stretch", label: "stretch" },
];

/**
 * CSSフレックスボックスジェネレーター コンポーネント
 * コンテナ・アイテムのプロパティをビジュアルに設定し、CSSコードを生成する
 */
function CssFlexboxGenerator() {
  const [container, setContainer] = useState<FlexContainerConfig>(defaultContainerConfig);
  const [items, setItems] = useState<FlexItemConfig[]>(createDefaultItems());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  /** 生成されたCSS */
  const generatedCSS = useMemo(() => generateFullCSS(container, items), [container, items]);

  /** プレビュー用のコンテナスタイル */
  const previewContainerStyle = useMemo(
    () => getContainerStyles(container) as React.CSSProperties,
    [container],
  );

  /** コンテナプロパティを更新する */
  const updateContainer = useCallback((updates: Partial<FlexContainerConfig>) => {
    setContainer((prev) => ({ ...prev, ...updates }));
  }, []);

  /** アイテムを追加する */
  const addItem = useCallback(() => {
    const newItem = createDefaultItem(items.length);
    setItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
    announceStatus(`${newItem.label}を追加しました`);
  }, [items.length, announceStatus]);

  /** アイテムを削除する */
  const removeItem = useCallback(
    (id: string, label: string) => {
      if (items.length <= 1) {
        showToast("アイテムは1つ以上必要です", "error");
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedItemId === id) setSelectedItemId(null);
      announceStatus(`${label}を削除しました`);
    },
    [items.length, selectedItemId, announceStatus, showToast],
  );

  /** アイテムのプロパティを更新する */
  const updateItem = useCallback((id: string, updates: Partial<FlexItemConfig>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  /** 設定をリセットする */
  const handleReset = useCallback(() => {
    setContainer(defaultContainerConfig);
    setItems(createDefaultItems());
    setSelectedItemId(null);
    announceStatus("設定をリセットしました");
  }, [announceStatus]);

  /** CSSをクリップボードにコピーする */
  const handleCopyCSS = useCallback(async () => {
    const success = await copy(generatedCSS);
    if (success) {
      announceStatus("CSSをクリップボードにコピーしました");
      showToast("CSSをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, generatedCSS, announceStatus, showToast]);

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  return (
    <>
      <div className="tool-container">
        <div className="cfb-layout">
          {/* 左側: コントロールパネル */}
          <div className="cfb-controls" aria-label="フレックスボックス設定パネル">
            {/* コンテナプロパティ */}
            <section className="cfb-section" aria-labelledby="container-props-title">
              <h2 className="cfb-section-title" id="container-props-title">
                コンテナプロパティ
              </h2>

              <div className="cfb-prop-row">
                <label htmlFor="flex-direction" className="cfb-prop-label">
                  <code>flex-direction</code>
                </label>
                <select
                  id="flex-direction"
                  className="cfb-select"
                  value={container.flexDirection}
                  onChange={(e) =>
                    updateContainer({
                      flexDirection: e.target.value as FlexContainerConfig["flexDirection"],
                    })
                  }
                  aria-label="flex-direction の値"
                >
                  {FLEX_DIRECTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cfb-prop-row">
                <label htmlFor="justify-content" className="cfb-prop-label">
                  <code>justify-content</code>
                </label>
                <select
                  id="justify-content"
                  className="cfb-select"
                  value={container.justifyContent}
                  onChange={(e) =>
                    updateContainer({
                      justifyContent: e.target.value as FlexContainerConfig["justifyContent"],
                    })
                  }
                  aria-label="justify-content の値"
                >
                  {JUSTIFY_CONTENT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cfb-prop-row">
                <label htmlFor="align-items" className="cfb-prop-label">
                  <code>align-items</code>
                </label>
                <select
                  id="align-items"
                  className="cfb-select"
                  value={container.alignItems}
                  onChange={(e) =>
                    updateContainer({
                      alignItems: e.target.value as FlexContainerConfig["alignItems"],
                    })
                  }
                  aria-label="align-items の値"
                >
                  {ALIGN_ITEMS_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cfb-prop-row">
                <label htmlFor="flex-wrap" className="cfb-prop-label">
                  <code>flex-wrap</code>
                </label>
                <select
                  id="flex-wrap"
                  className="cfb-select"
                  value={container.flexWrap}
                  onChange={(e) =>
                    updateContainer({
                      flexWrap: e.target.value as FlexContainerConfig["flexWrap"],
                    })
                  }
                  aria-label="flex-wrap の値"
                >
                  {FLEX_WRAP_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {container.flexWrap !== "nowrap" && (
                <div className="cfb-prop-row">
                  <label htmlFor="align-content" className="cfb-prop-label">
                    <code>align-content</code>
                  </label>
                  <select
                    id="align-content"
                    className="cfb-select"
                    value={container.alignContent}
                    onChange={(e) =>
                      updateContainer({
                        alignContent: e.target.value as FlexContainerConfig["alignContent"],
                      })
                    }
                    aria-label="align-content の値"
                  >
                    {ALIGN_CONTENT_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="cfb-prop-row">
                <label htmlFor="gap" className="cfb-prop-label">
                  <code>gap</code>
                </label>
                <input
                  id="gap"
                  type="text"
                  className="cfb-input"
                  value={container.gap}
                  onChange={(e) => updateContainer({ gap: e.target.value })}
                  placeholder="例: 8px, 1rem, 10px 20px"
                  aria-label="gap の値"
                />
              </div>
            </section>

            {/* アイテムリスト */}
            <section className="cfb-section" aria-labelledby="items-title">
              <div className="cfb-section-header">
                <h2 className="cfb-section-title" id="items-title">
                  アイテム ({items.length})
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-secondary cfb-add-btn"
                  onClick={addItem}
                  aria-label="フレックスアイテムを追加"
                >
                  + 追加
                </Button>
              </div>

              <div className="cfb-items-list" role="list" aria-label="アイテム一覧">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`cfb-item-card${selectedItemId === item.id ? " cfb-item-card--selected" : ""}`}
                    role="listitem"
                  >
                    <span
                      className="cfb-item-swatch"
                      style={
                        {
                          "--cfb-item-color": ITEM_COLORS[idx % ITEM_COLORS.length],
                        } as React.CSSProperties
                      }
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      className="cfb-item-name"
                      onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                      aria-expanded={selectedItemId === item.id}
                      aria-label={`${item.label}のプロパティを${selectedItemId === item.id ? "閉じる" : "開く"}`}
                    >
                      {item.label}
                    </button>
                    <button
                      type="button"
                      className="cfb-item-remove"
                      onClick={() => removeItem(item.id, item.label)}
                      aria-label={`${item.label}を削除`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* 選択中アイテムのプロパティ */}
              {selectedItem && (
                <div className="cfb-item-detail" aria-label={`${selectedItem.label}のプロパティ`}>
                  <p className="cfb-item-detail-title">{selectedItem.label} のプロパティ</p>

                  <div className="cfb-prop-row">
                    <label htmlFor={`flex-grow-${selectedItem.id}`} className="cfb-prop-label">
                      <code>flex-grow</code>
                    </label>
                    <div className="cfb-number-row">
                      <input
                        id={`flex-grow-${selectedItem.id}`}
                        type="number"
                        className="cfb-number-input"
                        min="0"
                        step="1"
                        value={selectedItem.flexGrow}
                        onChange={(e) =>
                          updateItem(selectedItem.id, {
                            flexGrow: Math.max(0, Number(e.target.value)),
                          })
                        }
                        aria-label="flex-grow の値"
                      />
                    </div>
                  </div>

                  <div className="cfb-prop-row">
                    <label htmlFor={`flex-shrink-${selectedItem.id}`} className="cfb-prop-label">
                      <code>flex-shrink</code>
                    </label>
                    <div className="cfb-number-row">
                      <input
                        id={`flex-shrink-${selectedItem.id}`}
                        type="number"
                        className="cfb-number-input"
                        min="0"
                        step="1"
                        value={selectedItem.flexShrink}
                        onChange={(e) =>
                          updateItem(selectedItem.id, {
                            flexShrink: Math.max(0, Number(e.target.value)),
                          })
                        }
                        aria-label="flex-shrink の値"
                      />
                    </div>
                  </div>

                  <div className="cfb-prop-row">
                    <label htmlFor={`flex-basis-${selectedItem.id}`} className="cfb-prop-label">
                      <code>flex-basis</code>
                    </label>
                    <input
                      id={`flex-basis-${selectedItem.id}`}
                      type="text"
                      className="cfb-input"
                      value={selectedItem.flexBasis}
                      onChange={(e) =>
                        updateItem(selectedItem.id, {
                          flexBasis: e.target.value,
                        })
                      }
                      placeholder="auto, 100px, 50%, ..."
                      aria-label="flex-basis の値"
                    />
                  </div>

                  <div className="cfb-prop-row">
                    <label htmlFor={`align-self-${selectedItem.id}`} className="cfb-prop-label">
                      <code>align-self</code>
                    </label>
                    <select
                      id={`align-self-${selectedItem.id}`}
                      className="cfb-select"
                      value={selectedItem.alignSelf}
                      onChange={(e) =>
                        updateItem(selectedItem.id, {
                          alignSelf: e.target.value as FlexItemConfig["alignSelf"],
                        })
                      }
                      aria-label="align-self の値"
                    >
                      {ALIGN_SELF_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cfb-prop-row">
                    <label htmlFor={`order-${selectedItem.id}`} className="cfb-prop-label">
                      <code>order</code>
                    </label>
                    <div className="cfb-number-row">
                      <input
                        id={`order-${selectedItem.id}`}
                        type="number"
                        className="cfb-number-input"
                        step="1"
                        value={selectedItem.order}
                        onChange={(e) =>
                          updateItem(selectedItem.id, {
                            order: Number(e.target.value),
                          })
                        }
                        aria-label="order の値"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* リセットボタン */}
            <Button
              type="button"
              variant="outline"
              className="btn-clear"
              onClick={handleReset}
              aria-label="すべての設定をリセット"
            >
              リセット
            </Button>
          </div>

          {/* 右側: プレビュー + CSS出力 */}
          <div className="cfb-right">
            {/* ライブプレビュー */}
            <section className="cfb-preview-section" aria-labelledby="preview-title">
              <h2 className="cfb-section-title" id="preview-title">
                ライブプレビュー
              </h2>
              <div className="cfb-preview-wrapper">
                <div
                  className="cfb-preview-container"
                  style={previewContainerStyle}
                  aria-label="フレックスボックスプレビュー"
                >
                  {items.map((item, idx) => {
                    const itemStyle = getItemStyles(item) as React.CSSProperties;
                    itemStyle.backgroundColor = ITEM_COLORS[idx % ITEM_COLORS.length];
                    return (
                      <div
                        key={item.id}
                        className={`cfb-preview-item${selectedItemId === item.id ? " cfb-preview-item--selected" : ""}`}
                        style={itemStyle}
                        onClick={() =>
                          setSelectedItemId(selectedItemId === item.id ? null : item.id)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedItemId(selectedItemId === item.id ? null : item.id);
                          }
                        }}
                        aria-label={`${item.label}（クリックで選択）`}
                        aria-pressed={selectedItemId === item.id}
                      >
                        {item.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* CSS出力 */}
            <section className="cfb-css-section" aria-labelledby="css-output-title">
              <div className="cfb-css-header">
                <h2 className="cfb-section-title" id="css-output-title">
                  生成 CSS
                </h2>
                <Button
                  type="button"
                  className="btn-primary"
                  onClick={handleCopyCSS}
                  aria-label="生成されたCSSをクリップボードにコピー"
                >
                  コピー
                </Button>
              </div>
              <pre className="cfb-css-output" aria-label="生成されたCSSコード" aria-live="polite">
                {generatedCSS}
              </pre>
            </section>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "左パネルでコンテナプロパティ（flex-direction、justify-content など）を設定",
                "「アイテム」セクションで各アイテムを追加・削除できます",
                "アイテム名をクリックすると、そのアイテム固有のプロパティ（flex-grow、flex-basis など）を設定できます",
                "プレビューでアイテムをクリックして選択・編集も可能です",
                "「生成 CSS」のコピーボタンでCSSコードをクリップボードにコピー",
              ],
            },
            {
              title: "flexbox の主要プロパティ",
              items: [
                "flex-direction: アイテムの並ぶ方向（row / column）",
                "justify-content: 主軸方向の揃え（center、space-between など）",
                "align-items: 交差軸方向の揃え（center、stretch など）",
                "flex-wrap: アイテムの折り返し（nowrap / wrap）",
                "flex-grow / flex-shrink / flex-basis: 個別アイテムのサイズ制御",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
