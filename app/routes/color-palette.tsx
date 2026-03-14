import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  type RGB,
  type HSL,
} from "./color-picker";

export const Route = createFileRoute("/color-palette")({
  head: () => ({
    meta: [
      { title: "カラーパレット生成 | Web ツール集" },
      {
        name: "description",
        content:
          "補色・三色・類似色など配色理論に基づいたカラーパレットを自動生成するツール。",
      },
      { property: "og:title", content: "カラーパレット生成 | Web ツール集" },
      {
        property: "og:description",
        content:
          "補色・三色・類似色など配色理論に基づいたカラーパレットを自動生成するツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/color-palette` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      {
        name: "twitter:title",
        content: "カラーパレット生成 | Web ツール集",
      },
      {
        name: "twitter:description",
        content:
          "補色・三色・類似色など配色理論に基づいたカラーパレットを自動生成するツール。",
      },
    ],
  }),
  component: ColorPalette,
});

/**
 * HSLのhue値を0〜360の範囲に正規化する
 * @param h - hue値
 * @returns 正規化されたhue値（0〜360）
 */
export function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/**
 * ベースカラーのHSLのH値をoffset分だけずらした色を返す
 * @param baseHex - ベースカラーのHEX文字列
 * @param offset - hueのオフセット値
 * @returns シフト後のHEX文字列
 */
function shiftHue(baseHex: string, offset: number): string {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return baseHex;
  const hsl = rgbToHsl(rgb);
  const newHsl: HSL = { ...hsl, h: normalizeHue(hsl.h + offset) };
  return rgbToHex(hslToRgb(newHsl));
}

/**
 * モノクロ（同色相・異明度）パレットを生成する
 * @param baseHex - ベースカラーのHEX文字列
 * @returns 6色のHEX文字列配列
 */
export function generateMonochromatic(baseHex: string): string[] {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [baseHex];
  const hsl = rgbToHsl(rgb);
  const lightnesses = [10, 25, 40, 55, 70, 85];
  return lightnesses.map((l) => rgbToHex(hslToRgb({ ...hsl, l })));
}

/**
 * 補色パレットを生成する
 * @param baseHex - ベースカラーのHEX文字列
 * @returns 2色のHEX文字列配列
 */
export function generateComplementary(baseHex: string): string[] {
  return [baseHex, shiftHue(baseHex, 180)];
}

/**
 * 三色配色パレットを生成する
 * @param baseHex - ベースカラーのHEX文字列
 * @returns 3色のHEX文字列配列
 */
export function generateTriadic(baseHex: string): string[] {
  return [baseHex, shiftHue(baseHex, 120), shiftHue(baseHex, 240)];
}

/**
 * 類似色（±30°、±60°）パレットを生成する
 * @param baseHex - ベースカラーのHEX文字列
 * @returns 5色のHEX文字列配列
 */
export function generateAnalogous(baseHex: string): string[] {
  return [
    shiftHue(baseHex, -60),
    shiftHue(baseHex, -30),
    baseHex,
    shiftHue(baseHex, 30),
    shiftHue(baseHex, 60),
  ];
}

/**
 * 分割補色パレットを生成する
 * @param baseHex - ベースカラーのHEX文字列
 * @returns 3色のHEX文字列配列
 */
export function generateSplitComplementary(baseHex: string): string[] {
  return [baseHex, shiftHue(baseHex, 150), shiftHue(baseHex, 210)];
}

/**
 * 四色配色パレットを生成する
 * @param baseHex - ベースカラーのHEX文字列
 * @returns 4色のHEX文字列配列
 */
export function generateTetradic(baseHex: string): string[] {
  return [
    baseHex,
    shiftHue(baseHex, 90),
    shiftHue(baseHex, 180),
    shiftHue(baseHex, 270),
  ];
}

/**
 * WCAGコントラスト比に基づき白か黒のどちらが読みやすいかを返す
 * @param hex - 背景色のHEX文字列
 * @returns "white" または "black"
 */
export function getContrastColor(hex: string): "white" | "black" {
  const rgb = hexToRgb(hex);
  if (!rgb) return "black";
  const luminance = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L =
    0.2126 * luminance(rgb.r) +
    0.7152 * luminance(rgb.g) +
    0.0722 * luminance(rgb.b);
  return L > 0.179 ? "black" : "white";
}

