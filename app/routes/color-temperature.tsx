import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback } from "react";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";

export const Route = createFileRoute("/color-temperature")({
  head: () => ({
    meta: [
      { title: "色温度変換 | Web ツール集" },
      {
        name: "description",
        content:
          "色温度（ケルビン）をRGB・HEXカラーに変換するツール。ろうそく・白熱灯・昼光色などのプリセットを使って照明や写真の色味を視覚的に確認できます。",
      },
      { property: "og:title", content: "色温度変換 | Web ツール集" },
      {
        property: "og:description",
        content: "色温度（ケルビン）をRGB・HEXカラーに変換。照明・写真の色味を視覚確認。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/color-temperature` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "色温度変換 | Web ツール集" },
      {
        name: "twitter:description",
        content: "色温度（ケルビン）をRGB・HEXに変換。照明・写真の色味を視覚的に確認。",
      },
    ],
  }),
  component: ColorTemperature,
});

// ==================== 変換ロジック ====================

/**
 * ケルビン値をRGBに変換する（Tanner Helland近似アルゴリズム）
 * @see https://tannerhelland.com/2012/09/18/convert-temperature-rgb-algorithm-code.html
 */
export function kelvinToRgb(kelvin: number): { r: number; g: number; b: number } {
  const temp = Math.max(1000, Math.min(40000, kelvin)) / 100;

  let r: number;
  let g: number;
  let b: number;

  // Red
  if (temp <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }

  // Green
  if (temp <= 66) {
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    g = Math.max(0, Math.min(255, g));
  } else {
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    g = Math.max(0, Math.min(255, g));
  }

  // Blue
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }

  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

/** RGBを16進数カラーコードに変換する */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

/** ケルビン値を16進数カラーコードに変換する */
export function kelvinToHex(kelvin: number): string {
  const { r, g, b } = kelvinToRgb(kelvin);
  return rgbToHex(r, g, b);
}

// ==================== プリセット ====================

const PRESETS: { label: string; kelvin: number; description: string }[] = [
  { label: "ろうそく", kelvin: 1800, description: "炎のような温かみのある赤橙色" },
  { label: "白熱電球", kelvin: 2700, description: "従来の電球の温かみのある暖色" },
  { label: "電球色LED", kelvin: 3000, description: "電球色LED・ハロゲンランプ" },
  { label: "白色LED", kelvin: 4000, description: "白色LEDの中間色" },
  { label: "昼白色", kelvin: 5000, description: "自然光に近い標準白色" },
  { label: "太陽光", kelvin: 5500, description: "晴天時の直射日光" },
  { label: "昼光色", kelvin: 6500, description: "曇天・一般的なモニター基準" },
  { label: "薄曇り", kelvin: 8000, description: "薄曇りの空の光" },
  { label: "青空", kelvin: 15000, description: "晴れた青空の散乱光" },
];

// ==================== コンポーネント ====================

function ColorTemperature() {
  const [kelvin, setKelvin] = useState(6500);
  const [inputValue, setInputValue] = useState("6500");

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();

  const rgb = kelvinToRgb(kelvin);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    setKelvin(v);
    setInputValue(String(v));
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const v = parseInt(e.target.value);
    if (!isNaN(v) && v >= 1000 && v <= 40000) {
      setKelvin(v);
    }
  }, []);

  const handleInputBlur = useCallback(() => {
    const v = parseInt(inputValue);
    if (isNaN(v) || v < 1000 || v > 40000) {
      setInputValue(String(kelvin));
    } else {
      setKelvin(v);
      setInputValue(String(v));
    }
  }, [inputValue, kelvin]);

  const handlePreset = useCallback(
    (k: number) => {
      setKelvin(k);
      setInputValue(String(k));
      announceStatus(`${k}Kに設定しました`);
    },
    [announceStatus],
  );

  const handleCopyHex = useCallback(async () => {
    const ok = await copy(hex);
    announceStatus(ok ? `HEX ${hex} をコピーしました` : "コピーに失敗しました");
  }, [copy, hex, announceStatus]);

  const handleCopyRgb = useCallback(async () => {
    const ok = await copy(rgbString);
    announceStatus(ok ? `RGB ${rgbString} をコピーしました` : "コピーに失敗しました");
  }, [copy, rgbString, announceStatus]);

  // 色温度スペクトルの背景グラデーション（1000K〜40000K）
  const spectrumGradient =
    "linear-gradient(to right, #ff3800, #ff6000, #ffa040, #ffc87c, #fff4e8, #ffffff, #dde8ff, #c2d4ff)";

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">色温度入力</h2>

          <div className="ct-kelvin-row">
            <label htmlFor="ct-input" className="ct-kelvin-label">
              色温度
            </label>
            <input
              id="ct-input"
              type="number"
              className="ct-kelvin-input"
              value={inputValue}
              min={1000}
              max={40000}
              step={100}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              aria-label="色温度（ケルビン）"
              aria-describedby="ct-range-hint"
            />
            <span className="ct-kelvin-unit">K</span>
          </div>

          <div className="ct-spectrum-wrap" aria-hidden="true">
            <div className="ct-spectrum-bar" style={{ background: spectrumGradient }} />
          </div>

          <input
            type="range"
            id="ct-slider"
            className="ct-slider"
            min={1000}
            max={40000}
            step={100}
            value={kelvin}
            onChange={handleSliderChange}
            aria-label="色温度スライダー"
            aria-valuemin={1000}
            aria-valuemax={40000}
            aria-valuenow={kelvin}
            aria-valuetext={`${kelvin}K`}
          />
          <div className="ct-range-labels" id="ct-range-hint">
            <span>1,000K（暖色）</span>
            <span>40,000K（寒色）</span>
          </div>
        </div>

        <div className="converter-section">
          <h2 className="section-title">変換結果</h2>
          <div className="ct-result-layout">
            <div
              className="ct-swatch"
              style={{ background: hex }}
              role="img"
              aria-label={`${kelvin}Kの色: ${hex}`}
            />
            <div className="ct-values">
              <div className="ct-value-row">
                <span className="ct-value-label">HEX</span>
                <code className="ct-value-code">{hex}</code>
                <button
                  type="button"
                  className="ct-copy-btn"
                  onClick={handleCopyHex}
                  aria-label={`HEX値 ${hex} をコピー`}
                >
                  コピー
                </button>
              </div>
              <div className="ct-value-row">
                <span className="ct-value-label">RGB</span>
                <code className="ct-value-code">{rgbString}</code>
                <button
                  type="button"
                  className="ct-copy-btn"
                  onClick={handleCopyRgb}
                  aria-label={`RGB値 ${rgbString} をコピー`}
                >
                  コピー
                </button>
              </div>
              <div className="ct-value-row">
                <span className="ct-value-label">R</span>
                <code className="ct-value-code">{rgb.r}</code>
              </div>
              <div className="ct-value-row">
                <span className="ct-value-label">G</span>
                <code className="ct-value-code">{rgb.g}</code>
              </div>
              <div className="ct-value-row">
                <span className="ct-value-label">B</span>
                <code className="ct-value-code">{rgb.b}</code>
              </div>
            </div>
          </div>
        </div>

        <div className="converter-section">
          <h2 className="section-title">プリセット</h2>
          <div className="ct-presets" role="list">
            {PRESETS.map((p) => (
              <button
                key={p.kelvin}
                type="button"
                className={`ct-preset-btn${kelvin === p.kelvin ? " ct-preset-btn--active" : ""}`}
                onClick={() => handlePreset(p.kelvin)}
                aria-pressed={kelvin === p.kelvin}
                aria-label={`${p.label} ${p.kelvin}K: ${p.description}`}
                role="listitem"
              >
                <span
                  className="ct-preset-swatch"
                  style={{ background: kelvinToHex(p.kelvin) }}
                  aria-hidden="true"
                />
                <span className="ct-preset-info">
                  <span className="ct-preset-name">{p.label}</span>
                  <span className="ct-preset-kelvin">{p.kelvin.toLocaleString()}K</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <TipsCard
          sections={[
            {
              title: "色温度とは",
              items: [
                "色温度とはケルビン（K）で表される光の色の指標です",
                "低い値（1000〜3000K）は暖かみのある赤橙色、高い値（6000K以上）は青みがかった冷たい色になります",
                "白熱電球（約2700K）・蛍光灯（約6500K）・晴天の空（約10000〜15000K）が代表例です",
              ],
            },
            {
              title: "用途",
              items: [
                "写真・動画のホワイトバランス調整の参考に",
                "照明設計・室内デザインの色味検討に",
                "UIデザインやブランドカラーの色温度確認に",
                "CSS カラー値として直接コピーして利用できます",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
