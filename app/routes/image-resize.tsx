import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useToast } from "../components/Toast";

export const Route = createFileRoute("/image-resize")({
  head: () => ({
    meta: [{ title: "画像リサイズ・トリミングツール" }],
  }),
  component: ImageResizer,
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
  { label: "Full HD (1920×1080)", width: 1920, height: 1080 },
  { label: "HD (1280×720)", width: 1280, height: 720 },
  { label: "VGA (640×480)", width: 640, height: 480 },
  { label: "正方形 (512×512)", width: 512, height: 512 },
  { label: "サムネイル (256×256)", width: 256, height: 256 },
  { label: "アイコン (128×128)", width: 128, height: 128 },
];

/**
 * トリミングのアスペクト比プリセット
 */
interface AspectRatioPreset {
  label: string;
  ratio: number | null; // nullは自由比率
}

const CROP_ASPECT_RATIOS: AspectRatioPreset[] = [
  { label: "自由", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "2:3", ratio: 2 / 3 },
];

/**
 * 最大サイズ制限
 */
const MAX_DIMENSION = 10000;

/**
 * 最小サイズ制限
 */
const MIN_DIMENSION = 1;

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
 * ファイルサイズを人間が読みやすい形式にフォーマットする
 * @param bytes - バイト数
 * @returns フォーマットされた文字列（例: "1.5 MB"）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * アスペクト比を維持した新しいサイズを計算する
 * @param originalWidth - 元の幅
 * @param originalHeight - 元の高さ
 * @param newWidth - 新しい幅（nullの場合は高さから計算）
 * @param newHeight - 新しい高さ（nullの場合は幅から計算）
 * @returns 計算された幅と高さ
 */
export function calculateAspectRatioSize(
  originalWidth: number,
  originalHeight: number,
  newWidth: number | null,
  newHeight: number | null
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  if (newWidth !== null && newHeight === null) {
    return {
      width: newWidth,
      height: Math.round(newWidth / aspectRatio),
    };
  }

  if (newHeight !== null && newWidth === null) {
    return {
      width: Math.round(newHeight * aspectRatio),
      height: newHeight,
    };
  }

  return {
    width: newWidth ?? originalWidth,
    height: newHeight ?? originalHeight,
  };
}

/**
 * 値を指定された範囲内にクランプする
 * @param value - クランプする値
 * @param min - 最小値
 * @param max - 最大値
 * @returns クランプされた値
 */
export function clampDimension(value: number, min: number = MIN_DIMENSION, max: number = MAX_DIMENSION): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * 画像をリサイズする（トリミング対応）
 * @param file - リサイズする画像ファイル
 * @param width - 新しい幅
 * @param height - 新しい高さ
 * @param cropArea - トリミング範囲（オプション）
 * @returns リサイズされたBlobを含むPromise
 */
export async function resizeImage(
  file: File,
  width: number,
  height: number,
  cropArea?: CropArea
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      // 高品質なリサイズのための設定
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (cropArea) {
        // トリミング処理
        ctx.drawImage(
          img,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          width,
          height
        );
      } else {
        // 通常のリサイズ
        ctx.drawImage(img, 0, 0, width, height);
      }

      // 元のファイル形式を判定
      let mimeType = file.type;
      if (!mimeType || mimeType === "image/gif") {
        // GIFはリサイズ後もGIFにはできないのでPNGにする
        mimeType = "image/png";
      }

      canvas.toBlob(
        (blob) => resolve(blob),
        mimeType,
        0.92 // JPEG/WebPの場合の画質
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
 * @param width - リサイズ後の幅
 * @param height - リサイズ後の高さ
 * @param isCropped - トリミングされたか
 * @returns 新しいファイル名
 */
export function generateFilename(originalName: string, width: number, height: number, isCropped: boolean = false): string {
  const ext = originalName.match(/\.[^/.]+$/)?.[0] || ".png";
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
  const suffix = isCropped ? "_cropped" : "_resized";
  return `${nameWithoutExt}${suffix}_${width}x${height}${ext}`;
}

function ImageResizer() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [resizedPreview, setResizedPreview] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastChanged, setLastChanged] = useState<"width" | "height">("width");

  // トリミング関連のstate
  const [enableCrop, setEnableCrop] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [cropAspectRatio, setCropAspectRatio] = useState<number | null>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const canvasScaleRef = useRef<number>(1);
  const { showToast } = useToast();

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (resizedPreview) URL.revokeObjectURL(resizedPreview);
    };
  }, [originalPreview, resizedPreview]);

  // アスペクト比を計算
  const aspectRatio = useMemo(() => {
    if (!originalDimensions) return 1;
    return originalDimensions.width / originalDimensions.height;
  }, [originalDimensions]);

  // トリミングモード切り替え時の処理
  useEffect(() => {
    if (enableCrop && originalDimensions && !cropArea) {
      // トリミングモードを有効にした時、デフォルトで中央に選択範囲を作成
      const defaultSize = Math.min(originalDimensions.width, originalDimensions.height) * 0.8;
      const defaultCrop: CropArea = {
        x: (originalDimensions.width - defaultSize) / 2,
        y: (originalDimensions.height - defaultSize) / 2,
        width: defaultSize,
        height: defaultSize,
      };
      setCropArea(defaultCrop);
    } else if (!enableCrop) {
      setCropArea(null);
    }
  }, [enableCrop, originalDimensions, cropArea]);

  // トリミング範囲をCanvasに描画
  useEffect(() => {
    if (!enableCrop || !originalPreview || !cropArea || !cropCanvasRef.current) return;

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // refに保存
      imageElementRef.current = img;

      // Canvasのサイズを設定（表示サイズに合わせる）
      const container = canvas.parentElement;
      if (!container) return;

      const maxWidth = container.clientWidth;
      const maxHeight = 400;
      const scale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);

      // スケールをrefに保存
      canvasScaleRef.current = scale;

      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;

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

      // 選択範囲の枠を描画
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        cropArea.x * scale,
        cropArea.y * scale,
        cropArea.width * scale,
        cropArea.height * scale
      );
    };
    img.src = originalPreview;
  }, [enableCrop, originalPreview, cropArea]);

  // ドラッグモード: 'create' = 新規作成, 'move' = 移動
  const [dragMode, setDragMode] = useState<'create' | 'move'>('create');

  // 座標を取得する共通関数（マウス・タッチ両対応）
  const getEventCoordinates = useCallback((
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | MouseEvent | TouchEvent
  ): { x: number; y: number } | null => {
    if (!cropCanvasRef.current) return null;

    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = canvasScaleRef.current;

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  }, []);

  // 既存の選択範囲内かどうかを判定
  const isInsideCropArea = useCallback((x: number, y: number): boolean => {
    if (!cropArea) return false;
    return (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    );
  }, [cropArea]);

  // ドラッグ開始の共通処理
  const handleDragStart = useCallback((
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!enableCrop || !imageElementRef.current) return;

    // タッチイベントの場合はスクロールを防止
    if ('touches' in e) {
      e.preventDefault();
    }

    const coords = getEventCoordinates(e);
    if (!coords) return;

    // 既存の選択範囲内をクリックした場合は移動モード
    if (isInsideCropArea(coords.x, coords.y)) {
      setDragMode('move');
    } else {
      setDragMode('create');
    }

    setIsDraggingCrop(true);
    setDragStart(coords);
  }, [enableCrop, getEventCoordinates, isInsideCropArea]);

  // ドラッグ中の共通処理
  const handleDragMove = useCallback((
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDraggingCrop || !dragStart || !originalDimensions) return;

    // タッチイベントの場合はスクロールを防止
    if ('touches' in e) {
      e.preventDefault();
    }

    const coords = getEventCoordinates(e);
    if (!coords) return;

    const minSize = 10;

    if (dragMode === 'move' && cropArea) {
      // 移動モード: 選択範囲を移動
      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;

      let newX = cropArea.x + deltaX;
      let newY = cropArea.y + deltaY;

      // 画像範囲内に制限
      newX = Math.max(0, Math.min(newX, originalDimensions.width - cropArea.width));
      newY = Math.max(0, Math.min(newY, originalDimensions.height - cropArea.height));

      setCropArea({
        ...cropArea,
        x: newX,
        y: newY,
      });

      // ドラッグ開始位置を更新（差分計算のため）
      setDragStart(coords);
    } else {
      // 作成モード: 新しい選択範囲を作成
      const x = Math.min(dragStart.x, coords.x);
      const y = Math.min(dragStart.y, coords.y);
      let newWidth = Math.abs(coords.x - dragStart.x);
      let newHeight = Math.abs(coords.y - dragStart.y);

      if (newWidth < minSize || newHeight < minSize) return;

      // アスペクト比を適用
      if (cropAspectRatio !== null && cropAspectRatio > 0) {
        if (newWidth / newHeight > cropAspectRatio) {
          newWidth = newHeight * cropAspectRatio;
        } else {
          newHeight = newWidth / cropAspectRatio;
        }
      }

      // 画像範囲内に制限
      const clampedX = Math.max(0, Math.min(x, originalDimensions.width - newWidth));
      const clampedY = Math.max(0, Math.min(y, originalDimensions.height - newHeight));
      const clampedWidth = Math.min(newWidth, originalDimensions.width - clampedX);
      const clampedHeight = Math.min(newHeight, originalDimensions.height - clampedY);

      if (clampedWidth < minSize || clampedHeight < minSize) return;

      setCropArea({
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      });
    }
  }, [isDraggingCrop, dragStart, originalDimensions, cropAspectRatio, dragMode, cropArea, getEventCoordinates]);

  // ドラッグ終了の共通処理
  const handleDragEnd = useCallback(() => {
    setIsDraggingCrop(false);
    setDragStart(null);
  }, []);

  // グローバルなマウス/タッチイベントをリッスン（Canvas外でもドラッグを追跡）
  useEffect(() => {
    if (!isDraggingCrop) return;

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingCrop || !dragStart || !originalDimensions) return;

      const coords = getEventCoordinates(e as MouseEvent | TouchEvent);
      if (!coords) return;

      const minSize = 10;

      if (dragMode === 'move' && cropArea) {
        const deltaX = coords.x - dragStart.x;
        const deltaY = coords.y - dragStart.y;

        let newX = cropArea.x + deltaX;
        let newY = cropArea.y + deltaY;

        newX = Math.max(0, Math.min(newX, originalDimensions.width - cropArea.width));
        newY = Math.max(0, Math.min(newY, originalDimensions.height - cropArea.height));

        setCropArea({
          ...cropArea,
          x: newX,
          y: newY,
        });

        setDragStart(coords);
      } else {
        const x = Math.min(dragStart.x, coords.x);
        const y = Math.min(dragStart.y, coords.y);
        let newWidth = Math.abs(coords.x - dragStart.x);
        let newHeight = Math.abs(coords.y - dragStart.y);

        if (newWidth < minSize || newHeight < minSize) return;

        if (cropAspectRatio !== null && cropAspectRatio > 0) {
          if (newWidth / newHeight > cropAspectRatio) {
            newWidth = newHeight * cropAspectRatio;
          } else {
            newHeight = newWidth / cropAspectRatio;
          }
        }

        const clampedX = Math.max(0, Math.min(x, originalDimensions.width - newWidth));
        const clampedY = Math.max(0, Math.min(y, originalDimensions.height - newHeight));
        const clampedWidth = Math.min(newWidth, originalDimensions.width - clampedX);
        const clampedHeight = Math.min(newHeight, originalDimensions.height - clampedY);

        if (clampedWidth < minSize || clampedHeight < minSize) return;

        setCropArea({
          x: clampedX,
          y: clampedY,
          width: clampedWidth,
          height: clampedHeight,
        });
      }
    };

    const handleGlobalEnd = () => {
      setIsDraggingCrop(false);
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDraggingCrop, dragStart, originalDimensions, cropAspectRatio, dragMode, cropArea, getEventCoordinates]);

  // 幅変更時のハンドラー
  const handleWidthChange = useCallback(
    (newWidth: number) => {
      const clampedWidth = clampDimension(newWidth);
      setWidth(clampedWidth);
      setLastChanged("width");

      if (maintainAspectRatio && originalDimensions) {
        const newHeight = Math.round(clampedWidth / aspectRatio);
        setHeight(clampDimension(newHeight));
      }
    },
    [maintainAspectRatio, originalDimensions, aspectRatio]
  );

  // 高さ変更時のハンドラー
  const handleHeightChange = useCallback(
    (newHeight: number) => {
      const clampedHeight = clampDimension(newHeight);
      setHeight(clampedHeight);
      setLastChanged("height");

      if (maintainAspectRatio && originalDimensions) {
        const newWidth = Math.round(clampedHeight * aspectRatio);
        setWidth(clampDimension(newWidth));
      }
    },
    [maintainAspectRatio, originalDimensions, aspectRatio]
  );

  // アスペクト比維持トグル時のハンドラー
  const handleAspectRatioToggle = useCallback(
    (checked: boolean) => {
      setMaintainAspectRatio(checked);

      if (checked && originalDimensions) {
        // アスペクト比維持をオンにした場合、最後に変更された方を基準に再計算
        if (lastChanged === "width") {
          const newHeight = Math.round(width / aspectRatio);
          setHeight(clampDimension(newHeight));
        } else {
          const newWidth = Math.round(height * aspectRatio);
          setWidth(clampDimension(newWidth));
        }
      }
    },
    [originalDimensions, width, height, aspectRatio, lastChanged]
  );

  // プリセット選択ハンドラー
  const handlePresetSelect = useCallback(
    (preset: PresetSize) => {
      if (maintainAspectRatio && originalDimensions) {
        // アスペクト比を維持する場合、プリセットの幅を基準に計算
        const newHeight = Math.round(preset.width / aspectRatio);
        setWidth(clampDimension(preset.width));
        setHeight(clampDimension(newHeight));
      } else {
        setWidth(preset.width);
        setHeight(preset.height);
      }
      setLastChanged("width");
    },
    [maintainAspectRatio, originalDimensions, aspectRatio]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast("画像ファイルを選択してください", "error");
        return;
      }

      // 既存のプレビューをクリーンアップ
      if (originalPreview) URL.revokeObjectURL(originalPreview);
      if (resizedPreview) URL.revokeObjectURL(resizedPreview);

      const preview = URL.createObjectURL(file);
      setOriginalFile(file);
      setOriginalPreview(preview);
      setResizedBlob(null);
      setResizedPreview(null);
      setCropArea(null);
      setEnableCrop(false);

      // 画像のサイズを取得
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      };
      img.src = preview;
    },
    [originalPreview, resizedPreview, showToast]
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

  const handleResize = useCallback(async () => {
    if (!originalFile || width < MIN_DIMENSION || height < MIN_DIMENSION) {
      showToast("有効なサイズを指定してください", "error");
      return;
    }

    setIsLoading(true);
    const blob = await resizeImage(originalFile, width, height, enableCrop && cropArea ? cropArea : undefined);
    setIsLoading(false);

    if (blob) {
      if (resizedPreview) URL.revokeObjectURL(resizedPreview);
      setResizedBlob(blob);
      setResizedPreview(URL.createObjectURL(blob));
      showToast(enableCrop ? "画像をトリミング・リサイズしました" : "画像をリサイズしました", "success");
    } else {
      showToast("画像の処理に失敗しました", "error");
    }
  }, [originalFile, width, height, enableCrop, cropArea, resizedPreview, showToast]);

  const handleDownload = useCallback(() => {
    if (!resizedBlob || !originalFile) return;

    const url = URL.createObjectURL(resizedBlob);
    const filename = generateFilename(originalFile.name, width, height, enableCrop && cropArea !== null);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("ダウンロードを開始しました", "success");
  }, [resizedBlob, originalFile, width, height, enableCrop, cropArea, showToast]);

  const handleClear = useCallback(() => {
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (resizedPreview) URL.revokeObjectURL(resizedPreview);

    setOriginalFile(null);
    setOriginalPreview(null);
    setOriginalDimensions(null);
    setResizedBlob(null);
    setResizedPreview(null);
    setWidth(0);
    setHeight(0);
    setMaintainAspectRatio(true);
    setEnableCrop(false);
    setCropArea(null);
    setCropAspectRatio(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    showToast("クリアしました", "info");
  }, [originalPreview, resizedPreview, showToast]);

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

  // サイズ変更の割合を計算
  const sizeChangePercent = useMemo(() => {
    if (!originalDimensions) return 0;
    const originalPixels = originalDimensions.width * originalDimensions.height;
    const newPixels = width * height;
    return Math.round((newPixels / originalPixels - 1) * 100);
  }, [originalDimensions, width, height]);

  return (
    <>
      <div className="tool-container">
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

        {originalFile && originalDimensions && (
          <>
            <div className="converter-section">
              <h2 className="section-title">元画像の情報</h2>
              <div className="image-info-grid">
                <div className="info-item">
                  <span className="info-label">ファイル名</span>
                  <span className="info-value">{originalFile.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">サイズ</span>
                  <span className="info-value">{formatFileSize(originalFile.size)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">解像度</span>
                  <span className="info-value">{originalDimensions.width} × {originalDimensions.height} px</span>
                </div>
              </div>
            </div>

            {/* トリミング設定 */}
            <div className="converter-section">
              <h2 className="section-title">トリミング設定</h2>

              <div className="crop-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={enableCrop}
                    onChange={(e) => setEnableCrop(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>トリミングを有効にする</span>
                </label>
              </div>

              {enableCrop && (
                <>
                  <div className="crop-aspect-ratios">
                    <label className="preset-label">アスペクト比</label>
                    <div className="preset-buttons">
                      {CROP_ASPECT_RATIOS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          className={`preset-btn ${cropAspectRatio === preset.ratio ? "active" : ""}`}
                          onClick={() => setCropAspectRatio(preset.ratio)}
                          disabled={isLoading}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="crop-canvas-container">
                    <p className="crop-hint">
                      {cropArea ? "選択範囲をドラッグで移動、範囲外をドラッグで新規作成" : "ドラッグして範囲を選択してください"}
                    </p>
                    <canvas
                      ref={cropCanvasRef}
                      className={`crop-canvas ${cropArea ? 'has-selection' : ''}`}
                      onMouseDown={handleDragStart}
                      onMouseMove={handleDragMove}
                      onMouseUp={handleDragEnd}
                      onMouseLeave={handleDragEnd}
                      onTouchStart={handleDragStart}
                      onTouchMove={handleDragMove}
                      onTouchEnd={handleDragEnd}
                    />
                  </div>

                  {cropArea && (
                    <div className="crop-info">
                      <p>選択範囲: {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px</p>
                      <p className="crop-info-detail">
                        位置: ({Math.round(cropArea.x)}, {Math.round(cropArea.y)})
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="converter-section">
              <h2 className="section-title">リサイズ設定</h2>

              <div className="resize-options">
                <div className="size-inputs">
                  <div className="size-input-group">
                    <label htmlFor="width">幅 (px)</label>
                    <input
                      type="number"
                      id="width"
                      min={MIN_DIMENSION}
                      max={MAX_DIMENSION}
                      value={width}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                      disabled={isLoading}
                      aria-describedby="width-help"
                    />
                  </div>

                  <div className="size-link-icon" aria-hidden="true">
                    {maintainAspectRatio ? "🔗" : "⛓️‍💥"}
                  </div>

                  <div className="size-input-group">
                    <label htmlFor="height">高さ (px)</label>
                    <input
                      type="number"
                      id="height"
                      min={MIN_DIMENSION}
                      max={MAX_DIMENSION}
                      value={height}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                      disabled={isLoading}
                      aria-describedby="height-help"
                    />
                  </div>
                </div>

                <div className="aspect-ratio-toggle">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={maintainAspectRatio}
                      onChange={(e) => handleAspectRatioToggle(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span>アスペクト比を維持</span>
                  </label>
                </div>

                <div className="preset-section">
                  <label className="preset-label">プリセットサイズ</label>
                  <div className="preset-buttons">
                    {PRESET_SIZES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        className="preset-btn"
                        onClick={() => handlePresetSelect(preset)}
                        disabled={isLoading}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <span id="width-help" className="option-help">
                  {MIN_DIMENSION}〜{MAX_DIMENSION}px の範囲で指定
                  {sizeChangePercent !== 0 && (
                    <span className={sizeChangePercent > 0 ? "size-increase" : "size-decrease"}>
                      {" "}（{sizeChangePercent > 0 ? "+" : ""}{sizeChangePercent}%）
                    </span>
                  )}
                </span>
              </div>

              <div className="button-group" role="group" aria-label="操作">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleResize}
                  disabled={isLoading || width < MIN_DIMENSION || height < MIN_DIMENSION}
                >
                  {isLoading ? "処理中..." : (enableCrop ? "トリミング&リサイズ" : "リサイズ")}
                </button>
                {resizedBlob && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleDownload}
                    disabled={isLoading}
                  >
                    ダウンロード
                  </button>
                )}
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

            <div className="converter-section">
              <h2 className="section-title">プレビュー</h2>

              <div className="preview-comparison">
                <div className="preview-panel">
                  <h3 className="preview-label">元の画像</h3>
                  <div className="preview-image-container">
                    {originalPreview ? (
                      <img
                        src={originalPreview}
                        alt="元の画像"
                        className="preview-image"
                      />
                    ) : (
                      <span className="preview-placeholder">プレビューなし</span>
                    )}
                  </div>
                </div>
                <div className="preview-panel">
                  <h3 className="preview-label">
                    {enableCrop ? "トリミング・リサイズ後" : "リサイズ後"} ({width} × {height})
                  </h3>
                  <div className="preview-image-container">
                    {isLoading ? (
                      <div className="loading-enhanced">
                        <div className="spinner-enhanced" />
                        <span className="loading-text">処理中...</span>
                      </div>
                    ) : resizedPreview ? (
                      <img
                        src={resizedPreview}
                        alt="処理後の画像"
                        className="preview-image"
                      />
                    ) : (
                      <span className="preview-placeholder">処理待ち</span>
                    )}
                  </div>
                </div>
              </div>

              {resizedBlob && (
                <div className="resize-stats">
                  <div className="stat-item">
                    <span className="stat-label">元のサイズ</span>
                    <span className="stat-value">{formatFileSize(originalFile.size)}</span>
                  </div>
                  <div className="stat-item stat-arrow" aria-hidden="true">→</div>
                  <div className="stat-item">
                    <span className="stat-label">処理後</span>
                    <span className="stat-value">{formatFileSize(resizedBlob.size)}</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <aside
          className="info-box"
          role="complementary"
          aria-labelledby="usage-title"
        >
          <h3 id="usage-title">画像リサイズ・トリミングとは</h3>
          <ul>
            <li>画像の幅と高さを変更し、サイズを調整します</li>
            <li>トリミング機能で必要な部分だけを切り出せます</li>
            <li>アスペクト比を維持して歪みを防ぐことができます</li>
            <li>すべての処理はブラウザ内で完結（サーバーにアップロードされません）</li>
          </ul>
          <h3 id="tips-title">Tips</h3>
          <ul>
            <li>縮小は画質劣化が少なく、拡大は画質が低下する可能性があります</li>
            <li>トリミングで不要な部分を削除してからリサイズすると効率的です</li>
            <li>Canvas上でドラッグしてトリミング範囲を選択できます</li>
            <li>プリセットサイズやアスペクト比を使用すると素早く設定できます</li>
            <li>最大サイズは10000×10000pxです</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
