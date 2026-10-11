/**
 * エンコード/デコード系ツールの共通型定義
 *
 * Base16/Base32/Base36/Base58/Base62/Base64/Base85 などの変換ツールが
 * 共通で利用する型を集約する。
 */

/** 変換モード（エンコード or デコード） */
export type ConversionMode = "encode" | "decode";

/**
 * エンコード結果
 * @property encoded - エンコード済み文字列
 * @property inputBytes - 入力のバイト数（UTF-8 基準）
 * @property outputLength - 出力文字列の長さ
 */
export interface EncodeResult {
  encoded: string;
  inputBytes: number;
  outputLength: number;
}

/** デコード成功結果 */
export interface DecodeSuccessResult {
  success: true;
  decoded: string;
  bytes: Uint8Array;
}

/** デコード失敗結果 */
export interface DecodeErrorResult {
  success: false;
  error: string;
}

/** デコード結果（成功/失敗の判別可能 union） */
export type DecodeResult = DecodeSuccessResult | DecodeErrorResult;

/**
 * 変換ツールの振る舞いを注入するためのコンフィグ
 * @typeParam T - ツール固有のオプション型（例: Base16 なら `{ letterCase, delimiter }`）
 */
export interface ConversionConfig<T> {
  /** エンコード関数。options はツール固有のオプション */
  encode: (text: string, options: T) => EncodeResult;
  /** デコード関数。成功/失敗を判別可能 union で返す */
  decode: (text: string, options: T) => DecodeResult;
  /**
   * デコード前の入力バリデーション。エラーメッセージを返すと UI にエラー表示する。
   * null の場合は妥当とみなして decode に進む。
   */
  validate?: (text: string, options: T) => string | null;
  /** オプションの初期値 */
  defaultOptions: T;
}
