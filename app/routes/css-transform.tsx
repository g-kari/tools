import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  type TransformState,
  TRANSFORM_PRESETS,
  createDefaultState,
  generateTransformValue,
  generateFullCSS,
} from "~/utils/css-transform";

export const Route = createFileRoute("/css-transform")({
  head: () => ({
    meta: [
      { title: "CSS Transformジェネレーター | Web ツール集" },
      {
        name: "description",
        content:
          "CSS transformプロパティをビジュアルエディターで作成。translate・rotate・scale・skew・perspectiveをスライダーで調整してCSSコードを即座に生成。",
      },
      {
        property: "og:title",
        content: "CSS Transformジェネレーター | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS transformプロパティをビジュアルエディターで作成。translate・rotate・scale・skew・perspectiveをスライダーで調整。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/css-transform` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS Transformジェネレーター | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS transformプロパティをビジュアルエディターで作成。translate・rotate・scale・skew・perspectiveをスライダーで調整。",
      },
    ],
  }),
  component: CssTransformGenerator,
});

/** スライダー定義 */
interface SliderDef {
  key: keyof TransformState;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
}

/** スライダーグループ定義 */
interface SliderGroup {
  title: string;
  id: string;
  sliders: SliderDef[];
}

const SLIDER_GROUPS: SliderGroup[] = [
  {
    title: "移動 (translate)",
    id: "ct-translate",
    sliders: [
      { key: "translateX", label: "X", min: -300, max: 300, step: 1, defaultValue: 0, unit: "px" },
      { key: "translateY", label: "Y", min: -300, max: 300, step: 1, defaultValue: 0, unit: "px" },
      { key: "translateZ", label: "Z", min: -300, max: 300, step: 1, defaultValue: 0, unit: "px" },
    ],
  },
  {
    title: "回転 (rotate)",
    id: "ct-rotate",
    sliders: [
      { key: "rotateX", label: "X", min: -180, max: 180, step: 1, defaultValue: 0, unit: "deg" },
      { key: "rotateY", label: "Y", min: -180, max: 180, step: 1, defaultValue: 0, unit: "deg" },
      { key: "rotateZ", label: "Z", min: -180, max: 180, step: 1, defaultValue: 0, unit: "deg" },
    ],
  },
  {
    title: "拡縮 (scale)",
    id: "ct-scale",
    sliders: [
      { key: "scaleX", label: "X", min: 0, max: 3, step: 0.01, defaultValue: 1, unit: "" },
      { key: "scaleY", label: "Y", min: 0, max: 3, step: 0.01, defaultValue: 1, unit: "" },
    ],
  },
  {
    title: "傾斜 (skew)",
    id: "ct-skew",
    sliders: [
      { key: "skewX", label: "X", min: -60, max: 60, step: 1, defaultValue: 0, unit: "deg" },
      { key: "skewY", label: "Y", min: -60, max: 60, step: 1, defaultValue: 0, unit: "deg" },
    ],
  },
  {
    title: "遠近法 (perspective)",
    id: "ct-perspective",
    sliders: [
      {
        key: "perspective",
        label: "距離",
        min: 0,
        max: 2000,
        step: 10,
        defaultValue: 0,
        unit: "px",
      },
    ],
  },
];

/**
 * CSS Transform ジェネレーター コンポーネント
 * translate・rotate・scale・skew・perspective をビジュアルで設定し、CSS コードを生成する
 */
