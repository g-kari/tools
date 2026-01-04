import { useRef, useCallback, type ReactNode } from "react";
import { useDropZone } from "~/hooks/useDropZone";

/**
 * ImageUploadZoneのProps
 */
export interface ImageUploadZoneProps {
  /** ファイルが選択された時のコールバック */
  onFileSelect: (file: File) => void;
  /** ファイルタイプエラー時のコールバック */
  onTypeError?: () => void;
  /** 許可するファイルタイプのaccept属性 */
  accept?: string;
  /** 無効状態 */
  disabled?: boolean;
  /** ヒントテキスト */
  hint?: string;
  /** メインテキスト */
  text?: string;
  /** カスタムコンテンツ */
  children?: ReactNode;
  /** aria-label */
  ariaLabel?: string;
  /** input要素のID（テスト用） */
  inputId?: string;
}

/**
 * アップロードアイコンコンポーネント
 */
function UploadIcon() {
  return (
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
  );
}

/**
 * 画像アップロード用のドロップゾーンコンポーネント
 *
 * @example
 * ```tsx
 * <ImageUploadZone
 *   onFileSelect={(file) => handleFileSelect(file)}
 *   onTypeError={() => showToast("画像ファイルを選択してください", "error")}
 *   hint="PNG, JPEG, WebP など"
 * />
 * ```
 */
export function ImageUploadZone({
  onFileSelect,
  onTypeError,
  accept = "image/*",
  disabled = false,
  hint = "PNG, JPEG, WebP など",
  text = "クリックして画像を選択、またはドラッグ&ドロップ",
  children,
  ariaLabel = "画像ファイルをアップロード",
  inputId = "imageFile",
}: ImageUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isDragging, handleDragOver, handleDragLeave, handleDrop } =
    useDropZone({
      onFileSelect,
      acceptType: "image/",
      onTypeError,
    });

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!disabled && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [disabled]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <>
      <div
        className={`dropzone ${isDragging ? "dragging" : ""} ${disabled ? "disabled" : ""}`}
        onDragOver={disabled ? undefined : handleDragOver}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDrop={disabled ? undefined : handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        onKeyDown={handleKeyDown}
      >
        {children || (
          <div className="dropzone-content">
            <UploadIcon />
            <p className="dropzone-text">{text}</p>
            <p className="dropzone-hint">{hint}</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden-file-input"
        aria-label="画像ファイルを選択"
      />
    </>
  );
}
