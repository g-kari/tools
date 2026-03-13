/**
 * QRコード生成ユーティリティ関数
 *
 * QRコードのバージョン40（最大容量）において、英数字モードで格納できる
 * 最大文字数は4296文字です。
 */

/** QRコードの最大入力文字数（バージョン40、英数字モード） */
export const QR_MAX_LENGTH = 4296;

/** QRコードのサイズ定義 */
export const QR_SIZES = [128, 256, 512] as const;
export type QrSize = (typeof QR_SIZES)[number];

/** QRコードのエラー訂正レベル */
export const QR_ERROR_CORRECTION_LEVELS = ["L", "M", "Q", "H"] as const;
export type QrErrorCorrectionLevel = (typeof QR_ERROR_CORRECTION_LEVELS)[number];

/** QRコードのサイズラベルマッピング */
const QR_SIZE_LABELS: Record<QrSize, string> = {
  128: "小 (128px)",
  256: "中 (256px)",
  512: "大 (512px)",
};

/**
 * QRコードの入力テキストを検証する
 *
 * @param text - 検証するテキスト
 * @returns テキストが有効な場合はtrue、無効な場合はfalse
 */
export function validateQrInput(text: string): boolean {
  if (text.length === 0) return false;
  if (text.length > QR_MAX_LENGTH) return false;
  return true;
}

/**
 * QRコードのサイズラベルを返す
 *
 * @param size - サイズ（ピクセル）
 * @returns サイズラベル文字列。未定義のサイズの場合は空文字列を返す
 */
export function getQrSizeLabel(size: number): string {
  return QR_SIZE_LABELS[size as QrSize] ?? "";
}

/**
 * HEXカラーコードが有効かどうかを検証する
 *
 * @param color - 検証するカラー文字列（例: "#ff0000"）
 * @returns 有効なHEXカラーコードの場合はtrue、そうでない場合はfalse
 */
export function isValidHexColor(color: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
}

/**
 * エラー訂正レベルが有効かどうかを検証する
 *
 * QRコードのエラー訂正レベルは L、M、Q、H の4種類が有効です。
 *
 * @param level - 検証するエラー訂正レベル文字列
 * @returns 有効なエラー訂正レベルの場合はtrue、そうでない場合はfalse
 */
export function isValidErrorCorrectionLevel(level: string): boolean {
  return (QR_ERROR_CORRECTION_LEVELS as readonly string[]).includes(level);
}
