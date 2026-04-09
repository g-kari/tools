import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type FilterState,
  FILTER_PRESETS,
  createDefaultState,
  generateFilterValue,
  generateFullCSS,
} from "~/utils/css-filter";

export const Route = createFileRoute("/css-filter")({
  head: () => ({
    meta: [
      { title: "CSS Filterジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "CSS filterプロパティをビジュアルエディターで作成。blur・brightness・contrast・grayscale・hue-rotate・invert・saturate・sepiaをスライダーで調整し、CSSコードを即座に生成。",
      },
      {
        property: "og:title",
        content: "CSS Filterジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS filterをビジュアルエディターで作成。blur・brightness・contrast・grayscale・hue-rotate・invert・saturate・sepia対応。プリセットも豊富。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-filter` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Filterジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS filterをビジュアルエディターで作成。blur・brightness・contrast・grayscale・hue-rotate・invert・saturate・sepia対応。",
      },
    ],
  }),
  component: CssFilterGenerator,
});

type BgMode = "light" | "dark" | "colored";

const BG_OPTIONS: { id: BgMode; label: string }[] = [
  { id: "light", label: "ライト" },
  { id: "dark", label: "ダーク" },
  { id: "colored", label: "カラー" },
];

/** スライダーの定義 */
interface SliderDef {
  key: keyof FilterState;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SLIDER_DEFS: SliderDef[] = [
  { key: "blur", label: "Blur", min: 0, max: 20, step: 0.5, unit: "px" },
  {
    key: "brightness",
    label: "Brightness",
    min: 0,
    max: 200,
    step: 1,
    unit: "%",
  },
  {
    key: "contrast",
    label: "Contrast",
    min: 0,
    max: 200,
    step: 1,
    unit: "%",
  },
  {
    key: "grayscale",
    label: "Grayscale",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
  },
  {
    key: "hueRotate",
    label: "Hue Rotate",
    min: 0,
    max: 360,
    step: 1,
    unit: "deg",
  },
  { key: "invert", label: "Invert", min: 0, max: 100, step: 1, unit: "%" },
  { key: "opacity", label: "Opacity", min: 0, max: 100, step: 1, unit: "%" },
  {
    key: "saturate",
    label: "Saturate",
    min: 0,
    max: 300,
    step: 1,
    unit: "%",
  },
  { key: "sepia", label: "Sepia", min: 0, max: 100, step: 1, unit: "%" },
];

/**
 * CSS Filter ジェネレーター コンポーネント
 * blur/brightness/contrast/grayscale/hue-rotate/invert/opacity/saturate/sepiaを
 * スライダーで視覚的に設定し、CSS filterコードを生成する
 */
function CssFilterGenerator() {
  const [state, setState] = useState<FilterState>(createDefaultState);
  const [bgMode, setBgMode] = useState<BgMode>("light");

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  /** 生成された CSS filter 値 */
  const filterValue = useMemo(() => generateFilterValue(state), [state]);

  /** 生成された CSS コード全体 */
  const generatedCSS = useMemo(() => generateFullCSS(state), [state]);

  /** スライダー値を更新する */
  const updateValue = useCallback((key: keyof FilterState, value: number) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** プリセットを適用する */
  const applyPreset = useCallback(
    (index: number) => {
      const preset = FILTER_PRESETS[index];
      if (!preset) return;
      setState(preset.state);
      announceStatus(`「${preset.label}」プリセットを適用しました`);
    },
    [announceStatus],
  );

  /** リセットする */
  const handleReset = useCallback(() => {
    setState(createDefaultState());
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
        <div className="cfl-layout">
          {/* 左側: コントロールパネル */}
          <div className="cfl-controls" aria-label="フィルター設定パネル">
            {/* プリセット */}
            <section className="cfl-section" aria-labelledby="cfl-presets-title">
              <h2 className="cfl-section-title" id="cfl-presets-title">
                プリセット
              </h2>
              <div className="cfl-presets">
                {FILTER_PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="cfl-preset-btn"
                    onClick={() => applyPreset(i)}
                    aria-label={`「${preset.label}」プリセットを適用`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            {/* スライダー設定 */}
            <section className="cfl-section" aria-labelledby="cfl-sliders-title">
              <h2 className="cfl-section-title" id="cfl-sliders-title">
                フィルター設定
              </h2>
              <div className="cfl-sliders">
                {SLIDER_DEFS.map((def) => {
                  const value = state[def.key];
                  return (
                    <div key={def.key} className="cfl-slider-item">
                      <div className="cfl-slider-header">
                        <label htmlFor={`cfl-slider-${def.key}`} className="cfl-slider-label">
                          {def.label}
                        </label>
                        <span className="cfl-slider-value">
                          {value}
                          {def.unit}
                        </span>
                      </div>
                      <div className="cfl-slider-row">
                        <input
                          id={`cfl-slider-${def.key}`}
                          type="range"
                          className="cfl-range"
                          min={def.min}
                          max={def.max}
                          step={def.step}
                          value={value}
                          aria-label={`${def.label} ${value}${def.unit}`}
                          onChange={(e) => updateValue(def.key, Number(e.target.value))}
                        />
                        <input
                          type="number"
                          className="cfl-number-input"
                          min={def.min}
                          max={def.max}
                          step={def.step}
                          value={value}
                          aria-label={`${def.label}の数値入力`}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!isNaN(v) && v >= def.min && v <= def.max) {
                              updateValue(def.key, v);
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* アクションボタン */}
            <div className="cfl-actions">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                aria-label="すべての設定をリセット"
              >
                リセット
              </Button>
            </div>
          </div>

          {/* 右側: プレビュー + 出力 */}
          <div className="cfl-right">
            {/* ライブプレビュー */}
            <section className="cfl-preview-section" aria-labelledby="cfl-preview-title">
              <div className="cfl-preview-header">
                <h2 className="cfl-preview-section-title" id="cfl-preview-title">
                  プレビュー
                </h2>
                {/* 背景切替 */}
                <div className="cfl-bg-toggle" role="group" aria-label="背景色選択">
                  {BG_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`cfl-bg-btn${bgMode === opt.id ? " cfl-bg-btn--active" : ""}`}
                      onClick={() => setBgMode(opt.id)}
                      aria-pressed={bgMode === opt.id}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={`cfl-preview-canvas cfl-preview-canvas--${bgMode}`}
                aria-label="フィルタープレビュー"
              >
                {/* 元画像（フィルターなし） */}
                <div className="cfl-preview-pair">
                  <div className="cfl-sample-img" aria-hidden="true">
                    🏞️
                  </div>
                  <span className="cfl-preview-label">元画像</span>
                </div>

                {/* フィルター適用後 */}
                <div className="cfl-preview-pair">
                  <div
                    className="cfl-sample-img cfl-preview-image--filtered"
                    style={{ filter: filterValue }}
                    aria-label={`filter: ${filterValue} 適用後のプレビュー`}
                    aria-hidden="true"
                  >
                    🏞️
                  </div>
                  <span className="cfl-preview-label">フィルター後</span>
                </div>
              </div>
            </section>

            {/* CSS 出力 */}
            <section className="cfl-css-section" aria-labelledby="cfl-css-title">
              <div className="cfl-css-header">
                <h2 className="cfl-section-title" id="cfl-css-title">
                  生成 CSS
                </h2>
                <Button size="sm" onClick={handleCopyCSS} aria-label="CSSをクリップボードにコピー">
                  コピー
                </Button>
              </div>
              <pre className="cfl-css-output" aria-label="生成されたCSSコード" aria-live="polite">
                {generatedCSS}
              </pre>
            </section>

            {/* Tips */}
            <TipsCard
              sections={[
                {
                  title: "使い方",
                  items: [
                    "プリセットから素早くフィルター効果を適用できます",
                    "スライダーまたは数値入力で各フィルターを細かく調整できます",
                    "「元画像」と「フィルター後」を並べてリアルタイムで比較確認できます",
                    "背景色を切り替えることでさまざまな背景での見え方を確認できます",
                    "「コピー」ボタンで生成CSSをクリップボードにコピーできます",
                  ],
                },
                {
                  title: "CSS filterとは",
                  items: [
                    "blur: 画像にガウスぼかしを適用します（単位: px）",
                    "brightness: 明るさを調整します（100%が元の明るさ）",
                    "contrast: コントラストを調整します（100%が元のコントラスト）",
                    "grayscale: グレースケール化の度合いを設定します（100%で完全なモノクロ）",
                    "hue-rotate: 色相を回転させます（0〜360deg）",
                    "invert: 色を反転させます（100%で完全反転）",
                    "opacity: 不透明度を調整します（100%で完全不透明）",
                    "saturate: 彩度を調整します（100%が元の彩度、0%でグレー）",
                    "sepia: セピア調の度合いを設定します（100%で完全なセピア）",
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
