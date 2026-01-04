import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";

export const Route = createFileRoute("/color-extractor")({
  head: () => ({
    meta: [{ title: "カラーコード抽出ツール" }],
  }),
  component: ColorExtractor,
});

interface Color {
  r: number;
  g: number;
  b: number;
  hex: string;
  count: number;
}

/**
 * RGBをHEXに変換する
 * @param r - 赤 (0-255)
 * @param g - 緑 (0-255)
 * @param b - 青 (0-255)
 * @returns HEXカラーコード
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("").toUpperCase();
}

/**
 * 2つの色の距離を計算する
 * @param c1 - 色1
 * @param c2 - 色2
 * @returns ユークリッド距離
 */
function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

/**
 * k-means法でカラーをクラスタリングする
 * @param pixels - ピクセルデータの配列
 * @param k - クラスター数
 * @param maxIterations - 最大反復回数
 * @returns クラスター中心の色配列
 */
export function extractColors(
  pixels: { r: number; g: number; b: number }[],
  k: number,
  maxIterations: number = 10
): Color[] {
  if (pixels.length === 0) return [];

  // 初期中心をランダムに選択
  const centers: { r: number; g: number; b: number }[] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    const index = Math.min(i * step, pixels.length - 1);
    centers.push({ ...pixels[index] });
  }

  // k-meansアルゴリズム
  for (let iter = 0; iter < maxIterations; iter++) {
    // 各ピクセルを最も近い中心に割り当て
    const clusters: number[][] = Array.from({ length: k }, () => []);

    pixels.forEach((pixel, index) => {
      let minDist = Infinity;
      let clusterIndex = 0;

      centers.forEach((center, i) => {
        const dist = colorDistance(pixel, center);
        if (dist < minDist) {
          minDist = dist;
          clusterIndex = i;
        }
      });

      clusters[clusterIndex].push(index);
    });

    // 新しい中心を計算
    let changed = false;
    clusters.forEach((cluster, i) => {
      if (cluster.length === 0) return;

      let sumR = 0, sumG = 0, sumB = 0;
      cluster.forEach((pixelIndex) => {
        sumR += pixels[pixelIndex].r;
        sumG += pixels[pixelIndex].g;
        sumB += pixels[pixelIndex].b;
      });

      const newCenter = {
        r: sumR / cluster.length,
        g: sumG / cluster.length,
        b: sumB / cluster.length,
      };

      if (colorDistance(centers[i], newCenter) > 1) {
        changed = true;
        centers[i] = newCenter;
      }
    });

    // 収束判定
    if (!changed) break;
  }

  // 結果を整形（カウント順にソート）
  return centers.map((center, i) => ({
    r: center.r,
    g: center.g,
    b: center.b,
    hex: rgbToHex(center.r, center.g, center.b),
    count: pixels.filter((pixel) => {
      let minDist = Infinity;
      let clusterIndex = 0;
      centers.forEach((c, j) => {
        const dist = colorDistance(pixel, c);
        if (dist < minDist) {
          minDist = dist;
          clusterIndex = j;
        }
      });
      return clusterIndex === i;
    }).length,
  })).sort((a, b) => b.count - a.count);
}

/**
 * 画像からピクセルデータを抽出する
 * @param imageData - ImageDataオブジェクト
 * @param sampleRate - サンプリングレート（1 = 全ピクセル、2 = 1/2、など）
 * @returns ピクセルデータの配列
 */
export function getPixelsFromImageData(
  imageData: ImageData,
  sampleRate: number = 10
): { r: number; g: number; b: number }[] {
  const pixels: { r: number; g: number; b: number }[] = [];
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    // アルファ値が128以上（半透明以上）のピクセルのみ考慮
    if (data[i + 3] >= 128) {
      pixels.push({
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
      });
    }
  }

  return pixels;
}