/** アルゴリズムの選択肢 */
const ALGORITHMS = [
  { id: "complementary", label: "補色" },
  { id: "triadic", label: "三色" },
  { id: "analogous", label: "類似色" },
  { id: "split-complementary", label: "分割補色" },
  { id: "tetradic", label: "四色" },
  { id: "monochromatic", label: "モノクロ" },
] as const;

type AlgorithmId = (typeof ALGORITHMS)[number]["id"];

/**
 * アルゴリズムIDに対応するパレット生成関数を返す
 * @param algorithmId - アルゴリズムID
 * @param baseHex - ベースカラーのHEX文字列
 * @returns 生成されたカラー配列
 */
function generatePalette(algorithmId: AlgorithmId, baseHex: string): string[] {
  switch (algorithmId) {
    case "complementary":
      return generateComplementary(baseHex);
    case "triadic":
      return generateTriadic(baseHex);
    case "analogous":
      return generateAnalogous(baseHex);
    case "split-complementary":
      return generateSplitComplementary(baseHex);
    case "tetradic":
      return generateTetradic(baseHex);
    case "monochromatic":
      return generateMonochromatic(baseHex);
    default:
      return generateComplementary(baseHex);
  }
}

/**
 * RGBオブジェクトをRGB文字列に変換する
 * @param rgb - RGBオブジェクト
 * @returns RGB文字列
 */
function rgbToDisplayString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * HSLオブジェクトをHSL文字列に変換する
 * @param hsl - HSLオブジェクト
 * @returns HSL文字列
 */
function hslToDisplayString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * カラーパレット生成コンポーネント
 * 配色理論に基づいたカラーパレットを自動生成する
 */
