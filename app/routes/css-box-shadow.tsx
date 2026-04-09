import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type BoxShadowLayer,
  BOX_SHADOW_PRESETS,
  createDefaultLayer,
  generateBoxShadowValue,
  generateFullCSS,
} from "~/utils/css-box-shadow";

export const Route = createFileRoute("/css-box-shadow")({
  head: () => ({
    meta: [
      { title: "CSS Box Shadowジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "CSS box-shadowをビジュアルエディターで作成。複数レイヤー・inset・不透明度・プリセット対応のオンラインツール。",
      },
      {
        property: "og:title",
        content: "CSS Box Shadowジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS box-shadowをビジュアルエディターで作成。複数レイヤー・inset・不透明度・プリセット対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-box-shadow` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Box Shadowジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS box-shadowをビジュアルエディターで作成。複数レイヤー・inset・不透明度・プリセット対応。",
      },
    ],
  }),
  component: CssBoxShadowGenerator,
});

type BgMode = "light" | "dark" | "colored";

const BG_OPTIONS: { id: BgMode; label: string }[] = [
  { id: "light", label: "ライト" },
  { id: "dark", label: "ダーク" },
  { id: "colored", label: "カラー" },
];

/**
 * CSS Box Shadowジェネレーター コンポーネント
 * 複数レイヤーのbox-shadowをビジュアルに設定し、CSSコードを生成する
 */
