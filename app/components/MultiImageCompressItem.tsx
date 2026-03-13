import { type CompressItem } from "~/types/image-compress";
import { formatFileSize } from "~/utils/image";
import { calculateCompressionRatio } from "~/routes/image-compress";

/**
 * MultiImageCompressItemのProps
 */
interface MultiImageCompressItemProps {
  /** 圧縮アイテムデータ */
  item: CompressItem;
  /** ダウンロードボタンクリック時のコールバック */
  onDownload: (id: string) => void;
  /** 削除ボタンクリック時のコールバック */
  onRemove: (id: string) => void;
}

/**
 * 複数画像圧縮リストの個別アイテムコンポーネント
 *
 * サムネイル、ファイル情報、圧縮統計、操作ボタンを表示する。
 *
 * @example
 * ```tsx
 * <MultiImageCompressItem
 *   item={compressItem}
 *   onDownload={(id) => handleDownload(id)}
 *   onRemove={(id) => handleRemove(id)}
 * />
 * ```
 */
export function MultiImageCompressItem({
  item,
  onDownload,
  onRemove,
}: MultiImageCompressItemProps) {
  const isCompressing = item.status === "compressing";
  const isDone = item.status === "done";
  const isError = item.status === "error";

  const compressionRatio =
    isDone && item.compressedBlob
      ? calculateCompressionRatio(
          item.originalFile.size,
          item.compressedBlob.size
        )
      : null;

  return (
    <div
      className={`compress-image-card${isCompressing ? " compress-card-compressing" : ""}${isError ? " compress-card-error" : ""}`}
      role="article"
      aria-label={`${item.originalFile.name} の圧縮アイテム`}
    >
      {/* サムネイル */}
      <div className="compress-image-thumbnail-container">
        {item.compressedPreviewUrl && isDone ? (
          <img
            src={item.compressedPreviewUrl}
            alt={`${item.originalFile.name} の圧縮後プレビュー`}
            className="compress-image-thumbnail"
          />
        ) : (
          <img
            src={item.previewUrl}
            alt={`${item.originalFile.name} のプレビュー`}
            className="compress-image-thumbnail"
          />
        )}

        {/* 圧縮中オーバーレイ */}
        {isCompressing && (
          <div className="compress-image-overlay" aria-hidden="true">
            <div className="spinner-enhanced" />
          </div>
        )}
      </div>

      {/* ファイル情報 */}
      <div className="compress-image-info">
        <p
          className="compress-image-filename"
          title={item.originalFile.name}
          aria-label={`ファイル名: ${item.originalFile.name}`}
        >
          {item.originalFile.name}
        </p>

        <div className="compress-image-sizes" aria-label="ファイルサイズ情報">
          <span className="compress-size-label">元:</span>
          <span className="compress-size-value">
            {formatFileSize(item.originalFile.size)}
          </span>

          {isDone && item.compressedBlob && (
            <>
              <span className="compress-size-arrow" aria-hidden="true">
                →
              </span>
              <span className="compress-size-label">圧縮後:</span>
              <span className="compress-size-value">
                {formatFileSize(item.compressedBlob.size)}
              </span>
            </>
          )}
        </div>

        {/* 削減率バッジ */}
        {compressionRatio !== null && (
          <div
            className={`compress-ratio-badge ${compressionRatio > 0 ? "compress-ratio-positive" : "compress-ratio-negative"}`}
            aria-label={`削減率: ${compressionRatio > 0 ? `-${compressionRatio}%` : `+${Math.abs(compressionRatio)}%`}`}
          >
            {compressionRatio > 0
              ? `-${compressionRatio}%`
              : `+${Math.abs(compressionRatio)}%`}
          </div>
        )}

        {/* 圧縮中テキスト */}
        {isCompressing && (
          <p className="compress-progress-text" role="status" aria-live="polite">
            圧縮中...
          </p>
        )}

        {/* エラー表示 */}
        {isError && (
          <p
            className="compress-error-text"
            role="alert"
            aria-live="assertive"
          >
            {item.error ?? "圧縮に失敗しました"}
          </p>
        )}

        {/* 操作ボタン */}
        <div className="compress-image-actions">
          <button
            type="button"
            className="compress-action-btn compress-action-download"
            onClick={() => onDownload(item.id)}
            disabled={!isDone || !item.compressedBlob}
            aria-label={`${item.originalFile.name} をダウンロード`}
          >
            ダウンロード
          </button>
          <button
            type="button"
            className="compress-action-btn compress-action-remove"
            onClick={() => onRemove(item.id)}
            aria-label={`${item.originalFile.name} を削除`}
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
