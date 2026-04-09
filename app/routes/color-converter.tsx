import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useCallback, useMemo } from "react";
import { useToast } from "../components/Toast";
import { TipsCard } from "~/components/TipsCard";
import { useStatusAnnouncement, StatusAnnouncer } from "~/hooks/useStatusAnnouncement";
import { useClipboard } from "~/hooks/useClipboard";
import {
  hexToRgb,
  rgbToAllFormats,
  hslToRgb,
  hsvToRgb,
  cmykToRgb,
  oklchToRgb,
  rgbToString,
  hslToString,
  hsvToString,
  cmykToString,
  oklchToString,
  DEFAULT_COLOR_RGB,
  type ColorFormats,
  type RgbColor,
  type HslColor,
  type HsvColor,
  type CmykColor,
  type OklchColor,
} from "~/utils/color-converter";

export const Route = createFileRoute("/color-converter")({
  head: () => ({
    meta: [
      { title: "カラーフォーマット変換 | Web ツール集" },
      {
        name: "description",
        content:
          "HEX・RGB・HSL・HSV・CMYK・OKLCHなど6種類のカラーフォーマット間をリアルタイムに相互変換。Webデザイン・印刷・CSS設計に活用できるカラーコンバーター。",
      },
      { property: "og:title", content: "カラーフォーマット変換 | Web ツール集" },
      {
        property: "og:description",
        content: "HEX・RGB・HSL・HSV・CMYK・OKLCH 6種のカラーフォーマットをリアルタイム相互変換。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/color-converter` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "カラーフォーマット変換 | Web ツール集" },
      {
        name: "twitter:description",
        content: "HEX・RGB・HSL・HSV・CMYK・OKLCHをリアルタイム相互変換するカラーコンバーター。",
      },
    ],
  }),
  component: ColorConverter,
});

// ==================== 数値入力フィールド ====================

interface NumInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}

function NumInput({ id, label, value, min, max, step = 1, onChange }: NumInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseFloat(e.target.value);
    if (!isNaN(n)) {
      onChange(Math.max(min, Math.min(max, n)));
    }
  };

  return (
    <div className="ccv-num-field">
      <label htmlFor={id} className="ccv-num-label">
        {label}
      </label>
      <input
        id={id}
        type="number"
        className="ccv-num-input"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        aria-label={`${label}の値`}
      />
    </div>
  );
}

// ==================== フォーマット行 ====================

interface FormatRowProps {
  label: string;
  displayText: string;
  onCopy: () => void;
  children: React.ReactNode;
}

function FormatRow({ label, displayText, onCopy, children }: FormatRowProps) {
  return (
    <div className="ccv-format-row" role="group" aria-label={`${label}フォーマット`}>
      <div className="ccv-format-header">
        <span className="ccv-format-badge">{label}</span>
        <code className="ccv-format-value">{displayText}</code>
        <button
          type="button"
          className="ccv-copy-btn"
          onClick={onCopy}
          aria-label={`${label}の値をコピー: ${displayText}`}
        >
          コピー
        </button>
      </div>
      <div className="ccv-format-inputs">{children}</div>
    </div>
  );
}

// ==================== メインコンポーネント ====================

