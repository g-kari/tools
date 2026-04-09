import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type TextShadowLayer,
  TEXT_SHADOW_PRESETS,
  createDefaultLayer,
  generateTextShadowValue,
  generateFullCSS,
} from "~/utils/css-text-shadow";

export const Route = createFileRoute("/css-text-shadow")({
  head: () => ({
    meta: [
      { title: "CSS Text Shadowジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "CSS text-shadowをビジュアルエディターで作成。複数レイヤー・不透明度・プリセット対応のオンラインツール。ネオン・エンボス・アウトラインなど様々な効果を試せます。",
      },
      {
        property: "og:title",
        content: "CSS Text Shadowジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS text-shadowをビジュアルエディターで作成。複数レイヤー・不透明度・プリセット対応。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-text-shadow` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Text Shadowジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS text-shadowをビジュアルエディターで作成。複数レイヤー・不透明度・プリセット対応。",
      },
    ],
  }),
  component: CssTextShadowGenerator,
});

type BgMode = "light" | "dark" | "colored";

const BG_OPTIONS: { id: BgMode; label: string }[] = [
  { id: "light", label: "ライト" },
  { id: "dark", label: "ダーク" },
  { id: "colored", label: "カラー" },
];

/**
 * CSS Text Shadowジェネレーター コンポーネント
 * 複数レイヤーのtext-shadowをビジュアルに設定し、CSSコードを生成する
 */
