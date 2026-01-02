import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "../components/Toast";

export const Route = createFileRoute("/transparent-image")({
  head: () => ({
    meta: [{ title: "透過画像生成ツール" }],
  }),
  component: TransparentImageGenerator,
});

/**
 * プリセットサイズの定義
 */
interface PresetSize {
  label: string;
  width: number;
  height: number;
}

const PRESET_SIZES: PresetSize[] = [
  { label: "16×16", width: 16, height: 16 },
  { label: "32×32", width: 32, height: 32 },
  { label: "64×64", width: 64, height: 64 },
  { label: "128×128", width: 128, height: 128 },
  { label: "256×256", width: 256, height: 256 },
  { label: "512×512", width: 512, height: 512 },
  { label: "1024×1024", width: 1024, height: 1024 },
];

const MIN_SIZE = 1;
const MAX_SIZE = 10000;
const CHECKERBOARD_SIZE = 10;

/**
 * HEX色をRGBA形式に変換する
 * @param hex - HEX形式の色（#RRGGBB）
 * @param alpha - 透明度（0-1）
 * @returns RGBA形式の色文字列
 */
export function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0, 0, 0, ${alpha})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * チェッカーボードパターンを描画する
 * @param ctx - CanvasRenderingContext2D
 * @param width - キャンバスの幅
 * @param height - キャンバスの高さ
 * @param cellSize - チェッカーボードのセルサイズ
 */
export function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number = CHECKERBOARD_SIZE
): void {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#e0e0e0";
  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      if ((Math.floor(x / cellSize) + Math.floor(y / cellSize)) % 2 === 0) {
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }
}

/**
 * 透過画像を生成する
 * @param width - 画像の幅
 * @param height - 画像の高さ
 * @param opacity - 透明度（0-100）
 * @param backgroundColor - 背景色（HEX形式、オプション）
 * @returns 生成されたBlobを含むPromise
 */
