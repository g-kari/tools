/**
 * 画像圧縮ツールの型定義
 */

/**
 * 出力フォーマット
 */
export type OutputFormat = "jpeg" | "webp" | "png";

/**
 * 圧縮アイテムの状態
 */
export type CompressStatus = "pending" | "compressing" | "done" | "error";

/**
 * 複数画像圧縮の個別アイテム
 */
export interface CompressItem {
  /** 一意なID */
  id: string;
  /** 元のファイル */
  originalFile: File;
  /** プレビューURL（Object URL） */
  previewUrl: string;
  /** 圧縮後のBlob */
  compressedBlob: Blob | null;
  /** 圧縮後プレビューURL（Object URL） */
  compressedPreviewUrl: string | null;
  /** 圧縮ステータス */
  status: CompressStatus;
  /** エラーメッセージ（status === "error" の場合） */
  error?: string;
}
