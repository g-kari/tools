/**
 * Base36 エンコード/デコードユーティリティ
 *
 * Base36 は [0-9a-z] の 36 文字を使用するエンコード方式です。
 * JavaScript の Number.prototype.toString(36) / parseInt(str, 36) と互換性があります。
 * URL に安全で、英数字（小文字）のみで構成されます。
 * 短い ID 生成・数値の短縮表現・ライセンスキー生成などに使われます。
 */

/** Base36 アルファベット（小文字標準） */
const BASE36_ALPHABET_LOWER = "0123456789abcdefghijklmnopqrstuvwxyz";

/** Base36 アルファベット（大文字） */
const BASE36_ALPHABET_UPPER = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Base36 アルファベット種別 */
export type Base36Variant = "lower" | "upper";

/** Base36 エンコード結果 */
export interface Base36EncodeResult {
  /** エンコードされた文字列 */
  encoded: string;
  /** 入力バイト数 */
  inputBytes: number;
  /** 出力文字数 */
  outputLength: number;
}

/** Base36 デコード結果 */
export interface Base36DecodeResult {
  /** デコードされた文字列（UTF-8 変換できない場合は hex 表現） */
  decoded: string;
  /** デコードされたバイト列 */
  bytes: Uint8Array;
  /** デコード成功か */
  success: boolean;
  /** エラーメッセージ */
  error?: string;
}

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/**
 * バリアントに対応するアルファベット文字列を返す
 */
function getAlphabet(variant: Base36Variant): string {
  return variant === "upper" ? BASE36_ALPHABET_UPPER : BASE36_ALPHABET_LOWER;
}

/**
 * アルファベットから逆引き辞書を作成する（大文字小文字を統一して扱う）
 */
function buildLookup(_variant: Base36Variant): Map<string, number> {
  const alphabet = BASE36_ALPHABET_LOWER;
  const map = new Map<string, number>();
  for (let i = 0; i < alphabet.length; i++) {
    map.set(alphabet[i], i);
    map.set(alphabet[i].toUpperCase(), i);
  }
  return map;
}

// ---------------------------------------------------------------------------
// エンコード（テキスト）
// ---------------------------------------------------------------------------

/**
 * テキストを Base36 エンコードする
 * @param text - エンコード対象のテキスト（UTF-8）
 * @param variant - 出力アルファベット種別
 * @returns エンコード結果
 */
export function encodeBase36(text: string, variant: Base36Variant = "lower"): Base36EncodeResult {
  const bytes = new TextEncoder().encode(text);
  return encodeBase36Bytes(bytes, variant);
}

/**
 * バイト列を Base36 エンコードする
 * @param bytes - エンコード対象のバイト列
 * @param variant - 出力アルファベット種別
 * @returns エンコード結果
 */
export function encodeBase36Bytes(
  bytes: Uint8Array,
  variant: Base36Variant = "lower",
): Base36EncodeResult {
  const alphabet = getAlphabet(variant);

  if (bytes.length === 0) {
    return { encoded: "", inputBytes: 0, outputLength: 0 };
  }

  // 先頭の 0x00 バイトをカウント
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros++;
  }

  // バイト列を大整数として処理（Base256 → Base36）
  const digits: number[] = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 256;
      digits[j] = carry % 36;
      carry = Math.floor(carry / 36);
    }
    while (carry > 0) {
      digits.push(carry % 36);
      carry = Math.floor(carry / 36);
    }
  }

  // 末尾ゼロを削除
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
// 整数変換
// ---------------------------------------------------------------------------

/**
 * 整数（bigint）を Base36 エンコードする
 * JavaScript の Number.prototype.toString(36) と互換
 * @param n - エンコード対象の非負整数
 * @param variant - 出力アルファベット種別
 * @returns エンコード結果文字列
 */
export function encodeIntBase36(n: bigint, variant: Base36Variant = "lower"): string {
  const alphabet = getAlphabet(variant);
  if (n < 0n) throw new RangeError("負の整数はエンコードできません");
  if (n === 0n) return alphabet[0];

  let result = "";
  let remaining = n;
  while (remaining > 0n) {
    result = alphabet[Number(remaining % 36n)] + result;
    remaining = remaining / 36n;
  }
  return result;
}

/**
 * Base36 文字列を整数（bigint）にデコードする
 * @param encoded - デコード対象の Base36 文字列（大文字小文字を区別しない）
 * @returns デコードされた非負整数
 */
export function decodeIntBase36(encoded: string): bigint {
  const lookup = buildLookup("lower");
  let result = 0n;
  for (const ch of encoded.toLowerCase()) {
    const val = lookup.get(ch);
    if (val === undefined) throw new Error(`無効な文字: '${ch}'`);
    result = result * 36n + BigInt(val);
  }
  return result;
}

// ---------------------------------------------------------------------------
// デコード（テキスト）
// ---------------------------------------------------------------------------

/**
 * Base36 エンコード文字列をデコードする
 * @param encoded - デコード対象の Base36 文字列（大文字小文字を区別しない）
 * @returns デコード結果
 */
export function decodeBase36(encoded: string): Base36DecodeResult {
  const lookup = buildLookup("lower");
  const cleaned = encoded.replace(/\s/g, "").toLowerCase();

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
        error: `無効な文字が含まれています: '${ch}' （使用可能: 0-9a-z）`,
      };
    }
  }

  // 先頭の '0' （= 0x00 バイト）をカウント
  let leadingZeros = 0;
  while (leadingZeros < cleaned.length && cleaned[leadingZeros] === "0") {
    leadingZeros++;
  }

  // Base36 → Base256 変換
  const digits: number[] = [0];
  for (let i = 0; i < cleaned.length; i++) {
    let carry = lookup.get(cleaned[i])!;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 36;
      digits[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      digits.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // 末尾ゼロを削除
  while (digits.length > 1 && digits[digits.length - 1] === 0) {
    digits.pop();
  }

  // バイト列を構築
  const outputBytes = new Uint8Array(leadingZeros + digits.length);
  for (let i = 0; i < digits.length; i++) {
    outputBytes[leadingZeros + i] = digits[digits.length - 1 - i];
  }

  // UTF-8 変換を試みる
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(outputBytes);
    return { decoded, bytes: outputBytes, success: true };
  } catch {
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
 * 文字列が有効な Base36 エンコードかを検証する（大文字小文字を区別しない）
 * @param input - 検証する文字列
 * @returns エラーメッセージ（問題なければ null）
 */
export function validateBase36(input: string): string | null {
  const cleaned = input.replace(/\s/g, "");
  if (cleaned.length === 0) return null;

  for (const ch of cleaned) {
    if (!/^[0-9a-zA-Z]$/.test(ch)) {
      return `無効な文字: '${ch}'`;
    }
  }
  return null;
}
