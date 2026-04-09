/**
 * Base58 エンコード/デコードユーティリティ
 *
 * Base58 は Bitcoin で広く使われるエンコード方式です。
 * 視覚的に紛らわしい文字（0, O, I, l）を除いた 58 文字を使用します。
 * - Bitcoin Base58: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
 * - Flickr Base58: 123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ
 *
 * Base58Check はチェックサム（SHA-256 x2 の先頭 4 バイト）を付加した Bitcoin アドレス形式です。
 */

/** Base58 アルファベット種別 */
export type Base58Alphabet = "bitcoin" | "flickr";

/** Base58 エンコード結果 */
export interface Base58EncodeResult {
  /** エンコードされた文字列 */
  encoded: string;
  /** 入力バイト数 */
  inputBytes: number;
  /** 出力文字数 */
  outputLength: number;
}

/** Base58 デコード結果 */
export interface Base58DecodeResult {
  /** デコードされた文字列（UTF-8変換できない場合は hex 表現） */
  decoded: string;
  /** デコードされたバイト列 */
  bytes: Uint8Array;
  /** デコード成功か */
  success: boolean;
  /** エラーメッセージ */
  error?: string;
}

// ---------------------------------------------------------------------------
// 定数
// ---------------------------------------------------------------------------

/** Bitcoin Base58 アルファベット */
const BITCOIN_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Flickr Base58 アルファベット */
const FLICKR_ALPHABET = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/**
 * アルファベット文字列を選択する
 */
function getAlphabet(variant: Base58Alphabet): string {
  return variant === "flickr" ? FLICKR_ALPHABET : BITCOIN_ALPHABET;
}

/**
 * アルファベットから逆引き辞書を作成する
 */
function buildLookup(alphabet: string): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < alphabet.length; i++) {
    map.set(alphabet[i], i);
  }
  return map;
}

// ---------------------------------------------------------------------------
// エンコード
// ---------------------------------------------------------------------------

/**
 * テキストを Base58 エンコードする
 * @param text - エンコード対象のテキスト（UTF-8）
 * @param variant - アルファベット種別
 * @returns エンコード結果
 */
export function encodeBase58(
  text: string,
  variant: Base58Alphabet = "bitcoin",
): Base58EncodeResult {
  const bytes = new TextEncoder().encode(text);
  return encodeBase58Bytes(bytes, variant);
}

/**
 * バイト列を Base58 エンコードする
 * @param bytes - エンコード対象のバイト列
 * @param variant - アルファベット種別
 * @returns エンコード結果
 */
export function encodeBase58Bytes(
  bytes: Uint8Array,
  variant: Base58Alphabet = "bitcoin",
): Base58EncodeResult {
  const alphabet = getAlphabet(variant);

  // 空バイト列の早期リターン
  if (bytes.length === 0) {
    return { encoded: "", inputBytes: 0, outputLength: 0 };
  }

  // 先頭の 0x00 バイトをカウント（'1' で表現）
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros++;
  }

  // バイト列を大整数として処理（Base256 → Base58）
  // 可変長整数演算のため number[] を使用
  const digits: number[] = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 256;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  // 先頭ゼロ（元の '1' 相当）を削除
  while (digits.length > 1 && digits[digits.length - 1] === 0) {
    digits.pop();
  }

  // 文字列化（digits は逆順になっている）
  const result =
    alphabet[0].repeat(leadingZeros) +
    digits
      .reverse()
      .map((d) => alphabet[d])
      .join("");

  return {
    encoded: result,
    inputBytes: bytes.length,
    outputLength: result.length,
  };
}

// ---------------------------------------------------------------------------
// デコード
// ---------------------------------------------------------------------------

/**
 * Base58 エンコード文字列をデコードする
 * @param encoded - デコード対象の Base58 文字列
 * @param variant - アルファベット種別
 * @returns デコード結果
 */
export function decodeBase58(
  encoded: string,
  variant: Base58Alphabet = "bitcoin",
): Base58DecodeResult {
  const alphabet = getAlphabet(variant);
  const lookup = buildLookup(alphabet);

  // 空白を除去
  const cleaned = encoded.replace(/\s/g, "");

  if (cleaned.length === 0) {
    return { decoded: "", bytes: new Uint8Array(0), success: true };
  }

  // 文字バリデーション
  for (const ch of cleaned) {
    if (!lookup.has(ch)) {
      return {
        decoded: "",
        bytes: new Uint8Array(0),
        success: false,
        error: `無効な文字が含まれています: '${ch}' （使用可能: ${alphabet}）`,
      };
    }
  }

  // 先頭の '1'（= 0x00 バイト）をカウント
  const firstChar = alphabet[0];
  let leadingZeros = 0;
  while (leadingZeros < cleaned.length && cleaned[leadingZeros] === firstChar) {
    leadingZeros++;
  }

  // Base58 → Base256 変換
  const digits: number[] = [0];
  for (let i = 0; i < cleaned.length; i++) {
    let carry = lookup.get(cleaned[i])!;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 58;
      digits[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      digits.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // 末尾のゼロを削除
  while (digits.length > 1 && digits[digits.length - 1] === 0) {
    digits.pop();
  }

  // バイト列を構築（先頭の 0x00 + 逆順の digits）
  const outputBytes = new Uint8Array(leadingZeros + digits.length);
  for (let i = 0; i < digits.length; i++) {
    outputBytes[leadingZeros + i] = digits[digits.length - 1 - i];
  }

  // UTF-8 変換を試みる
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(outputBytes);
    return { decoded, bytes: outputBytes, success: true };
  } catch {
    // バイナリデータは hex 表現で返す
    const hexStr = Array.from(outputBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    return { decoded: hexStr, bytes: outputBytes, success: true };
  }
}

// ---------------------------------------------------------------------------
// バリデーション
// ---------------------------------------------------------------------------

/**
 * 文字列が有効な Base58 エンコードかを検証する
 * @param input - 検証する文字列
 * @param variant - アルファベット種別
 * @returns エラーメッセージ（問題なければ null）
 */
export function validateBase58(input: string, variant: Base58Alphabet = "bitcoin"): string | null {
  const alphabet = getAlphabet(variant);
  const cleaned = input.replace(/\s/g, "");

  if (cleaned.length === 0) return null;

  for (const ch of cleaned) {
    if (!alphabet.includes(ch)) {
      return `無効な文字: '${ch}'（使用不可: 0, O, I, l）`;
    }
  }

  return null;
}
