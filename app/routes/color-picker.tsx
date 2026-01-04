import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

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
  const [imageData, setImageData] = useState<string | null>(null);
  const [isPickingFromImage, setIsPickingFromImage] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 画像ファイルの読み込み
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("画像ファイルを選択してください", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageData(result);
        setIsPickingFromImage(true);
      };
      reader.onerror = () => {
        showToast("画像の読み込みに失敗しました", "error");
      };
      reader.readAsDataURL(file);
    },
    [showToast]
  );

  // 画像がロードされたらCanvasに描画
  useEffect(() => {
    if (imageData && imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        // 最大サイズを設定
        const maxWidth = 400;
        const maxHeight = 300;
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // アスペクト比を維持してリサイズ
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
      };
    }
  }, [imageData]);

  // 画像から色をピック
  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const pickedRgb: RGB = { r: pixel[0], g: pixel[1], b: pixel[2] };
      const hex = rgbToHex(pickedRgb);

      updateAllFormats(hex);
      showToast(`色を取得しました: ${hex}`, "success");
    },
    [updateAllFormats, showToast]
  );

  // 画像のクリア
  const handleClearImage = useCallback(() => {
    setImageData(null);
    setIsPickingFromImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // ドラッグ＆ドロップ処理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("画像ファイルをドロップしてください", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageData(result);
        setIsPickingFromImage(true);
      };
      reader.onerror = () => {
        showToast("画像の読み込みに失敗しました", "error");
      };
      reader.readAsDataURL(file);
    },
    [showToast]
  );

  return (
    <div className="tool-container color-picker-page">
      {/* メインエリア：2カラムグリッド */}
      <div className="color-picker-main">
        {/* 左カラム：プレビューと入力 */}
        <div className="color-picker-left">
          {/* カラープレビュー＆ピッカー */}
          <div className="color-picker-header">
            <div
              className="color-preview-compact"
              style={{ "--current-color": currentColor } as React.CSSProperties}
            >
              <input
                type="color"
                value={currentColor}
                onChange={handleColorChange}
                className="color-input-overlay"
                aria-label="カラーピッカー"
              />
            </div>
            <div className="color-hex-input">
              <input
                type="text"
                value={currentColor}
                onChange={handleHexInput}
                className="hex-input-compact"
                placeholder="#000000"
                maxLength={7}
                aria-label="HEX形式の色コード"
              />
              <Button
                type="button"
                className="btn-copy-small"
                onClick={() => handleCopy(currentColor, "HEX")}
                aria-label="HEX形式をコピー"
              >
                コピー
              </Button>
            </div>
          </div>

          {/* カラー形式入力グリッド */}
          <div className="color-formats-grid">
            {/* RGB */}
            <div className="format-row">
              <span className="format-label">RGB</span>
              <div className="format-inputs">
                <input
                  id="rgb-r"
                  type="number"
                  value={rgb.r}
                  onChange={(e) => handleRgbInput("r", e.target.value)}
                  min="0"
                  max="255"
                  className="compact-input"
                  aria-label="R"
                />
                <input
                  id="rgb-g"
                  type="number"
                  value={rgb.g}
                  onChange={(e) => handleRgbInput("g", e.target.value)}
                  min="0"
                  max="255"
                  className="compact-input"
                  aria-label="G"
                />
                <input
                  id="rgb-b"
                  type="number"
                  value={rgb.b}
                  onChange={(e) => handleRgbInput("b", e.target.value)}
                  min="0"
                  max="255"
                  className="compact-input"
                  aria-label="B"
                />
              </div>
              <Button
                type="button"
                className="btn-copy-small"
                onClick={() => handleCopy(rgbToString(rgb), "RGB")}
                aria-label="RGB形式をコピー"
              >
                コピー
              </Button>
            </div>

            {/* HSL */}
            <div className="format-row">
              <span className="format-label">HSL</span>
              <div className="format-inputs">
                <input
                  id="hsl-h"
                  type="number"
                  value={hsl.h}
                  onChange={(e) => handleHslInput("h", e.target.value)}
                  min="0"
                  max="360"
                  className="compact-input"
                  aria-label="H"
                />
                <input
                  id="hsl-s"
                  type="number"
                  value={hsl.s}
                  onChange={(e) => handleHslInput("s", e.target.value)}
                  min="0"
                  max="100"
                  className="compact-input"
                  aria-label="S"
                />
                <input
                  id="hsl-l"
                  type="number"
                  value={hsl.l}
                  onChange={(e) => handleHslInput("l", e.target.value)}
                  min="0"
                  max="100"
                  className="compact-input"
                  aria-label="L"
                />
              </div>
              <Button
                type="button"
                className="btn-copy-small"
                onClick={() => handleCopy(hslToString(hsl), "HSL")}
                aria-label="HSL形式をコピー"
              >
                コピー
              </Button>
            </div>

            {/* CMYK */}
            <div className="format-row">
              <span className="format-label">CMYK</span>
              <div className="format-inputs format-inputs-4">
                <input
                  id="cmyk-c"
                  type="number"
                  value={cmyk.c}
                  onChange={(e) => handleCmykInput("c", e.target.value)}
                  min="0"
                  max="100"
                  className="compact-input"
                  aria-label="C"
                />
                <input
                  id="cmyk-m"
                  type="number"
                  value={cmyk.m}
                  onChange={(e) => handleCmykInput("m", e.target.value)}
                  min="0"
                  max="100"
                  className="compact-input"
                  aria-label="M"
                />
                <input
                  id="cmyk-y"
                  type="number"
                  value={cmyk.y}
                  onChange={(e) => handleCmykInput("y", e.target.value)}
                  min="0"
                  max="100"
                  className="compact-input"
                  aria-label="Y"
                />
                <input
                  id="cmyk-k"
                  type="number"
                  value={cmyk.k}
                  onChange={(e) => handleCmykInput("k", e.target.value)}
                  min="0"
                  max="100"
                  className="compact-input"
                  aria-label="K"
                />
              </div>
              <Button
                type="button"
                className="btn-copy-small"
                onClick={() => handleCopy(cmykToString(cmyk), "CMYK")}
                aria-label="CMYK形式をコピー"
              >
                コピー
              </Button>
            </div>
          </div>

          {/* パレット */}
          <div className="palette-section-compact">
            <div className="palette-header-compact">
              <span className="palette-title">パレット</span>
              <Button
                type="button"
                className="btn-add-palette-small"
                onClick={handleAddToPalette}
                disabled={palette.length >= 10}
                aria-label="現在の色をパレットに追加"
              >
                +
              </Button>
            </div>
            <div
              className="palette-container-compact"
              role="list"
              aria-label="カラーパレット"
            >
              {palette.length === 0 ? (
                <span className="palette-empty-compact">未登録</span>
              ) : (
                palette.map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    type="button"
                    className="palette-color-compact"
                    style={{ "--palette-color": color } as React.CSSProperties}
                    onClick={() => handleSelectFromPalette(color)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleRemoveFromPalette(index);
                    }}
                    aria-label={`色 ${color} を選択（右クリックで削除）`}
                    title={`${color} (右クリックで削除)`}
                    role="listitem"
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* 右カラム：画像ピッカー */}
        <div className="color-picker-right">
          <div className="image-picker-compact">
            <div className="image-picker-header-compact">
              <span className="image-picker-title">画像から取得</span>
              <div className="image-picker-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                  id="image-upload"
                  aria-label="画像ファイルを選択"
                />
                <label htmlFor="image-upload" className="btn-upload-small">
                  選択
                </label>
                {isPickingFromImage && (
                  <Button
                    type="button"
                    className="btn-clear-small"
                    onClick={handleClearImage}
                    aria-label="画像をクリア"
                  >
                    クリア
                  </Button>
                )}
              </div>
            </div>

            <div
              className="image-canvas-container"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {imageData ? (
                <>
                  <img
                    ref={imageRef}
                    src={imageData}
                    alt="色取得用の画像"
                    className="hidden-image"
                  />
                  <canvas
                    ref={canvasRef}
                    onClick={handleImageClick}
                    className="image-canvas-compact"
                    aria-label="画像をクリックして色を取得"
                  />
                </>
              ) : (
                <div className="image-placeholder">
                  <span>画像をD&Dまたは選択</span>
                  <span className="image-placeholder-hint">
                    クリックで色を取得
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TipsCard
        sections={[
          {
            title: "カラーピッカーとは",
            items: [
              "色の選択と各種形式への変換ができるツールです",
              "HEX、RGB、HSL、CMYK形式に対応しています",
              "画像をアップロードして色を抽出できます",
              "選択した色をパレットに保存できます（最大10色）",
              "パレットはブラウザに保存され、次回も利用できます",
            ],
          },
          {
            title: "カラー形式について",
            items: [
              "HEX: Web開発で最も一般的な形式（例: #FF0000）",
              "RGB: 光の三原色による表現（例: rgb(255, 0, 0)）",
              "HSL: 色相・彩度・輝度による表現（例: hsl(0, 100%, 50%)）",
              "CMYK: 印刷で使用される色表現（例: cmyk(0%, 100%, 100%, 0%)）",
            ],
          },
          {
            title: "Tips",
            items: [
              "各形式の入力欄に直接値を入力して色を変更できます",
              "画像をクリックすると、その場所の色を取得できます",
              "コピーボタンで各形式の色コードをクリップボードにコピーできます",
              "パレットの色を右クリックで削除できます",
              "CMYKは印刷向けの色表現のため、RGB/HEXとは若干異なる場合があります",
            ],
          },
        ]}
      />
    </div>
  );
}
