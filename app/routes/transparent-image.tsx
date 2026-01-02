import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "../components/Toast";

export const Route = createFileRoute("/transparent-image")({
  head: () => ({
    meta: [{ title: "画像透過ツール" }],
  }),
  component: TransparentImageProcessor,
});

const CHECKERBOARD_SIZE = 10;

/**
 * RGB色の型定義
 */
interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * HEX色をRGB形式に変換する
 * @param hex - HEX形式の色（#RRGGBB）
 * @returns RGB形式のオブジェクト
 */
export function hexToRgb(hex: string): RgbColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * RGB色をHEX形式に変換する
 * @param r - 赤成分（0-255）
 * @param g - 緑成分（0-255）
 * @param b - 青成分（0-255）
 * @returns HEX形式の色文字列
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * 2つの色の距離を計算する（ユークリッド距離）
 * @param color1 - 比較する色1
 * @param color2 - 比較する色2
 * @returns 色の距離（0-441.67程度）
 */
export function colorDistance(color1: RgbColor, color2: RgbColor): number {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * 画像の指定した色を透過処理する
 * @param imageData - 処理する画像データ
 * @param targetColor - 透過させる色
 * @param tolerance - 許容範囲（0-100）
 * @returns 処理後の画像データ
 */
export function makeColorTransparent(
  imageData: ImageData,
  targetColor: RgbColor,
  tolerance: number
): ImageData {
  const data = imageData.data;
  const maxDistance = (tolerance / 100) * 441.67; // 最大距離は√(255²+255²+255²) ≈ 441.67

  for (let i = 0; i < data.length; i += 4) {
    const pixelColor: RgbColor = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2],
    };

    const distance = colorDistance(pixelColor, targetColor);

    if (distance <= maxDistance) {
      // 透過度を距離に応じて計算（近いほど透明）
      const alpha = distance <= maxDistance * 0.5
        ? 0
        : Math.round(((distance - maxDistance * 0.5) / (maxDistance * 0.5)) * 255);
      data[i + 3] = alpha;
    }
  }

  return imageData;
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
 * ダウンロード用のファイル名を生成する
 * @param originalName - 元のファイル名
 * @returns 新しいファイル名
 */
