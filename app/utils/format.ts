/**
 * @fileoverview フォーマット用ユーティリティ関数
 */

/**
 * バイト数を人間が読みやすい形式に変換する
 * @param bytes - バイト数
 * @returns フォーマットされた文字列（例: "1.5 MB"）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  // parseFloatを使って不要な末尾のゼロを削除（例: 1.00 → 1）
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));

  return `${size} ${units[i]}`;
}

/**
 * 数値をパーセンテージ文字列に変換する
 * @param value - 値（0-1または0-100）
 * @param isDecimal - trueの場合、valueを0-1として扱う
 * @returns パーセンテージ文字列（例: "75%"）
 */
export function formatPercent(value: number, isDecimal = false): string {
  const percent = isDecimal ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

/**
 * 画像サイズを「幅 × 高さ」形式でフォーマットする
 * @param width - 幅
 * @param height - 高さ
 * @returns フォーマットされた文字列（例: "1920 × 1080 px"）
 */
export function formatDimensions(width: number, height: number): string {
  return `${width} × ${height} px`;
}
