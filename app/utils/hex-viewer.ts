/**
 * Hex Viewer ユーティリティ
 * バイト列を xxd 形式のhexダンプとして表示するためのユーティリティ
 */

/** 1行分のhexダンプデータ */
export interface HexRow {
  /** オフセット（バイト位置） */
  offset: number;
  /** 16進数の各バイト文字列（空文字はパディング） */
  hexBytes: string[];
  /** ASCII表示文字列（非表示文字は`.`） */
  ascii: string;
}

/** Hex Viewer の設定オプション */
export interface HexViewerOptions {
  /** 1行あたりのバイト数（8 | 16 | 32） */
  bytesPerRow: 8 | 16 | 32;
  /** 16進数を大文字で表示するか */
  uppercase: boolean;
  /** 最大表示バイト数 */
  maxBytes: number;
}

/** デフォルト設定 */
export const DEFAULT_HEX_OPTIONS: HexViewerOptions = {
  bytesPerRow: 16,
  uppercase: false,
  maxBytes: 65536, // 64KB
};

/**
 * バイト値を16進数文字列に変換する
 * @param byte バイト値 (0-255)
 * @param uppercase 大文字にするか
 * @returns 2桁の16進数文字列
 */
export function byteToHex(byte: number, uppercase: boolean): string {
  const hex = byte.toString(16).padStart(2, "0");
  return uppercase ? hex.toUpperCase() : hex;
}

/**
 * バイト値をASCII表示文字に変換する
 * 表示可能文字（0x20-0x7E）はそのまま返し、それ以外は `.` を返す
 * @param byte バイト値
 * @returns ASCII表示文字
 */
export function byteToAsciiChar(byte: number): string {
  if (byte >= 0x20 && byte <= 0x7e) {
    return String.fromCharCode(byte);
  }
  return ".";
}

/**
 * オフセット値をhex文字列にフォーマットする
 * @param offset オフセット値
 * @param uppercase 大文字にするか
 * @returns 8桁の16進数オフセット文字列
 */
export function formatOffset(offset: number, uppercase: boolean): string {
  const hex = offset.toString(16).padStart(8, "0");
  return uppercase ? hex.toUpperCase() : hex;
}

/**
 * Uint8Array をhexダンプ行の配列に変換する
 * @param data バイト配列
 * @param options Hex Viewer 設定
 * @returns HexRow の配列
 */
export function toHexRows(data: Uint8Array, options: HexViewerOptions): HexRow[] {
  const { bytesPerRow, uppercase, maxBytes } = options;
  const limitedData = data.length > maxBytes ? data.slice(0, maxBytes) : data;
  const rows: HexRow[] = [];

  for (let offset = 0; offset < limitedData.length; offset += bytesPerRow) {
    const rowBytes = limitedData.slice(offset, offset + bytesPerRow);
    const hexBytes: string[] = [];
    let ascii = "";

    for (let i = 0; i < bytesPerRow; i++) {
      if (i < rowBytes.length) {
        hexBytes.push(byteToHex(rowBytes[i], uppercase));
        ascii += byteToAsciiChar(rowBytes[i]);
      } else {
        hexBytes.push("");
      }
    }

    rows.push({ offset, hexBytes, ascii });
  }

  return rows;
}

/**
 * hexダンプをプレーンテキスト（xxd形式）にフォーマットする
 * @param data バイト配列
 * @param options Hex Viewer 設定
 * @returns xxd 形式のhexダンプ文字列
 */
export function toHexDumpText(data: Uint8Array, options: HexViewerOptions): string {
  const { bytesPerRow, uppercase, maxBytes } = options;
  const limitedData = data.length > maxBytes ? data.slice(0, maxBytes) : data;
  const lines: string[] = [];

  for (let offset = 0; offset < limitedData.length; offset += bytesPerRow) {
    const rowBytes = limitedData.slice(offset, offset + bytesPerRow);
    const offsetStr = formatOffset(offset, uppercase);

    const hexPart = Array.from(rowBytes)
      .map((b) => byteToHex(b, uppercase))
      .join(" ")
      .padEnd(bytesPerRow * 3 - 1);

    const asciiPart = Array.from(rowBytes)
      .map((b) => byteToAsciiChar(b))
      .join("");

    lines.push(`${offsetStr}: ${hexPart}  ${asciiPart}`);
  }

  if (data.length > maxBytes) {
    lines.push(`... (${data.length - maxBytes} バイト省略)`);
  }

  return lines.join("\n");
}

/**
 * テキストを UTF-8 バイト配列に変換する
 * @param text 入力テキスト
 * @returns UTF-8 バイト配列
 */
export function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * ファイルサイズを人間が読みやすい文字列に変換する
 * @param bytes バイト数
 * @returns 人間が読みやすいサイズ文字列
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
