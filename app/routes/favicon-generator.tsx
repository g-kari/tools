import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "../components/Toast";
import JSZip from "jszip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/favicon-generator")({
  head: () => ({
    meta: [{ title: "Favicon生成ツール" }],
  }),
  component: FaviconGenerator,
});

/**
 * Faviconサイズの定義
 */
interface FaviconSize {
  /** サイズ名 */
  name: string;
  /** 幅（ピクセル） */
  width: number;
  /** 高さ（ピクセル） */
  height: number;
  /** ファイル名 */
  filename: string;
  /** 説明 */
  description: string;
  /** デフォルトで選択するか */
  defaultSelected: boolean;
}

/**
 * 利用可能なFaviconサイズ一覧
 */
const FAVICON_SIZES: FaviconSize[] = [
  { name: "16x16", width: 16, height: 16, filename: "favicon-16x16.png", description: "標準favicon", defaultSelected: true },
  { name: "32x32", width: 32, height: 32, filename: "favicon-32x32.png", description: "高解像度favicon", defaultSelected: true },
  { name: "48x48", width: 48, height: 48, filename: "favicon-48x48.png", description: "Windows用", defaultSelected: true },
  { name: "64x64", width: 64, height: 64, filename: "favicon-64x64.png", description: "拡大表示用", defaultSelected: false },
  { name: "128x128", width: 128, height: 128, filename: "favicon-128x128.png", description: "Chrome Web Store", defaultSelected: false },
  { name: "180x180", width: 180, height: 180, filename: "apple-touch-icon.png", description: "Apple Touch Icon", defaultSelected: true },
  { name: "192x192", width: 192, height: 192, filename: "android-chrome-192x192.png", description: "Android Chrome", defaultSelected: true },
  { name: "256x256", width: 256, height: 256, filename: "favicon-256x256.png", description: "高解像度用", defaultSelected: false },
  { name: "512x512", width: 512, height: 512, filename: "android-chrome-512x512.png", description: "Android Chrome大", defaultSelected: true },
];

/**
 * 画像を指定サイズにリサイズしてBlobを生成する
 * @param img - 元画像
 * @param width - 出力幅
 * @param height - 出力高さ
 * @returns PNG形式のBlob
 */
