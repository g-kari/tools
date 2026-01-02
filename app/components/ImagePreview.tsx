/**
 * @fileoverview 画像プレビュー表示用コンポーネント
 */

import { formatFileSize } from "../utils/format";

/**
 * 画像情報の型定義
 */
export interface ImageInfo {
  /** 画像のURL（ObjectURLまたはdata URL） */
  src: string;
  /** ファイル名 */
  name?: string;
  /** 画像の幅（px） */
  width?: number;
  /** 画像の高さ（px） */
  height?: number;
  /** ファイルサイズ（bytes） */
  size?: number;
}

/**
 * ImagePreviewコンポーネントのProps
 */
export interface ImagePreviewProps {
  /** 画像情報 */
  image: ImageInfo;
  /** 代替テキスト */
  alt?: string;
  /** サムネイルとして表示（小さいサイズ） */
  thumbnail?: boolean;
  /** ローディング状態 */
  loading?: boolean;
  /** 画像情報を表示するか（デフォルト: true） */
  showInfo?: boolean;
  /** カスタム情報を表示 */
  customInfo?: React.ReactNode;
  /** CSSクラス名 */
  className?: string;
}

/**
 * 画像プレビュー表示用コンポーネント
 *
 * @example 基本的な使用
 * ```tsx
 * <ImagePreview
 *   image={{
 *     src: previewUrl,
 *     name: file.name,
 *     width: 1920,
 *     height: 1080,
 *     size: file.size
 *   }}
 *   alt="元画像プレビュー"
 * />
 * ```
 *
 * @example サムネイル表示
 * ```tsx
 * <ImagePreview
 *   image={{ src: previewUrl, name: file.name }}
 *   thumbnail
 *   showInfo={false}
 * />
 * ```
 */
export function ImagePreview({
  image,
  alt = "画像プレビュー",
  thumbnail = false,
  loading = false,
  showInfo = true,
  customInfo,
  className,
}: ImagePreviewProps) {
  const containerClass = thumbnail
    ? "image-source-preview"
    : "image-preview-container";

  const imageClass = thumbnail
    ? "image-source-thumbnail"
    : "image-preview-image";

  if (loading) {
    return (
      <div className={`${containerClass} ${className ?? ""}`}>
        <div className="loading-enhanced">
          <div className="spinner-enhanced" />
          <span className="loading-text">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClass} ${className ?? ""}`}>
      <img
        src={image.src}
        alt={alt}
        className={imageClass}
        loading="lazy"
      />
      {showInfo && (
        <div className="image-source-info">
          {image.name && <span>{image.name}</span>}
          {image.width && image.height && (
            <span>{image.width} × {image.height} px</span>
          )}
          {image.size !== undefined && (
            <span>{formatFileSize(image.size)}</span>
          )}
          {customInfo}
        </div>
      )}
    </div>
  );
}

/**
 * 画像比較プレビューコンポーネントのProps
 */
export interface ImageCompareProps {
  /** 元画像 */
  original: ImageInfo;
  /** 処理後画像 */
  processed: ImageInfo | null;
  /** 元画像のラベル */
  originalLabel?: string;
  /** 処理後画像のラベル */
  processedLabel?: string;
  /** ローディング状態 */
  loading?: boolean;
  /** ローディングテキスト */
  loadingText?: string;
  /** 処理待ちテキスト */
  pendingText?: string;
}

/**
 * 画像比較用プレビューコンポーネント（Before/After表示）
 *
 * @example
 * ```tsx
 * <ImageCompare
 *   original={{ src: originalUrl, size: originalFile.size }}
 *   processed={compressedUrl ? { src: compressedUrl, size: compressedSize } : null}
 *   originalLabel="元の画像"
 *   processedLabel="圧縮後"
 *   loading={isCompressing}
 *   loadingText="圧縮中..."
 * />
 * ```
 */
export function ImageCompare({
  original,
  processed,
  originalLabel = "元の画像",
  processedLabel = "処理後",
  loading = false,
  loadingText = "処理中...",
  pendingText = "処理待ち",
}: ImageCompareProps) {
  return (
    <div className="preview-comparison">
      <div className="preview-panel">
        <h3 className="preview-label">{originalLabel}</h3>
        <div className="preview-image-container">
          <img
            src={original.src}
            alt={originalLabel}
            className="preview-image"
            loading="lazy"
          />
        </div>
        {original.size !== undefined && (
          <div className="preview-size-info">
            {formatFileSize(original.size)}
          </div>
        )}
      </div>

      <div className="preview-panel">
        <h3 className="preview-label">{processedLabel}</h3>
        <div className="preview-image-container">
          {loading ? (
            <div className="loading-enhanced">
              <div className="spinner-enhanced" />
              <span className="loading-text">{loadingText}</span>
            </div>
          ) : processed ? (
            <>
              <img
                src={processed.src}
                alt={processedLabel}
                className="preview-image"
                loading="lazy"
              />
            </>
          ) : (
            <span className="preview-placeholder">{pendingText}</span>
          )}
        </div>
        {processed?.size !== undefined && (
          <div className="preview-size-info">
            {formatFileSize(processed.size)}
            {original.size !== undefined && (
              <span className={processed.size < original.size ? "size-decrease" : "size-increase"}>
                {" "}
                ({processed.size < original.size ? "-" : "+"}
                {Math.abs(Math.round((1 - processed.size / original.size) * 100))}%)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
