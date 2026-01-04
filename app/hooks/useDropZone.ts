import { useState, useCallback, type DragEvent } from "react";

/**
 * ドロップゾーンのオプション
 */
export interface UseDropZoneOptions {
  /** ファイルが選択された時のコールバック */
  onFileSelect: (file: File) => void;
  /** ドロップ時に許可するファイルタイプ（MIMEタイプのプレフィックス、例: "image/"） */
  acceptType?: string;
  /** ファイルタイプエラー時のコールバック */
  onTypeError?: () => void;
}

/**
 * ドロップゾーンの状態とイベントハンドラーを返すフックの戻り値
 */
export interface UseDropZoneReturn {
  /** ドラッグ中かどうか */
  isDragging: boolean;
  /** ドラッグオーバーイベントハンドラー */
  handleDragOver: (e: DragEvent) => void;
  /** ドラッグリーブイベントハンドラー */
  handleDragLeave: (e: DragEvent) => void;
  /** ドロップイベントハンドラー */
  handleDrop: (e: DragEvent) => void;
}

/**
 * ドラッグ&ドロップ機能を提供するフック
 *
 * @example
 * ```tsx
 * const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useDropZone({
 *   onFileSelect: (file) => console.log(file),
 *   acceptType: "image/",
 *   onTypeError: () => showToast("画像ファイルを選択してください", "error"),
 * });
 *
 * return (
 *   <div
 *     className={`dropzone ${isDragging ? "dragging" : ""}`}
 *     onDragOver={handleDragOver}
 *     onDragLeave={handleDragLeave}
 *     onDrop={handleDrop}
 *   >
 *     ドロップしてください
 *   </div>
 * );
 * ```
 */
export function useDropZone({
  onFileSelect,
  acceptType,
  onTypeError,
}: UseDropZoneOptions): UseDropZoneReturn {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      // ファイルタイプチェック
      if (acceptType && !file.type.startsWith(acceptType)) {
        onTypeError?.();
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect, acceptType, onTypeError]
  );

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