function ColorExtractor() {
  const [colors, setColors] = useState<Color[]>([]);
  const [colorCount, setColorCount] = useState(8);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      statusTimeoutRef.current = setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = "";
        }
      }, 3000);
    }
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  // imageSrcが設定されたらcanvasに画像を描画
  useEffect(() => {
    if (imageSrc && loadedImageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = loadedImageRef.current;
      if (ctx) {
        // キャンバスサイズを画像に合わせる（最大800px）
        const maxSize = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
      }
    }
  }, [imageSrc]);

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      announceStatus("画像ファイルを選択してください");
      return;
    }

    setIsProcessing(true);
    setColors([]);

    try {
      // 画像を読み込む
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        // 画像をrefに保存（後でcanvasに描画するため）
        loadedImageRef.current = img;

        // 一時的なcanvasでピクセルデータを取得
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        // キャンバスサイズを画像に合わせる（最大800px）
        const maxSize = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        tempCanvas.width = width;
        tempCanvas.height = height;

        // 画像を描画
        tempCtx.drawImage(img, 0, 0, width, height);

        // ピクセルデータを取得
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const pixels = getPixelsFromImageData(imageData, 10);

        // カラーを抽出
        const extractedColors = extractColors(pixels, colorCount);
        setColors(extractedColors);
        // imageSrcを設定すると、useEffectでcanvasに描画される
        setImageSrc(objectUrl);
        setIsProcessing(false);
        announceStatus(`${extractedColors.length}色を抽出しました`);
      };

      img.onerror = () => {
        announceStatus("画像の読み込みに失敗しました");
        setIsProcessing(false);
        URL.revokeObjectURL(objectUrl);
      };

      img.src = objectUrl;
    } catch (error) {
      console.error("Image processing error:", error);
      announceStatus("画像の処理中にエラーが発生しました");
      setIsProcessing(false);
    }
  }, [colorCount, announceStatus]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  }, [processImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processImage(file);
    }
  }, [processImage]);

  const handleColorCountChange = useCallback((value: number) => {
    setColorCount(Math.max(2, Math.min(20, value)));
  }, []);

  const handleReanalyze = useCallback(() => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsProcessing(true);

    // 既存のキャンバスから再分析
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = getPixelsFromImageData(imageData, 10);
    const extractedColors = extractColors(pixels, colorCount);
    setColors(extractedColors);
    setIsProcessing(false);
    announceStatus(`${extractedColors.length}色を抽出しました`);
  }, [imageSrc, colorCount, announceStatus]);

  const handleCopyColor = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      announceStatus(`${hex} をコピーしました`);
    }).catch(() => {
      announceStatus("コピーに失敗しました");
    });
  }, [announceStatus]);

  const handleCopyAllColors = useCallback(() => {
    const allColors = colors.map((c) => c.hex).join(", ");
    navigator.clipboard.writeText(allColors).then(() => {
      announceStatus("すべての色をコピーしました");
    }).catch(() => {
      announceStatus("コピーに失敗しました");
    });
  }, [colors, announceStatus]);

  return (
    <>
      <div className="tool-container">
        <div className="converter-section">
          <h2 className="section-title">画像アップロード</h2>

          <div
            className={`dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="画像をアップロード"
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
              <p className="dropzone-hint">PNG, JPEG, WebP, GIF対応</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
            aria-label="画像ファイル選択"
          />

          {imageSrc && (
            <>
              <div className="option-group">
                <label htmlFor="colorCount">抽出する色数: {colorCount}</label>
                <input
                  type="range"
                  id="colorCount"
                  min="2"
                  max="20"
                  value={colorCount}
                  onChange={(e) => handleColorCountChange(parseInt(e.target.value))}
                  aria-describedby="colorCount-help"
                />
                <span id="colorCount-help" className="sr-only">
                  2から20色の間で抽出する色数を指定できます
                </span>
              </div>

              <Button
                type="button"
                onClick={handleReanalyze}
                disabled={isProcessing}
              >
                {isProcessing ? "分析中..." : "再分析"}
              </Button>
            </>
          )}
        </div>

        {/* Canvas always exists in DOM for processing, parent controls visibility */}
        <div className="converter-section preview-section" style={imageSrc ? {} : { position: 'absolute', left: '-9999px', visibility: 'hidden' }}>
          <h2 className="section-title">プレビュー</h2>
          <div className="preview-container">
            <canvas ref={canvasRef} aria-label="アップロードされた画像" />
          </div>
        </div>

        {colors.length > 0 && (
          <div className="converter-section">
            <h2 className="section-title">
              抽出されたカラーコード
              <Button
                type="button"
                className="btn-copy-all"
                onClick={handleCopyAllColors}
                aria-label="すべての色をコピー"
              >
                すべてコピー
              </Button>
            </h2>

            <div className="color-grid">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="color-card"
                  onClick={() => handleCopyColor(color.hex)}
                  role="button"
                  tabIndex={0}
                  aria-label={`色 ${color.hex}、使用率 ${((color.count / colors.reduce((sum, c) => sum + c.count, 0)) * 100).toFixed(1)}%`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCopyColor(color.hex);
                    }
                  }}
                >
                  <div
                    className="color-swatch"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />
                  <div className="color-info">
                    <div className="color-hex">{color.hex}</div>
                    <div className="color-rgb">
                      RGB({Math.round(color.r)}, {Math.round(color.g)}, {Math.round(color.b)})
                    </div>
                    <div className="color-usage">
                      使用率: {((color.count / colors.reduce((sum, c) => sum + c.count, 0)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <TipsCard
          sections={[
            {
              title: "カラーコード抽出とは",
              items: [
                "画像から主要な色を抽出してカラーコードを表示します",
                "k-meansクラスタリングを使用して代表的な色を分析",
                "デザインの配色確認やカラーパレット作成に便利",
              ],
            },
            {
              title: "使い方",
              items: [
                "画像をアップロード（クリックまたはドラッグ&ドロップ）",
                "抽出する色数を調整（2〜20色）",
                "抽出された色をクリックしてコピー",
                "「すべてコピー」ですべての色をまとめてコピー",
              ],
            },
            {
              title: "ヒント",
              items: [
                "色数を増やすと、より細かい色の違いを検出します",
                "色数を減らすと、主要な色のみを抽出します",
                "使用率は画像内でその色が占める割合を示します",
              ],
            },
          ]}
        />
      </div>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

    </>
  );
}