function CssTransformGenerator() {
  const [state, setState] = useState<TransformState>(createDefaultState);

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  /** 生成された CSS transform 値 */
  const transformValue = useMemo(() => generateTransformValue(state), [state]);

  /** 生成された CSS コード全体 */
  const generatedCSS = useMemo(() => generateFullCSS(state), [state]);

  /** スライダー値を更新する */
  const updateValue = useCallback((key: keyof TransformState, value: number) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** プリセットを適用する */
  const applyPreset = useCallback(
    (index: number) => {
      const preset = TRANSFORM_PRESETS[index];
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

  /** perspective コンテナのスタイル */
  const perspectiveStyle = useMemo(
    () => (state.perspective > 0 ? { perspective: `${state.perspective}px` } : {}),
    [state.perspective],
  );

  return (
    <>
      <div className="tool-container">
        <div className="ct-layout">
          {/* 左側: コントロールパネル */}
          <div className="ct-controls" aria-label="transform 設定パネル">
            {/* プリセット */}
            <section className="ct-section" aria-labelledby="ct-presets-title">
              <h2 className="ct-section-title" id="ct-presets-title">
                プリセット
              </h2>
              <div className="ct-presets">
                {TRANSFORM_PRESETS.map((preset, i) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="ct-preset-btn"
                    onClick={() => applyPreset(i)}
                    aria-label={`「${preset.label}」プリセットを適用`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </section>

            {/* スライダーグループ */}
            {SLIDER_GROUPS.map((group) => (
              <section key={group.id} className="ct-section" aria-labelledby={`${group.id}-title`}>
                <div className="ct-section-header">
                  <h2 className="ct-section-title" id={`${group.id}-title`}>
                    {group.title}
                  </h2>
                </div>
                <div className="ct-sliders">
                  {group.sliders.map((def) => {
                    const value = state[def.key] as number;
                    const displayValue = def.step < 1 ? value.toFixed(2) : String(value);
                    return (
                      <div key={def.key} className="ct-slider-row">
                        <span className="ct-slider-label">{def.label}</span>
                        <input
                          type="range"
                          min={def.min}
                          max={def.max}
                          step={def.step}
                          value={value}
                          className="ct-range"
                          onChange={(e) => updateValue(def.key, Number(e.target.value))}
                          aria-label={`${group.title} ${def.label}の値`}
                        />
                        <input
                          type="number"
                          min={def.min}
                          max={def.max}
                          step={def.step}
                          value={value}
                          className="ct-number-input"
                          onChange={(e) => {
                            const v = Math.max(def.min, Math.min(def.max, Number(e.target.value)));
                            updateValue(def.key, v);
                          }}
                          aria-label={`${group.title} ${def.label}の数値入力`}
                        />
                        <span className="ct-range-value" aria-hidden="true">
                          {displayValue}
                          {def.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* リセット */}
            <Button
              type="button"
              variant="outline"
              className="btn-clear ct-reset-btn"
              onClick={handleReset}
              aria-label="すべての設定をリセット"
            >
              リセット
            </Button>
          </div>

          {/* 右側: プレビュー + CSS 出力 */}
          <div className="ct-right">
            {/* ライブプレビュー */}
            <section className="ct-preview-section" aria-labelledby="ct-preview-title">
              <h2 className="ct-section-title" id="ct-preview-title">
                ライブプレビュー
              </h2>
              <div className="ct-preview-canvas">
                <div className="ct-preview-scene" style={perspectiveStyle}>
                  <div
                    className="ct-preview-box"
                    style={{ transform: transformValue }}
                    aria-label="transformのプレビュー"
                  >
                    <span className="ct-preview-box-label">CSS Transform</span>
                  </div>
                </div>
              </div>
              {state.perspective > 0 && (
                <p className="ct-perspective-note">
                  perspective: {state.perspective}px（親要素に適用）
                </p>
              )}
            </section>

            {/* CSS 出力 */}
            <section className="ct-css-section" aria-labelledby="ct-css-output-title">
              <div className="ct-css-header">
                <h2 className="ct-section-title" id="ct-css-output-title">
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
              <pre className="ct-css-output" aria-label="生成されたCSSコード" aria-live="polite">
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
                "プリセットから素早くよく使う変形を適用できます",
                "スライダーまたは数値入力で各パラメーターを細かく調整",
                "3D回転（X/Y軸）を使う場合は「遠近法 (perspective)」を設定すると立体感が出ます",
                "「生成 CSS」のコピーボタンでCSSをクリップボードにコピー",
              ],
            },
            {
              title: "transform 関数の説明",
              items: [
                "translate(X/Y/Z): 要素を指定した距離だけ移動",
                "rotate(X/Y/Z): 各軸を中心に要素を回転",
                "scale(X/Y): 要素を拡大・縮小（1.0が等倍）",
                "skew(X/Y): 要素を指定した角度だけ傾斜",
                "perspective: 3D変形の遠近感の強さ（小さいほど強い遠近感）",
              ],
            },
            {
              title: "よく使うパターン",
              items: [
                "中心回転: rotateZ で要素を好きな角度に回転",
                "ホバーエフェクト: scale(1.05) で軽い拡大アニメーション",
                "カード反転: rotateY(180deg) + perspective で3Dフリップ",
                "スライドイン: translateX(-100px) → 0px のアニメーション",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
