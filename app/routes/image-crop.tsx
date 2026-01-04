import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "../components/Toast";
import { Button } from "~/components/ui/button";
import { TipsCard } from "~/components/TipsCard";
import { ImageUploadZone } from "~/components/ImageUploadZone";
import { formatFileSize, downloadBlob } from "~/utils/image";

export const Route = createFileRoute("/image-crop")({
  head: () => ({
    meta: [{ title: "画像トリミングツール" }],
  }),
  component: ImageCropper,
});

/**
 * トリミング範囲の型定義
 */
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * アスペクト比プリセットの型定義
 */
interface AspectRatioPreset {
  label: string;
  ratio: number | null; // nullは自由比率
}

/**
 * リサイズハンドルの位置
 */
type ResizeHandle =
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "e"
  | "w"
  | "move"
  | null;

/**
 * アスペクト比プリセット
 */
const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { label: "自由", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "2:3", ratio: 2 / 3 },
];


/**
 * 画像をトリミングする
 * @param file - トリミングする画像ファイル
 * @param cropArea - トリミング範囲
 * @param originalWidth - 元の画像の幅
 * @param originalHeight - 元の画像の高さ
 * @returns トリミングされたBlobを含むPromise
 */
async function cropImage(
  file: File,
  cropArea: CropArea,
  originalWidth: number,
  originalHeight: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      // 高品質なレンダリング設定
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // トリミング処理
      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      // 元のファイル形式を保持
      let mimeType = file.type;
      if (!mimeType || mimeType === "image/gif") {
        mimeType = "image/png";
      }

      canvas.toBlob(
        (blob) => resolve(blob),
        mimeType,
        0.95 // 高品質
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * ダウンロード用のファイル名を生成する
 * @param originalName - 元のファイル名
 * @returns 新しいファイル名
 */
function generateFilename(originalName: string): string {
  const ext = originalName.match(/\.[^/.]+$/)?.[0] || ".png";
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExt}_cropped${ext}`;
}

function ImageCropper() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // トリミング関連のstate
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [initialCropArea, setInitialCropArea] = useState<CropArea | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasScaleRef = useRef<number>(1);
  const { showToast } = useToast();

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (croppedPreview) URL.revokeObjectURL(croppedPreview);
    };
  }, [originalPreview, croppedPreview]);

  /**
   * ファイル選択時の処理
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast("画像ファイルを選択してください", "error");
        return;
      }

      // 前回のプレビューをクリーンアップ
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (croppedPreview) URL.revokeObjectURL(croppedPreview);

      const previewUrl = URL.createObjectURL(file);
      setOriginalFile(file);
      setOriginalPreview(previewUrl);
      setCroppedBlob(null);
      setCroppedPreview(null);

      // 画像のサイズを取得
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        // デフォルトのトリミング範囲を中央に設定
        const defaultSize = Math.min(img.width, img.height) * 0.8;
        setCropArea({
          x: (img.width - defaultSize) / 2,
          y: (img.height - defaultSize) / 2,
          width: defaultSize,
          height: defaultSize,
        });
      };
      img.src = previewUrl;
    },
    [originalPreview, croppedPreview, showToast]
  );


  /**
   * クリア処理
   */
  const handleClear = useCallback(() => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (croppedPreview) URL.revokeObjectURL(croppedPreview);

    setOriginalFile(null);
    setOriginalPreview(null);
    setOriginalDimensions(null);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setAspectRatio(null);

    showToast("クリアしました", "info");
  }, [originalPreview, croppedPreview, showToast]);

  /**
   * アスペクト比を適用する
   */
  const applyAspectRatio = useCallback(
    (ratio: number | null) => {
      setAspectRatio(ratio);

      if (ratio === null || !originalDimensions) return;

      setCropArea((prev) => {
        const newWidth = prev.width;
        const newHeight = newWidth / ratio;

        // 画像の範囲内に収める
        if (prev.y + newHeight > originalDimensions.height) {
          const adjustedHeight = originalDimensions.height - prev.y;
          const adjustedWidth = adjustedHeight * ratio;
          return {
            ...prev,
            width: adjustedWidth,
            height: adjustedHeight,
          };
        }

        return {
          ...prev,
          height: newHeight,
        };
      });
    },
    [originalDimensions]
  );

  /**
   * トリミング範囲の手動変更
   */
  const handleCropInputChange = useCallback(
    (field: keyof CropArea, value: number) => {
      if (!originalDimensions) return;

      setCropArea((prev) => {
        const newArea = { ...prev, [field]: value };

        // 範囲チェック
        newArea.x = Math.max(0, Math.min(newArea.x, originalDimensions.width - newArea.width));
        newArea.y = Math.max(0, Math.min(newArea.y, originalDimensions.height - newArea.height));
        newArea.width = Math.max(1, Math.min(newArea.width, originalDimensions.width - newArea.x));
        newArea.height = Math.max(1, Math.min(newArea.height, originalDimensions.height - newArea.y));

        // アスペクト比を維持
        if (aspectRatio !== null) {
          if (field === "width") {
            newArea.height = newArea.width / aspectRatio;
          } else if (field === "height") {
            newArea.width = newArea.height * aspectRatio;
          }
        }

        return newArea;
      });
    },
    [originalDimensions, aspectRatio]
  );

  /**
   * キャンバス上でのマウスダウン処理
   */
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!cropCanvasRef.current || !originalDimensions) return;

      const canvas = cropCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = originalDimensions.width / rect.width;
      const scaleY = originalDimensions.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      canvasScaleRef.current = scaleX;

      // どのハンドルをクリックしたか判定
      const handle = getHandleAtPosition(x, y, cropArea);
      setActiveHandle(handle);
      setDragStart({ x, y });
      setInitialCropArea({ ...cropArea });
    },
    [cropArea, originalDimensions]
  );

  /**
   * キャンバス上でのマウス移動処理
   */
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!activeHandle || !dragStart || !initialCropArea || !originalDimensions) return;

      const canvas = cropCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = originalDimensions.width / rect.width;
      const scaleY = originalDimensions.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      let newCropArea = { ...initialCropArea };

      if (activeHandle === "move") {
        // 移動
        newCropArea.x = Math.max(
          0,
          Math.min(initialCropArea.x + dx, originalDimensions.width - cropArea.width)
        );
        newCropArea.y = Math.max(
          0,
          Math.min(initialCropArea.y + dy, originalDimensions.height - cropArea.height)
        );
      } else {
        // リサイズ
        newCropArea = resizeCropArea(
          initialCropArea,
          activeHandle,
          dx,
          dy,
          aspectRatio,
          originalDimensions
        );
      }

      setCropArea(newCropArea);
    },
    [activeHandle, dragStart, initialCropArea, aspectRatio, originalDimensions, cropArea.width, cropArea.height]
  );

  /**
   * キャンバス上でのマウスアップ処理
   */
  const handleCanvasMouseUp = useCallback(() => {
    setActiveHandle(null);
    setDragStart(null);
    setInitialCropArea(null);
  }, []);

  /**
   * トリミング実行
   */
  const handleCrop = useCallback(async () => {
    if (!originalFile || !originalDimensions) {
      showToast("画像を選択してください", "error");
      return;
    }

    setIsLoading(true);

    try {
      const blob = await cropImage(
        originalFile,
        cropArea,
        originalDimensions.width,
        originalDimensions.height
      );

      if (!blob) {
        showToast("トリミングに失敗しました", "error");
        return;
      }

      setCroppedBlob(blob);
      if (croppedPreview) URL.revokeObjectURL(croppedPreview);
      setCroppedPreview(URL.createObjectURL(blob));
      showToast("トリミングが完了しました", "success");
    } catch (error) {
      console.error("Crop error:", error);
      showToast("トリミング中にエラーが発生しました", "error");
    } finally {
      setIsLoading(false);
    }
  }, [originalFile, originalDimensions, cropArea, croppedPreview, showToast]);

  /**
   * ダウンロード処理
   */
  const handleDownload = useCallback(() => {
    if (!croppedBlob || !originalFile) {
      showToast("トリミングを実行してください", "error");
      return;
    }

    const filename = generateFilename(originalFile.name);
    downloadBlob(croppedBlob, filename);
    showToast("ダウンロードを開始しました", "success");
  }, [croppedBlob, originalFile, showToast]);

  /**
   * キャンバスに画像とトリミング範囲を描画
   */
  useEffect(() => {
    if (!cropCanvasRef.current || !originalPreview || !originalDimensions) return;

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // キャンバスサイズを画像に合わせる（最大800px幅）
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / originalDimensions.width);
      canvas.width = originalDimensions.width * scale;
      canvas.height = originalDimensions.height * scale;

      // 画像を描画
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // オーバーレイ（暗くする）
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // トリミング範囲をクリア（明るく表示）
      ctx.clearRect(
        cropArea.x * scale,
        cropArea.y * scale,
        cropArea.width * scale,
        cropArea.height * scale
      );
      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        cropArea.x * scale,
        cropArea.y * scale,
        cropArea.width * scale,
        cropArea.height * scale
      );

      // トリミング範囲の枠線
      ctx.strokeStyle = "#4285f4";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        cropArea.x * scale,
        cropArea.y * scale,
        cropArea.width * scale,
        cropArea.height * scale
      );

      // グリッド線（三分割法）
      if (showGrid) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;

        // 縦線
        for (let i = 1; i < 3; i++) {
          const x = cropArea.x * scale + (cropArea.width * scale * i) / 3;
          ctx.beginPath();
          ctx.moveTo(x, cropArea.y * scale);
          ctx.lineTo(x, (cropArea.y + cropArea.height) * scale);
          ctx.stroke();
        }

        // 横線
        for (let i = 1; i < 3; i++) {
          const y = cropArea.y * scale + (cropArea.height * scale * i) / 3;
          ctx.beginPath();
          ctx.moveTo(cropArea.x * scale, y);
          ctx.lineTo((cropArea.x + cropArea.width) * scale, y);
          ctx.stroke();
        }
      }

      // リサイズハンドル
      drawResizeHandles(ctx, cropArea, scale);
    };

    img.src = originalPreview;
  }, [originalPreview, originalDimensions, cropArea, showGrid]);

  return (
    <div className="tool-container">
      {!originalFile ? (
        <>
          <div className="converter-section">
            <h2 className="section-title">画像選択</h2>

            <ImageUploadZone
              onFileSelect={handleFileSelect}
              onTypeError={() => showToast("画像ファイルを選択してください", "error")}
              disabled={isLoading}
            />
          </div>

          <TipsCard
            sections={[
              {
                title: "画像トリミングツールとは",
                items: [
                  "画像の一部を切り取って保存できるツールです",
                ],
              },
              {
                title: "使い方",
                items: [
                  "トリミングしたい画像をアップロード",
                  "必要に応じてアスペクト比を選択",
                  "キャンバス上でトリミング範囲をドラッグして調整",
                  "「トリミングを実行」ボタンをクリック",
                  "結果を確認してダウンロード",
                ],
              },
              {
                title: "機能",
                items: [
                  "アスペクト比プリセット: 1:1、4:3、16:9など",
                  "グリッド線表示: 三分割法のガイドライン",
                  "手動調整: X、Y、幅、高さを数値入力可能",
                ],
              },
            ]}
          />
        </>
      ) : (
        <>
          <div className="converter-section">
            <h2 className="section-title">元画像</h2>
            <div className="image-source-preview">
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="元画像プレビュー"
                  className="image-source-thumbnail"
                />
              )}
              {originalDimensions && (
                <div className="image-source-info">
                  <span>{originalFile?.name}</span>
                  <span>{originalDimensions.width} × {originalDimensions.height} px</span>
                  <span>{formatFileSize(originalFile?.size || 0)}</span>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="btn-clear"
              onClick={handleClear}
              disabled={isLoading}
            >
              別の画像を選択
            </Button>
          </div>

          <div className="converter-section">
            <h2 className="section-title">アスペクト比</h2>
            <div className="aspect-ratio-buttons" role="group" aria-label="アスペクト比選択">
              {ASPECT_RATIO_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`btn-chip ${aspectRatio === preset.ratio ? "active" : ""}`}
                  onClick={() => applyAspectRatio(preset.ratio)}
                  disabled={isLoading}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                disabled={isLoading}
              />
              グリッド線を表示（三分割法）
            </label>
          </div>

          <div className="converter-section">
            <h2 className="section-title">トリミング範囲</h2>
            <div className="crop-inputs-grid">
              <div className="crop-input-group">
                <label htmlFor="crop-x">X</label>
                <input
                  id="crop-x"
                  type="number"
                  min="0"
                  max={originalDimensions ? originalDimensions.width - cropArea.width : 0}
                  value={Math.round(cropArea.x)}
                  onChange={(e) =>
                    handleCropInputChange("x", Number.parseInt(e.target.value) || 0)
                  }
                  disabled={isLoading}
                />
                <span className="input-unit">px</span>
              </div>

              <div className="crop-input-group">
                <label htmlFor="crop-y">Y</label>
                <input
                  id="crop-y"
                  type="number"
                  min="0"
                  max={originalDimensions ? originalDimensions.height - cropArea.height : 0}
                  value={Math.round(cropArea.y)}
                  onChange={(e) =>
                    handleCropInputChange("y", Number.parseInt(e.target.value) || 0)
                  }
                  disabled={isLoading}
                />
                <span className="input-unit">px</span>
              </div>

              <div className="crop-input-group">
                <label htmlFor="crop-width">幅</label>
                <input
                  id="crop-width"
                  type="number"
                  min="1"
                  max={originalDimensions ? originalDimensions.width - cropArea.x : 1}
                  value={Math.round(cropArea.width)}
                  onChange={(e) =>
                    handleCropInputChange("width", Number.parseInt(e.target.value) || 1)
                  }
                  disabled={isLoading}
                />
                <span className="input-unit">px</span>
              </div>

              <div className="crop-input-group">
                <label htmlFor="crop-height">高さ</label>
                <input
                  id="crop-height"
                  type="number"
                  min="1"
                  max={originalDimensions ? originalDimensions.height - cropArea.y : 1}
                  value={Math.round(cropArea.height)}
                  onChange={(e) =>
                    handleCropInputChange("height", Number.parseInt(e.target.value) || 1)
                  }
                  disabled={isLoading}
                />
                <span className="input-unit">px</span>
              </div>
            </div>
          </div>

          <div className="converter-section">
            <h2 className="section-title">プレビュー</h2>
            <div className="crop-canvas-container">
              <canvas
                ref={cropCanvasRef}
                className="crop-canvas"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                aria-label="トリミング範囲を調整"
              />
            </div>
            <p className="help-text">
              ドラッグで移動、角や辺のハンドルでリサイズできます
            </p>
          </div>

          <div className="converter-section">
            <div className="button-group" role="group" aria-label="操作ボタン">
              <Button
                type="button"
                onClick={handleCrop}
                disabled={isLoading}
              >
                {isLoading ? "処理中..." : "トリミングを実行"}
              </Button>
            </div>
          </div>

          {croppedPreview && croppedBlob && (
            <div className="converter-section">
              <h2 className="section-title">トリミング結果</h2>
              <div className="crop-result-preview">
                <img
                  src={croppedPreview}
                  alt="トリミング結果"
                  className="crop-result-image"
                />
                <div className="crop-result-info">
                  <span>
                    {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px
                  </span>
                  <span>{formatFileSize(croppedBlob.size)}</span>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleDownload}
              >
                ダウンロード
              </Button>
            </div>
          )}

          <TipsCard
            sections={[
              {
                title: "トリミングのヒント",
                items: [
                  "三分割法: グリッド線の交点に被写体を配置すると、バランスの良い構図になります",
                  "アスペクト比: SNS投稿用には1:1、YouTubeサムネイルには16:9がおすすめです",
                  "画質保持: 元の画像形式（PNG/JPEG等）を維持して高品質で出力します",
                ],
              },
            ]}
          />
        </>
      )}

    </div>
  );
}

/**
 * 指定位置にあるハンドルを取得
 */
function getHandleAtPosition(
  x: number,
  y: number,
  cropArea: CropArea
): ResizeHandle {
  const handleSize = 10;
  const { x: cx, y: cy, width, height } = cropArea;

  // 四隅のハンドル
  if (
    Math.abs(x - cx) < handleSize &&
    Math.abs(y - cy) < handleSize
  )
    return "nw";
  if (
    Math.abs(x - (cx + width)) < handleSize &&
    Math.abs(y - cy) < handleSize
  )
    return "ne";
  if (
    Math.abs(x - cx) < handleSize &&
    Math.abs(y - (cy + height)) < handleSize
  )
    return "sw";
  if (
    Math.abs(x - (cx + width)) < handleSize &&
    Math.abs(y - (cy + height)) < handleSize
  )
    return "se";

  // 辺のハンドル
  if (Math.abs(y - cy) < handleSize && x > cx && x < cx + width) return "n";
  if (Math.abs(y - (cy + height)) < handleSize && x > cx && x < cx + width)
    return "s";
  if (Math.abs(x - cx) < handleSize && y > cy && y < cy + height) return "w";
  if (Math.abs(x - (cx + width)) < handleSize && y > cy && y < cy + height)
    return "e";

  // 範囲内（移動）
  if (x > cx && x < cx + width && y > cy && y < cy + height) return "move";

  return null;
}

/**
 * トリミング範囲をリサイズ
 */
function resizeCropArea(
  initial: CropArea,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  aspectRatio: number | null,
  bounds: { width: number; height: number }
): CropArea {
  let newArea = { ...initial };

  switch (handle) {
    case "nw":
      newArea.x = Math.max(0, initial.x + dx);
      newArea.y = Math.max(0, initial.y + dy);
      newArea.width = initial.width - (newArea.x - initial.x);
      newArea.height = initial.height - (newArea.y - initial.y);
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
        newArea.y = initial.y + initial.height - newArea.height;
      }
      break;
    case "ne":
      newArea.y = Math.max(0, initial.y + dy);
      newArea.width = Math.min(
        bounds.width - initial.x,
        initial.width + dx
      );
      newArea.height = initial.height - (newArea.y - initial.y);
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
        newArea.y = initial.y + initial.height - newArea.height;
      }
      break;
    case "sw":
      newArea.x = Math.max(0, initial.x + dx);
      newArea.width = initial.width - (newArea.x - initial.x);
      newArea.height = Math.min(
        bounds.height - initial.y,
        initial.height + dy
      );
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
      }
      break;
    case "se":
      newArea.width = Math.min(
        bounds.width - initial.x,
        initial.width + dx
      );
      newArea.height = Math.min(
        bounds.height - initial.y,
        initial.height + dy
      );
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
      }
      break;
    case "n":
      newArea.y = Math.max(0, initial.y + dy);
      newArea.height = initial.height - (newArea.y - initial.y);
      if (aspectRatio !== null) {
        newArea.width = newArea.height * aspectRatio;
      }
      break;
    case "s":
      newArea.height = Math.min(
        bounds.height - initial.y,
        initial.height + dy
      );
      if (aspectRatio !== null) {
        newArea.width = newArea.height * aspectRatio;
      }
      break;
    case "w":
      newArea.x = Math.max(0, initial.x + dx);
      newArea.width = initial.width - (newArea.x - initial.x);
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
      }
      break;
    case "e":
      newArea.width = Math.min(
        bounds.width - initial.x,
        initial.width + dx
      );
      if (aspectRatio !== null) {
        newArea.height = newArea.width / aspectRatio;
      }
      break;
  }

  // 最小サイズ制限
  newArea.width = Math.max(10, newArea.width);
  newArea.height = Math.max(10, newArea.height);

  // 範囲内に収める
  if (newArea.x + newArea.width > bounds.width) {
    newArea.width = bounds.width - newArea.x;
    if (aspectRatio !== null) {
      newArea.height = newArea.width / aspectRatio;
    }
  }
  if (newArea.y + newArea.height > bounds.height) {
    newArea.height = bounds.height - newArea.y;
    if (aspectRatio !== null) {
      newArea.width = newArea.height * aspectRatio;
    }
  }

  return newArea;
}

/**
 * リサイズハンドルを描画
 */
function drawResizeHandles(
  ctx: CanvasRenderingContext2D,
  cropArea: CropArea,
  scale: number
) {
  const handleSize = 8;
  const { x, y, width, height } = cropArea;

  ctx.fillStyle = "#4285f4";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  const handles = [
    { x: x * scale, y: y * scale }, // nw
    { x: (x + width) * scale, y: y * scale }, // ne
    { x: x * scale, y: (y + height) * scale }, // sw
    { x: (x + width) * scale, y: (y + height) * scale }, // se
    { x: (x + width / 2) * scale, y: y * scale }, // n
    { x: (x + width / 2) * scale, y: (y + height) * scale }, // s
    { x: x * scale, y: (y + height / 2) * scale }, // w
    { x: (x + width) * scale, y: (y + height / 2) * scale }, // e
  ];

  for (const handle of handles) {
    ctx.fillRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.strokeRect(
      handle.x - handleSize / 2,
      handle.y - handleSize / 2,
      handleSize,
      handleSize
    );
  }
}
