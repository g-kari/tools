import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "../components/Toast";

export const Route = createFileRoute("/color-picker")({
  head: () => ({
    meta: [{ title: "カラーピッカー - カラーコード変換ツール" }],
  }),
  component: ColorPicker,
});

/**
 * RGB色の型定義
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * HSL色の型定義
 */
export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * CMYK色の型定義
 */
export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

/**
 * HEX形式の文字列をRGBオブジェクトに変換
 * @param hex - HEX形式の文字列（例: "#FF0000" または "FF0000"）
 * @returns RGBオブジェクト
 */
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace("#", "");
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * RGBオブジェクトをHEX形式の文字列に変換
 * @param rgb - RGBオブジェクト
 * @returns HEX形式の文字列（例: "#FF0000"）
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * RGBオブジェクトをHSLオブジェクトに変換
 * @param rgb - RGBオブジェクト
 * @returns HSLオブジェクト
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * HSLオブジェクトをRGBオブジェクトに変換
 * @param hsl - HSLオブジェクト
 * @returns RGBオブジェクト
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * RGBオブジェクトをCMYKオブジェクトに変換
 * @param rgb - RGBオブジェクト
 * @returns CMYKオブジェクト
 */
export function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
}

/**
 * CMYKオブジェクトをRGBオブジェクトに変換
 * @param cmyk - CMYKオブジェクト
 * @returns RGBオブジェクト
 */
export function cmykToRgb(cmyk: CMYK): RGB {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;

  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
  };
}

/**
 * RGBをCSS rgb()形式の文字列に変換
 * @param rgb - RGBオブジェクト
 * @returns CSS rgb()形式の文字列
 */
