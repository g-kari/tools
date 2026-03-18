/**
 * Base62 エンコード/デコードユーティリティ
 *
 * Base62 は [0-9A-Za-z] の 62 文字を使用するエンコード方式です。
 * URL に安全で、英数字のみで構成されます。
 * URL 短縮サービス・短い一意 ID 生成・数値の短縮表現に広く使われます。
 */

/** Base62 アルファベット（標準: 0-9A-Za-z） */
const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Base62 アルファベット（小文字優先: 0-9a-zA-Z） */
const BASE62_ALPHABET_LOWER_FIRST = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Base62 アルファベット種別 */
export type Base62Variant = 'standard' | 'lower-first';

/** Base62 エンコード結果 */
export interface Base62EncodeResult {
  /** エンコードされた文字列 */
  encoded: string;
  /** 入力バイト数 */
  inputBytes: number;
  /** 出力文字数 */
  outputLength: number;
}

/** Base62 デコード結果 */
export interface Base62DecodeResult {
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
function getAlphabet(variant: Base62Variant): string {
  return variant === 'lower-first' ? BASE62_ALPHABET_LOWER_FIRST : BASE62_ALPHABET;
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
 * テキストを Base62 エンコードする
 * @param text - エンコード対象のテキスト（UTF-8）
 * @param variant - アルファベット種別
 * @returns エンコード結果
 */
export function encodeBase62(
  text: string,
  variant: Base62Variant = 'standard',
): Base62EncodeResult {
  const bytes = new TextEncoder().encode(text);
  return encodeBase62Bytes(bytes, variant);
}

/**
 * バイト列を Base62 エンコードする
 * @param bytes - エンコード対象のバイト列
 * @param variant - アルファベット種別
 * @returns エンコード結果
 */
export function encodeBase62Bytes(
  bytes: Uint8Array,
  variant: Base62Variant = 'standard',
): Base62EncodeResult {
  const alphabet = getAlphabet(variant);

  if (bytes.length === 0) {
    return { encoded: '', inputBytes: 0, outputLength: 0 };
  }

  // 先頭の 0x00 バイトをカウント（'0' で表現）
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
    leadingZeros++;
  }

  // バイト列を大整数として処理（Base256 → Base62）
  const digits: number[] = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 256;
      digits[j] = carry % 62;
      carry = Math.floor(carry / 62);
    }
    while (carry > 0) {
      digits.push(carry % 62);
      carry = Math.floor(carry / 62);
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
      .join('');

  return {
    encoded: result,
    inputBytes: bytes.length,
    outputLength: result.length,
  };
}

/**
 * 整数（bigint）を Base62 エンコードする
 * URL 短縮などの数値 ID 変換に使用
 * @param n - エンコード対象の非負整数
 * @param variant - アルファベット種別
 * @returns エンコード結果文字列
 */
export function encodeIntBase62(n: bigint, variant: Base62Variant = 'standard'): string {
  const alphabet = getAlphabet(variant);
  if (n < 0n) throw new RangeError('負の整数はエンコードできません');
  if (n === 0n) return alphabet[0];

  let result = '';
  let remaining = n;
  while (remaining > 0n) {
    result = alphabet[Number(remaining % 62n)] + result;
    remaining = remaining / 62n;
  }
  return result;
}

/**
 * Base62 文字列を整数（bigint）にデコードする
 * @param encoded - デコード対象の Base62 文字列
 * @param variant - アルファベット種別
 * @returns デコードされた非負整数
 */
export function decodeIntBase62(encoded: string, variant: Base62Variant = 'standard'): bigint {
  const alphabet = getAlphabet(variant);
  const lookup = buildLookup(alphabet);
  let result = 0n;
  for (const ch of encoded) {
    const val = lookup.get(ch);
    if (val === undefined) throw new Error(`無効な文字: '${ch}'`);
    result = result * 62n + BigInt(val);
  }
  return result;
}

// ---------------------------------------------------------------------------
// デコード
// ---------------------------------------------------------------------------

/**
 * Base62 エンコード文字列をデコードする
 * @param encoded - デコード対象の Base62 文字列
 * @param variant - アルファベット種別
 * @returns デコード結果
 */
export function decodeBase62(
  encoded: string,
  variant: Base62Variant = 'standard',
): Base62DecodeResult {
  const alphabet = getAlphabet(variant);
  const lookup = buildLookup(alphabet);

  // 空白を除去
  const cleaned = encoded.replace(/\s/g, '');

  if (cleaned.length === 0) {
    return { decoded: '', bytes: new Uint8Array(0), success: true };
  }

  // 文字バリデーション
  for (const ch of cleaned) {
    if (!lookup.has(ch)) {
      return {
        decoded: '',
        bytes: new Uint8Array(0),
        success: false,
        error: `無効な文字が含まれています: '${ch}' （使用可能: ${alphabet}）`,
      };
    }
  }

  // 先頭の '0' （= 0x00 バイト）をカウント
  const firstChar = alphabet[0];
  let leadingZeros = 0;
  while (leadingZeros < cleaned.length && cleaned[leadingZeros] === firstChar) {
    leadingZeros++;
  }

  // Base62 → Base256 変換
  const digits: number[] = [0];
  for (let i = 0; i < cleaned.length; i++) {
    let carry = lookup.get(cleaned[i])!;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 62;
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
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(outputBytes);
    return { decoded, bytes: outputBytes, success: true };
  } catch {
    // バイナリデータは hex 表現で返す
    const hexStr = Array.from(outputBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    return { decoded: hexStr, bytes: outputBytes, success: true };
  }
}

// ---------------------------------------------------------------------------
// バリデーション
// ---------------------------------------------------------------------------

/**
 * 文字列が有効な Base62 エンコードかを検証する
 * @param input - 検証する文字列
 * @param variant - アルファベット種別
 * @returns エラーメッセージ（問題なければ null）
 */
export function validateBase62(
  input: string,
  variant: Base62Variant = 'standard',
): string | null {
  const alphabet = getAlphabet(variant);
  const cleaned = input.replace(/\s/g, '');

  if (cleaned.length === 0) return null;

  for (const ch of cleaned) {
    if (!alphabet.includes(ch)) {
      return `無効な文字: '${ch}'`;
    }
  }

  return null;
}
