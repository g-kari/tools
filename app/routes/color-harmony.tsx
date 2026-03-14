import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "../components/TipsCard";
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  type RGB,
  type HSL,
} from "./color-picker";
import { getContrastColor } from "./color-palette";

export const Route = createFileRoute("/color-harmony")({
  head: () => ({
    meta: [
      { title: "カラーハーモニー | Web ツール集" },
      {
        name: "description",
        content:
          "ベースカラーから補色・類似色・トライアド・分割補色・テトラッドを一覧生成するカラーハーモニー配色ツール。",
      },
      { property: "og:title", content: "カラーハーモニー | Web ツール集" },
      {
        property: "og:description",
        content:
          "ベースカラーから補色・類似色・トライアド・分割補色・テトラッドを一覧生成するカラーハーモニー配色ツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/color-harmony` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "カラーハーモニー | Web ツール集" },
      {
        name: "twitter:description",
        content:
          "ベースカラーから補色・類似色・トライアド・分割補色・テトラッドを一覧生成するカラーハーモニー配色ツール。",
      },
    ],
  }),
  component: ColorHarmony,
});

/** ハーモニースキームの型定義 */
interface HarmonyScheme {
  /** スキーム識別子 */
  id: string;
  /** 表示名 */
  name: string;
  /** 説明 */
  description: string;
  /** 生成された色の配列 (HEX文字列) */
  colors: string[];
}

/**
 * hue値を0-360の範囲に正規化する
 * @param h - 正規化前のhue値
 * @returns 正規化後のhue値 (0-359)
 */
function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/**
 * ベースカラーのhueをoffset分シフトしたHEX文字列を返す
 * @param baseHex - ベースカラーのHEX文字列
 * @param offset - hueオフセット（度）
 * @returns シフト後のHEX文字列
 */
function shiftHue(baseHex: string, offset: number): string {
  const rgb = hexToRgb(baseHex);
  const hsl = rgbToHsl(rgb);
  const newHsl: HSL = { ...hsl, h: normalizeHue(hsl.h + offset) };
  return rgbToHex(hslToRgb(newHsl));
}

/**
 * 全ハーモニースキームを生成する
 * @param baseHex - ベースカラーのHEX文字列
 * @returns 5種類のハーモニースキーム配列
 */
export function generateAllHarmonySchemes(baseHex: string): HarmonyScheme[] {
  return [
    {
      id: "complementary",
      name: "補色 (Complementary)",
      description:
        "色相環の正反対 180°。強いコントラストで視線を引きつける配色。",
      colors: [baseHex, shiftHue(baseHex, 180)],
    },
    {
      id: "analogous",
      name: "類似色 (Analogous)",
      description:
        "隣接する ±30°・±60° の5色。自然で調和のとれた印象を与える配色。",
      colors: [
        shiftHue(baseHex, -60),
        shiftHue(baseHex, -30),
        baseHex,
        shiftHue(baseHex, 30),
        shiftHue(baseHex, 60),
      ],
    },
    {
      id: "triadic",
      name: "トライアド (Triadic)",
      description:
        "色相環を3等分した 120° 間隔の3色。バランスよく活気あるデザインに。",
      colors: [baseHex, shiftHue(baseHex, 120), shiftHue(baseHex, 240)],
    },
    {
      id: "split-complementary",
      name: "分割補色 (Split-Complementary)",
      description:
        "補色の両隣 150°・210° の3色。補色より柔らかいコントラスト。",
      colors: [baseHex, shiftHue(baseHex, 150), shiftHue(baseHex, 210)],
    },
    {
      id: "tetradic",
      name: "テトラッド (Tetradic / Square)",
      description:
        "色相環を4等分した 90° 間隔の4色。豊かな色彩表現が可能な配色。",
      colors: [
        baseHex,
        shiftHue(baseHex, 90),
        shiftHue(baseHex, 180),
        shiftHue(baseHex, 270),
      ],
    },
  ];
}

/**
 * RGBオブジェクトをRGB文字列に変換する
 * @param rgb - RGBオブジェクト
 * @returns "rgb(r, g, b)" 形式の文字列
 */
export function toRgbString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * HSLオブジェクトをHSL文字列に変換する
 * @param hsl - HSLオブジェクト
 * @returns "hsl(h, s%, l%)" 形式の文字列
 */
export function toHslString(hsl: HSL): string {
  return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
}

interface ColorSwatchProps {
  hex: string;
  index: number;
  isBase: boolean;
  onCopy: (text: string, label: string) => void;
}

/**
 * カラースウォッチコンポーネント
 * HEX/RGB/HSL形式のコピーボタンを含む色表示カード
 */
function ColorSwatch({ hex, index, isBase, onCopy }: ColorSwatchProps) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const contrastResult = getContrastColor(hex);
  // getContrastColor は "white" | "black" を返す
  const badgeColor = contrastResult === "white" ? "#ffffff" : "#1c1b1e";

  return (
    <div
      className={`ch-swatch${isBase ? " ch-swatch--base" : ""}`}
      role="listitem"
      aria-label={`色 ${index + 1}: ${hex}${isBase ? " (ベースカラー)" : ""}`}
    >
      <div
        className="ch-swatch-color"
        ref={(el) => {
          if (el) el.style.setProperty("--ch-swatch-bg", hex);
        }}
        aria-hidden="true"
      >
        {isBase && (
          <span
            className="ch-swatch-base-badge"
            ref={(el) => {
              if (el) el.style.setProperty("--ch-badge-color", badgeColor);
            }}
          >
            BASE
          </span>
        )}
      </div>
      <div className="ch-swatch-info">
        <div className="ch-swatch-codes">
          <span className="ch-swatch-hex">{hex.toUpperCase()}</span>
          <span className="ch-swatch-rgb">{toRgbString(rgb)}</span>
          <span className="ch-swatch-hsl">{toHslString(hsl)}</span>
        </div>
        <div
          className="ch-swatch-copy-btns"
          role="group"
          aria-label="コピーボタン"
        >
          <button
            type="button"
            className="ch-copy-btn"
            onClick={() => onCopy(hex.toUpperCase(), "HEX")}
            aria-label={`HEX ${hex} をコピー`}
          >
            HEX
          </button>
          <button
            type="button"
            className="ch-copy-btn"
            onClick={() => onCopy(toRgbString(rgb), "RGB")}
            aria-label="RGB値をコピー"
          >
            RGB
          </button>
          <button
            type="button"
            className="ch-copy-btn"
            onClick={() => onCopy(toHslString(hsl), "HSL")}
            aria-label="HSL値をコピー"
          >
            HSL
          </button>
        </div>
      </div>
    </div>
  );
}

