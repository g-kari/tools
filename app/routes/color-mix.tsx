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

export const Route = createFileRoute("/color-mix")({
  head: () => ({
    meta: [
      { title: "CSS color-mix() プレイグラウンド | Web ツール集" },
      {
        name: "description",
        content:
          "CSS color-mix() 関数をインタラクティブに試せるツール。2色を選んで色空間・割合を調整し、混合結果をリアルタイムプレビュー。CSS コードを即座に生成。",
      },
      {
        property: "og:title",
        content: "CSS color-mix() プレイグラウンド | Web ツール集",
      },
      {
        property: "og:description",
        content:
          "CSS color-mix() 関数をインタラクティブに試せるツール。2色を選んで色空間・割合を調整し、混合結果をリアルタイムプレビュー。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/color-mix` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "CSS color-mix() プレイグラウンド | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "CSS color-mix() 関数をインタラクティブに試せるツール。2色を選んで色空間・割合を調整し、混合結果をリアルタイムプレビュー。",
      },
    ],
  }),
  component: ColorMixTool,
});

/** サポートされる色空間の定義 */
export const COLOR_SPACES = [
  {
    value: "srgb",
    label: "sRGB",
    description: "標準的なRGB色空間（最も広くサポート）",
  },
  {
    value: "srgb-linear",
    label: "sRGB Linear",
    description: "リニアsRGB（ガンマ補正なし）",
  },
  {
    value: "display-p3",
    label: "Display P3",
    description: "広色域ディスプレイ向け",
  },
  {
    value: "oklch",
    label: "OKLCH",
    description: "知覚的に均一な色空間（推奨）",
  },
  {
    value: "oklab",
    label: "OKLAB",
    description: "知覚的に均一な色空間（Lab系）",
  },
  { value: "hsl", label: "HSL", description: "色相・彩度・輝度" },
  { value: "hwb", label: "HWB", description: "色相・白・黒" },
  { value: "lab", label: "CIELAB", description: "CIELAB色空間" },
  { value: "lch", label: "CIELCH", description: "CIELCH色空間（円柱座標）" },
] as const;

export type ColorSpaceValue = (typeof COLOR_SPACES)[number]["value"];

/**
 * color-mix() CSS値を生成する
 * @param colorSpace 色空間
 * @param color1 色1 (CSS color値)
 * @param percentage1 色1の割合 (0-100)
 * @param color2 色2 (CSS color値)
 * @returns CSS color-mix() 文字列
 */
export function buildColorMixCss(
  colorSpace: string,
  color1: string,
  percentage1: number,
  color2: string
): string {
  const p2 = 100 - percentage1;
  return `color-mix(in ${colorSpace}, ${color1} ${percentage1}%, ${color2} ${p2}%)`;
}

/**
 * HEXカラーを RGB オブジェクトに変換する
 * @param hex HEXカラー文字列（#rrggbb）
 * @returns RGBオブジェクト、失敗時はnull
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * RGB値をsRGB色空間で線形補間して混合色を計算する（ブラウザのcolor-mix非サポート環境向けフォールバック）
 * @param hex1 色1のHEX値
 * @param hex2 色2のHEX値
 * @param percentage1 色1の割合 (0-100)
 * @returns 混合色のHEX文字列
 */
