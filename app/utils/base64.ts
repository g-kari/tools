/**
 * Base64 エンコード・デコードユーティリティ
 *
 * RFC 4648 Section 4 に基づく Base64 エンコード。
 * UTF-8 テキストを対象とし、ブラウザ組み込みの btoa/atob を用いる。
 */

import type { DecodeResult, EncodeResult } from "~/types/converter";

/**
 * テキストを Base64 にエンコードする
 * @param text - エンコードするテキスト（UTF-8）
 * @param _options - Base64 はオプションなし（ConversionConfig 互換のため受け取る）
 * @returns エンコード結果
 */
export function encodeBase64(text: string, _options?: Record<string, never>): EncodeResult {
  const encoded = btoa(unescape(encodeURIComponent(text)));
  const inputBytes = new TextEncoder().encode(text).length;
  return {
    encoded,
    inputBytes,
    outputLength: encoded.length,
  };
}

/**
 * Base64 文字列をデコードする
 * @param text - デコードする Base64 文字列
 * @param _options - Base64 はオプションなし（ConversionConfig 互換のため受け取る）
 * @returns デコード結果（成功/失敗の判別可能 union）
 */
export function decodeBase64(text: string, _options?: Record<string, never>): DecodeResult {
  try {
    const decoded = decodeURIComponent(escape(atob(text)));
    const bytes = new TextEncoder().encode(decoded);
    return { success: true, decoded, bytes };
  } catch {
    return {
      success: false,
      error: "無効な Base64 文字列です。入力を確認してください。",
    };
  }
}

/**
 * Base64 文字列の簡易バリデーション
 * @param text - 検証する文字列
 * @param _options - Base64 はオプションなし（ConversionConfig 互換のため受け取る）
 * @returns エラーメッセージ、または null（有効な場合）
 */
export function validateBase64(text: string, _options?: Record<string, never>): string | null {
  const normalized = text.trim();
  if (normalized.length === 0) return null;
  const invalidMatch = normalized.match(/[^A-Za-z0-9+/=\s]/);
  if (invalidMatch) {
    return `無効な文字が含まれています: "${invalidMatch[0]}"。Base64 は A–Z, a–z, 0–9, +, /, = のみ使用できます。`;
  }
  return null;
}
