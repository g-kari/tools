/**
 * Base32 エンコード/デコードユーティリティ
 * RFC 4648 Section 6 準拠
 * - Standard Base32: アルファベット A–Z, 2–7
 * - Base32hex:       アルファベット 0–9, A–V
 */

/** Base32 エンコード方式 */
export type Base32Variant = 'standard' | 'hex';

/** Base32 エンコード結果 */
export interface Base32EncodeResult {
  /** エンコードされた文字列 */
  encoded: string;
  /** 入力バイト数 */
  inputBytes: number;
  /** 出力文字数（パディング含む） */
  outputLength: number;
}

/** Base32 デコード結果 */
export interface Base32DecodeResult {
  /** デコードされた文字列（UTF-8変換できない場合は空文字） */
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

/** RFC 4648 Standard Base32 アルファベット (A–Z, 2–7) */
const STANDARD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** RFC 4648 Base32hex アルファベット (0–9, A–V) */
const HEX_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUV';

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/**
 * アルファベットから逆引き辞書を作成する
 */
function buildLookup(alphabet: string): Record<string, number> {
  const lookup: Record<string, number> = {};
  for (let i = 0; i < alphabet.length; i++) {
    lookup[alphabet[i]] = i;
  }
  return lookup;
}

// ---------------------------------------------------------------------------
// エンコード
// ---------------------------------------------------------------------------

/**
 * テキストを Base32 エンコードする
 * @param text - エンコード対象のテキスト（UTF-8）
 * @param variant - エンコード方式（standard / hex）
 * @param padding - パディング文字 '=' を付加するか
 * @returns エンコード結果
 */
export function encodeBase32(
  text: string,
  variant: Base32Variant = 'standard',
  padding = true,
): Base32EncodeResult {
  const bytes = new TextEncoder().encode(text);
  return encodeBase32Bytes(bytes, variant, padding);
}

/**
 * バイト列を Base32 エンコードする
 * @param bytes - エンコード対象のバイト列
 * @param variant - エンコード方式
 * @param padding - パディングを付加するか
 * @returns エンコード結果
 */
export function encodeBase32Bytes(
  bytes: Uint8Array,
  variant: Base32Variant = 'standard',
  padding = true,
): Base32EncodeResult {
  const alphabet = variant === 'hex' ? HEX_ALPHABET : STANDARD_ALPHABET;
  let result = '';

  // 5バイトを8文字（40ビット → 8×5ビット）に変換
  for (let i = 0; i < bytes.length; i += 5) {
    const b0 = bytes[i] ?? 0;
    const b1 = bytes[i + 1] ?? 0;
    const b2 = bytes[i + 2] ?? 0;
    const b3 = bytes[i + 3] ?? 0;
    const b4 = bytes[i + 4] ?? 0;

    result += alphabet[(b0 >> 3) & 0x1f];
    result += alphabet[((b0 << 2) | (b1 >> 6)) & 0x1f];
    result += alphabet[(b1 >> 1) & 0x1f];
    result += alphabet[((b1 << 4) | (b2 >> 4)) & 0x1f];
    result += alphabet[((b2 << 1) | (b3 >> 7)) & 0x1f];
    result += alphabet[(b3 >> 2) & 0x1f];
    result += alphabet[((b3 << 3) | (b4 >> 5)) & 0x1f];
    result += alphabet[b4 & 0x1f];
  }

  // 余りバイトに応じて末尾を削除・パディング追加
  // 余りバイト数: 0→(trim 0, pad 0), 1→(trim 6, pad 6), 2→(trim 4, pad 4),
  //               3→(trim 3, pad 3), 4→(trim 1, pad 1)
  const TRIM_COUNTS = [0, 6, 4, 3, 1];
  const PAD_COUNTS = [0, 6, 4, 3, 1];
  const remainder = bytes.length % 5;

  if (remainder !== 0) {
    result = result.slice(0, result.length - TRIM_COUNTS[remainder]);
    if (padding) {
      result += '='.repeat(PAD_COUNTS[remainder]);
    }
  }

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
 * Base32 エンコード文字列をデコードする
 * @param encoded - デコード対象の Base32 文字列
 * @param variant - エンコード方式
 * @returns デコード結果
 */
export function decodeBase32(
  encoded: string,
  variant: Base32Variant = 'standard',
): Base32DecodeResult {
  const alphabet = variant === 'hex' ? HEX_ALPHABET : STANDARD_ALPHABET;
  const lookup = buildLookup(alphabet);

  // パディング・空白を除去して大文字に正規化
  const cleaned = encoded.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');

  if (cleaned.length === 0) {
    return { decoded: '', bytes: new Uint8Array(0), success: true };
  }

  // 文字バリデーション
  for (const ch of cleaned) {
    if (lookup[ch] === undefined) {
      return {
        decoded: '',
        bytes: new Uint8Array(0),
        success: false,
        error: `無効な文字が含まれています: '${ch}' （使用可能: ${alphabet}）`,
      };
    }
  }

  // 8文字 → 5バイト のグループ処理
  const outputBytes: number[] = [];

  for (let i = 0; i < cleaned.length; i += 8) {
    const remaining = Math.min(8, cleaned.length - i);
    const c = Array.from({ length: 8 }, (_, j) => lookup[cleaned[i + j] ?? ''] ?? 0);

    // 常に byte0 を出力
    outputBytes.push((c[0] << 3) | (c[1] >> 2));

    // 4文字以上なら byte1
    if (remaining >= 4) {
      outputBytes.push(((c[1] & 0x03) << 6) | (c[2] << 1) | (c[3] >> 4));
    }
    // 5文字以上なら byte2
    if (remaining >= 5) {
      outputBytes.push(((c[3] & 0x0f) << 4) | (c[4] >> 1));
    }
    // 7文字以上なら byte3
    if (remaining >= 7) {
      outputBytes.push(((c[4] & 0x01) << 7) | (c[5] << 2) | (c[6] >> 3));
    }
    // 8文字なら byte4
    if (remaining >= 8) {
      outputBytes.push(((c[6] & 0x07) << 5) | c[7]);
    }
  }

  const bytes = new Uint8Array(outputBytes);

  // UTF-8 変換を試みる
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { decoded, bytes, success: true };
  } catch {
    // バイナリデータの場合は hex 表現で返す
    const hexStr = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    return { decoded: hexStr, bytes, success: true };
  }
}

// ---------------------------------------------------------------------------
// ユーティリティ
// ---------------------------------------------------------------------------

/**
 * 文字列が有効な Base32 エンコードかを検証する
 * @param input - 検証する文字列
 * @param variant - エンコード方式
 * @returns エラーメッセージ（問題なければ null）
 */
export function validateBase32(input: string, variant: Base32Variant = 'standard'): string | null {
  const alphabet = variant === 'hex' ? HEX_ALPHABET : STANDARD_ALPHABET;
  const cleaned = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');

  if (cleaned.length === 0) return null;

  for (const ch of cleaned) {
    if (!alphabet.includes(ch)) {
      return `無効な文字: '${ch}'`;
    }
  }

  // 有効な長さ (mod 8) は 0, 2, 4, 5, 7 のみ
  const VALID_REMAINDERS = new Set([0, 2, 4, 5, 7]);
  if (!VALID_REMAINDERS.has(cleaned.length % 8)) {
    return `文字数が不正です（${cleaned.length} 文字）。Base32 は 8 の倍数、またはパディングなしで 2/4/5/7 の余り数が必要です`;
  }

  return null;
}
