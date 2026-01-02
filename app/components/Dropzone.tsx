/**
 * @fileoverview MUIベースのドロップゾーンコンポーネント
 * ファイルのドラッグ&ドロップまたはクリックによるアップロードをサポート
 * WCAG 2.1準拠のアクセシビリティ対応
 */

import { useState, useRef, useCallback, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

/**
 * Dropzoneコンポーネントのプロパティ
 */
interface DropzoneProps {
  /** ファイルが選択された時のコールバック */
  onFileSelect: (file: File) => void;
  /** 複数ファイル選択時のコールバック（指定時はonFileSelectより優先） */
  onFilesSelect?: (files: File[]) => void;
  /** 受け付けるファイルタイプ（例: "image/*", "audio/*"） */
  accept?: string;
  /** 複数ファイル選択を許可するか */
  multiple?: boolean;
  /** 無効化状態 */
  disabled?: boolean;
  /** アクセシビリティ用のラベル */
  ariaLabel?: string;
  /** 表示テキスト（メイン） */
  text?: string;
  /** 表示テキスト（ヒント） */
  hint?: string;
  /** カスタムアイコン（ReactNode） */
  icon?: ReactNode;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * MUIベースのファイルアップロード用ドロップゾーンコンポーネント
 * ドラッグ&ドロップまたはクリックでファイルを選択可能
 *
 * @example
 * ```tsx
 * <Dropzone
 *   onFileSelect={(file) => handleFile(file)}
 *   accept="image/*"
 *   text="クリックして画像を選択、またはドラッグ&ドロップ"
 *   hint="PNG, JPEG, WebP など"
 * />
 * ```
 */
export function Dropzone({
  onFileSelect,
  onFilesSelect,
  accept = "*/*",
  multiple = false,
  disabled = false,
  ariaLabel = "ファイルをアップロード",
  text = "クリックしてファイルを選択、またはドラッグ&ドロップ",
  hint,
  icon,
  className = "",
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      if (onFilesSelect && multiple) {
        onFilesSelect(files);
      } else if (files[0]) {
        onFileSelect(files[0]);
      }
    },
    [disabled, multiple, onFileSelect, onFilesSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      if (onFilesSelect && multiple) {
        onFilesSelect(files);
      } else if (files[0]) {
        onFileSelect(files[0]);
      }

      // 同じファイルを再選択できるようにリセット
      e.target.value = "";
    },
    [multiple, onFileSelect, onFilesSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !disabled) {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [disabled]
  );

  return (
    <>
      <Box
        className={className}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          p: 4,
          border: "2px dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          borderRadius: 2,
          bgcolor: isDragging ? "primary.50" : "background.paper",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            borderColor: disabled ? "divider" : "primary.main",
            bgcolor: disabled ? "background.paper" : "action.hover",
          },
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
        }}
      >
        {icon || (
          <CloudUploadIcon
            sx={{
              fontSize: 48,
              color: isDragging ? "primary.main" : "text.secondary",
            }}
          />
        )}
        <Typography
          variant="body1"
          color={isDragging ? "primary.main" : "text.primary"}
          textAlign="center"
        >
          {text}
        </Typography>
        {hint && (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {hint}
          </Typography>
        )}
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled}
        style={{ display: "none" }}
        aria-label={ariaLabel}
      />
    </>
  );
}