function ColorPalette() {
  const [baseColor, setBaseColor] = useState<string>("#4a90e2");
  const [hexInputValue, setHexInputValue] = useState<string>("#4a90e2");
  const [algorithm, setAlgorithm] = useState<AlgorithmId>("complementary");
  const [palette, setPalette] = useState<string[]>([]);

  const { showToast } = useToast();

  // ベースカラーまたはアルゴリズムが変わるたびにパレットを更新
  useEffect(() => {
    const generated = generatePalette(algorithm, baseColor);
    setPalette(generated);
  }, [baseColor, algorithm]);

  // カラーピッカーからの色変更
  const handleColorPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setBaseColor(value);
      setHexInputValue(value);
    },
    []
  );

  // HEXテキスト入力からの色変更
  const handleHexTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setHexInputValue(value);
      const normalized = value.startsWith("#") ? value : `#${value}`;
      if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
        setBaseColor(normalized);
      }
    },
    []
  );

  // スウォッチの色をコピー
  const handleCopyColor = useCallback(
    async (hex: string) => {
      try {
        await navigator.clipboard.writeText(hex);
        showToast(`${hex} をコピーしました`, "success");
      } catch {
        showToast("コピーに失敗しました", "error");
      }
    },
    [showToast]
  );

  // CSS変数としてエクスポート
  const handleExportCss = useCallback(async () => {
    const cssVars = palette
      .map((color, i) => `  --color-${i + 1}: ${color};`)
      .join("\n");
    const output = `:root {\n${cssVars}\n}`;
    try {
      await navigator.clipboard.writeText(output);
      showToast("CSS変数をコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [palette, showToast]);

  // JSONとしてエクスポート
  const handleExportJson = useCallback(async () => {
    const output = JSON.stringify({ colors: palette }, null, 2);
    try {
      await navigator.clipboard.writeText(output);
      showToast("JSONをコピーしました", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  }, [palette, showToast]);

  return (
    <div className="tool-container">
      <form onSubmit={(e) => e.preventDefault()}>
        {/* ベースカラー入力エリア */}
        <div className="tool-section">
          <label className="tool-label" htmlFor="cp-base-color-text">
            ベースカラー
          </label>
          <div className="cp-color-input-wrapper">
            <input
              type="color"
              value={baseColor}
              onChange={handleColorPickerChange}
              className="cp-color-picker"
              aria-label="カラーピッカーでベースカラーを選択"
            />
            <input
              id="cp-base-color-text"
              type="text"
              value={hexInputValue}
              onChange={handleHexTextChange}
              className="cp-hex-input"
              placeholder="#4a90e2"
              maxLength={7}
              aria-label="HEXコードでベースカラーを入力"
            />
          </div>
        </div>

        {/* アルゴリズム選択タブ */}
        <div className="tool-section">
          <span className="tool-label">配色アルゴリズム</span>
          <div
            className="cp-algo-tabs"
            role="tablist"
            aria-label="配色アルゴリズムの選択"
          >
            {ALGORITHMS.map((algo) => (
              <button
                key={algo.id}
                type="button"
                role="tab"
                aria-selected={algorithm === algo.id}
                className={`cp-algo-tab${algorithm === algo.id ? " active" : ""}`}
                onClick={() => setAlgorithm(algo.id)}
              >
                {algo.label}
              </button>
            ))}
          </div>
        </div>

        {/* パレット表示グリッド */}
        <div className="tool-section">
          <span className="tool-label">生成されたパレット</span>
          <div
            className="cp-palette-grid"
            role="list"
            aria-label="生成されたカラーパレット"
          >
            {palette.map((hex, index) => {
              const rgb = hexToRgb(hex);
              const hsl = rgbToHsl(rgb);
              const contrastColor = getContrastColor(hex);
              return (
                <div
                  key={`${hex}-${index}`}
                  className="cp-swatch"
                  role="listitem"
                >
                  <div
                    className="cp-swatch-color"
                    style={{ backgroundColor: hex }}
                    aria-label={`カラー ${hex}`}
                  />
                  <div className="cp-swatch-info">
                    <div className="cp-swatch-hex">{hex}</div>
                    <div className="cp-swatch-detail">
                      {rgbToDisplayString(rgb)}
                    </div>
                    <div className="cp-swatch-detail">
                      {hslToDisplayString(hsl)}
                    </div>
                    <button
                      type="button"
                      className="cp-swatch-copy-btn"
                      onClick={() => handleCopyColor(hex)}
                      aria-label={`${hex} をコピー`}
                      data-contrast={contrastColor}
                    >
                      コピー
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* エクスポートエリア */}
        <div className="cp-export-section">
          <span className="tool-label">エクスポート</span>
          <div className="cp-export-btns">
            <Button
              type="button"
              onClick={handleExportCss}
              aria-label="CSS変数形式でエクスポート"
            >
              CSS変数としてコピー
            </Button>
            <Button
              type="button"
              onClick={handleExportJson}
              aria-label="JSON形式でエクスポート"
            >
              JSONとしてコピー
            </Button>
          </div>
        </div>
      </form>

      <TipsCard
        sections={[
          {
            title: "配色アルゴリズムの使い分け",
            items: [
              "補色: 色相環の正反対にある2色。強いコントラストで視線を引きつける",
              "三色: 色相環を3等分した3色。バランスが取れた活気あるデザインに",
              "類似色: 隣接する色相の5色。自然で調和のとれた印象を与える",
              "分割補色: 補色の両隣の色を使った3色。補色より柔らかいコントラスト",
              "四色: 色相環を4等分した4色。豊かな色彩表現が可能",
              "モノクロ: 同じ色相で明度のみ変化させた6色。洗練された統一感",
            ],
          },
          {
            title: "パレットの使い方",
            items: [
              "各スウォッチの「コピー」ボタンでHEXコードをクリップボードにコピー",
              "「CSS変数としてコピー」で :root { --color-1: #xxx; ... } 形式でエクスポート",
              "「JSONとしてコピー」で { \"colors\": [\"#xxx\", ...] } 形式でエクスポート",
            ],
          },
          {
            title: "Tips",
            items: [
              "カラーピッカーとHEXテキスト入力のどちらからでもベースカラーを変更できます",
              "アルゴリズムを切り替えると即座にパレットが更新されます",
              "WCAGコントラスト比に基づき、各スウォッチのテキスト色を自動で白黒切り替え",
            ],
          },
        ]}
      />
    </div>
  );
}