export function resizeImage(
  img: HTMLImageElement,
  width: number,
  height: number
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

    // 高品質なリサイズを行う
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * 複数のFaviconを生成する
 * @param img - 元画像
 * @param sizes - 生成するサイズ一覧
 * @returns ファイル名とBlobのMap
 */
export async function generateFavicons(
  img: HTMLImageElement,
  sizes: FaviconSize[]
): Promise<Map<string, Blob>> {
  const favicons = new Map<string, Blob>();

  for (const size of sizes) {
    const blob = await resizeImage(img, size.width, size.height);
    if (blob) {
      favicons.set(size.filename, blob);
    }
  }

  return favicons;
}

/**
 * FaviconsをZIPファイルとしてダウンロードする
 * @param favicons - ファイル名とBlobのMap
 * @returns ZIPファイルのBlob
 */
export async function createFaviconsZip(
  favicons: Map<string, Blob>
): Promise<Blob> {
  const zip = new JSZip();

  for (const [filename, blob] of favicons) {
    zip.file(filename, blob);
  }

  return zip.generateAsync({ type: "blob" });
}

/**
 * チェッカーボードパターンを描画する
 * @param ctx - CanvasRenderingContext2D
 * @param width - キャンバスの幅
 * @param height - キャンバスの高さ
 * @param cellSize - チェッカーボードのセルサイズ
 */
function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cellSize: number = 8
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

function FaviconGenerator() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(
    new Set(FAVICON_SIZES.filter((s) => s.defaultSelected).map((s) => s.name))
  );
  const [generatedFavicons, setGeneratedFavicons] = useState<Map<string, Blob>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const { showToast } = useToast();

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
    };
  }, [originalPreview]);

  // プレビューを更新
  const updatePreviews = useCallback(() => {
    if (!imageRef.current) return;

    for (const size of FAVICON_SIZES) {
      const canvas = previewCanvasRefs.current.get(size.name);
      if (!canvas) continue;

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      // プレビューは固定サイズで表示
      const displaySize = Math.min(size.width, 64);
      canvas.width = displaySize;
      canvas.height = displaySize;

      // チェッカーボードを描画
      drawCheckerboard(ctx, displaySize, displaySize, 4);

      // 画像を描画
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imageRef.current, 0, 0, displaySize, displaySize);
    }
  }, []);

  useEffect(() => {
    if (imageDimensions) {
      updatePreviews();
    }
  }, [imageDimensions, updatePreviews]);

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
      setGeneratedFavicons(new Map());

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

  const handleSizeToggle = useCallback((sizeName: string) => {
    setSelectedSizes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sizeName)) {
        newSet.delete(sizeName);
      } else {
        newSet.add(sizeName);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedSizes(new Set(FAVICON_SIZES.map((s) => s.name)));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedSizes(new Set());
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!imageRef.current || selectedSizes.size === 0) {
      showToast("画像とサイズを選択してください", "error");
      return;
    }

    setIsLoading(true);

    const sizesToGenerate = FAVICON_SIZES.filter((s) => selectedSizes.has(s.name));
    const favicons = await generateFavicons(imageRef.current, sizesToGenerate);
    setGeneratedFavicons(favicons);

    setIsLoading(false);
    showToast(`${favicons.size}個のFaviconを生成しました`, "success");
  }, [selectedSizes, showToast]);

  const handleDownloadAll = useCallback(async () => {
    if (generatedFavicons.size === 0) {
      showToast("先にFaviconを生成してください", "error");
      return;
    }

    setIsLoading(true);

    const zipBlob = await createFaviconsZip(generatedFavicons);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "favicons.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsLoading(false);
    showToast("ZIPファイルをダウンロードしました", "success");
  }, [generatedFavicons, showToast]);

  const handleDownloadSingle = useCallback(
    (filename: string) => {
      const blob = generatedFavicons.get(filename);
      if (!blob) {
        showToast("ファイルが見つかりません", "error");
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`${filename}をダウンロードしました`, "success");
    },
    [generatedFavicons, showToast]
  );

  const handleClear = useCallback(() => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);

    setOriginalFile(null);
    setOriginalPreview(null);
    setGeneratedFavicons(new Map());
    setImageDimensions(null);
    imageRef.current = null;

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    showToast("クリアしました", "info");
  }, [originalPreview, showToast]);

  const setPreviewCanvasRef = useCallback((name: string, el: HTMLCanvasElement | null) => {
    if (el) {
      previewCanvasRefs.current.set(name, el);
    } else {
      previewCanvasRefs.current.delete(name);
    }
  }, []);

  return (
    <div className="tool-container">
      {!originalFile ? (
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
                <p className="dropzone-hint">PNG, JPEG, SVG など（正方形推奨）</p>
              </div>
            </div>
          </div>

          <aside
            className="info-box"
            role="complementary"
            aria-labelledby="usage-title"
          >
            <h3 id="usage-title">Favicon生成ツールとは</h3>
            <p>画像から複数サイズのFaviconを一括生成するツールです。</p>
            <h3>使い方</h3>
            <ol>
              <li>元画像をアップロード（正方形推奨）</li>
              <li>生成するサイズを選択</li>
              <li>「Favicon生成」ボタンをクリック</li>
              <li>一括ダウンロード、または個別にダウンロード</li>
            </ol>
            <h3>生成可能なファイル</h3>
            <ul>
              <li><strong>favicon-16x16.png / 32x32.png</strong>: 標準的なfavicon</li>
              <li><strong>apple-touch-icon.png</strong>: iOS用アイコン（180x180）</li>
              <li><strong>android-chrome-*.png</strong>: Android用アイコン</li>
            </ul>
          </aside>
        </>
      ) : (
        <>
          <div className="converter-section">
            <h2 className="section-title">元画像</h2>
            <div className="favicon-source-preview">
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="元画像プレビュー"
                  className="favicon-source-image"
                />
              )}
              {imageDimensions && (
                <div className="favicon-source-info">
                  <span>{originalFile?.name}</span>
                  <span>{imageDimensions.width} × {imageDimensions.height} px</span>
                  {imageDimensions.width !== imageDimensions.height && (
                    <span className="favicon-warning">
                      ※ 正方形でない画像は引き伸ばされます
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClear}
              disabled={isLoading}
            >
              別の画像を選択
            </button>
          </div>

          <div className="converter-section">
            <h2 className="section-title">生成サイズ</h2>
            <div className="favicon-size-actions">
              <button
                type="button"
                className="btn-text"
                onClick={handleSelectAll}
                disabled={isLoading}
              >
                すべて選択
              </button>
              <button
                type="button"
                className="btn-text"
                onClick={handleDeselectAll}
                disabled={isLoading}
              >
                すべて解除
              </button>
            </div>
            <div className="favicon-size-grid" role="group" aria-label="生成サイズ選択">
              {FAVICON_SIZES.map((size) => (
                <div
                  key={size.name}
                  className={`favicon-size-item ${selectedSizes.has(size.name) ? "selected" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`size-${size.name}`}
                      checked={selectedSizes.has(size.name)}
                      onCheckedChange={() => handleSizeToggle(size.name)}
                      disabled={isLoading}
                      aria-describedby={`size-desc-${size.name}`}
                    />
                    <Label htmlFor={`size-${size.name}`} className="cursor-pointer sr-only">
                      {size.name}
                    </Label>
                  </div>
                  <canvas
                    ref={(el) => setPreviewCanvasRef(size.name, el)}
                    className="favicon-preview-canvas"
                    aria-hidden="true"
                  />
                  <div className="favicon-size-info">
                    <span className="favicon-size-name">{size.name}</span>
                    <span id={`size-desc-${size.name}`} className="favicon-size-desc">
                      {size.description}
                    </span>
                    <span className="favicon-size-filename">{size.filename}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="converter-section">
            <div className="button-group" role="group" aria-label="操作ボタン">
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerate}
                disabled={isLoading || selectedSizes.size === 0}
              >
                {isLoading ? "生成中..." : "Favicon生成"}
              </button>
              {generatedFavicons.size > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleDownloadAll}
                  disabled={isLoading}
                >
                  ZIPで一括ダウンロード
                </button>
              )}
            </div>
          </div>

          {generatedFavicons.size > 0 && (
            <div className="converter-section">
              <h2 className="section-title">生成結果</h2>
              <div className="favicon-result-grid">
                {Array.from(generatedFavicons.entries()).map(([filename]) => {
                  const sizeInfo = FAVICON_SIZES.find((s) => s.filename === filename);
                  return (
                    <div key={filename} className="favicon-result-item">
                      <span className="favicon-result-name">{filename}</span>
                      {sizeInfo && (
                        <span className="favicon-result-size">{sizeInfo.width}×{sizeInfo.height}</span>
                      )}
                      <button
                        type="button"
                        className="btn-download-small"
                        onClick={() => handleDownloadSingle(filename)}
                        aria-label={`${filename}をダウンロード`}
                      >
                        ダウンロード
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <aside
            className="info-box"
            role="complementary"
            aria-labelledby="html-code-title"
          >
            <h3 id="html-code-title">HTMLへの組み込み</h3>
            <p>以下のコードをHTMLの<code>&lt;head&gt;</code>内に追加してください:</p>
            <pre className="favicon-code-block">
{`<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`}
            </pre>
          </aside>
        </>
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