interface HarmonySectionProps {
  scheme: HarmonyScheme;
  baseColor: string;
  onCopy: (text: string, label: string) => void;
  onExportCss: (scheme: HarmonyScheme) => void;
}

/**
 * ハーモニースキームセクションコンポーネント
 * スキームのタイトル・説明・スウォッチ一覧・CSS変数エクスポートを表示する
 */
function HarmonySection({
  scheme,
  baseColor,
  onCopy,
  onExportCss,
}: HarmonySectionProps) {
  return (
    <section
      className="ch-scheme-section"
      aria-labelledby={`ch-scheme-title-${scheme.id}`}
    >
      <div className="ch-scheme-header">
        <div className="ch-scheme-title-group">
          <h2
            className="ch-scheme-title"
            id={`ch-scheme-title-${scheme.id}`}
          >
            {scheme.name}
          </h2>
          <p className="ch-scheme-description">{scheme.description}</p>
        </div>
        <button
          type="button"
          className="ch-export-btn"
          onClick={() => onExportCss(scheme)}
          aria-label={`${scheme.name} をCSS変数としてコピー`}
        >
          CSS変数コピー
        </button>
      </div>
      <div
        className="ch-swatch-list"
        role="list"
        aria-label={`${scheme.name} のカラーパレット`}
      >
        {scheme.colors.map((color, i) => (
          <ColorSwatch
            key={`${scheme.id}-${color}-${i}`}
            hex={color}
            index={i}
            isBase={color.toUpperCase() === baseColor.toUpperCase() && i === 0}
            onCopy={onCopy}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * カラーハーモニーツールコンポーネント
 * ベースカラーから全配色スキームを一覧表示する
 */
function ColorHarmony() {
  const [baseColor, setBaseColor] = useState<string>("#4a90e2");
  const [hexInputValue, setHexInputValue] = useState<string>("#4a90e2");

  const { showToast } = useToast();

  const schemes = useMemo(
    () => generateAllHarmonySchemes(baseColor),
    [baseColor]
  );

  const handleColorPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setBaseColor(value);
      setHexInputValue(value);
    },
    []
  );

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

  const handleCopy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label} をコピーしました: ${text}`, "success");
      } catch {
        showToast("コピーに失敗しました", "error");
      }
    },
    [showToast]
  );

  const handleExportCss = useCallback(
    async (scheme: HarmonyScheme) => {
      const vars = scheme.colors
        .map((c, i) => `  --${scheme.id}-${i + 1}: ${c.toUpperCase()};`)
        .join("\n");
      const output = `:root {\n${vars}\n}`;
      try {
        await navigator.clipboard.writeText(output);
        showToast(`${scheme.name} のCSS変数をコピーしました`, "success");
      } catch {
        showToast("コピーに失敗しました", "error");
      }
    },
    [showToast]
  );

  return (
    <div className="tool-container ch-page">
      <section className="tool-section" aria-labelledby="ch-base-label">
        <label
          className="tool-label"
          id="ch-base-label"
          htmlFor="ch-hex-input"
        >
          ベースカラー
        </label>
        <div className="ch-base-input-row">
          <input
            type="color"
            value={baseColor}
            onChange={handleColorPickerChange}
            className="ch-color-picker"
            aria-label="カラーピッカーでベースカラーを選択"
          />
          <input
            id="ch-hex-input"
            type="text"
            value={hexInputValue}
            onChange={handleHexTextChange}
            className="ch-hex-input"
            placeholder="#4a90e2"
            maxLength={7}
            aria-label="HEXコードでベースカラーを入力"
            aria-describedby="ch-hex-hint"
          />
          <div
            className="ch-base-preview"
            ref={(el) => {
              if (el)
                el.style.setProperty("--ch-base-preview-color", baseColor);
            }}
            aria-hidden="true"
          />
        </div>
        <span id="ch-hex-hint" className="ch-hint-text">
          例: #4a90e2 — カラーピッカーまたはHEXコード直接入力で色を指定
        </span>
      </section>

      <div className="ch-schemes-container">
        {schemes.map((scheme) => (
          <HarmonySection
            key={scheme.id}
            scheme={scheme}
            baseColor={baseColor}
            onCopy={handleCopy}
            onExportCss={handleExportCss}
          />
        ))}
      </div>

      <TipsCard
        sections={[
          {
            title: "カラーハーモニーとは",
            items: [
              "色相環の幾何学的関係に基づいて調和した配色を自動生成するツールです",
              "ベースカラーを変えると全スキームが即座に更新されます",
              "各色はHEX・RGB・HSL形式でコピーできます",
              "CSS変数コピーで :root { --complementary-1: #xxx; } 形式で取得できます",
            ],
          },
          {
            title: "各スキームの使い分け",
            items: [
              "補色: ボタンとテキスト背景など、強いコントラストが必要な場面に",
              "類似色: ナビゲーションやカードなど、統一感のあるUI全体に",
              "トライアド: インフォグラフィックスや多色バッジに",
              "分割補色: 補色よりも柔らかい対比が欲しい場面に",
              "テトラッド: 複雑な多色デザインや季節感のある表現に",
            ],
          },
        ]}
      />
    </div>
  );
}
