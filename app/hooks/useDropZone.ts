import { useState, useCallback, type DragEvent } from "react";

/**
 * ドロップゾーンのオプション
 */
export interface UseDropZoneOptions {
  /** ファイルが選択された時のコールバック（複数ファイル対応） */
  onFileSelect: (files: File[]) => void;
  /** ドロップ時に許可するファイルタイプ（MIMEタイプのプレフィックス、例: "image/"） */
  acceptType?: string;
  /** ファイルタイプエラー時のコールバック */
  onTypeError?: () => void;
  /** 複数ファイルを許可するか */
  multiple?: boolean;
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
 *   onFileSelect: (files) => console.log(files),
 *   acceptType: "image/",
 *   multiple: true,
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
  multiple = false,
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

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      // ファイルタイプチェック
      if (acceptType) {
        const validFiles = droppedFiles.filter((file) => file.type.startsWith(acceptType));
        const invalidFiles = droppedFiles.filter((file) => !file.type.startsWith(acceptType));
        if (invalidFiles.length > 0) {
          onTypeError?.();
        }
        if (validFiles.length === 0) return;
        const filesToProcess = multiple ? validFiles : [validFiles[0]];
        onFileSelect(filesToProcess);
        return;
      }

      const filesToProcess = multiple ? droppedFiles : [droppedFiles[0]];
      onFileSelect(filesToProcess);
    },
    [onFileSelect, acceptType, onTypeError, multiple],
  );

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
