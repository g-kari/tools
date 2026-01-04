import { useState, useCallback, useEffect } from "react";
import {
  isImageFile,
  getImageDimensions,
  createImagePreviewUrl,
} from "~/utils/image";

/**
 * 画像プレビューの状態
 */
export interface ImagePreviewState {
  /** 選択されたファイル */
  file: File | null;
  /** プレビューURL */
  previewUrl: string | null;
  /** 画像のサイズ */
  dimensions: { width: number; height: number } | null;
}

/**
 * 画像プレビューフックのオプション
 */
export interface UseImagePreviewOptions {
  /** ファイルタイプエラー時のコールバック */
  onTypeError?: () => void;
  /** 画像読み込みエラー時のコールバック */
  onLoadError?: () => void;
  /** 画像読み込み成功時のコールバック */
  onLoadSuccess?: (dimensions: { width: number; height: number }) => void;
}

/**
 * 画像プレビューフックの戻り値
 */
export interface UseImagePreviewReturn extends ImagePreviewState {
  /** ファイルを選択する */
  selectFile: (file: File) => Promise<void>;
  /** プレビューをクリアする */
  clear: () => void;
  /** 読み込み中かどうか */
  isLoading: boolean;
}

/**
 * 画像プレビュー機能を提供するフック
 *
 * @example
 * ```tsx
 * const {
 *   file,
 *   previewUrl,
 *   dimensions,
 *   selectFile,
 *   clear,
 *   isLoading,
 * } = useImagePreview({
 *   onTypeError: () => showToast("画像ファイルを選択してください", "error"),
 *   onLoadSuccess: (dims) => {
 *     setWidth(dims.width);
 *     setHeight(dims.height);
 *   },
 * });
 * ```
 */
export function useImagePreview(
  options: UseImagePreviewOptions = {}
): UseImagePreviewReturn {
  const { onTypeError, onLoadError, onLoadSuccess } = options;

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectFile = useCallback(
    async (newFile: File) => {
      // ファイルタイプチェック
      if (!isImageFile(newFile)) {
        onTypeError?.();
        return;
      }

      // 前のプレビューをクリーンアップ
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setIsLoading(true);
      setFile(newFile);

      try {
        // プレビューURLを作成
        const url = createImagePreviewUrl(newFile);
        setPreviewUrl(url);

        // 画像のサイズを取得
        const dims = await getImageDimensions(newFile);
        setDimensions(dims);
        onLoadSuccess?.(dims);
      } catch {
        onLoadError?.();
        setPreviewUrl(null);
        setDimensions(null);
      } finally {
        setIsLoading(false);
      }
    },
    [previewUrl, onTypeError, onLoadError, onLoadSuccess]
  );

  const clear = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setDimensions(null);
    setIsLoading(false);
  }, [previewUrl]);

  return {
    file,
    previewUrl,
    dimensions,
    selectFile,
    clear,
    isLoading,
  };
}