export function generateFilename(originalName: string): string {
  const ext = originalName.match(/\.[^/.]+$/)?.[0] || "";
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}_transparent.png`;
}

function TransparentImageProcessor() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [targetColor, setTargetColor] = useState<string>("#ffffff");
  const [tolerance, setTolerance] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const { showToast } = useToast();

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
    };
  }, [originalPreview]);

  // 元画像をCanvasに描画
  const drawOriginalImage = useCallback(() => {
    if (!originalCanvasRef.current || !imageRef.current || !imageDimensions) return;

    const canvas = originalCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const maxSize = 500;
    const scale = Math.min(1, maxSize / Math.max(imageDimensions.width, imageDimensions.height));
    canvas.width = Math.round(imageDimensions.width * scale);
    canvas.height = Math.round(imageDimensions.height * scale);

    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
  }, [imageDimensions]);

  useEffect(() => {
    drawOriginalImage();
  }, [drawOriginalImage]);

  // 透過処理を実行してプレビューを更新
  const processImage = useCallback(() => {
    if (!originalCanvasRef.current || !previewCanvasRef.current || !imageRef.current || !imageDimensions) return;

    const originalCanvas = originalCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    const originalCtx = originalCanvas.getContext("2d");
    const previewCtx = previewCanvas.getContext("2d");
    if (!originalCtx || !previewCtx) return;

    const rgbTarget = hexToRgb(targetColor);
    if (!rgbTarget) return;

    // プレビューキャンバスのサイズを設定
    previewCanvas.width = originalCanvas.width;
    previewCanvas.height = originalCanvas.height;

    // チェッカーボードを描画
    drawCheckerboard(previewCtx, previewCanvas.width, previewCanvas.height);

    // 元画像のデータを取得
    const imageData = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);

    // 透過処理
    const processedData = makeColorTransparent(imageData, rgbTarget, tolerance);

    // 一時キャンバスに処理結果を描画
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = originalCanvas.width;
    tempCanvas.height = originalCanvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.putImageData(processedData, 0, 0);
      // プレビューキャンバスに描画
      previewCtx.drawImage(tempCanvas, 0, 0);
    }
  }, [targetColor, tolerance, imageDimensions]);

  useEffect(() => {
    if (originalFile && imageDimensions) {
      processImage();
    }
  }, [processImage, originalFile, imageDimensions]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast("画像ファイルを選択してください", "error");
        return;
      }

      // 既存のプレビューをクリーンアップ
      if (originalPreview) URL.revokeObjectURL(originalPreview);

      const preview = URL.createObjectURL(file);
      setOriginalFile(file);
      setOriginalPreview(preview);
      setProcessedBlob(null);

      // 画像サイズを取得
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        showToast("画像の読み込みに失敗しました", "error");
        URL.revokeObjectURL(preview);
        setOriginalFile(null);
        setOriginalPreview(null);
      };
      img.src = preview;
    },
    [originalPreview, showToast]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 画像クリックで色を取得
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isPickingColor || !originalCanvasRef.current) return;

      const canvas = originalCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
      const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
      setTargetColor(hex);
      setIsPickingColor(false);
      showToast(`色を選択しました: ${hex}`, "success");
    },
    [isPickingColor, showToast]
  );

  // 透過画像を生成してダウンロード
  const handleDownload = useCallback(async () => {
    if (!imageRef.current || !originalFile || !imageDimensions) return;

    setIsLoading(true);

    const rgbTarget = hexToRgb(targetColor);
    if (!rgbTarget) {
      showToast("無効な色が指定されています", "error");
      setIsLoading(false);
      return;
    }

    // フルサイズで処理
    const canvas = document.createElement("canvas");
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      showToast("画像処理に失敗しました", "error");
      setIsLoading(false);
      return;
    }

    ctx.drawImage(imageRef.current, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const processedData = makeColorTransparent(imageData, rgbTarget, tolerance);
    ctx.putImageData(processedData, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setProcessedBlob(blob);
          const url = URL.createObjectURL(blob);
          const filename = generateFilename(originalFile.name);

          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          showToast("透過画像をダウンロードしました", "success");
        } else {
          showToast("画像の生成に失敗しました", "error");
        }
        setIsLoading(false);
      },
      "image/png"
    );
  }, [originalFile, targetColor, tolerance, imageDimensions, showToast]);

  const handleClear = useCallback(() => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);

    setOriginalFile(null);
    setOriginalPreview(null);
    setProcessedBlob(null);
    setImageDimensions(null);
    imageRef.current = null;

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    showToast("クリアしました", "info");
  }, [originalPreview, showToast]);

  return (
    <div className="tool-container">
      {!originalFile ? (
        /* 画像未選択時：ドロップゾーンと説明を表示 */
        <>
          <div className="converter-section">
            <h2 className="section-title">画像選択</h2>

            <div
              className={`dropzone ${isDragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="画像ファイルをアップロード"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="dropzone-content">
                <svg
                  className="upload-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="dropzone-text">
                  クリックして画像を選択、またはドラッグ&ドロップ
                </p>
                <p className="dropzone-hint">PNG, JPEG, WebP など</p>
              </div>
            </div>
          </div>

          <aside
            className="info-box"
            role="complementary"
            aria-labelledby="usage-title"
          >
            <h3 id="usage-title">画像透過ツールとは</h3>
            <p>画像の特定の色を透明にするツールです。背景の除去やロゴの透過処理に便利です。</p>
            <h3>使い方</h3>
            <ol>
              <li>画像をアップロード</li>
              <li>透過させたい色を選択（カラーピッカーまたは画像クリック）</li>
              <li>許容範囲を調整してプレビュー確認</li>
              <li>「ダウンロード」でPNG保存</li>
            </ol>
          </aside>
        </>
      ) : imageDimensions && (
        /* 画像選択後：コンパクトな2カラムレイアウト */
        <div className="transparent-processor-layout">
          {/* 左カラム：プレビュー */}
          <div className="transparent-preview-column">
            <div className="transparent-preview-grid">
              <div className="transparent-preview-item">
                <span className="transparent-preview-label">元画像{isPickingColor && " (クリックで色選択)"}</span>
                <div className="transparent-canvas-wrapper">
                  <canvas
                    ref={originalCanvasRef}
                    className={`preview-canvas ${isPickingColor ? "picking-color" : ""}`}
                    onClick={handleCanvasClick}
                    aria-label="元画像プレビュー"
                  />
                </div>
              </div>
              <div className="transparent-preview-item">
                <span className="transparent-preview-label">透過後</span>
                <div className="transparent-canvas-wrapper transparent-preview-bg">
                  <canvas
                    ref={previewCanvasRef}
                    className="preview-canvas"
                    aria-label="透過後プレビュー"
                  />
                </div>
              </div>
            </div>
            <div className="transparent-image-meta">
              {imageDimensions.width} × {imageDimensions.height} px
            </div>
          </div>

          {/* 右カラム：設定とアクション */}
          <div className="transparent-settings-column">
            <div className="transparent-settings-card">
              <div className="transparent-color-section">
                <label className="transparent-label">透過する色</label>
                <div className="transparent-color-controls">
                  <input
                    type="color"
                    id="targetColor"
                    value={targetColor}
                    onChange={(e) => setTargetColor(e.target.value)}
                    disabled={isLoading}
                    className="transparent-color-input"
                  />
                  <input
                    type="text"
                    value={targetColor}
                    onChange={(e) => setTargetColor(e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    aria-label="透過色のHEX値"
                    disabled={isLoading}
                    className="transparent-hex-input"
                  />
                  <button
                    type="button"
                    className={`transparent-pick-btn ${isPickingColor ? "active" : ""}`}
                    onClick={() => setIsPickingColor(!isPickingColor)}
                    disabled={isLoading}
                    title="画像から色を選択"
                  >
                    {isPickingColor ? "✓" : "🎯"}
                  </button>
                </div>
              </div>

              <div className="transparent-tolerance-section">
                <label className="transparent-label">
                  許容範囲: <strong>{tolerance}%</strong>
                </label>
                <input
                  type="range"
                  id="tolerance"
                  min="0"
                  max="100"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value))}
                  disabled={isLoading}
                  className="transparent-slider"
                />
                <div className="transparent-slider-labels">
                  <span>厳密</span>
                  <span>緩和</span>
                </div>
              </div>

              <div className="transparent-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleDownload}
                  disabled={isLoading}
                >
                  {isLoading ? "処理中..." : "ダウンロード"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  クリア
                </button>
              </div>
            </div>

            <p className="transparent-tip">
              💡 「🎯」ボタンを押して元画像をクリックすると色を直接選択できます
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        id="imageFile"
        accept="image/*"
        onChange={handleInputChange}
        disabled={isLoading}
        className="hidden-file-input"
        aria-label="画像ファイルを選択"
      />
    </div>
  );
}
