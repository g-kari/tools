/**
 * Base16 (Hex) エンコード・デコードユーティリティ
 * RFC 4648 Section 8 に基づく16進数エンコード
 */

/** 大文字/小文字の出力オプション */
export type Base16Case = "upper" | "lower";

/** 区切り文字オプション */
export type Base16Delimiter = "none" | "space" | "colon" | "dash";

/** エンコード結果 */
export interface Base16EncodeResult {
  encoded: string;
  inputBytes: number;
  outputLength: number;
}

/** デコード結果 */
export interface Base16DecodeResult {
  success: true;
  decoded: string;
  bytes: Uint8Array;
}

/** デコードエラー結果 */
export interface Base16DecodeErrorResult {
  success: false;
  error: string;
}

const DELIMITERS: Record<Base16Delimiter, string> = {
  none: "",
  space: " ",
  colon: ":",
  dash: "-",
};

/**
 * テキストを Base16 (Hex) にエンコードする
 * @param text - エンコードするテキスト（UTF-8）
 * @param letterCase - 出力の大文字/小文字
 * @param delimiter - バイト間の区切り文字
 * @returns エンコード結果
 */
export function encodeBase16(
  text: string,
  letterCase: Base16Case = "upper",
  delimiter: Base16Delimiter = "none",
): Base16EncodeResult {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  return encodeBase16Bytes(bytes, letterCase, delimiter);
}

/**
 * バイト列を Base16 (Hex) にエンコードする
 * @param bytes - エンコードするバイト列
 * @param letterCase - 出力の大文字/小文字
 * @param delimiter - バイト間の区切り文字
 * @returns エンコード結果
 */
export function encodeBase16Bytes(
  bytes: Uint8Array,
  letterCase: Base16Case = "upper",
  delimiter: Base16Delimiter = "none",
): Base16EncodeResult {
  const sep = DELIMITERS[delimiter];
  const parts: string[] = [];

  for (const byte of bytes) {
    const hex = byte.toString(16).padStart(2, "0");
    parts.push(letterCase === "upper" ? hex.toUpperCase() : hex);
  }

  const encoded = parts.join(sep);
  return {
    encoded,
    inputBytes: bytes.length,
    outputLength: encoded.length,
  };
}

/**
 * Base16 (Hex) 文字列をデコードする
 * @param hex - デコードする16進数文字列
 * @returns デコード結果またはエラー
 */
export function decodeBase16(hex: string): Base16DecodeResult | Base16DecodeErrorResult {
  // 空白・コロン・ダッシュ区切りを除去して正規化
  const normalized = hex.replace(/[\s:_-]/g, "").toLowerCase();

  if (normalized.length === 0) {
    const bytes = new Uint8Array(0);
    return { success: true, decoded: "", bytes };
  }

  const validationError = validateBase16(normalized);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }

  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const decoded = decoder.decode(bytes);
    return { success: true, decoded, bytes };
  } catch {
    return {
      success: false,
      error:
        "有効な UTF-8 テキストにデコードできません。バイナリデータが含まれている可能性があります。",
    };
  }
}

/**
 * Base16 文字列を検証する
 * @param hex - 検証する文字列（空白・区切り文字除去済みを想定）
 * @param raw - 元の入力文字列（省略時は hex と同じ）
 * @returns エラーメッセージ、または null（有効な場合）
 */
export function validateBase16(hex: string, raw?: string): string | null {
  const normalized = (raw !== undefined ? raw : hex).replace(/[\s:_-]/g, "").toLowerCase();

  if (normalized.length % 2 !== 0) {
    return `文字数が奇数です（${normalized.length} 文字）。16進数は2文字で1バイトを表します。`;
  }

  const invalidMatch = normalized.match(/[^0-9a-f]/);
  if (invalidMatch) {
    return `無効な文字が含まれています: "${invalidMatch[0]}"。使用できるのは 0–9 と A–F (a–f) のみです。`;
  }

  return null;
}