export function rgbToString(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * HSLをCSS hsl()形式の文字列に変換
 * @param hsl - HSLオブジェクト
 * @returns CSS hsl()形式の文字列
 */
export function hslToString(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * CMYKをCSS cmyk()形式の文字列に変換
 * @param cmyk - CMYKオブジェクト
 * @returns CSS cmyk()形式の文字列
 */
export function cmykToString(cmyk: CMYK): string {
  return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
}

/**
 * LocalStorageのキー
 */
const PALETTE_STORAGE_KEY = "color-picker-palette";

/**
 * カラーピッカーコンポーネント
 * HEX、RGB、HSL、CMYKの相互変換とカラーパレット管理
 */
function ColorPicker() {
  const [currentColor, setCurrentColor] = useState<string>("#1976D2");
  const [rgb, setRgb] = useState<RGB>({ r: 25, g: 118, b: 210 });
  const [hsl, setHsl] = useState<HSL>({ h: 207, s: 79, l: 46 });
  const [cmyk, setCmyk] = useState<CMYK>({ c: 88, m: 44, y: 0, k: 18 });
  const [palette, setPalette] = useState<string[]>([]);

  const { showToast } = useToast();

  // 初期化時にLocalStorageからパレットを読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PALETTE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPalette(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load palette:", error);
    }
  }, []);

  // パレットが変更されたらLocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, JSON.stringify(palette));
    } catch (error) {
      console.error("Failed to save palette:", error);
    }
  }, [palette]);

  // 色が変更されたら全ての形式を更新
  const updateAllFormats = useCallback((hex: string) => {
    setCurrentColor(hex);
    const newRgb = hexToRgb(hex);
    setRgb(newRgb);
    setHsl(rgbToHsl(newRgb));
    setCmyk(rgbToCmyk(newRgb));
  }, []);

  // カラーピッカーからの色変更
  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAllFormats(e.target.value);
    },
    [updateAllFormats]
  );

  // HEX入力からの色変更
  const handleHexInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (!value.startsWith("#")) {
        value = "#" + value;
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        updateAllFormats(value);
      }
    },
    [updateAllFormats]
  );

  // RGB入力からの色変更
  const handleRgbInput = useCallback(
    (component: "r" | "g" | "b", value: string) => {
      const num = parseInt(value) || 0;
      const clamped = Math.max(0, Math.min(255, num));
      const newRgb = { ...rgb, [component]: clamped };
      setRgb(newRgb);
      updateAllFormats(rgbToHex(newRgb));
    },
    [rgb, updateAllFormats]
  );

  // HSL入力からの色変更
  const handleHslInput = useCallback(
    (component: "h" | "s" | "l", value: string) => {
      const num = parseInt(value) || 0;
      let clamped = num;
      if (component === "h") {
        clamped = Math.max(0, Math.min(360, num));
      } else {
        clamped = Math.max(0, Math.min(100, num));
      }
      const newHsl = { ...hsl, [component]: clamped };
      setHsl(newHsl);
      const newRgb = hslToRgb(newHsl);
      setRgb(newRgb);
      updateAllFormats(rgbToHex(newRgb));
    },
    [hsl, updateAllFormats]
  );

  // CMYK入力からの色変更
  const handleCmykInput = useCallback(
    (component: "c" | "m" | "y" | "k", value: string) => {
      const num = parseInt(value) || 0;
      const clamped = Math.max(0, Math.min(100, num));
      const newCmyk = { ...cmyk, [component]: clamped };
      setCmyk(newCmyk);
      const newRgb = cmykToRgb(newCmyk);
      setRgb(newRgb);
      updateAllFormats(rgbToHex(newRgb));
    },
    [cmyk, updateAllFormats]
  );

  // コピー機能
  const handleCopy = useCallback(
    async (text: string, format: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${format}形式をコピーしました`, "success");
      } catch (error) {
        showToast("コピーに失敗しました", "error");
      }
    },
    [showToast]
  );

  // パレットに色を追加
  const handleAddToPalette = useCallback(() => {
    if (palette.length >= 10) {
      showToast("パレットは最大10色までです", "error");
      return;
    }
    if (palette.includes(currentColor)) {
      showToast("この色は既にパレットに追加されています", "info");
      return;
    }
    setPalette([...palette, currentColor]);
    showToast("パレットに追加しました", "success");
  }, [palette, currentColor, showToast]);

  // パレットから色を削除
  const handleRemoveFromPalette = useCallback(
    (index: number) => {
      setPalette(palette.filter((_, i) => i !== index));
      showToast("パレットから削除しました", "info");
    },
    [palette, showToast]
  );

  // パレットから色を選択
  const handleSelectFromPalette = useCallback(
    (color: string) => {
      updateAllFormats(color);
      showToast("色を選択しました", "info");
    },
    [updateAllFormats, showToast]
  );

  return (
    <div className="tool-container">
      <div className="converter-section">
        <h2 className="section-title">カラーピッカー</h2>

        <div className="color-picker-container">
          <div className="color-preview" style={{ backgroundColor: currentColor }}>
            <span className="color-preview-text">{currentColor}</span>
          </div>

          <input
            type="color"
            value={currentColor}
            onChange={handleColorChange}
            className="color-input"
            aria-label="カラーピッカー"
          />
        </div>
      </div>

      <div className="converter-section">
        <h2 className="section-title">HEX形式</h2>
        <div className="color-format-group">
          <input
            type="text"
            value={currentColor}
            onChange={handleHexInput}
            className="color-format-input"
            placeholder="#000000"
            maxLength={7}
            aria-label="HEX形式の色コード"
          />
          <button
            type="button"
            className="btn-copy"
            onClick={() => handleCopy(currentColor, "HEX")}
            aria-label="HEX形式をコピー"
          >
            コピー
          </button>
        </div>
      </div>

      <div className="converter-section">
        <h2 className="section-title">RGB形式</h2>
        <div className="rgb-inputs">
          <div className="rgb-input-group">
            <label htmlFor="rgb-r">R</label>
            <input
              id="rgb-r"
              type="number"
              value={rgb.r}
              onChange={(e) => handleRgbInput("r", e.target.value)}
              min="0"
              max="255"
              className="color-component-input"
            />
          </div>
          <div className="rgb-input-group">
            <label htmlFor="rgb-g">G</label>
            <input
              id="rgb-g"
              type="number"
              value={rgb.g}
              onChange={(e) => handleRgbInput("g", e.target.value)}
              min="0"
              max="255"
              className="color-component-input"
            />
          </div>
          <div className="rgb-input-group">
            <label htmlFor="rgb-b">B</label>
            <input
              id="rgb-b"
              type="number"
              value={rgb.b}
              onChange={(e) => handleRgbInput("b", e.target.value)}
              min="0"
              max="255"
              className="color-component-input"
            />
          </div>
        </div>
        <div className="color-format-group">
          <input
            type="text"
            value={rgbToString(rgb)}
            readOnly
            className="color-format-input readonly"
            aria-label="RGB形式の色コード"
          />
          <button
            type="button"
            className="btn-copy"
            onClick={() => handleCopy(rgbToString(rgb), "RGB")}
            aria-label="RGB形式をコピー"
          >
            コピー
          </button>
        </div>
      </div>

      <div className="converter-section">
        <h2 className="section-title">HSL形式</h2>
        <div className="rgb-inputs">
          <div className="rgb-input-group">
            <label htmlFor="hsl-h">H</label>
            <input
              id="hsl-h"
              type="number"
              value={hsl.h}
              onChange={(e) => handleHslInput("h", e.target.value)}
              min="0"
              max="360"
              className="color-component-input"
            />
          </div>
          <div className="rgb-input-group">
            <label htmlFor="hsl-s">S</label>
            <input
              id="hsl-s"
              type="number"
              value={hsl.s}
              onChange={(e) => handleHslInput("s", e.target.value)}
              min="0"
              max="100"
              className="color-component-input"
            />
          </div>
          <div className="rgb-input-group">
            <label htmlFor="hsl-l">L</label>
            <input
              id="hsl-l"
              type="number"
              value={hsl.l}
              onChange={(e) => handleHslInput("l", e.target.value)}
              min="0"
              max="100"
              className="color-component-input"
            />
          </div>
        </div>
        <div className="color-format-group">
          <input
            type="text"
            value={hslToString(hsl)}
            readOnly
            className="color-format-input readonly"
            aria-label="HSL形式の色コード"
          />
          <button
            type="button"
            className="btn-copy"
            onClick={() => handleCopy(hslToString(hsl), "HSL")}
            aria-label="HSL形式をコピー"
          >
            コピー
          </button>
        </div>
      </div>

      <div className="converter-section">
        <h2 className="section-title">CMYK形式</h2>
        <div className="cmyk-inputs">
          <div className="rgb-input-group">
            <label htmlFor="cmyk-c">C</label>
            <input
              id="cmyk-c"
              type="number"
              value={cmyk.c}
              onChange={(e) => handleCmykInput("c", e.target.value)}
              min="0"
              max="100"
              className="color-component-input"
            />
          </div>
          <div className="rgb-input-group">
            <label htmlFor="cmyk-m">M</label>
            <input
              id="cmyk-m"
              type="number"
              value={cmyk.m}
              onChange={(e) => handleCmykInput("m", e.target.value)}
              min="0"
              max="100"
              className="color-component-input"
            />
          </div>
          <div className="rgb-input-group">
            <label htmlFor="cmyk-y">Y</label>
            <input
              id="cmyk-y"
              type="number"
              value={cmyk.y}
              onChange={(e) => handleCmykInput("y", e.target.value)}
              min="0"
              max="100"
              className="color-component-input"
            />
          </div>
          <div className="rgb-input-group">
            <label htmlFor="cmyk-k">K</label>
            <input
              id="cmyk-k"
              type="number"
              value={cmyk.k}
              onChange={(e) => handleCmykInput("k", e.target.value)}
              min="0"
              max="100"
              className="color-component-input"
            />
          </div>
        </div>
        <div className="color-format-group">
          <input
            type="text"
            value={cmykToString(cmyk)}
            readOnly
            className="color-format-input readonly"
            aria-label="CMYK形式の色コード"
          />
          <button
            type="button"
            className="btn-copy"
            onClick={() => handleCopy(cmykToString(cmyk), "CMYK")}
            aria-label="CMYK形式をコピー"
          >
            コピー
          </button>
        </div>
      </div>

      <div className="converter-section">
        <div className="section-header">
          <h2 className="section-title">カラーパレット</h2>
          <button
            type="button"
            className="btn-add-palette"
            onClick={handleAddToPalette}
            disabled={palette.length >= 10}
            aria-label="現在の色をパレットに追加"
          >
            + 追加
          </button>
        </div>

        <div className="palette-container" role="list" aria-label="カラーパレット">
          {palette.length === 0 ? (
            <p className="palette-empty">パレットに色が追加されていません</p>
          ) : (
            palette.map((color, index) => (
              <div
                key={`${color}-${index}`}
                className="palette-item"
                role="listitem"
              >
                <button
                  type="button"
                  className="palette-color"
                  style={{ backgroundColor: color }}
                  onClick={() => handleSelectFromPalette(color)}
                  aria-label={`色 ${color} を選択`}
                  title={color}
                />
                <button
                  type="button"
                  className="palette-remove"
                  onClick={() => handleRemoveFromPalette(index)}
                  aria-label={`色 ${color} を削除`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        {palette.length > 0 && (
          <p className="palette-count">{palette.length} / 10色</p>
        )}
      </div>

      <aside className="info-box" role="complementary" aria-labelledby="usage-title">
        <h3 id="usage-title">カラーピッカーとは</h3>
        <ul>
          <li>色の選択と各種形式への変換ができるツールです</li>
          <li>HEX、RGB、HSL、CMYK形式に対応しています</li>
          <li>選択した色をパレットに保存できます（最大10色）</li>
          <li>パレットはブラウザに保存され、次回も利用できます</li>
        </ul>
        <h3 id="format-title">カラー形式について</h3>
        <ul>
          <li>
            <strong>HEX</strong>: Web開発で最も一般的な形式（例: #FF0000）
          </li>
          <li>
            <strong>RGB</strong>: 光の三原色による表現（例: rgb(255, 0, 0)）
          </li>
          <li>
            <strong>HSL</strong>: 色相・彩度・輝度による表現（例: hsl(0, 100%, 50%)）
          </li>
          <li>
            <strong>CMYK</strong>: 印刷で使用される色表現（例: cmyk(0%, 100%, 100%, 0%)）
          </li>
        </ul>
        <h3 id="tips-title">Tips</h3>
        <ul>
          <li>各形式の入力欄に直接値を入力して色を変更できます</li>
          <li>コピーボタンで各形式の色コードをクリップボードにコピーできます</li>
          <li>パレットに保存した色をクリックすると、その色を選択できます</li>
          <li>CMYKは印刷向けの色表現のため、RGB/HEXとは若干異なる場合があります</li>
        </ul>
      </aside>
    </div>
  );
}
