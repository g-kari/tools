import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  useStatusAnnouncement,
  StatusAnnouncer,
} from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type GridContainerConfig,
  type GridItemConfig,
  defaultContainerConfig,
  createDefaultItem,
  createDefaultItems,
  generateFullCSS,
  getContainerStyles,
  getItemStyles,
  ITEM_COLORS,
} from "~/utils/css-grid";

export const Route = createFileRoute("/css-grid")({
  head: () => ({
    meta: [
      { title: "CSS Gridジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "CSS Gridのコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。grid-template-columns・align-items・gap などを直感的に試せるオンラインツール。",
      },
      {
        property: "og:title",
        content: "CSS Gridジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS Gridのコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-grid` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Gridジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS Gridのコンテナ・アイテムプロパティをビジュアルで設定し、CSSコードを即座に生成。",
      },
    ],
  }),
  component: CssGridGenerator,
});

const JUSTIFY_ITEMS_OPTIONS: {
  id: GridContainerConfig["justifyItems"];
  label: string;
}[] = [
  { id: "stretch", label: "stretch" },
  { id: "start", label: "start" },
  { id: "end", label: "end" },
  { id: "center", label: "center" },
];

const ALIGN_ITEMS_OPTIONS: {
  id: GridContainerConfig["alignItems"];
  label: string;
}[] = [
  { id: "stretch", label: "stretch" },
  { id: "start", label: "start" },
  { id: "end", label: "end" },
  { id: "center", label: "center" },
];

const JUSTIFY_CONTENT_OPTIONS: {
  id: GridContainerConfig["justifyContent"];
  label: string;
}[] = [
  { id: "start", label: "start" },
  { id: "end", label: "end" },
  { id: "center", label: "center" },
  { id: "stretch", label: "stretch" },
  { id: "space-between", label: "space-between" },
  { id: "space-around", label: "space-around" },
  { id: "space-evenly", label: "space-evenly" },
];

const ALIGN_CONTENT_OPTIONS: {
  id: GridContainerConfig["alignContent"];
  label: string;
}[] = [
  { id: "start", label: "start" },
  { id: "end", label: "end" },
  { id: "center", label: "center" },
  { id: "stretch", label: "stretch" },
  { id: "space-between", label: "space-between" },
  { id: "space-around", label: "space-around" },
  { id: "space-evenly", label: "space-evenly" },
];

const JUSTIFY_SELF_OPTIONS: {
  id: GridItemConfig["justifySelf"];
  label: string;
}[] = [
  { id: "auto", label: "auto" },
  { id: "start", label: "start" },
  { id: "end", label: "end" },
  { id: "center", label: "center" },
  { id: "stretch", label: "stretch" },
];

const ALIGN_SELF_OPTIONS: {
  id: GridItemConfig["alignSelf"];
  label: string;
}[] = [
  { id: "auto", label: "auto" },
  { id: "start", label: "start" },
  { id: "end", label: "end" },
  { id: "center", label: "center" },
  { id: "stretch", label: "stretch" },
];

/**
 * CSS Gridジェネレーター コンポーネント
 * コンテナ・アイテムのプロパティをビジュアルに設定し、CSSコードを生成する
 */