function CssTextShadowGenerator() {
  const [layers, setLayers] = useState<TextShadowLayer[]>([createDefaultLayer(0)]);
  const [selectedId, setSelectedId] = useState<string | null>(() => createDefaultLayer(0).id);
  const [bgMode, setBgMode] = useState<BgMode>("dark");

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  /** 生成された CSS */
  const generatedCSS = useMemo(() => generateFullCSS(layers), [layers]);

  /** プレビューの text-shadow 値 */
  const previewShadow = useMemo(() => generateTextShadowValue(layers), [layers]);

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
  const updateLayer = useCallback((id: string, updates: Partial<TextShadowLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  /** プリセットを適用する */
  const applyPreset = useCallback(
    (presetIndex: number) => {
      const preset = TEXT_SHADOW_PRESETS[presetIndex];
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
        <div className="cts-layout">
          {/* 左側: コントロールパネル */}
          <div className="cts-controls" aria-label="テキストシャドウ設定パネル">
            {/* プリセット */}
            <section className="cts-section" aria-labelledby="cts-presets-title">
              <h2 className="cts-section-title" id="cts-presets-title">
                プリセット
              </h2>
              <div className="cts-presets">
                {TEXT_SHADOW_PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="cts-preset-btn"
                    onClick={() => applyPreset(i)}
                    aria-label={`「${preset.label}」プリセットを適用`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            {/* レイヤーリスト */}
            <section className="cts-section" aria-labelledby="cts-layers-title">
              <div className="cts-section-header">
                <h2 className="cts-section-title" id="cts-layers-title">
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

              <div className="cts-layers-list" role="list" aria-label="シャドウレイヤー一覧">
                {layers.map((layer, idx) => (
                  <div
                    key={layer.id}
                    className={`cts-layer-card${selectedId === layer.id ? " cts-layer-card--selected" : ""}`}
                    role="listitem"
                  >
                    <div className="cts-layer-header">
                      <span
                        className="cts-layer-swatch"
                        style={{ backgroundColor: layer.color }}
                        aria-hidden="true"
                      />
                      <button
                        type="button"
                        className="cts-layer-name"
                        onClick={() => setSelectedId(selectedId === layer.id ? null : layer.id)}
                        aria-expanded={selectedId === layer.id}
                        aria-label={`レイヤー${idx + 1}のプロパティを${selectedId === layer.id ? "閉じる" : "開く"}`}
                      >
                        レイヤー {idx + 1}
                      </button>
                      <button
                        type="button"
                        className="cts-layer-remove"
                        onClick={() => removeLayer(layer.id)}
                        aria-label={`レイヤー${idx + 1}を削除`}
                      >
                        ×
                      </button>
                    </div>

                    {selectedId === layer.id && selectedLayer && (
                      <div
                        className="cts-layer-detail"
                        aria-label={`レイヤー${idx + 1}のプロパティ`}
                      >
                        {/* offset-x */}
                        <div className="cts-prop-row">
                          <label htmlFor={`cts-ox-${layer.id}`} className="cts-prop-label">
                            offset-x
                          </label>
                          <div className="cts-range-row">
                            <input
                              id={`cts-ox-${layer.id}`}
                              type="range"
                              min="-50"
                              max="50"
                              className="cts-range"
                              value={selectedLayer.offsetX}
                              onChange={(e) =>
                                updateLayer(layer.id, {
                                  offsetX: Number(e.target.value),
                                })
                              }
                              aria-label="水平オフセット"
                            />
                            <span className="cts-range-value">{selectedLayer.offsetX}px</span>
                          </div>
                        </div>

                        {/* offset-y */}
                        <div className="cts-prop-row">
                          <label htmlFor={`cts-oy-${layer.id}`} className="cts-prop-label">
                            offset-y
                          </label>
                          <div className="cts-range-row">
                            <input
                              id={`cts-oy-${layer.id}`}
                              type="range"
                              min="-50"
                              max="50"
                              className="cts-range"
                              value={selectedLayer.offsetY}
                              onChange={(e) =>
                                updateLayer(layer.id, {
                                  offsetY: Number(e.target.value),
                                })
                              }
                              aria-label="垂直オフセット"
                            />
                            <span className="cts-range-value">{selectedLayer.offsetY}px</span>
                          </div>
                        </div>

                        {/* blur */}
                        <div className="cts-prop-row">
                          <label htmlFor={`cts-blur-${layer.id}`} className="cts-prop-label">
                            blur-radius
                          </label>
                          <div className="cts-range-row">
                            <input
                              id={`cts-blur-${layer.id}`}
                              type="range"
                              min="0"
                              max="100"
                              className="cts-range"
                              value={selectedLayer.blur}
                              onChange={(e) =>
                                updateLayer(layer.id, {
                                  blur: Number(e.target.value),
                                })
                              }
                              aria-label="ぼかし半径"
                            />
                            <span className="cts-range-value">{selectedLayer.blur}px</span>
                          </div>
                        </div>

                        {/* color */}
                        <div className="cts-prop-row">
                          <label htmlFor={`cts-color-text-${layer.id}`} className="cts-prop-label">
                            color
                          </label>
                          <div className="cts-color-row">
                            <input
                              type="color"
                              className="cts-color-input"
                              value={selectedLayer.color}
                              onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                              aria-label="影の色（カラーピッカー）"
                            />
                            <input
                              id={`cts-color-text-${layer.id}`}
                              type="text"
                              className="cts-input cts-color-text"
                              value={selectedLayer.color}
                              onChange={(e) => updateLayer(layer.id, { color: e.target.value })}
                              placeholder="#000000"
                              aria-label="影の色（16進数）"
                            />
                          </div>
                        </div>

                        {/* opacity */}
                        <div className="cts-prop-row">
                          <label htmlFor={`cts-opacity-${layer.id}`} className="cts-prop-label">
                            opacity
                          </label>
                          <div className="cts-range-row">
                            <input
                              id={`cts-opacity-${layer.id}`}
                              type="range"
                              min="0"
                              max="100"
                              className="cts-range"
                              value={selectedLayer.opacity}
                              onChange={(e) =>
                                updateLayer(layer.id, {
                                  opacity: Number(e.target.value),
                                })
                              }
                              aria-label="不透明度"
                            />
                            <span className="cts-range-value">{selectedLayer.opacity}%</span>
                          </div>
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
          <div className="cts-right">
            {/* ライブプレビュー */}
            <section className="cts-preview-section" aria-labelledby="cts-preview-title">
              <h2 className="cts-section-title" id="cts-preview-title">
                ライブプレビュー
              </h2>
              <div className={`cts-preview-bg cts-preview-bg--${bgMode}`}>
                <p
                  className="cts-preview-text"
                  style={{ textShadow: previewShadow }}
                  aria-label="テキストシャドウのプレビュー"
                >
                  Text Shadow
                </p>
              </div>
              <div className="cts-preview-bg-switcher" role="group" aria-label="背景色を選択">
                {BG_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`cts-bg-option${bgMode === opt.id ? " cts-bg-option--active" : ""}`}
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
            <section className="cts-css-section" aria-labelledby="cts-css-output-title">
              <div className="cts-css-header">
                <h2 className="cts-section-title" id="cts-css-output-title">
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
              <pre className="cts-css-output" aria-label="生成されたCSSコード" aria-live="polite">
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
                "offset-x/y・blur・color・opacityをスライダーで調整",
                "プリセットから素早くよく使うスタイルを適用できます",
                "「生成 CSS」のコピーボタンでCSSをクリップボードにコピー",
              ],
            },
            {
              title: "text-shadow プロパティの構文",
              items: [
                "text-shadow: offset-x offset-y [blur-radius] color",
                "offset-x: 水平方向のオフセット（正=右、負=左）",
                "offset-y: 垂直方向のオフセット（正=下、負=上）",
                "blur-radius: ぼかし半径（省略可、大きいほどぼんやり）",
                "複数シャドウはカンマ区切りで重ねられます",
              ],
            },
            {
              title: "よく使うパターン",
              items: [
                "シンプルシャドウ: 1px 1px 2px rgba(0,0,0,0.5)",
                "ネオン効果: 0 0 10px と 0 0 20px で光の広がりを表現",
                "エンボス: 明るい影と暗い影を組み合わせて立体感を演出",
                "アウトライン: 4方向にオフセットを付けて文字縁取り",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
