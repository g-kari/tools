import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";

export const Route = createFileRoute("/emoji-converter")({
  head: () => ({
    meta: [{ title: "絵文字コンバーター" }],
  }),
  component: EmojiConverter,
});

type Platform = "discord" | "slack";

const PLATFORM_LIMITS = {
  discord: { maxSize: 256 * 1024, label: "Discord (最大256KB)" },
  slack: { maxSize: 1024 * 1024, label: "Slack (最大1MB)" },
} as const;

const EMOJI_SIZE = 128;

interface EditOptions {
  text: string;
  fontSize: number;
  textColor: string;
  textX: number;
  textY: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  transparent: boolean;
  transparentColor: string;
  border: boolean;
  borderWidth: number;
  borderColor: string;
}

const DEFAULT_EDIT_OPTIONS: EditOptions = {
  text: "",
  fontSize: 24,
  textColor: "#FFFFFF",
  textX: 50,
  textY: 50,
  rotation: 0,
  flipH: false,
  flipV: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  transparent: false,
  transparentColor: "#FFFFFF",
  border: false,
  borderWidth: 2,
  borderColor: "#000000",
};

/**
 * 画像をリサイズする
 * @param file - 元の画像ファイル
 * @param size - リサイズ後のサイズ（正方形）
 * @returns リサイズ後の画像を含むcanvas
 */
export async function resizeImage(
  file: File,
  size: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;

      // アスペクト比を保持してリサイズ
      const scale = Math.min(size / img.width, size / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (size - scaledWidth) / 2;
      const y = (size - scaledHeight) / 2;

      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      resolve(canvas);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 編集オプションを適用した画像を生成
 * @param sourceCanvas - 元のcanvas
 * @param options - 編集オプション
 * @returns 編集後の画像を含むcanvas
 */
export function applyEditOptions(
  sourceCanvas: HTMLCanvasElement,
  options: EditOptions
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) return sourceCanvas;

  ctx.save();

  // 回転・反転の中心を設定
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // 反転
  if (options.flipH || options.flipV) {
    ctx.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1);
  }

  // 回転
  if (options.rotation !== 0) {
    ctx.rotate((options.rotation * Math.PI) / 180);
  }

  // 元の画像を描画
  ctx.drawImage(
    sourceCanvas,
    -canvas.width / 2,
    -canvas.height / 2,
    canvas.width,
    canvas.height
  );

  ctx.restore();

  // フィルター適用
  if (
    options.brightness !== 100 ||
    options.contrast !== 100 ||
    options.saturation !== 100
  ) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyFilters(imageData, options);
    ctx.putImageData(imageData, 0, 0);
  }

  // 透過処理
  if (options.transparent) {
    applyTransparency(ctx, canvas.width, canvas.height, options.transparentColor);
  }

  // 枠線追加
  if (options.border) {
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth;
    ctx.strokeRect(
      options.borderWidth / 2,
      options.borderWidth / 2,
      canvas.width - options.borderWidth,
      canvas.height - options.borderWidth
    );
  }

  // テキスト埋め込み
  if (options.text) {
    ctx.font = `bold ${options.fontSize}px 'Noto Sans JP', sans-serif`;
    ctx.fillStyle = options.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const x = (canvas.width * options.textX) / 100;
    const y = (canvas.height * options.textY) / 100;
    ctx.fillText(options.text, x, y);
  }

  return canvas;
}

/**
 * フィルターを適用
 * @param imageData - ImageData
 * @param options - 編集オプション
 */
function applyFilters(imageData: ImageData, options: EditOptions): void {
  const data = imageData.data;
  const brightness = options.brightness / 100;
  const contrast = options.contrast / 100;
  const saturation = options.saturation / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 明るさ
    r *= brightness;
    g *= brightness;
    b *= brightness;

    // コントラスト
    r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
    g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
    b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

    // 彩度
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }
}

/**
 * 指定色を透過させる
 * @param ctx - CanvasRenderingContext2D
 * @param width - キャンバス幅
 * @param height - キャンバス高さ
 * @param color - 透過させる色（HEX形式）
 */