function CssBoxShadowGenerator() {
  const [layers, setLayers] = useState<BoxShadowLayer[]>([createDefaultLayer(0)]);
  const [selectedId, setSelectedId] = useState<string | null>(() => createDefaultLayer(0).id);
  const [bgMode, setBgMode] = useState<BgMode>("light");

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  /** 生成された CSS */
  const generatedCSS = useMemo(() => generateFullCSS(layers), [layers]);

  /** プレビューの box-shadow 値 */
  const previewShadow = useMemo(() => generateBoxShadowValue(layers), [layers]);

  /** 選択中レイヤー */
  const selectedLayer = layers.find((l) => l.id === selectedId) ?? null;

  /** レイヤーを追加する */
  const addLayer = useCallback(() => {
    const newLayer = createDefaultLayer(layers.length);
    setLayers((prev) => [...prev, newLayer]);
    setSelectedId(newLayer.id);
    announceStatus("レイヤーを追加しました");
  }, [layers.length, announceStatus]);

  /** レイヤーを削除する */
  const removeLayer = useCallback(
    (id: string) => {
      if (layers.length <= 1) {
        showToast("レイヤーは1つ以上必要です", "error");
        return;
      }
      setLayers((prev) => prev.filter((l) => l.id !== id));
      if (selectedId === id) setSelectedId(null);
      announceStatus("レイヤーを削除しました");
    },
    [layers.length, selectedId, announceStatus, showToast],
  );

  /** 選択中レイヤーのプロパティを更新する */
  const updateLayer = useCallback((id: string, updates: Partial<BoxShadowLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  /** プリセットを適用する */
  const applyPreset = useCallback(
    (presetIndex: number) => {
      const preset = BOX_SHADOW_PRESETS[presetIndex];
      if (!preset) return;
      const newLayers = preset.layers.map((l, i) => ({
        ...l,
        id: `preset-${Date.now()}-${i}`,
      }));
      setLayers(newLayers);
      setSelectedId(newLayers[0]?.id ?? null);
      announceStatus(`「${preset.label}」プリセットを適用しました`);
    },
    [announceStatus],
  );

  /** リセットする */
  const handleReset = useCallback(() => {
    const initial = createDefaultLayer(0);
    setLayers([initial]);
    setSelectedId(initial.id);
    announceStatus("設定をリセットしました");
  }, [announceStatus]);

  /** CSS をクリップボードにコピーする */
  const handleCopyCSS = useCallback(async () => {
    const success = await copy(generatedCSS);
    if (success) {
      announceStatus("CSSをクリップボードにコピーしました");
      showToast("CSSをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [copy, generatedCSS, announceStatus, showToast]);

  return (
    <>
      <div className="tool-container">
        <div className="cbs-layout">
          {/* 左側: コントロールパネル */}
          <div className="cbs-controls" aria-label="ボックスシャドウ設定パネル">
            {/* プリセット */}
            <section className="cbs-section" aria-labelledby="cbs-presets-title">
              <h2 className="cbs-section-title" id="cbs-presets-title">
                プリセット
              </h2>
              <div className="cbs-presets">
                {BOX_SHADOW_PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="cbs-preset-btn"
                    onClick={() => applyPreset(i)}
                    aria-label={`「${preset.label}」プリセットを適用`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            {/* レイヤーリスト */}
            <section className="cbs-section" aria-labelledby="cbs-layers-title">
              <div className="cbs-section-header">
                <h2 className="cbs-section-title" id="cbs-layers-title">
                  シャドウレイヤー ({layers.length})
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-secondary"
                  onClick={addLayer}
                  aria-label="シャドウレイヤーを追加"
                >
                  + 追加
                </Button>
              </div>

              <div className="cbs-layers-list" role="list" aria-label="シャドウレイヤー一覧">
                {layers.map((layer, idx) => (
                  <div
                    key={layer.id}
                    className={`cbs-layer-card${selectedId === layer.id ? " cbs-layer-card--selected" : ""}`}
                    role="listitem"
                  >
                    <div className="cbs-layer-header">
                      <span
                        className="cbs-layer-swatch"
                        style={{ backgroundColor: layer.color }}
                        aria-hidden="true"
                      />
                      <button
                        type="button"
                        className="cbs-layer-name"
                        onClick={() => setSelectedId(selectedId === layer.id ? null : layer.id)}
                        aria-expanded={selectedId === layer.id}
                        aria-label={`レイヤー${idx + 1}のプロパティを${selectedId === layer.id ? "閉じる" : "開く"}`}
                      >
                        レイヤー {idx + 1}
                      </button>
                      {layer.inset && <span className="cbs-layer-badge">inset</span>}
                      <button
                        type="button"
                        className="cbs-layer-remove"
                        onClick={() => removeLayer(layer.id)}
                        aria-label={`レイヤー${idx + 1}を削除`}
                      >
                        ×
                      </button>
                    </div>

                    {selectedId === layer.id && selectedLayer && (
                      <div
                        className="cbs-layer-detail"
                        aria-label={`レイヤー${idx + 1}のプロパティ`}
                      >
                        {/* offset-x */}
                        <div className="cbs-prop-row">
                          <label htmlFor={`cbs-ox-${layer.id}`} className="cbs-prop-label">
                            offset-x
                          </label>
                          <div className="cbs-range-row">
                            <input
                              id={`cbs-ox-${layer.id}`}
                              type="range"
                              min="-50"
                              max="50"
                              className="cbs-range"
                              value={selectedLayer.offsetX}
                              onChange={(e) =>
                                updateLayer(layer.id, {
                                  offsetX: Number(e.target.value),
                                })
                              }
                              aria-label="水平オフセット"
                            />
                            <span className="cbs-range-value">{selectedLayer.offsetX}px</span>
                          </div>
                        </div>

                        {/* offset-y */}
                        <div className="cbs-prop-row">
                          <label htmlFor={`cbs-oy-${layer.id}`} className="cbs-prop-label">
                            offset-y
                          </label>
                          <div className="cbs-range-row">
                            <input
                              id={`cbs-oy-${layer.id}`}
                              type="range"
                              min="-50"
                              max="50"
                              className="cbs-range"
                              value={selectedLayer.offsetY}
                              onChange={(e) =>
                                updateLayer(layer.id, {
                                  offsetY: Number(e.target.value),
                                })
                              }
                              aria-label="垂直オフセット"
                            />
                            <span className="cbs-range-value">{selectedLayer.offsetY}px</span>
                          </div>
                        </div>

                        {/* blur */}
                        <div className="cbs-prop-row">
                          <label htmlFor={`cbs-blur-${layer.id}`} className="cbs-prop-label">
                            blur-radius
                          </label>
                          <div className="cbs-range-row">
                            <input
                              id={`cbs-blur-${layer.id}`}
                              type="range"
                              min="0"
                              max="100"
                              className="cbs-range"
                              value={selectedLayer.blur}
                              onChange={(e) =>
                                updateLayer(layer.id, {
                                  blur: Number(e.target.value),
                                })
                              }
                              aria-label="ぼかし半径"
                            />
                            <span className="cbs-range-value">{selectedLayer.blur}px</span>
                          </div>
                        </div>

                        {/* spread */}
                        <div className="cbs-prop-row">
                          <label htmlFor={`cbs-spread-${layer.id}`} className="cbs-prop-label">
                            spread-radius
                          </label>
                          <div className="cbs-range-row">
                            <input
                              id={`cbs-spread-${layer.id}`}
                              type="range"
                              min="-50"
                              max="50"
                              className="cbs-range"
                              value={selectedLayer.spread}
                              onChange={(e) =>
                                updateLayer(layer.id, {
                                  spread: Number(e.target.value),
                                })
                              }
                              aria-label="広がり半径"
                            />
                            <span className="cbs-range-value">{selectedLayer.spread}px</span>
                          </div>
                        </div>

                        {/* color */}
                        <div className="cbs-prop-row">
                          <label htmlFor={`cbs-color-text-${layer.id}`} className="cbs-prop-label">
                            color
                          </label>
                          <div className="cbs-color-row">
                            <input
                              type="color"
                              className="cbs-color-input"
                              value={selectedLayer.color}
                              onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                              aria-label="影の色（カラーピッカー）"
                            />
                            <input
                              id={`cbs-color-text-${layer.id}`}
                              type="text"
                              className="cbs-input cbs-color-text"
                              value={selectedLayer.color}
                              onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                              placeholder="#000000"
                              aria-label="影の色（16進数）"
                            />
                          </div>
                        </div>

                        {/* opacity */}
                        <div className="cbs-prop-row">
                          <label htmlFor={`cbs-opacity-${layer.id}`} className="cbs-prop-label">
                            opacity
                          </label>
                          <div className="cbs-range-row">
                            <input
                              id={`cbs-opacity-${layer.id}`}
                              type="range"
                              min="0"
                              max="100"
                              className="cbs-range"
                              value={selectedLayer.opacity}
                              onChange={(e) =>
                                updateLayer(layer.id, {
                                  opacity: Number(e.target.value),
                                })
                              }
                              aria-label="不透明度"
                            />
                            <span className="cbs-range-value">{selectedLayer.opacity}%</span>
                          </div>
                        </div>

                        {/* inset */}
                        <div className="cbs-inset-row">
                          <input
                            id={`cbs-inset-${layer.id}`}
                            type="checkbox"
                            checked={selectedLayer.inset}
                            onChange={(e) =>
                              updateLayer(layer.id, {
                                inset: e.target.checked,
                              })
                            }
                            aria-label="inset（内側シャドウ）"
                          />
                          <label htmlFor={`cbs-inset-${layer.id}`} className="cbs-inset-label">
                            inset（内側シャドウ）
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="btn-clear"
                onClick={handleReset}
                aria-label="すべての設定をリセット"
              >
                リセット
              </Button>
            </section>
          </div>

          {/* 右側: プレビュー + CSS出力 */}
          <div className="cbs-right">
            {/* ライブプレビュー */}
            <section className="cbs-preview-section" aria-labelledby="cbs-preview-title">
              <h2 className="cbs-section-title" id="cbs-preview-title">
                ライブプレビュー
              </h2>
              <div className={`cbs-preview-bg cbs-preview-bg--${bgMode}`}>
                <div
                  className="cbs-preview-card"
                  style={{ boxShadow: previewShadow }}
                  aria-label="ボックスシャドウのプレビューカード"
                >
                  Preview
                </div>
              </div>
              <div className="cbs-preview-bg-switcher" role="group" aria-label="背景色を選択">
                {BG_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`cbs-bg-option${bgMode === opt.id ? " cbs-bg-option--active" : ""}`}
                    onClick={() => setBgMode(opt.id)}
                    aria-pressed={bgMode === opt.id}
                    aria-label={`背景: ${opt.label}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* CSS出力 */}
            <section className="cbs-css-section" aria-labelledby="cbs-css-output-title">
              <div className="cbs-css-header">
                <h2 className="cbs-section-title" id="cbs-css-output-title">
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
              <pre className="cbs-css-output" aria-label="生成されたCSSコード" aria-live="polite">
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
                "「+ 追加」ボタンで複数のシャドウレイヤーを重ねられます",
                "レイヤー名をクリックするとプロパティパネルが開きます",
                "offset-x/y・blur・spread・color・opacityをスライダーで調整",
                "insetにチェックを入れると内側シャドウに切り替わります",
                "プリセットから素早くよく使うスタイルを適用できます",
                "「生成 CSS」のコピーボタンでCSSをクリップボードにコピー",
              ],
            },
            {
              title: "box-shadow プロパティの構文",
              items: [
                "box-shadow: [inset] offset-x offset-y [blur] [spread] color",
                "offset-x: 水平方向のオフセット（正=右、負=左）",
                "offset-y: 垂直方向のオフセット（正=下、負=上）",
                "blur-radius: ぼかし半径（大きいほどぼんやり）",
                "spread-radius: 影の広がり（正=拡大、負=縮小）",
                "inset: 外側ではなく内側に影を描画",
              ],
            },
            {
              title: "よく使うパターン",
              items: [
                "ソフトシャドウ: 0 4px 16px -2px rgba(0,0,0,0.15)",
                "ハードシャドウ: 4px 4px 0 0 rgba(0,0,0,0.8)",
                "ニューモーフィズム: 複数シャドウで凸凹を表現",
                "グロウ: spread を使って発光効果",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
