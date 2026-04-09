import { createFileRoute } from "@tanstack/react-router";
import { SITE_BASE_URL, SITE_OGP_IMAGE } from "../constants/site";
import { useState, useRef, useCallback, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { loadFFmpeg, convertImagesToGif } from "./image-to-gif";
import {
  generateAnimationFrames,
  getAnimationEffectLabel,
  getAnimationSpeedLabel,
  type AnimationEffectType,
  type AnimationSpeed,
  type AnimationConfig,
  type GSAPEasingType,
  type EasingDirection,
} from "~/utils/animationEffects";
import { getGSAPEasingLabel, getEasingDirectionLabel } from "~/utils/gsapAnimationEngine";

export const Route = createFileRoute("/emoji-converter")({
  head: () => ({
    meta: [
      { title: "絵文字変換ツール | Web ツール集" },
      {
        name: "description",
        content: "絵文字のUnicodeコードポイント変換や各種形式への変換ツール。",
      },
      { property: "og:title", content: "絵文字変換ツール | Web ツール集" },
      {
        property: "og:description",
        content: "絵文字のUnicodeコードポイント変換や各種形式への変換ツール。",
      },
      { property: "og:url", content: `${SITE_BASE_URL}/emoji-converter` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: SITE_OGP_IMAGE },
      { name: "twitter:title", content: "絵文字変換ツール | Web ツール集" },
      {
        name: "twitter:description",
        content: "絵文字のUnicodeコードポイント変換や各種形式への変換ツール。",
      },
    ],
  }),
  component: EmojiConverter,
});

type Platform = "discord" | "slack";
type OutputFormat = "png" | "jpeg" | "webp" | "avif" | "gif";

const PLATFORM_LIMITS = {
  discord: { maxSize: 256 * 1024, label: "Discord (最大256KB)" },
  slack: { maxSize: 1024 * 1024, label: "Slack (最大1MB)" },
} as const;

const EMOJI_SIZE = 128; // Output size
const PREVIEW_SIZE = 256; // Preview display size

const FORMAT_LABELS: Record<OutputFormat, string> = {
  png: "PNG (ロスレス)",
  jpeg: "JPEG",
  webp: "WebP",
  avif: "AVIF",
  gif: "GIF",
};

const FORMAT_EXTENSIONS: Record<OutputFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
  avif: "avif",
  gif: "gif",
};

const FORMAT_MIME_TYPES: Record<OutputFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

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

/** テキスト埋め込みのデフォルト値 */
const DEFAULT_TEXT_OPTIONS: Pick<
  EditOptions,
  "text" | "fontSize" | "textColor" | "textX" | "textY"
> = {
  text: "",
  fontSize: 24,
  textColor: "#FFFFFF",
  textX: 50,
  textY: 50,
};

/** 回転・反転のデフォルト値 */
const DEFAULT_TRANSFORM_OPTIONS: Pick<EditOptions, "rotation" | "flipH" | "flipV"> = {
  rotation: 0,
  flipH: false,
  flipV: false,
};

/** フィルターのデフォルト値 */
const DEFAULT_FILTER_OPTIONS: Pick<EditOptions, "brightness" | "contrast" | "saturation"> = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

/** 透過処理のデフォルト値 */
const DEFAULT_TRANSPARENT_OPTIONS: Pick<EditOptions, "transparent" | "transparentColor"> = {
  transparent: false,
  transparentColor: "#FFFFFF",
};

/** 枠線のデフォルト値 */
const DEFAULT_BORDER_OPTIONS: Pick<EditOptions, "border" | "borderWidth" | "borderColor"> = {
  border: false,
  borderWidth: 2,
  borderColor: "#000000",
};

const DEFAULT_EDIT_OPTIONS: EditOptions = {
  ...DEFAULT_TEXT_OPTIONS,
  ...DEFAULT_TRANSFORM_OPTIONS,
  ...DEFAULT_FILTER_OPTIONS,
  ...DEFAULT_TRANSPARENT_OPTIONS,
  ...DEFAULT_BORDER_OPTIONS,
};