export function mixColorsRgb(
  hex1: string,
  hex2: string,
  percentage1: number
): string {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return "#808080";
  const t = percentage1 / 100;
  const r = Math.round(c1.r * t + c2.r * (1 - t));
  const g = Math.round(c1.g * t + c2.g * (1 - t));
  const b = Math.round(c1.b * t + c2.b * (1 - t));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** CSS Custom Properties コードを生成する */
export function buildCssVariablesCode(
  colorSpace: ColorSpaceValue,
  color1: string,
  percentage: number,
  color2: string
): string {
  const lines: string[] = [];
  const steps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  lines.push(":root {");
  for (const pct of steps) {
    const p2 = 100 - pct;
    lines.push(
      `  --color-mix-${pct}: color-mix(in ${colorSpace}, ${color1} ${pct}%, ${color2} ${p2}%);`
    );
  }
  lines.push(
    `  --color-mix-custom: color-mix(in ${colorSpace}, ${color1} ${percentage}%, ${color2} ${100 - percentage}%);`
  );
  lines.push("}");
  return lines.join("\n");
}

/** プリセットカラーペア */
const PRESET_PAIRS: Array<{
  label: string;
  color1: string;
  color2: string;
}> = [
  { label: "青 × 赤", color1: "#3b82f6", color2: "#ef4444" },
  { label: "緑 × 紫", color1: "#22c55e", color2: "#a855f7" },
  { label: "白 × 黒", color1: "#ffffff", color2: "#000000" },
  { label: "橙 × 青", color1: "#f97316", color2: "#0ea5e9" },
  { label: "黄 × 青紫", color1: "#eab308", color2: "#6366f1" },
  { label: "ピンク × 緑", color1: "#ec4899", color2: "#10b981" },
];

/**
 * CSS color-mix() プレイグラウンドコンポーネント
 */
function ColorMixTool() {
  const { showToast } = useToast();
  const { copy } = useClipboard();
  const { statusRef, announceStatus } = useStatusAnnouncement();

  const [color1, setColor1] = useState("#3b82f6");
  const [color2, setColor2] = useState("#ef4444");
  const [percentage, setPercentage] = useState(50);
  const [colorSpace, setColorSpace] = useState<ColorSpaceValue>("srgb");

  const colorMixCss = useMemo(
    () => buildColorMixCss(colorSpace, color1, percentage, color2),
    [colorSpace, color1, percentage, color2]
  );

  const fallbackMixColor = useMemo(
    () => mixColorsRgb(color1, color2, percentage),
    [color1, color2, percentage]
  );

  const cssVariablesCode = useMemo(
    () => buildCssVariablesCode(colorSpace, color1, percentage, color2),
    [colorSpace, color1, percentage, color2]
  );

  /** グラデーションのステップを計算（プレビュー用） */
  const gradientSteps = useMemo(() => {
    return [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((pct) => ({
      pct,
      css: `color-mix(in ${colorSpace}, ${color1} ${pct}%, ${color2} ${100 - pct}%)`,
      fallback: mixColorsRgb(color1, color2, pct),
    }));
  }, [colorSpace, color1, color2]);

  const handleCopyCss = useCallback(async () => {
    const success = await copy(colorMixCss);
    if (success) {
      announceStatus("CSS color-mix() をコピーしました");
      showToast("CSS color-mix() をコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [colorMixCss, copy, announceStatus, showToast]);

  const handleCopyCssVars = useCallback(async () => {
    const success = await copy(cssVariablesCode);
    if (success) {
      announceStatus("CSS変数コードをコピーしました");
      showToast("CSS変数コードをコピーしました", "success");
    } else {
      showToast("コピーに失敗しました", "error");
    }
  }, [cssVariablesCode, copy, announceStatus, showToast]);

  const handleSwapColors = useCallback(() => {
    setColor1(color2);
    setColor2(color1);
    announceStatus("色を入れ替えました");
  }, [color1, color2, announceStatus]);

  const handlePreset = useCallback(
    (preset: (typeof PRESET_PAIRS)[number]) => {
      setColor1(preset.color1);
      setColor2(preset.color2);
      setPercentage(50);
    },
    []
  );

  return (
    <>
      <div className="tool-container">
        {/* プリセット */}
        <div className="converter-section">
          <span className="section-title">プリセット</span>
          <div className="color-mix-presets">
            {PRESET_PAIRS.map((preset) => (
              <button
                key={preset.label}
                className="color-mix-preset-btn"
                onClick={() => handlePreset(preset)}
                aria-label={`プリセット: ${preset.label}`}
              >
                <span
                  className="color-mix-preset-swatch"
                  style={{ background: preset.color1 }}
                  aria-hidden="true"
                />
                <span className="color-mix-preset-label">{preset.label}</span>
                <span
                  className="color-mix-preset-swatch"
                  style={{ background: preset.color2 }}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 色選択 */}
        <div className="converter-section">
          <span className="section-title">色の設定</span>
          <div className="color-mix-color-row">
            <div className="color-mix-color-field">
              <label htmlFor="color-mix-color1" className="color-mix-label">
                色 1
              </label>
              <div className="color-mix-color-input-group">
                <input
                  id="color-mix-color1"
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  aria-label="色1 カラーピッカー"
                  className="color-mix-color-picker"
                />
                <input
                  type="text"
                  value={color1}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor1(v);
                  }}
                  aria-label="色1 HEX値入力"
                  className="color-mix-hex-input"
                  maxLength={7}
                  spellCheck={false}
                />
              </div>
            </div>

            <button
              className="color-mix-swap-btn"
              onClick={handleSwapColors}
              aria-label="2色を入れ替え"
            >
              ⇄
            </button>

            <div className="color-mix-color-field">
              <label htmlFor="color-mix-color2" className="color-mix-label">
                色 2
              </label>
              <div className="color-mix-color-input-group">
                <input
                  id="color-mix-color2"
                  type="color"
                  value={color2}
                  onChange={(e) => setColor2(e.target.value)}
                  aria-label="色2 カラーピッカー"
                  className="color-mix-color-picker"
                />
                <input
                  type="text"
                  value={color2}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColor2(v);
                  }}
                  aria-label="色2 HEX値入力"
                  className="color-mix-hex-input"
                  maxLength={7}
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {/* 割合スライダー */}
          <div className="color-mix-percentage-section">
            <label htmlFor="color-mix-percentage" className="color-mix-label">
              色1の割合: <strong>{percentage}%</strong> / 色2:{" "}
              <strong>{100 - percentage}%</strong>
            </label>
            <input
              id="color-mix-percentage"
              type="range"
              min={0}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              aria-label="色1の割合スライダー"
              className="color-mix-slider"
            />
            <div className="color-mix-percentage-labels" aria-hidden="true">
              <span>色1 100%</span>
              <span>50/50</span>
              <span>色2 100%</span>
            </div>
          </div>

          {/* 色空間選択 */}
          <div className="color-mix-colorspace-section">
            <span className="color-mix-label">色空間</span>
            <div
              className="color-mix-colorspace-grid"
              role="group"
              aria-label="色空間の選択"
            >
              {COLOR_SPACES.map((cs) => (
                <button
                  key={cs.value}
                  className={`color-mix-colorspace-btn ${colorSpace === cs.value ? "active" : ""}`}
                  onClick={() => setColorSpace(cs.value)}
                  aria-pressed={colorSpace === cs.value}
                  title={cs.description}
                >
                  {cs.label}
                </button>
              ))}
            </div>
            <p className="color-mix-colorspace-desc">
              {COLOR_SPACES.find((cs) => cs.value === colorSpace)?.description}
            </p>
          </div>
        </div>

        {/* 混合結果プレビュー */}
        <div className="converter-section">
          <span className="section-title">混合結果プレビュー</span>

          {/* 大きなプレビュー */}
          <div className="color-mix-preview-row">
            <div className="color-mix-preview-item">
              <div
                className="color-mix-preview-swatch large"
                style={{ background: color1 }}
                aria-label={`色1: ${color1}`}
              />
              <span className="color-mix-preview-swatch-label">{color1}</span>
            </div>

            <div className="color-mix-preview-item">
              <div
                className="color-mix-preview-swatch large"
                style={{ background: colorMixCss, backgroundColor: fallbackMixColor }}
                aria-label="混合色プレビュー"
              />
              <span className="color-mix-preview-swatch-label">
                {percentage}% / {100 - percentage}%
              </span>
            </div>

            <div className="color-mix-preview-item">
              <div
                className="color-mix-preview-swatch large"
                style={{ background: color2 }}
                aria-label={`色2: ${color2}`}
              />
              <span className="color-mix-preview-swatch-label">{color2}</span>
            </div>
          </div>

          {/* グラデーション全ステップ */}
          <div className="color-mix-gradient-steps" aria-label="混合グラデーションステップ">
            {gradientSteps.map(({ pct, css, fallback }) => (
              <div
                key={pct}
                className="color-mix-gradient-step"
                style={{ background: css, backgroundColor: fallback }}
                title={`${pct}% / ${100 - pct}%`}
                aria-label={`色1 ${pct}% + 色2 ${100 - pct}%`}
              />
            ))}
          </div>
          <div className="color-mix-gradient-labels" aria-hidden="true">
            <span>色1 100%</span>
            <span>50/50</span>
            <span>色2 100%</span>
          </div>
        </div>

        {/* 生成されたCSS */}
        <div className="converter-section">
          <span className="section-title">生成された CSS</span>

          <div className="basic-auth-result-item">
            <span className="basic-auth-result-label">color-mix() 値</span>
            <code className="basic-auth-result-value basic-auth-result-monospace">
              {colorMixCss}
            </code>
          </div>

          <div className="button-group" role="group" aria-label="コピー操作">
            <Button
              type="button"
              className="btn-primary"
              onClick={handleCopyCss}
              aria-label="color-mix() CSS値をコピー"
            >
              CSS をコピー
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="btn-secondary"
              onClick={handleCopyCssVars}
              aria-label="CSS カスタムプロパティとして全ステップをコピー"
            >
              CSS 変数でコピー
            </Button>
          </div>

          <div className="color-mix-css-preview">
            <pre className="color-mix-css-code">{cssVariablesCode}</pre>
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "color-mix() とは",
              items: [
                "CSS Color Level 5で導入された色混合関数",
                "2つの色を指定した割合・色空間で混合できる",
                "デザインシステムのカラーパレット生成や、透明度なしの中間色作成に便利",
                "Chrome 111+, Firefox 113+, Safari 16.2+ でサポート",
              ],
            },
            {
              title: "色空間の選び方",
              items: [
                "sRGB: 最も互換性が高い。既存のCSSカラーシステムと一致",
                "OKLCH: 知覚的に均一。明るさを保ちながら色相を変えるのに最適",
                "OKLAB: OKLCH と同じく知覚均一。線形補間に向く",
                "HSL: 色相ベースで直感的だが、明るさの補間が不均一になることがある",
              ],
            },
            {
              title: "使用例",
              items: [
                "ホバー色: color-mix(in oklch, var(--btn-color) 80%, black)",
                "半透明フォールバック: color-mix(in srgb, #3b82f6 50%, white)",
                "カラースケール生成: 10%刻みで全ステップをCSS変数として出力",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
