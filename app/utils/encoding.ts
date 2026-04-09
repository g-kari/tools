import Encoding from "encoding-japanese";

/** サポートする文字コードの種類 */
export type EncodingName = "UTF8" | "SJIS" | "EUCJP" | "JIS" | "UTF16BE";

/** 文字コードのラベル定義 */
export interface EncodingInfo {
  /** encoding-japanese の内部コード */
  code: EncodingName;
  /** 表示名 */
  label: string;
  /** 一般的な別名 */
  alias: string;
}

/** サポートする文字コード一覧 */
export const SUPPORTED_ENCODINGS: EncodingInfo[] = [
  { code: "UTF8", label: "UTF-8", alias: "Unicode (UTF-8)" },
  { code: "SJIS", label: "Shift_JIS", alias: "CP932 / Windows-31J" },
  { code: "EUCJP", label: "EUC-JP", alias: "Extended Unix Code" },
  { code: "JIS", label: "ISO-2022-JP", alias: "JIS / メールJIS" },
  { code: "UTF16BE", label: "UTF-16 BE", alias: "Unicode (UTF-16 Big Endian)" },
];

/** エンコード変換の結果 */
export interface EncodeResult {
  /** 文字コード情報 */
  encoding: EncodingInfo;
  /** バイト列（Uint8Array） */
  bytes: Uint8Array;
  /** バイト数 */
  byteCount: number;
  /** 16進数表現（スペース区切り） */
  hex: string;
  /** エラーメッセージ（変換失敗時） */
  error?: string;
}

/**
 * テキストを指定した文字コードにエンコードしてバイト列を返す
 * @param text - エンコードするテキスト
 * @param encoding - 変換先の文字コード
 * @returns Uint8Array のバイト列
 */
export function encodeText(text: string, encoding: EncodingName): Uint8Array {
  if (!text) return new Uint8Array(0);

  // 入力文字列を Unicode コードポイント配列に変換
  const unicodeArray = Encoding.stringToCode(text);

  // 対象エンコーディングに変換
  const converted = Encoding.convert(unicodeArray, {
    to: encoding,
    from: "UNICODE",
  });

  return new Uint8Array(converted);
}

/**
 * バイト列を指定した文字コードからデコードして文字列を返す
 * @param bytes - デコードするバイト列
 * @param encoding - デコード元の文字コード（省略時は自動検出）
 * @returns デコードされた文字列
 */
export function decodeBytes(bytes: Uint8Array, encoding?: EncodingName): string {
  if (!bytes.length) return "";

  const from = encoding ?? (Encoding.detect(bytes) as EncodingName) ?? "UTF8";

  const unicodeArray = Encoding.convert(Array.from(bytes), {
    to: "UNICODE",
    from,
  });

  return Encoding.codeToString(unicodeArray);
}

/**
 * バイト列を 16 進数文字列に変換する
 * @param bytes - 変換するバイト列
 * @returns スペース区切りの 16 進数文字列（例: "E3 81 82"）
 */
export function toHexString(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
}

/**
 * 16 進数文字列をバイト列に変換する
 * @param hex - 16 進数文字列（スペース・コロン・改行区切りを許容）
 * @returns Uint8Array のバイト列。変換に失敗した場合は null
 */
export function hexToBytes(hex: string): Uint8Array | null {
  const cleaned = hex.replace(/[\s:,\n]/g, "");
  if (!cleaned) return new Uint8Array(0);
  if (cleaned.length % 2 !== 0) return null;
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) return null;

  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * バイト列の文字コードを自動検出する
 * @param bytes - 検出対象のバイト列
 * @returns 検出された文字コード名（検出できなかった場合は 'UTF8'）
 */
export function detectEncoding(bytes: Uint8Array): EncodingName {
  const detected = Encoding.detect(bytes);
  if (!detected || detected === false) return "UTF8";

  // encoding-japanese の検出結果をサポートコードにマッピング
  switch (detected) {
    case "SJIS":
      return "SJIS";
    case "EUCJP":
      return "EUCJP";
    case "JIS":
      return "JIS";
    case "UTF16":
    case "UTF16BE":
      return "UTF16BE";
    default:
      return "UTF8";
  }
}

/**
 * テキストを全サポート文字コードにエンコードして結果一覧を返す
 * @param text - エンコードするテキスト
 * @returns 各文字コードのエンコード結果配列
 */
export function encodeToAll(text: string): EncodeResult[] {
  return SUPPORTED_ENCODINGS.map((enc) => {
    try {
      const bytes = encodeText(text, enc.code);
      return {
        encoding: enc,
        bytes,
        byteCount: bytes.length,
        hex: toHexString(bytes),
      };
    } catch (e) {
      const error = e instanceof Error ? e.message : "変換エラー";
      return {
        encoding: enc,
        bytes: new Uint8Array(0),
        byteCount: 0,
        hex: "",
        error,
      };
    }
  });
}