function ColorConverter() {
  const [colors, setColors] = useState<ColorFormats>(() => rgbToAllFormats(DEFAULT_COLOR_RGB));
  const [hexInput, setHexInput] = useState(rgbToAllFormats(DEFAULT_COLOR_RGB).hex);
  const [hexError, setHexError] = useState(false);

  const { copy } = useClipboard();
  const { announceStatus, statusRef } = useStatusAnnouncement();
  const { showToast } = useToast();

  /** RGBを基準にして全フォーマットを更新 */
  const updateFromRgb = useCallback((rgb: RgbColor) => {
    const all = rgbToAllFormats(rgb);
    setColors(all);
    setHexInput(all.hex);
    setHexError(false);
  }, []);

  // ---- HEX ----
  const handleHexChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setHexInput(raw);
    const rgb = hexToRgb(raw);
    if (rgb) {
      setHexError(false);
      const all = rgbToAllFormats(rgb);
      setColors(all);
    } else {
      setHexError(true);
    }
  }, []);

  // ---- RGB ----
  const handleRgbChange = useCallback(
    (key: keyof RgbColor, value: number) => {
      updateFromRgb({ ...colors.rgb, [key]: value });
    },
    [colors.rgb, updateFromRgb],
  );

  // ---- HSL ----
  const handleHslChange = useCallback(
    (key: keyof HslColor, value: number) => {
      const newHsl = { ...colors.hsl, [key]: value };
      updateFromRgb(hslToRgb(newHsl));
    },
    [colors.hsl, updateFromRgb],
  );

  // ---- HSV ----
  const handleHsvChange = useCallback(
    (key: keyof HsvColor, value: number) => {
      const newHsv = { ...colors.hsv, [key]: value };
      updateFromRgb(hsvToRgb(newHsv));
    },
    [colors.hsv, updateFromRgb],
  );

  // ---- CMYK ----
  const handleCmykChange = useCallback(
    (key: keyof CmykColor, value: number) => {
      const newCmyk = { ...colors.cmyk, [key]: value };
      updateFromRgb(cmykToRgb(newCmyk));
    },
    [colors.cmyk, updateFromRgb],
  );

  // ---- OKLCH ----
  const handleOklchChange = useCallback(
    (key: keyof OklchColor, value: number) => {
      const newOklch = { ...colors.oklch, [key]: value };
      updateFromRgb(oklchToRgb(newOklch));
    },
    [colors.oklch, updateFromRgb],
  );

  // ---- コピー ----
  const handleCopy = useCallback(
    async (text: string, label: string) => {
      const success = await copy(text);
      if (success) {
        announceStatus(`${label}をコピーしました`);
        showToast(`${label}をコピーしました`, "success");
      } else {
        showToast("コピーに失敗しました", "error");
      }
    },
    [copy, announceStatus, showToast],
  );

  // ---- カラーピッカー（ブラウザネイティブ） ----
  const handleNativePicker = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rgb = hexToRgb(e.target.value);
      if (rgb) updateFromRgb(rgb);
    },
    [updateFromRgb],
  );

  const previewBg = useMemo(() => colors.hex, [colors.hex]);
  const textOnBg = useMemo(() => {
    // 輝度で文字色を決定
    const { r, g, b } = colors.rgb;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 140 ? "#000000" : "#ffffff";
  }, [colors.rgb]);

  return (
    <>
      <div className="tool-container">
        <div className="ccv-layout">
          {/* カラープレビュー */}
          <section className="ccv-preview-section" aria-labelledby="ccv-preview-title">
            <h2 className="ccv-section-title" id="ccv-preview-title">
              カラープレビュー
            </h2>
            <div
              className="ccv-swatch"
              style={{ backgroundColor: previewBg, color: textOnBg } as React.CSSProperties}
              role="img"
              aria-label={`現在の色: ${previewBg}`}
            >
              <span className="ccv-swatch-label">{previewBg}</span>
              <input
                type="color"
                className="ccv-native-picker"
                value={colors.hex.length === 7 ? colors.hex : "#000000"}
                onChange={handleNativePicker}
                aria-label="カラーピッカーで色を選択"
                title="クリックして色を選択"
              />
            </div>
          </section>

          {/* フォーマット入力エリア */}
          <section className="ccv-formats-section" aria-labelledby="ccv-formats-title">
            <h2 className="ccv-section-title" id="ccv-formats-title">
              カラーフォーマット
            </h2>

            <div className="ccv-formats-list">
              {/* HEX */}
              <FormatRow
                label="HEX"
                displayText={colors.hex}
                onCopy={() => handleCopy(colors.hex, "HEX")}
              >
                <div className="ccv-hex-row">
                  <label htmlFor="ccv-hex-input" className="ccv-sr-only">
                    HEXカラーコード
                  </label>
                  <input
                    id="ccv-hex-input"
                    type="text"
                    className={`ccv-hex-input${hexError ? " error" : ""}`}
                    value={hexInput}
                    onChange={handleHexChange}
                    placeholder="#39D353"
                    aria-label="HEXカラーコード入力"
                    aria-invalid={hexError}
                    maxLength={7}
                    spellCheck={false}
                  />
                  {hexError && (
                    <span className="ccv-error-msg" role="alert">
                      無効なHEX値です
                    </span>
                  )}
                </div>
              </FormatRow>

              {/* RGB */}
              <FormatRow
                label="RGB"
                displayText={rgbToString(colors.rgb)}
                onCopy={() => handleCopy(rgbToString(colors.rgb), "RGB")}
              >
                <NumInput
                  id="ccv-rgb-r"
                  label="R"
                  value={colors.rgb.r}
                  min={0}
                  max={255}
                  onChange={(v) => handleRgbChange("r", v)}
                />
                <NumInput
                  id="ccv-rgb-g"
                  label="G"
                  value={colors.rgb.g}
                  min={0}
                  max={255}
                  onChange={(v) => handleRgbChange("g", v)}
                />
                <NumInput
                  id="ccv-rgb-b"
                  label="B"
                  value={colors.rgb.b}
                  min={0}
                  max={255}
                  onChange={(v) => handleRgbChange("b", v)}
                />
              </FormatRow>

              {/* HSL */}
              <FormatRow
                label="HSL"
                displayText={hslToString(colors.hsl)}
                onCopy={() => handleCopy(hslToString(colors.hsl), "HSL")}
              >
                <NumInput
                  id="ccv-hsl-h"
                  label="H°"
                  value={colors.hsl.h}
                  min={0}
                  max={360}
                  onChange={(v) => handleHslChange("h", v)}
                />
                <NumInput
                  id="ccv-hsl-s"
                  label="S%"
                  value={colors.hsl.s}
                  min={0}
                  max={100}
                  onChange={(v) => handleHslChange("s", v)}
                />
                <NumInput
                  id="ccv-hsl-l"
                  label="L%"
                  value={colors.hsl.l}
                  min={0}
                  max={100}
                  onChange={(v) => handleHslChange("l", v)}
                />
              </FormatRow>

              {/* HSV */}
              <FormatRow
                label="HSV"
                displayText={hsvToString(colors.hsv)}
                onCopy={() => handleCopy(hsvToString(colors.hsv), "HSV")}
              >
                <NumInput
                  id="ccv-hsv-h"
                  label="H°"
                  value={colors.hsv.h}
                  min={0}
                  max={360}
                  onChange={(v) => handleHsvChange("h", v)}
                />
                <NumInput
                  id="ccv-hsv-s"
                  label="S%"
                  value={colors.hsv.s}
                  min={0}
                  max={100}
                  onChange={(v) => handleHsvChange("s", v)}
                />
                <NumInput
                  id="ccv-hsv-v"
                  label="V%"
                  value={colors.hsv.v}
                  min={0}
                  max={100}
                  onChange={(v) => handleHsvChange("v", v)}
                />
              </FormatRow>

              {/* CMYK */}
              <FormatRow
                label="CMYK"
                displayText={cmykToString(colors.cmyk)}
                onCopy={() => handleCopy(cmykToString(colors.cmyk), "CMYK")}
              >
                <NumInput
                  id="ccv-cmyk-c"
                  label="C%"
                  value={colors.cmyk.c}
                  min={0}
                  max={100}
                  onChange={(v) => handleCmykChange("c", v)}
                />
                <NumInput
                  id="ccv-cmyk-m"
                  label="M%"
                  value={colors.cmyk.m}
                  min={0}
                  max={100}
                  onChange={(v) => handleCmykChange("m", v)}
                />
                <NumInput
                  id="ccv-cmyk-y"
                  label="Y%"
                  value={colors.cmyk.y}
                  min={0}
                  max={100}
                  onChange={(v) => handleCmykChange("y", v)}
                />
                <NumInput
                  id="ccv-cmyk-k"
                  label="K%"
                  value={colors.cmyk.k}
                  min={0}
                  max={100}
                  onChange={(v) => handleCmykChange("k", v)}
                />
              </FormatRow>

              {/* OKLCH */}
              <FormatRow
                label="OKLCH"
                displayText={oklchToString(colors.oklch)}
                onCopy={() => handleCopy(oklchToString(colors.oklch), "OKLCH")}
              >
                <NumInput
                  id="ccv-oklch-l"
                  label="L"
                  value={colors.oklch.l}
                  min={0}
                  max={1}
                  step={0.001}
                  onChange={(v) => handleOklchChange("l", v)}
                />
                <NumInput
                  id="ccv-oklch-c"
                  label="C"
                  value={colors.oklch.c}
                  min={0}
                  max={0.4}
                  step={0.001}
                  onChange={(v) => handleOklchChange("c", v)}
                />
                <NumInput
                  id="ccv-oklch-h"
                  label="H°"
                  value={colors.oklch.h}
                  min={0}
                  max={360}
                  step={0.1}
                  onChange={(v) => handleOklchChange("h", v)}
                />
              </FormatRow>
            </div>
          </section>
        </div>

        <TipsCard
          sections={[
            {
              title: "使い方",
              items: [
                "いずれかのフォーマットの値を変更すると、他のフォーマットが自動的に更新されます",
                "カラープレビューをクリックするとブラウザのカラーピッカーが開きます",
                "各フォーマット右の「コピー」ボタンでCSS記法をクリップボードにコピーできます",
                'HEX入力は "#" あり/なし・大文字小文字を問いません',
              ],
            },
            {
              title: "フォーマットについて",
              items: [
                "HEX — #RRGGBB形式。Webデザインで最も一般的",
                "RGB — 光の三原色。Webブラウザ・画面表示で使用",
                "HSL — 色相・彩度・輝度。人間が直感的に理解しやすい",
                "HSV/HSB — 色相・彩度・明度。画像編集ソフトでよく使われる",
                "CMYK — 印刷用4色モデル（シアン・マゼンタ・イエロー・ブラック）",
                "OKLCH — 知覚的均一性に優れた新しいCSS Color Level 4の表色系",
              ],
            },
          ]}
        />
      </div>

      <StatusAnnouncer statusRef={statusRef} />
    </>
  );
}