export function generateTransparentImage(
  width: number,
  height: number,
  opacity: number,
  backgroundColor?: string
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }

    // 透明な背景をクリア
    ctx.clearRect(0, 0, width, height);

    // 背景色と透明度がある場合のみ描画
    if (backgroundColor && opacity > 0) {
      ctx.globalAlpha = opacity / 100;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * ダウンロード用のファイル名を生成する
 * @param width - 画像の幅
 * @param height - 画像の高さ
 * @param opacity - 透明度
 * @returns ファイル名
 */
export function generateFilename(width: number, height: number, opacity: number): string {
  const opacityStr = opacity === 0 ? "transparent" : `opacity${opacity}`;
  return `transparent_${width}x${height}_${opacityStr}.png`;
}

function TransparentImageGenerator() {
  const [width, setWidth] = useState(256);
  const [height, setHeight] = useState(256);
  const [opacity, setOpacity] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState("#6750A4");
  const [useBackgroundColor, setUseBackgroundColor] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { showToast } = useToast();

  // プレビューを描画
  const renderPreview = useCallback(() => {
    if (!previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // プレビュー用のスケール（大きすぎる場合は縮小）
    const maxPreviewSize = 400;
    const scale = Math.min(1, maxPreviewSize / Math.max(width, height));
    const previewWidth = Math.max(1, Math.round(width * scale));
    const previewHeight = Math.max(1, Math.round(height * scale));

    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // チェッカーボードを描画
    drawCheckerboard(ctx, previewWidth, previewHeight);

    // 透過画像をオーバーレイ
    if (useBackgroundColor && opacity > 0) {
      ctx.globalAlpha = opacity / 100;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, previewWidth, previewHeight);
    }
  }, [width, height, opacity, backgroundColor, useBackgroundColor]);

  // パラメータ変更時に再描画
  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  const handleWidthChange = useCallback((value: number) => {
    setWidth(Math.max(MIN_SIZE, Math.min(MAX_SIZE, value || MIN_SIZE)));
  }, []);

  const handleHeightChange = useCallback((value: number) => {
    setHeight(Math.max(MIN_SIZE, Math.min(MAX_SIZE, value || MIN_SIZE)));
  }, []);

  const handlePresetSelect = useCallback((preset: PresetSize) => {
    setWidth(preset.width);
    setHeight(preset.height);
  }, []);

  const handleDownload = useCallback(async () => {
    const blob = await generateTransparentImage(
      width,
      height,
      useBackgroundColor ? opacity : 0,
      useBackgroundColor ? backgroundColor : undefined
    );

    if (!blob) {
      showToast("画像の生成に失敗しました", "error");
      return;
    }

    const url = URL.createObjectURL(blob);
    const filename = generateFilename(width, height, useBackgroundColor ? opacity : 0);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("PNGファイルをダウンロードしました", "success");
  }, [width, height, opacity, backgroundColor, useBackgroundColor, showToast]);

  const handleCopyToClipboard = useCallback(async () => {
    const blob = await generateTransparentImage(
      width,
      height,
      useBackgroundColor ? opacity : 0,
      useBackgroundColor ? backgroundColor : undefined
    );

    if (!blob) {
      showToast("画像の生成に失敗しました", "error");
      return;
    }

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      showToast("クリップボードにコピーしました", "success");
    } catch {
      showToast("クリップボードへのコピーに失敗しました", "error");
    }
  }, [width, height, opacity, backgroundColor, useBackgroundColor, showToast]);

  return (
    <div className="tool-container">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleDownload();
        }}
        aria-label="透過画像生成フォーム"
      >
        <div className="converter-section">
          <h2 className="section-title">画像サイズ</h2>

          <div className="transparent-image-options">
            <div className="option-group">
              <label htmlFor="width">幅 (px)</label>
              <input
                type="number"
                id="width"
                min={MIN_SIZE}
                max={MAX_SIZE}
                value={width}
                onChange={(e) => handleWidthChange(parseInt(e.target.value))}
                aria-describedby="size-help"
              />
            </div>

            <span className="size-separator" aria-hidden="true">×</span>

            <div className="option-group">
              <label htmlFor="height">高さ (px)</label>
              <input
                type="number"
                id="height"
                min={MIN_SIZE}
                max={MAX_SIZE}
                value={height}
                onChange={(e) => handleHeightChange(parseInt(e.target.value))}
              />
            </div>
          </div>

          <span id="size-help" className="option-help">
            {MIN_SIZE}〜{MAX_SIZE}px の範囲で指定できます
          </span>

          <div className="preset-section">
            <label className="preset-label">プリセットサイズ</label>
            <div className="preset-buttons" role="group" aria-label="プリセットサイズ選択">
              {PRESET_SIZES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`preset-btn ${width === preset.width && height === preset.height ? "active" : ""}`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="converter-section">
          <h2 className="section-title">背景設定</h2>

          <div className="background-toggle">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useBackgroundColor}
                onChange={(e) => setUseBackgroundColor(e.target.checked)}
              />
              <span>背景色を使用する</span>
            </label>
          </div>

          {useBackgroundColor && (
            <div className="background-options">
              <div className="option-group">
                <label htmlFor="bgColor">背景色</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    id="bgColor"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    aria-label="背景色のHEX値"
                  />
                </div>
              </div>

              <div className="option-group opacity-group">
                <label htmlFor="opacity">
                  透明度: {opacity}%
                  <span className="opacity-hint">（0% = 完全透明、100% = 不透明）</span>
                </label>
                <input
                  type="range"
                  id="opacity"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(parseInt(e.target.value))}
                />
                <div className="opacity-labels">
                  <span>透明</span>
                  <span>不透明</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="converter-section">
          <h2 className="section-title">プレビュー</h2>
          <div className="transparent-preview-container">
            <canvas
              ref={previewCanvasRef}
              aria-label={`プレビュー画像 (${width}x${height})`}
            />
          </div>
          <div className="transparent-image-info">
            <div className="info-item">
              <span className="info-label">サイズ:</span>
              <span className="info-value">{width} × {height} px</span>
            </div>
            <div className="info-item">
              <span className="info-label">形式:</span>
              <span className="info-value">PNG（透過対応）</span>
            </div>
            <div className="info-item">
              <span className="info-label">状態:</span>
              <span className="info-value">
                {!useBackgroundColor || opacity === 0 ? "完全透明" : `${opacity}% 不透明`}
              </span>
            </div>
          </div>

          <div className="button-group" role="group" aria-label="画像操作">
            <button type="submit" className="btn-primary">
              ダウンロード
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCopyToClipboard}
            >
              クリップボードにコピー
            </button>
          </div>
        </div>
      </form>

      <aside
        className="info-box"
        role="complementary"
        aria-labelledby="usage-title"
      >
        <h3 id="usage-title">透過画像生成とは</h3>
        <ul>
          <li>指定したサイズの透過PNG画像を生成します</li>
          <li>Webデザインやアプリ開発のプレースホルダーに最適</li>
          <li>スペーサー画像やオーバーレイ用画像の作成に便利</li>
        </ul>
        <h3>使い方</h3>
        <ul>
          <li>幅と高さを指定、またはプリセットを選択</li>
          <li>必要に応じて背景色と透明度を設定</li>
          <li>チェッカーボード上でプレビューを確認</li>
          <li>「ダウンロード」でPNG画像を保存</li>
        </ul>
        <h3>Tips</h3>
        <ul>
          <li>完全透明（0%）の画像は見えませんが、正しく生成されます</li>
          <li>半透明の背景色を使うとオーバーレイ画像が作れます</li>
          <li>チェッカーボードは透明度を視覚化するためのもので、画像には含まれません</li>
          <li>最大10000×10000pxまで生成可能です</li>
        </ul>
      </aside>
    </div>
  );
}