/**
 * 画像をリサイズする
 * @param file - 元の画像ファイル
 * @param size - リサイズ後のサイズ（正方形）
 * @returns リサイズ後の画像を含むcanvas
 */
export async function resizeImage(file: File, size: number): Promise<HTMLCanvasElement> {
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
 * 編集オプションを適用した画像を生成
 * @param sourceCanvas - 元のcanvas
 * @param options - 編集オプション
 * @returns 編集後の画像を含むcanvas
 */
export function applyEditOptions(
  sourceCanvas: HTMLCanvasElement,
  options: EditOptions,
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
  ctx.drawImage(sourceCanvas, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

  ctx.restore();

  // フィルター適用
  if (options.brightness !== 100 || options.contrast !== 100 || options.saturation !== 100) {
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
      canvas.height - options.borderWidth,
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
  color: string,
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
 * @param format - 出力フォーマット
 * @param quality - 品質 (0.0-1.0, PNGでは無視)
 * @param maxSize - 最大ファイルサイズ（バイト）
 * @returns Blob
 */
export async function canvasToBlobWithLimit(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality: number,
  maxSize: number,
): Promise<Blob | null> {
  const mimeType = FORMAT_MIME_TYPES[format];

  // PNG is lossless, no quality adjustment
  if (format === "png") {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeType);
    });
    return blob;
  }

  // For lossy formats (JPEG, WebP, AVIF), try with specified quality first
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

function EmojiConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<Platform>("discord");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [outputQuality, setOutputQuality] = useState<number>(0.92);
  const [editOptions, setEditOptions] = useState<EditOptions>(DEFAULT_EDIT_OPTIONS);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animation state
  const [enableAnimation, setEnableAnimation] = useState(false);
  const [animationEffect, setAnimationEffect] = useState<AnimationEffectType>("bounce");
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>("normal");
  const [animationLoop, setAnimationLoop] = useState<number>(0); // 0 = infinite
  const [animationFps, setAnimationFps] = useState<number>(12);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  // GSAP animation settings
  const [useGSAP, setUseGSAP] = useState(true);
  const [gsapEasing, setGsapEasing] = useState<GSAPEasingType>("bounce");
  const [easingDirection, setEasingDirection] = useState<EasingDirection>("out");
  const [animationDuration, setAnimationDuration] = useState<number>(1.0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const processedImageRef = useRef<HTMLCanvasElement | null>(null);
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const animationFramesRef = useRef<HTMLCanvasElement[]>([]);
  const animationIntervalRef = useRef<number | null>(null);

  const announceStatus = useCallback((message: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = message;
    }
  }, []);

  // Check browser support for image formats
  const checkFormatSupport = useCallback((format: OutputFormat): boolean => {
    // GIF is always supported (generated via FFmpeg)
    if (format === "gif") return true;

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const mimeType = FORMAT_MIME_TYPES[format];
    return canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`);
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
    const scaleFactor = PREVIEW_SIZE / EMOJI_SIZE;
    ctx.save();
    ctx.translate(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(-EMOJI_SIZE / 2, -EMOJI_SIZE / 2);
    ctx.drawImage(processedImageRef.current, 0, 0);
    ctx.restore();
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

      // Store processed image for interactive preview
      processedImageRef.current = editedCanvas;

      // プレビュー更新 (larger preview size with crop/zoom support)
      // Skip preview update if animation is playing - it will be regenerated
      if (!enableAnimation) {
        updatePreviewCanvas();
      }

      // Blob生成（容量制限適用）
      const maxSize = PLATFORM_LIMITS[platform].maxSize;
      const blob = await canvasToBlobWithLimit(editedCanvas, outputFormat, outputQuality, maxSize);

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
  }, [
    file,
    platform,
    outputFormat,
    outputQuality,
    editOptions,
    enableAnimation,
    updatePreviewCanvas,
    announceStatus,
  ]);

  // ファイルまたは編集オプション変更時に画像を処理
  useEffect(() => {
    if (file) {
      processImage();
    }
  }, [file, platform, outputFormat, outputQuality, editOptions, processImage]);

  // コンポーネントアンマウント時にBlobURLをクリーンアップ
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント解除時のみクリーンアップ（二重revokeを防ぐため依存配列は空）

  const handleFileChange = useCallback(
    (selectedFile: File | null) => {
      if (selectedFile && selectedFile.type.startsWith("image/")) {
        setFile(selectedFile);
        announceStatus(`ファイルを選択しました: ${selectedFile.name}`);
      } else {
        announceStatus("画像ファイルを選択してください");
      }
    },
    [announceStatus],
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
    [handleFileChange],
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
    [handleDropzoneClick],
  );

  // Load FFmpeg when GIF format is selected (for animation support)
  useEffect(() => {
    if (outputFormat === "gif" && !ffmpegLoaded) {
      loadFFmpeg(ffmpegRef.current).then((loaded) => {
        setFfmpegLoaded(loaded);
      });
    }
  }, [outputFormat, ffmpegLoaded]);

  // Load FFmpeg for animation
  useEffect(() => {
    if (enableAnimation && !ffmpegLoaded) {
      loadFFmpeg(ffmpegRef.current).then((loaded) => {
        setFfmpegLoaded(loaded);
      });
    }
  }, [enableAnimation, ffmpegLoaded]);

  // Generate animation frames when animation is enabled
  const generateAnimation = useCallback(() => {
    if (!processedImageRef.current || !enableAnimation) return;

    const config: AnimationConfig = {
      effect: animationEffect,
      speed: animationSpeed,
      loop: animationLoop,
      useGSAP: useGSAP,
      gsapEasing: gsapEasing,
      easingDirection: easingDirection,
      duration: animationDuration,
    };

    // Generate frames synchronously
    const frames = generateAnimationFrames(processedImageRef.current, config, animationFps);

    // Only update if we have frames
    if (frames.length > 0) {
      animationFramesRef.current = frames;
      setIsAnimationPlaying(true);
    }
  }, [
    enableAnimation,
    animationEffect,
    animationSpeed,
    animationLoop,
    animationFps,
    useGSAP,
    gsapEasing,
    easingDirection,
    animationDuration,
  ]);

  // Generate animation when enabled or settings change
  useEffect(() => {
    if (enableAnimation && processedImageRef.current) {
      generateAnimation();
    } else {
      // Stop animation when disabled
      setIsAnimationPlaying(false);
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      // Update static preview when animation is disabled
      if (processedImageRef.current) {
        updatePreviewCanvas();
      }
    }
  }, [enableAnimation, generateAnimation, updatePreviewCanvas, editOptions]);

  // Animation playback in preview canvas
  useEffect(() => {
    if (!isAnimationPlaying || animationFramesRef.current.length === 0 || !canvasRef.current) {
      return;
    }

    let frameIndex = 0;
    const frameDelay = 1000 / animationFps;

    animationIntervalRef.current = window.setInterval(() => {
      if (!canvasRef.current || animationFramesRef.current.length === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear and draw current frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentFrame = animationFramesRef.current[frameIndex];
      const scaleFactor = PREVIEW_SIZE / EMOJI_SIZE;

      ctx.save();
      ctx.translate(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2);
      ctx.scale(scaleFactor, scaleFactor);
      ctx.translate(-EMOJI_SIZE / 2, -EMOJI_SIZE / 2);
      ctx.drawImage(currentFrame, 0, 0);
      ctx.restore();

      // Move to next frame
      frameIndex = (frameIndex + 1) % animationFramesRef.current.length;
    }, frameDelay);

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, [isAnimationPlaying, animationFps]);

  // Download handler with animation support
  const handleDownload = useCallback(async () => {
    if (!previewUrl && !enableAnimation) return;

    setIsProcessing(true);

    try {
      if (enableAnimation && ffmpegLoaded && animationFramesRef.current.length > 0) {
        // Generate animated GIF
        announceStatus("アニメーションGIFを生成しています...");

        // Convert frames to files
        const frameFiles: File[] = [];
        for (let i = 0; i < animationFramesRef.current.length; i++) {
          const frameCanvas = animationFramesRef.current[i];
          const blob = await new Promise<Blob | null>((resolve) => {
            frameCanvas.toBlob((b) => resolve(b), "image/png");
          });

          if (blob) {
            const file = new File([blob], `frame${i}.png`, { type: "image/png" });
            frameFiles.push(file);
          }
        }

        // Generate GIF with FFmpeg
        const gifBlob = await convertImagesToGif(
          ffmpegRef.current,
          frameFiles,
          animationFps,
          animationLoop,
          80, // Quality
          (msg) => announceStatus(msg),
        );

        if (gifBlob) {
          const url = URL.createObjectURL(gifBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `emoji_animated_${Date.now()}.gif`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          announceStatus("アニメーションGIFをダウンロードしました");
        } else {
          announceStatus("GIF生成に失敗しました");
        }
      } else {
        // Regular static image download
        const extension = FORMAT_EXTENSIONS[outputFormat];
        const a = document.createElement("a");
        a.href = previewUrl;
        a.download = `emoji_${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        announceStatus("ダウンロードしました");
      }
    } catch (error) {
      console.error("Download error:", error);
      announceStatus("ダウンロードに失敗しました");
    } finally {
      setIsProcessing(false);
    }
  }, [
    previewUrl,
    outputFormat,
    enableAnimation,
    ffmpegLoaded,
    animationFps,
    animationLoop,
    announceStatus,
  ]);

  const handleReset = useCallback(() => {
    setFile(null);
    setEditOptions(DEFAULT_EDIT_OPTIONS);
    setPreviewUrl("");
    setFileSize(0);
    announceStatus("リセットしました");
  }, [announceStatus]);

  /** テキスト埋め込みをリセット */
  const resetTextOptions = useCallback(() => {
    setEditOptions((prev) => ({ ...prev, ...DEFAULT_TEXT_OPTIONS }));
    announceStatus("テキスト設定をリセットしました");
  }, [announceStatus]);

  /** 回転・反転をリセット */
  const resetTransformOptions = useCallback(() => {
    setEditOptions((prev) => ({ ...prev, ...DEFAULT_TRANSFORM_OPTIONS }));
    announceStatus("回転・反転設定をリセットしました");
  }, [announceStatus]);

  /** フィルターをリセット */
  const resetFilterOptions = useCallback(() => {
    setEditOptions((prev) => ({ ...prev, ...DEFAULT_FILTER_OPTIONS }));
    announceStatus("フィルター設定をリセットしました");
  }, [announceStatus]);

  /** 透過処理をリセット */
  const resetTransparentOptions = useCallback(() => {
    setEditOptions((prev) => ({ ...prev, ...DEFAULT_TRANSPARENT_OPTIONS }));
    announceStatus("透過設定をリセットしました");
  }, [announceStatus]);

  /** 枠線をリセット */
  const resetBorderOptions = useCallback(() => {
    setEditOptions((prev) => ({ ...prev, ...DEFAULT_BORDER_OPTIONS }));
    announceStatus("枠線設定をリセットしました");
  }, [announceStatus]);

  /** 全ての編集オプションをリセット（画像は保持） */
  const resetAllEditOptions = useCallback(() => {
    setEditOptions(DEFAULT_EDIT_OPTIONS);
    announceStatus("全ての編集設定をリセットしました");
  }, [announceStatus]);

  const updateEditOption = <K extends keyof EditOptions>(key: K, value: EditOptions[K]) => {
    setEditOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="tool-container">
      <h1>絵文字コンバーター</h1>
      <p className="page-subtitle">Discord・Slack用の絵文字を作成（画像編集機能付き）</p>

      <div ref={statusRef} role="status" aria-live="polite" className="sr-only" />

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
              <p className="dropzone-text">クリックして画像を選択、またはドラッグ&ドロップ</p>
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

        {/* 出力形式選択 */}
        <section className="section">
          <h2 className="section-title">出力形式</h2>

          <div className="form-group">
            <label htmlFor="outputFormat" className="label">
              ファイル形式
            </label>
            <div className="format-selector">
              {(["png", "jpeg", "webp", "avif", "gif"] as OutputFormat[]).map((format) => {
                const isSupported = checkFormatSupport(format);
                return (
                  <label key={format} className="format-option">
                    <input
                      type="radio"
                      name="outputFormat"
                      value={format}
                      checked={outputFormat === format}
                      onChange={(e) => {
                        const newFormat = e.target.value as OutputFormat;
                        setOutputFormat(newFormat);
                        // Enable animation automatically when GIF is selected
                        if (newFormat === "gif") {
                          setEnableAnimation(true);
                        }
                      }}
                      disabled={!isSupported}
                    />
                    <span className="format-label">
                      {FORMAT_LABELS[format]}
                      {!isSupported && " (未対応)"}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {outputFormat !== "png" && outputFormat !== "gif" && (
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
              <small className="help-text">品質を下げるとファイルサイズが小さくなります</small>
            </div>
          )}
        </section>

        {/* アニメーション設定 */}
        {outputFormat === "gif" && (
          <section className="section">
            <h2 className="section-title">アニメーション</h2>
            <div className="form-group">
              <label className="label">エフェクト</label>
              <div className="format-selector">
                {(
                  [
                    "bounce",
                    "shake",
                    "rotate",
                    "pulse",
                    "fade",
                    "slide",
                    "wobble",
                    "pop",
                  ] as AnimationEffectType[]
                ).map((effect) => (
                  <label key={effect} className="format-option">
                    <input
                      type="radio"
                      name="animationEffect"
                      value={effect}
                      checked={animationEffect === effect}
                      onChange={(e) => setAnimationEffect(e.target.value as AnimationEffectType)}
                    />
                    <span className="format-label">{getAnimationEffectLabel(effect)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* GSAP イージング設定 */}
            <div className="form-group">
              <label className="label">イージング</label>
              <div className="format-selector">
                {(
                  [
                    "bounce",
                    "elastic",
                    "back",
                    "expo",
                    "circ",
                    "sine",
                    "power2",
                  ] as GSAPEasingType[]
                ).map((easing) => (
                  <label key={easing} className="format-option">
                    <input
                      type="radio"
                      name="gsapEasing"
                      value={easing}
                      checked={gsapEasing === easing}
                      onChange={(e) => setGsapEasing(e.target.value as GSAPEasingType)}
                    />
                    <span className="format-label">{getGSAPEasingLabel(easing)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* イージング方向 */}
            <div className="form-group">
              <label htmlFor="easingDirection" className="label">
                イージング方向: {getEasingDirectionLabel(easingDirection)}
              </label>
              <div className="format-selector">
                {(["in", "out", "inOut"] as EasingDirection[]).map((direction) => (
                  <label key={direction} className="format-option">
                    <input
                      type="radio"
                      name="easingDirection"
                      value={direction}
                      checked={easingDirection === direction}
                      onChange={(e) => setEasingDirection(e.target.value as EasingDirection)}
                    />
                    <span className="format-label">{getEasingDirectionLabel(direction)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group-horizontal">
              <div className="form-group">
                <label htmlFor="animationDuration" className="label">
                  アニメーション時間: {animationDuration.toFixed(1)}秒
                </label>
                <input
                  type="range"
                  id="animationDuration"
                  min="0.3"
                  max="3.0"
                  step="0.1"
                  value={animationDuration}
                  onChange={(e) => setAnimationDuration(parseFloat(e.target.value))}
                  className="slider"
                />
                <small className="help-text">1サイクルの長さ</small>
              </div>

              <div className="form-group">
                <label htmlFor="animationFps" className="label">
                  フレームレート: {animationFps} FPS
                </label>
                <input
                  type="range"
                  id="animationFps"
                  min="6"
                  max="30"
                  step="1"
                  value={animationFps}
                  onChange={(e) => setAnimationFps(parseInt(e.target.value))}
                  className="slider"
                />
                <small className="help-text">
                  FPSが高いほど滑らかですがファイルサイズが大きくなります
                </small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="animationLoop" className="label">
                ループ回数
              </label>
              <select
                id="animationLoop"
                value={animationLoop}
                onChange={(e) => setAnimationLoop(parseInt(e.target.value))}
                className="select"
              >
                <option value="0">無限ループ</option>
                <option value="1">1回</option>
                <option value="2">2回</option>
                <option value="3">3回</option>
                <option value="5">5回</option>
                <option value="10">10回</option>
              </select>
            </div>

            {!ffmpegLoaded && (
              <div className="info-box">
                <p>⏳ FFmpegを読み込んでいます...</p>
              </div>
            )}
          </section>
        )}

        {/* 編集オプションとプレビューを横並び */}
        {file && (
          <div className="emoji-editor-layout">
            {/* 編集オプション */}
            <div className="emoji-editor-panel">
              <section className="section">
                <div className="section-header-with-reset">
                  <h2 className="section-title">編集オプション</h2>
                  <button
                    type="button"
                    onClick={resetAllEditOptions}
                    className="reset-all-button"
                    aria-label="全ての編集設定をリセット"
                  >
                    全てリセット
                  </button>
                </div>

                <div className="edit-options-grid">
                  {/* テキスト埋め込み */}
                  <details className="details">
                    <summary className="details-summary">
                      <span>テキスト埋め込み</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          resetTextOptions();
                        }}
                        className="reset-section-button"
                        aria-label="テキスト設定をリセット"
                      >
                        リセット
                      </button>
                    </summary>
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
                          onChange={(e) => updateEditOption("fontSize", Number(e.target.value))}
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
                          onChange={(e) => updateEditOption("textX", Number(e.target.value))}
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
                          onChange={(e) => updateEditOption("textY", Number(e.target.value))}
                          className="range"
                        />
                      </div>
                    </div>
                  </details>

                  {/* 回転・反転 */}
                  <details className="details">
                    <summary className="details-summary">
                      <span>回転・反転</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          resetTransformOptions();
                        }}
                        className="reset-section-button"
                        aria-label="回転・反転設定をリセット"
                      >
                        リセット
                      </button>
                    </summary>
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
                          onChange={(e) => updateEditOption("rotation", Number(e.target.value))}
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
                    <summary className="details-summary">
                      <span>フィルター</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          resetFilterOptions();
                        }}
                        className="reset-section-button"
                        aria-label="フィルター設定をリセット"
                      >
                        リセット
                      </button>
                    </summary>
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
                          onChange={(e) => updateEditOption("brightness", Number(e.target.value))}
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
                          onChange={(e) => updateEditOption("contrast", Number(e.target.value))}
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
                          onChange={(e) => updateEditOption("saturation", Number(e.target.value))}
                          className="range"
                        />
                      </div>
                    </div>
                  </details>

                  {/* 透過処理 */}
                  <details className="details">
                    <summary className="details-summary">
                      <span>透過処理</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          resetTransparentOptions();
                        }}
                        className="reset-section-button"
                        aria-label="透過設定をリセット"
                      >
                        リセット
                      </button>
                    </summary>
                    <div className="details-content">
                      <div className="checkbox-group">
                        <label className="md3-checkbox-wrapper">
                          <input
                            type="checkbox"
                            checked={editOptions.transparent}
                            onChange={(e) => updateEditOption("transparent", e.target.checked)}
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
                            onChange={(e) => updateEditOption("transparentColor", e.target.value)}
                            className="color-input"
                          />
                        </div>
                      )}
                    </div>
                  </details>

                  {/* 枠線 */}
                  <details className="details">
                    <summary className="details-summary">
                      <span>枠線</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          resetBorderOptions();
                        }}
                        className="reset-section-button"
                        aria-label="枠線設定をリセット"
                      >
                        リセット
                      </button>
                    </summary>
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
                              onChange={(e) => updateEditOption("borderColor", e.target.value)}
                              className="color-input"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </details>
                </div>
              </section>
            </div>

            {/* プレビュー */}
            <div className="emoji-preview-panel">
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
                    className="button button-primary btn-primary"
                  >
                    {isProcessing ? "処理中..." : "ダウンロード"}
                  </button>

                  <button onClick={handleReset} className="button button-secondary btn-clear">
                    リセット
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
