/**
 * 画像関連のユーティリティ関数
 */

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
 * Blobを指定したファイル名でダウンロードする
 * @param blob - ダウンロードするBlob
 * @param filename - ファイル名
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * ファイルが画像かどうかをチェックする
 * @param file - チェックするファイル
 * @returns 画像の場合はtrue
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * 画像ファイルのサイズ（幅・高さ）を取得する
 * @param file - 画像ファイル
 * @returns 幅と高さを含むPromise
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました"));
    };

    img.src = url;
  });
}

/**
 * 画像ファイルのプレビューURLを作成する
 * @param file - 画像ファイル
 * @returns プレビューURL
 */
export function createImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * 最大サイズ制限
 */
export const MAX_DIMENSION = 10000;

/**
 * 最小サイズ制限
 */
export const MIN_DIMENSION = 1;

/**
 * 値を指定された範囲内にクランプする
 * @param value - クランプする値
 * @param min - 最小値
 * @param max - 最大値
 * @returns クランプされた値
 */
export function clampDimension(
  value: number,
  min: number = MIN_DIMENSION,
  max: number = MAX_DIMENSION
): number {
  return Math.max(min, Math.min(max, Math.round(value)));
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
 * MIMEタイプから拡張子を取得する
 * @param mimeType - MIMEタイプ
 * @returns 拡張子（ドット付き）
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff",
  };
  return mimeToExt[mimeType] || ".png";
}

/**
 * ファイル名から拡張子を除いた名前を取得する
 * @param filename - ファイル名
 * @returns 拡張子を除いた名前
 */
export function getFilenameWithoutExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

/**
 * ファイル名から拡張子を取得する
 * @param filename - ファイル名
 * @returns 拡張子（ドット付き）
 */
export function getExtension(filename: string): string {
  const match = filename.match(/\.[^/.]+$/);
  return match ? match[0] : ".png";
}