function applyTransparency(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // HEXをRGBに変換
  const hex = color.replace("#", "");
  const targetR = parseInt(hex.substring(0, 2), 16);
  const targetG = parseInt(hex.substring(2, 4), 16);
  const targetB = parseInt(hex.substring(4, 6), 16);

  const threshold = 30; // 色の許容範囲

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // 指定色に近い色を透過
    if (
      Math.abs(r - targetR) < threshold &&
      Math.abs(g - targetG) < threshold &&
      Math.abs(b - targetB) < threshold
    ) {
      data[i + 3] = 0; // アルファチャンネルを0に
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * CanvasをBlobに変換（容量制限を満たすまで圧縮）
 * @param canvas - 変換元のcanvas
 * @param maxSize - 最大ファイルサイズ（バイト）
 * @returns Blob
 */
export async function canvasToBlobWithLimit(
  canvas: HTMLCanvasElement,
  maxSize: number
): Promise<Blob | null> {
  let quality = 0.95;
  let blob: Blob | null = null;

  while (quality > 0.1) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png", quality);
    });

    if (blob && blob.size <= maxSize) {
      return blob;
    }

    quality -= 0.05;
  }

  return blob;
}

function EmojiConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<Platform>("discord");
  const [editOptions, setEditOptions] = useState<EditOptions>(DEFAULT_EDIT_OPTIONS);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
    }
  }, []);

  // 画像処理とプレビュー更新
  const processImage = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    announceStatus("画像を処理しています...");

    try {
      // リサイズ
      const resizedCanvas = await resizeImage(file, EMOJI_SIZE);

      // 編集オプション適用
      const editedCanvas = applyEditOptions(resizedCanvas, editOptions);

      // プレビュー更新
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          canvasRef.current.width = EMOJI_SIZE;
          canvasRef.current.height = EMOJI_SIZE;
          ctx.drawImage(editedCanvas, 0, 0);
        }
      }

      // Blob生成（容量制限適用）
      const maxSize = PLATFORM_LIMITS[platform].maxSize;
      const blob = await canvasToBlobWithLimit(editedCanvas, maxSize);

      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setFileSize(blob.size);
        announceStatus(`処理完了（${(blob.size / 1024).toFixed(1)} KB）`);
      } else {
        announceStatus("容量制限内に圧縮できませんでした");
      }
    } catch (error) {
      announceStatus("画像の処理に失敗しました");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, [file, platform, editOptions, announceStatus]);

  // ファイルまたは編集オプション変更時に画像を処理
  useEffect(() => {
    if (file) {
      processImage();
    }
  }, [file, platform, editOptions, processImage]);

  const handleFileChange = useCallback(
    (selectedFile: File | null) => {
      if (selectedFile && selectedFile.type.startsWith("image/")) {
        setFile(selectedFile);
        announceStatus(`ファイルを選択しました: ${selectedFile.name}`);
      } else {
        announceStatus("画像ファイルを選択してください");
      }
    },
    [announceStatus]
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

      const droppedFile = e.dataTransfer.files[0];
      handleFileChange(droppedFile);
    },
    [handleFileChange]
  );

  const handleDropzoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDropzoneKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleDropzoneClick();
      }
    },
    [handleDropzoneClick]
  );

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;

    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `emoji_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    announceStatus("ダウンロードしました");
  }, [previewUrl, announceStatus]);

  const handleReset = useCallback(() => {
    setFile(null);
    setEditOptions(DEFAULT_EDIT_OPTIONS);
    setPreviewUrl("");
    setFileSize(0);
    announceStatus("リセットしました");
  }, [announceStatus]);

  const updateEditOption = <K extends keyof EditOptions>(
    key: K,
    value: EditOptions[K]
  ) => {
    setEditOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">絵文字コンバーター</h1>
        <p className="subtitle">
          Discord・Slack用の絵文字を作成（画像編集機能付き）
        </p>
      </header>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      />

      <main className="main">
        {/* ファイル選択 */}
        <section className="section">
          <h2 className="section-title">ファイル選択</h2>

          <div
            className={`dropzone ${isDragging ? "dragging" : ""}`}
            onClick={handleDropzoneClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={handleDropzoneKeyDown}
            role="button"
            tabIndex={0}
            aria-label="画像ファイルをアップロード"
          >
            <div className="dropzone-content">
              <div className="upload-icon" aria-hidden="true">
                📁
              </div>
              <p className="dropzone-text">
                クリックして画像を選択、またはドラッグ&ドロップ
              </p>
              <p className="dropzone-hint">PNG, JPEG, GIF対応</p>
            </div>

            <input
              ref={fileInputRef}
              id="imageFile"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="file-input"
              aria-label="画像ファイルを選択"
            />
          </div>

          {file && (
            <div className="file-info">
              <p>
                <strong>選択中:</strong> {file.name}
              </p>
            </div>
          )}
        </section>

        {/* プラットフォーム選択 */}
        <section className="section">
          <h2 className="section-title">プラットフォーム</h2>

          <div className="form-group">
            <label htmlFor="platform" className="label">
              使用先
            </label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="select"
              aria-describedby="platform-help"
            >
              {(Object.keys(PLATFORM_LIMITS) as Platform[]).map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LIMITS[p].label}
                </option>
              ))}
            </select>
            <small id="platform-help" className="help-text">
              プラットフォームに応じて自動的に容量制限を適用します
            </small>
          </div>
        </section>

        {/* 編集オプション */}
        {file && (
          <section className="section">
            <h2 className="section-title">編集オプション</h2>

            {/* テキスト埋め込み */}
            <details className="details">
              <summary className="details-summary">テキスト埋め込み</summary>
              <div className="details-content">
                <div className="form-group">
                  <label htmlFor="text" className="label">
                    テキスト
                  </label>
                  <input
                    id="text"
                    type="text"
                    value={editOptions.text}
                    onChange={(e) => updateEditOption("text", e.target.value)}
                    className="input"
                    placeholder="絵文字に表示するテキスト"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fontSize" className="label">
                    フォントサイズ: {editOptions.fontSize}px
                  </label>
                  <input
                    id="fontSize"
                    type="range"
                    min="8"
                    max="64"
                    value={editOptions.fontSize}
                    onChange={(e) =>
                      updateEditOption("fontSize", Number(e.target.value))
                    }
                    className="range"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="textColor" className="label">
                    テキスト色
                  </label>
                  <input
                    id="textColor"
                    type="color"
                    value={editOptions.textColor}
                    onChange={(e) => updateEditOption("textColor", e.target.value)}
                    className="color-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="textX" className="label">
                    X位置: {editOptions.textX}%
                  </label>
                  <input
                    id="textX"
                    type="range"
                    min="0"
                    max="100"
                    value={editOptions.textX}
                    onChange={(e) =>
                      updateEditOption("textX", Number(e.target.value))
                    }
                    className="range"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="textY" className="label">
                    Y位置: {editOptions.textY}%
                  </label>
                  <input
                    id="textY"
                    type="range"
                    min="0"
                    max="100"
                    value={editOptions.textY}
                    onChange={(e) =>
                      updateEditOption("textY", Number(e.target.value))
                    }
                    className="range"
                  />
                </div>
              </div>
            </details>

            {/* 回転・反転 */}
            <details className="details">
              <summary className="details-summary">回転・反転</summary>
              <div className="details-content">
                <div className="form-group">
                  <label htmlFor="rotation" className="label">
                    回転: {editOptions.rotation}°
                  </label>
                  <input
                    id="rotation"
                    type="range"
                    min="0"
                    max="360"
                    value={editOptions.rotation}
                    onChange={(e) =>
                      updateEditOption("rotation", Number(e.target.value))
                    }
                    className="range"
                  />
                </div>

                <div className="checkbox-group">
                  <label className="md3-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={editOptions.flipH}
                      onChange={(e) => updateEditOption("flipH", e.target.checked)}
                    />
                    <span className="md3-checkbox" />
                    <span className="md3-checkbox-label">左右反転</span>
                  </label>

                  <label className="md3-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={editOptions.flipV}
                      onChange={(e) => updateEditOption("flipV", e.target.checked)}
                    />
                    <span className="md3-checkbox" />
                    <span className="md3-checkbox-label">上下反転</span>
                  </label>
                </div>
              </div>
            </details>

            {/* フィルター */}
            <details className="details">
              <summary className="details-summary">フィルター</summary>
              <div className="details-content">
                <div className="form-group">
                  <label htmlFor="brightness" className="label">
                    明るさ: {editOptions.brightness}%
                  </label>
                  <input
                    id="brightness"
                    type="range"
                    min="0"
                    max="200"
                    value={editOptions.brightness}
                    onChange={(e) =>
                      updateEditOption("brightness", Number(e.target.value))
                    }
                    className="range"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contrast" className="label">
                    コントラスト: {editOptions.contrast}%
                  </label>
                  <input
                    id="contrast"
                    type="range"
                    min="0"
                    max="200"
                    value={editOptions.contrast}
                    onChange={(e) =>
                      updateEditOption("contrast", Number(e.target.value))
                    }
                    className="range"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="saturation" className="label">
                    彩度: {editOptions.saturation}%
                  </label>
                  <input
                    id="saturation"
                    type="range"
                    min="0"
                    max="200"
                    value={editOptions.saturation}
                    onChange={(e) =>
                      updateEditOption("saturation", Number(e.target.value))
                    }
                    className="range"
                  />
                </div>
              </div>
            </details>

            {/* 透過処理 */}
            <details className="details">
              <summary className="details-summary">透過処理</summary>
              <div className="details-content">
                <div className="checkbox-group">
                  <label className="md3-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={editOptions.transparent}
                      onChange={(e) =>
                        updateEditOption("transparent", e.target.checked)
                      }
                    />
                    <span className="md3-checkbox" />
                    <span className="md3-checkbox-label">指定色を透過</span>
                  </label>
                </div>

                {editOptions.transparent && (
                  <div className="form-group">
                    <label htmlFor="transparentColor" className="label">
                      透過する色
                    </label>
                    <input
                      id="transparentColor"
                      type="color"
                      value={editOptions.transparentColor}
                      onChange={(e) =>
                        updateEditOption("transparentColor", e.target.value)
                      }
                      className="color-input"
                    />
                  </div>
                )}
              </div>
            </details>

            {/* 枠線 */}
            <details className="details">
              <summary className="details-summary">枠線</summary>
              <div className="details-content">
                <div className="checkbox-group">
                  <label className="md3-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={editOptions.border}
                      onChange={(e) => updateEditOption("border", e.target.checked)}
                    />
                    <span className="md3-checkbox" />
                    <span className="md3-checkbox-label">枠線を追加</span>
                  </label>
                </div>

                {editOptions.border && (
                  <>
                    <div className="form-group">
                      <label htmlFor="borderWidth" className="label">
                        枠線の太さ: {editOptions.borderWidth}px
                      </label>
                      <input
                        id="borderWidth"
                        type="range"
                        min="1"
                        max="10"
                        value={editOptions.borderWidth}
                        onChange={(e) =>
                          updateEditOption("borderWidth", Number(e.target.value))
                        }
                        className="range"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="borderColor" className="label">
                        枠線の色
                      </label>
                      <input
                        id="borderColor"
                        type="color"
                        value={editOptions.borderColor}
                        onChange={(e) =>
                          updateEditOption("borderColor", e.target.value)
                        }
                        className="color-input"
                      />
                    </div>
                  </>
                )}
              </div>
            </details>
          </section>
        )}

        {/* プレビュー */}
        {file && (
          <section className="section">
            <h2 className="section-title">プレビュー</h2>

            <div className="preview-container">
              <canvas
                ref={canvasRef}
                className="preview-canvas"
                aria-label="編集後の絵文字プレビュー"
              />
            </div>

            <div className="file-size-info">
              <p>
                ファイルサイズ: {(fileSize / 1024).toFixed(1)} KB /{" "}
                {(PLATFORM_LIMITS[platform].maxSize / 1024).toFixed(0)} KB
              </p>
              {fileSize > PLATFORM_LIMITS[platform].maxSize && (
                <p className="error-text">容量制限を超えています</p>
              )}
            </div>

            <div className="button-group">
              <button
                onClick={handleDownload}
                disabled={isProcessing || !previewUrl}
                className="button button-primary"
              >
                {isProcessing ? "処理中..." : "ダウンロード"}
              </button>

              <button onClick={handleReset} className="button button-secondary">
                リセット
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
