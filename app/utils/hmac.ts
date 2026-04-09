/**
 * HMAC アルゴリズム情報
 */
export interface HmacAlgorithmInfo {
  /** 表示名 */
  name: string;
  /** Web Crypto API のアルゴリズム名 */
  algorithm: string;
  /** ビット長 */
  bits: number;
  /** セキュリティ非推奨フラグ */
  deprecated?: boolean;
}

/**
 * HMAC 計算結果
 */
export interface HmacResult {
  /** 表示名 */
  algorithmName: string;
  /** 計算結果の文字列 */
  value: string;
  /** ビット長 */
  bits: number;
  /** セキュリティ非推奨フラグ */
  deprecated?: boolean;
}

/**
 * 出力フォーマット
 */
export type HmacOutputFormat = "hex" | "base64";

/**
 * サポートする HMAC アルゴリズム一覧
 */
export const HMAC_ALGORITHMS: HmacAlgorithmInfo[] = [
  { name: "HMAC-SHA-1", algorithm: "SHA-1", bits: 160, deprecated: true },
  { name: "HMAC-SHA-256", algorithm: "SHA-256", bits: 256 },
  { name: "HMAC-SHA-384", algorithm: "SHA-384", bits: 384 },
  { name: "HMAC-SHA-512", algorithm: "SHA-512", bits: 512 },
];

/**
 * テキストを Uint8Array に変換する
 * @param text - 変換する文字列
 * @returns Uint8Array
 */
export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * Uint8Array を 16 進数文字列に変換する
 * @param bytes - 変換するバイト列
 * @returns 16 進数文字列
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Uint8Array を Base64 文字列に変換する
 * @param bytes - 変換するバイト列
 * @returns Base64 文字列
 */
export function bytesToBase64(bytes: Uint8Array): string {
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("");
  return btoa(binary);
}

/**
 * Web Crypto API を使用して HMAC を計算する
 * @param algorithm - ハッシュアルゴリズム名（SHA-1, SHA-256 など）
 * @param keyData - 秘密鍵のバイト列
 * @param messageData - メッセージのバイト列
 * @returns HMAC バイト列
 */
export async function computeHmac(
  algorithm: string,
  keyData: Uint8Array,
  messageData: Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData as BufferSource,
    { name: "HMAC", hash: { name: algorithm } },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData.buffer as ArrayBuffer);
  return new Uint8Array(signature);
}

/**
 * 全 HMAC アルゴリズムで HMAC を計算する
 * @param message - メッセージのバイト列
 * @param key - 秘密鍵のバイト列
 * @param format - 出力フォーマット（hex または base64）
 * @returns HMAC 計算結果一覧
 */
export async function computeAllHmacs(
  message: Uint8Array,
  key: Uint8Array,
  format: HmacOutputFormat = "hex",
): Promise<HmacResult[]> {
  return Promise.all(
    HMAC_ALGORITHMS.map(async (algo) => {
      const bytes = await computeHmac(algo.algorithm, key, message);
      const value = format === "hex" ? bytesToHex(bytes) : bytesToBase64(bytes);
      return {
        algorithmName: algo.name,
        value,
        bits: algo.bits,
        deprecated: algo.deprecated,
      };
    }),
  );
}