function CssGridGenerator() {
  const [container, setContainer] = useState<GridContainerConfig>(
    defaultContainerConfig
  );
  const [items, setItems] = useState<GridItemConfig[]>(createDefaultItems());
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  /** 生成されたCSS */
  const generatedCSS = useMemo(
    () => generateFullCSS(container, items),
    [container, items]
  );

  /** プレビュー用のコンテナスタイル */
  const previewContainerStyle = useMemo(
    () => getContainerStyles(container) as React.CSSProperties,
    [container]
  );

  /** コンテナプロパティを更新する */
  const updateContainer = useCallback(
    (updates: Partial<GridContainerConfig>) => {
      setContainer((prev) => ({ ...prev, ...updates }));
    },
    []
  );

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
    [items.length, selectedItemId, announceStatus, showToast]
  );

  /** アイテムのプロパティを更新する */
  const updateItem = useCallback(
    (id: string, updates: Partial<GridItemConfig>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

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
        <div className="cg-layout">
          {/* 左側: コントロールパネル */}
          <div className="cg-controls" aria-label="グリッド設定パネル">
            {/* コンテナプロパティ */}
            <section className="cg-section" aria-labelledby="cg-container-props-title">
              <h2 className="cg-section-title" id="cg-container-props-title">
                コンテナプロパティ
              </h2>

              <div className="cg-prop-row">
                <label htmlFor="cg-template-columns" className="cg-prop-label">
                  <code>grid-template-columns</code>
                </label>
                <input
                  id="cg-template-columns"
                  type="text"
                  className="cg-input"
                  value={container.gridTemplateColumns}
                  onChange={(e) =>
                    updateContainer({ gridTemplateColumns: e.target.value })
                  }
                  placeholder="例: repeat(3, 1fr), 1fr 2fr 1fr"
                  aria-label="grid-template-columns の値"
                />
              </div>

              <div className="cg-prop-row">
                <label htmlFor="cg-template-rows" className="cg-prop-label">
                  <code>grid-template-rows</code>
                </label>
                <input
                  id="cg-template-rows"
                  type="text"
                  className="cg-input"
                  value={container.gridTemplateRows}
                  onChange={(e) =>
                    updateContainer({ gridTemplateRows: e.target.value })
                  }
                  placeholder="例: auto, 100px auto 100px"
                  aria-label="grid-template-rows の値"
                />
              </div>

              <div className="cg-prop-row">
                <label htmlFor="cg-gap" className="cg-prop-label">
                  <code>gap</code>
                </label>
                <input
                  id="cg-gap"
                  type="text"
                  className="cg-input"
                  value={container.gap}
                  onChange={(e) => updateContainer({ gap: e.target.value })}
                  placeholder="例: 8px, 1rem, 10px 20px"
                  aria-label="gap の値"
                />
              </div>

              <div className="cg-prop-row">
                <label htmlFor="cg-justify-items" className="cg-prop-label">
                  <code>justify-items</code>
                </label>
                <select
                  id="cg-justify-items"
                  className="cg-select"
                  value={container.justifyItems}
                  onChange={(e) =>
                    updateContainer({
                      justifyItems: e.target.value as GridContainerConfig["justifyItems"],
                    })
                  }
                  aria-label="justify-items の値"
                >
                  {JUSTIFY_ITEMS_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cg-prop-row">
                <label htmlFor="cg-align-items" className="cg-prop-label">
                  <code>align-items</code>
                </label>
                <select
                  id="cg-align-items"
                  className="cg-select"
                  value={container.alignItems}
                  onChange={(e) =>
                    updateContainer({
                      alignItems: e.target.value as GridContainerConfig["alignItems"],
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

              <div className="cg-prop-row">
                <label htmlFor="cg-justify-content" className="cg-prop-label">
                  <code>justify-content</code>
                </label>
                <select
                  id="cg-justify-content"
                  className="cg-select"
                  value={container.justifyContent}
                  onChange={(e) =>
                    updateContainer({
                      justifyContent: e.target.value as GridContainerConfig["justifyContent"],
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

              <div className="cg-prop-row">
                <label htmlFor="cg-align-content" className="cg-prop-label">
                  <code>align-content</code>
                </label>
                <select
                  id="cg-align-content"
                  className="cg-select"
                  value={container.alignContent}
                  onChange={(e) =>
                    updateContainer({
                      alignContent: e.target.value as GridContainerConfig["alignContent"],
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
            </section>

            {/* アイテムリスト */}
            <section className="cg-section" aria-labelledby="cg-items-title">
              <div className="cg-section-header">
                <h2 className="cg-section-title" id="cg-items-title">
                  アイテム ({items.length})
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-secondary cg-add-btn"
                  onClick={addItem}
                  aria-label="グリッドアイテムを追加"
                >
                  + 追加
                </Button>
              </div>

              <div className="cg-items-list" role="list" aria-label="アイテム一覧">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`cg-item-card${selectedItemId === item.id ? " cg-item-card--selected" : ""}`}
                    role="listitem"
                  >
                    <span
                      className="cg-item-swatch"
                      style={
                        {
                          "--cg-item-color":
                            ITEM_COLORS[idx % ITEM_COLORS.length],
                        } as React.CSSProperties
                      }
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      className="cg-item-name"
                      onClick={() =>
                        setSelectedItemId(
                          selectedItemId === item.id ? null : item.id
                        )
                      }
                      aria-expanded={selectedItemId === item.id}
                      aria-label={`${item.label}のプロパティを${selectedItemId === item.id ? "閉じる" : "開く"}`}
                    >
                      {item.label}
                    </button>
                    <button
                      type="button"
                      className="cg-item-remove"
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
                <div className="cg-item-detail" aria-label={`${selectedItem.label}のプロパティ`}>
                  <p className="cg-item-detail-title">
                    {selectedItem.label} のプロパティ
                  </p>

                  <div className="cg-prop-row">
                    <label
                      htmlFor={`cg-grid-column-${selectedItem.id}`}
                      className="cg-prop-label"
                    >
                      <code>grid-column</code>
                    </label>
                    <input
                      id={`cg-grid-column-${selectedItem.id}`}
                      type="text"
                      className="cg-input"
                      value={selectedItem.gridColumn}
                      onChange={(e) =>
                        updateItem(selectedItem.id, {
                          gridColumn: e.target.value,
                        })
                      }
                      placeholder="auto, 1 / 3, span 2, ..."
                      aria-label="grid-column の値"
                    />
                  </div>

                  <div className="cg-prop-row">
                    <label
                      htmlFor={`cg-grid-row-${selectedItem.id}`}
                      className="cg-prop-label"
                    >
                      <code>grid-row</code>
                    </label>
                    <input
                      id={`cg-grid-row-${selectedItem.id}`}
                      type="text"
                      className="cg-input"
                      value={selectedItem.gridRow}
                      onChange={(e) =>
                        updateItem(selectedItem.id, {
                          gridRow: e.target.value,
                        })
                      }
                      placeholder="auto, 1 / 3, span 2, ..."
                      aria-label="grid-row の値"
                    />
                  </div>

                  <div className="cg-prop-row">
                    <label
                      htmlFor={`cg-justify-self-${selectedItem.id}`}
                      className="cg-prop-label"
                    >
                      <code>justify-self</code>
                    </label>
                    <select
                      id={`cg-justify-self-${selectedItem.id}`}
                      className="cg-select"
                      value={selectedItem.justifySelf}
                      onChange={(e) =>
                        updateItem(selectedItem.id, {
                          justifySelf: e.target.value as GridItemConfig["justifySelf"],
                        })
                      }
                      aria-label="justify-self の値"
                    >
                      {JUSTIFY_SELF_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cg-prop-row">
                    <label
                      htmlFor={`cg-align-self-${selectedItem.id}`}
                      className="cg-prop-label"
                    >
                      <code>align-self</code>
                    </label>
                    <select
                      id={`cg-align-self-${selectedItem.id}`}
                      className="cg-select"
                      value={selectedItem.alignSelf}
                      onChange={(e) =>
                        updateItem(selectedItem.id, {
                          alignSelf: e.target.value as GridItemConfig["alignSelf"],
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
          <div className="cg-right">
            {/* ライブプレビュー */}
            <section
              className="cg-preview-section"
              aria-labelledby="cg-preview-title"
            >
              <h2 className="cg-section-title" id="cg-preview-title">
                ライブプレビュー
              </h2>
              <div className="cg-preview-wrapper">
                <div
                  className="cg-preview-container"
                  style={previewContainerStyle}
                  aria-label="CSS Gridプレビュー"
                >
                  {items.map((item, idx) => {
                    const itemStyle = getItemStyles(item) as React.CSSProperties;
                    const bgColor = ITEM_COLORS[idx % ITEM_COLORS.length];
                    return (
                      <div
                        key={item.id}
                        className={`cg-preview-item${selectedItemId === item.id ? " cg-preview-item--selected" : ""}`}
                        style={{ ...itemStyle, backgroundColor: bgColor }}
                        onClick={() =>
                          setSelectedItemId(
                            selectedItemId === item.id ? null : item.id
                          )
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedItemId(
                              selectedItemId === item.id ? null : item.id
                            );
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
            <section
              className="cg-css-section"
              aria-labelledby="cg-css-output-title"
            >
              <div className="cg-css-header">
                <h2 className="cg-section-title" id="cg-css-output-title">
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
              <pre className="cg-css-output" aria-label="生成されたCSSコード" aria-live="polite">
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
                "左パネルでコンテナプロパティ（grid-template-columns、gap など）を設定",
                "「アイテム」セクションで各アイテムを追加・削除できます",
                "アイテム名をクリックすると、そのアイテム固有のプロパティ（grid-column、grid-row など）を設定できます",
                "プレビューでアイテムをクリックして選択・編集も可能です",
                "「生成 CSS」のコピーボタンでCSSコードをクリップボードにコピー",
              ],
            },
            {
              title: "CSS Grid の主要プロパティ",
              items: [
                "grid-template-columns: 列の定義（例: repeat(3, 1fr)、1fr 2fr 1fr）",
                "grid-template-rows: 行の定義（例: auto、100px auto 100px）",
                "gap: グリッドの溝（例: 8px、1rem 2rem）",
                "justify-items / align-items: 全アイテムのデフォルト揃え",
                "grid-column / grid-row: アイテムの占有範囲（例: 1 / 3、span 2）",
              ],
            },
            {
              title: "よく使うパターン",
              items: [
                "3カラム等幅: repeat(3, 1fr)",
                "サイドバー付き: 250px 1fr",
                "Holy Grail: 200px 1fr 200px（3列）",
                "カードグリッド: repeat(auto-fill, minmax(200px, 1fr))",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
