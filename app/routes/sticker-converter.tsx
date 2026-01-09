import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";

export const Route = createFileRoute("/sticker-converter")({
  head: () => ({
    meta: [{ title: "スタンプコンバーター" }],
  }),
  component: StickerConverter,
});

type Platform = "discord" | "slack";
type OutputFormat = "png" | "webp";

const STICKER_LIMITS = {
  discord: { maxSize: 320, maxFileSize: 512 * 1024, label: "Discord (最大320x320px, 512KB)" },
  slack: { maxSize: 128, maxFileSize: 1024 * 1024, label: "Slack (最大128x128px, 1MB)" },
} as const;

const PREVIEW_SIZE = 256; // Preview display size

const FORMAT_LABELS: Record<OutputFormat, string> = {
  png: "PNG (ロスレス)",
  webp: "WebP (高圧縮)",
};

const FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
  png: "png",
  webp: "webp",
};

const FORMAT_MIME_TYPES: Record<OutputFormat, string> = {
  png: "image/png",
  webp: "image/webp",
};

/**
 * 画像をリサイズする
 * @param file - 元の画像ファイル
 * @param maxSize - 最大サイズ（正方形）
 * @returns リサイズ後の画像を含むcanvas
 */
export async function resizeImage(
  file: File,
  maxSize: number
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
      // アスペクト比を保持してリサイズ
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      canvas.width = Math.round(scaledWidth);
      canvas.height = Math.round(scaledHeight);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // BlobURLをクリーンアップ
      URL.revokeObjectURL(img.src);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * CanvasをBlobに変換（容量制限を満たすまで圧縮）
 * @param canvas - 変換元のcanvas
 * @param format - 出力フォーマット
 * @param quality - 品質 (0.0-1.0, PNGでは無視)
 * @param maxSize - 最大ファイルサイズ（バイト）
 * @returns Blob
 */
export async function canvasToBlobWithLimit(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number,
  maxSize: number
): Promise<Blob | null> {
  const mimeType = FORMAT_MIME_TYPES[format];

  // PNG is lossless, no quality adjustment
  if (format === "png") {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeType);
    });
    return blob;
  }

  // For WebP, try with specified quality first
  let currentQuality = quality;
  let blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), mimeType, currentQuality);
  });

  if (blob && blob.size <= maxSize) {
    return blob;
  }

  // If still too large, reduce quality incrementally
  while (currentQuality > 0.1) {
    currentQuality -= 0.05;
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeType, currentQuality);
    });

    if (blob && blob.size <= maxSize) {
      return blob;
    }
  }

  return blob;
}

function StickerConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<Platform>("discord");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [outputQuality, setOutputQuality] = useState<number>(0.92);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const processedImageRef = useRef<HTMLCanvasElement | null>(null);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
    }
  }, []);

  // プレビューキャンバス更新関数
  const updatePreviewCanvas = useCallback(() => {
    if (!canvasRef.current || !processedImageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set preview canvas size
    canvas.width = PREVIEW_SIZE;
    canvas.height = PREVIEW_SIZE;

    // Clear canvas
    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    // Center the image
    const sourceCanvas = processedImageRef.current;
    const scale = Math.min(PREVIEW_SIZE / sourceCanvas.width, PREVIEW_SIZE / sourceCanvas.height);
    const scaledWidth = sourceCanvas.width * scale;
    const scaledHeight = sourceCanvas.height * scale;
    const x = (PREVIEW_SIZE - scaledWidth) / 2;
    const y = (PREVIEW_SIZE - scaledHeight) / 2;

    ctx.drawImage(sourceCanvas, x, y, scaledWidth, scaledHeight);
  }, []);

  // 画像処理とプレビュー更新
  const processImage = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    announceStatus("画像を処理しています...");

    try {
      const limits = STICKER_LIMITS[platform];

      // リサイズ
      const resizedCanvas = await resizeImage(file, limits.maxSize);

      // Store processed image for preview
      processedImageRef.current = resizedCanvas;
      setImageDimensions({ width: resizedCanvas.width, height: resizedCanvas.height });

      // プレビュー更新
      updatePreviewCanvas();

      // Blob生成（容量制限適用）
      const blob = await canvasToBlobWithLimit(
        resizedCanvas,
        outputFormat,
        outputQuality,
        limits.maxFileSize
      );

      if (blob) {
        // 古いBlobURLがあればクリーンアップ
        setPreviewUrl((prevUrl) => {
          if (prevUrl) {
            URL.revokeObjectURL(prevUrl);
          }
          return URL.createObjectURL(blob);
        });
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
  }, [file, platform, outputFormat, outputQuality, updatePreviewCanvas, announceStatus]);

  // ファイルまたは設定変更時に画像を処理
  useEffect(() => {
    if (file) {
      processImage();
    }
  }, [file, platform, outputFormat, outputQuality, processImage]);

  // コンポーネントアンマウント時にBlobURLをクリーンアップ
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント解除時のみクリーンアップ

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

    const extension = FORMAT_EXTENSIONS[outputFormat];
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `sticker_${platform}_${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    announceStatus("ダウンロードしました");
  }, [previewUrl, outputFormat, platform, announceStatus]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreviewUrl("");
    setFileSize(0);
    setImageDimensions(null);
    announceStatus("リセットしました");
  }, [announceStatus]);

  return (
    <div className="tool-container">
      <h1>スタンプコンバーター</h1>
      <p className="page-subtitle">
        Discord・Slack用のスタンプ画像を生成
      </p>

      <div
        ref={statusRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      />

      <div className="converter-section">
        {/* ファイル選択 */}
        <section>
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
              <p className="dropzone-hint">PNG, JPEG, GIF, WebP対応</p>
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
              {(Object.keys(STICKER_LIMITS) as Platform[]).map((p) => (
                <option key={p} value={p}>
                  {STICKER_LIMITS[p].label}
                </option>
              ))}
            </select>
            <small id="platform-help" className="help-text">
              プラットフォームに応じて自動的にサイズと容量制限を適用します
            </small>
          </div>
        </section>

        {/* 出力形式選択 */}
        <section className="section">
          <h2 className="section-title">出力形式</h2>

          <div className="form-group">
            <label htmlFor="outputFormat" className="label">
              ファイル形式
            </label>
            <div className="format-selector">
              {(["png", "webp"] as OutputFormat[]).map((format) => (
                <label key={format} className="format-option">
                  <input
                    type="radio"
                    name="outputFormat"
                    value={format}
                    checked={outputFormat === format}
                    onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                  />
                  <span className="format-label">
                    {FORMAT_LABELS[format]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {outputFormat === "webp" && (
            <div className="form-group">
              <label htmlFor="outputQuality" className="label">
                品質: {Math.round(outputQuality * 100)}%
              </label>
              <input
                type="range"
                id="outputQuality"
                min="0.1"
                max="1.0"
                step="0.01"
                value={outputQuality}
                onChange={(e) => setOutputQuality(parseFloat(e.target.value))}
                className="slider"
              />
              <small className="help-text">
                品質を下げるとファイルサイズが小さくなります
              </small>
            </div>
          )}
        </section>

        {/* プレビュー */}
        {file && (
          <section className="section">
            <h2 className="section-title">プレビュー</h2>

            <div className="preview-container">
              <canvas
                ref={canvasRef}
                className="preview-canvas"
                aria-label="スタンププレビュー"
              />
            </div>

            {imageDimensions && (
              <div className="file-size-info">
                <p>
                  画像サイズ: {imageDimensions.width} x {imageDimensions.height} px
                </p>
              </div>
            )}

            <div className="file-size-info">
              <p>
                ファイルサイズ: {(fileSize / 1024).toFixed(1)} KB /{" "}
                {(STICKER_LIMITS[platform].maxFileSize / 1024).toFixed(0)} KB
              </p>
              {fileSize > STICKER_LIMITS[platform].maxFileSize && (
                <p className="error-text">容量制限を超えています</p>
              )}
            </div>

            <div className="button-group">
              <button
                onClick={handleDownload}
                disabled={isProcessing || !previewUrl}
                className="button button-primary btn-primary"
              >
                {isProcessing ? "処理中..." : "ダウンロード"}
              </button>

              <button onClick={handleReset} className="button button-secondary btn-clear">
                リセット
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
