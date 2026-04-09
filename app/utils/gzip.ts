/**
 * GZip/Deflate 圧縮・解凍ユーティリティ
 *
 * ブラウザ標準の CompressionStream / DecompressionStream API を使用して
 * gzip・deflate・deflate-raw 形式のテキスト圧縮・解凍を行う。
 */

/** サポートする圧縮形式 */
export type GzipFormat = "gzip" | "deflate" | "deflate-raw";

/** 圧縮結果 */
export interface CompressResult {
  /** 圧縮後バイト列 */
  bytes: Uint8Array;
  /** Base64エンコード済み文字列 */
  base64: string;
  /** 入力バイト数 */
  originalSize: number;
  /** 圧縮後バイト数 */
  compressedSize: number;
  /** 圧縮率（0.0〜1.0。正値=圧縮成功、負値=サイズ増） */
  ratio: number;
}

/** 解凍結果 */
export interface DecompressResult {
  /** 解凍後テキスト */
  text: string;
  /** 解凍後バイト列 */
  bytes: Uint8Array;
  /** 圧縮前バイト数 */
  compressedSize: number;
  /** 解凍後バイト数 */
  decompressedSize: number;
}

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/**
 * ReadableStream からすべてのチャンクを読み取り単一の Uint8Array に結合する
 * @param readable - 読み取り対象ストリーム
 */
async function readAllChunks(readable: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

/**
 * Uint8Array を Base64 文字列に変換する
 * @param bytes - 変換するバイト列
 * @returns Base64文字列
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Base64 文字列を Uint8Array に変換する
 * @param base64 - Base64文字列（空白は自動除去）
 * @throws {Error} 無効な Base64 文字列の場合
 */
export function base64ToBytes(base64: string): Uint8Array {
  const cleaned = base64.replace(/\s/g, "");
  let binary: string;
  try {
    binary = atob(cleaned);
  } catch {
    throw new Error("無効な Base64 文字列です");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * テキストを指定形式で圧縮し Base64 を返す
 * @param text - 圧縮するテキスト（UTF-8）
 * @param format - 圧縮形式（gzip / deflate / deflate-raw）
 * @returns 圧縮結果
 */
export async function compressText(text: string, format: GzipFormat): Promise<CompressResult> {
  const inputBytes = new TextEncoder().encode(text);
  const stream = new CompressionStream(format);
  const writer = stream.writable.getWriter();
  await writer.write(inputBytes);
  await writer.close();

  const compressed = await readAllChunks(stream.readable);
  const base64 = bytesToBase64(compressed);
  const ratio = inputBytes.length > 0 ? 1 - compressed.length / inputBytes.length : 0;

  return {
    bytes: compressed,
    base64,
    originalSize: inputBytes.length,
    compressedSize: compressed.length,
    ratio,
  };
}

/**
 * Base64 エンコードされた圧縮データを解凍してテキストを返す
 * @param base64 - Base64エンコードされた圧縮データ
 * @param format - 圧縮形式（gzip / deflate / deflate-raw）
 * @returns 解凍結果
 * @throws {Error} 無効なデータの場合
 */
export async function decompressBase64(
  base64: string,
  format: GzipFormat,
): Promise<DecompressResult> {
  const compressedBytes = base64ToBytes(base64);
  const stream = new DecompressionStream(format);
  const writer = stream.writable.getWriter();
  await writer.write(compressedBytes as BufferSource);
  await writer.close();

  const decompressed = await readAllChunks(stream.readable);
  const text = new TextDecoder("utf-8", { fatal: true }).decode(decompressed);

  return {
    text,
    bytes: decompressed,
    compressedSize: compressedBytes.length,
    decompressedSize: decompressed.length,
  };
}

/**
 * バイト数を人間が読みやすい文字列に変換する
 * @param bytes - バイト数
 * @returns フォーマット済み文字列（例: "1.23 KB"）
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** 圧縮形式の表示ラベル */
export const GZIP_FORMAT_LABELS: Record<GzipFormat, string> = {
  gzip: "gzip",
  deflate: "deflate (zlib)",
  "deflate-raw": "deflate-raw",
};
