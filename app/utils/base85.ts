/**
 * Base85 (ASCII85 / Z85) エンコード/デコードユーティリティ
 *
 * ASCII85 は Adobe PostScript・PDF で使用される Base85 エンコーディングです。
 * 4バイトを5文字に変換し、Base64 より約25%効率的です。
 * Z85 は ZeroMQ で使用される同じく Base85 エンコーディングですが異なるアルファベットを使用します。
 */

/** Base85 バリアント */
export type Base85Variant = 'ascii85' | 'z85';

/**
 * ASCII85 アルファベット（'!' = 33 から 'u' = 117 まで 85 文字）
 * Adobe / PostScript / PDF で使用される標準アルファベット
 */
const ASCII85_CHARS = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstu';

/**
 * Z85 アルファベット（ZeroMQ RFC 32 準拠）
 * 英数字 + 記号 85 文字
 */
const Z85_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';

/** エンコード結果 */
export interface Base85EncodeResult {
  /** エンコードされた文字列 */
  encoded: string;
  /** 入力バイト数 */
  inputBytes: number;
  /** 出力文字数 */
  outputLength: number;
}

/** デコード結果 */
export interface Base85DecodeResult {
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

/** アルファベット文字列を返す */
function getAlphabet(variant: Base85Variant): string {
  return variant === 'z85' ? Z85_CHARS : ASCII85_CHARS;
}

/** アルファベットから逆引き辞書を作成する */
function buildLookup(alphabet: string): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < alphabet.length; i++) {
    map.set(alphabet[i], i);
  }
  return map;
}

/**
 * 32ビット符号なし整数を Base85 の5文字にエンコードする
 * @param n - エンコード対象の 32bit 符号なし整数
 * @param alphabet - 使用するアルファベット文字列
 * @returns 5文字の文字列
 */
function encodeChunk(n: number, alphabet: string): string {
  const chars: string[] = new Array(5);
  for (let i = 4; i >= 0; i--) {
    chars[i] = alphabet[n % 85];
    n = Math.floor(n / 85);
  }
  return chars.join('');
}

/**
 * バイト列の指定オフセットから 4 バイトを読み、32ビット符号なし整数にする（ビッグエンディアン）
 * 範囲外は 0 として扱う
 */
function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (
    (((bytes[offset] ?? 0) << 24) |
      ((bytes[offset + 1] ?? 0) << 16) |
      ((bytes[offset + 2] ?? 0) << 8) |
      (bytes[offset + 3] ?? 0)) >>>
    0
  );
}

// ---------------------------------------------------------------------------
// エンコード
// ---------------------------------------------------------------------------

/**
 * テキストを Base85 エンコードする
 * @param text - エンコード対象のテキスト（UTF-8）
 * @param variant - バリアント（ascii85 / z85）
 * @returns エンコード結果
 */
export function encodeBase85(text: string, variant: Base85Variant = 'ascii85'): Base85EncodeResult {
  const bytes = new TextEncoder().encode(text);
  return encodeBase85Bytes(bytes, variant);
}

/**
 * バイト列を Base85 エンコードする
 * @param bytes - エンコード対象のバイト列
 * @param variant - バリアント（ascii85 / z85）
 * @returns エンコード結果
 */
export function encodeBase85Bytes(
  bytes: Uint8Array,
  variant: Base85Variant = 'ascii85',
): Base85EncodeResult {
  const alphabet = getAlphabet(variant);
  const isAscii85 = variant === 'ascii85';

  if (bytes.length === 0) {
    const encoded = isAscii85 ? '<~~>' : '';
    return { encoded, inputBytes: 0, outputLength: encoded.length };
  }

  // Z85 は入力が 4 の倍数である必要がある
  if (!isAscii85 && bytes.length % 4 !== 0) {
    throw new Error(
      `Z85 は入力バイト数が 4 の倍数である必要があります（現在: ${bytes.length} バイト）`,
    );
  }

  const parts: string[] = [];
  const fullGroups = Math.floor(bytes.length / 4);
  const remainder = bytes.length % 4;

  for (let i = 0; i < fullGroups; i++) {
    const n = readUint32BE(bytes, i * 4);
    if (isAscii85 && n === 0) {
      // 特殊ケース: 4 バイトすべて 0 → 'z' 1 文字に圧縮
      parts.push('z');
    } else {
      parts.push(encodeChunk(n, alphabet));
    }
  }

  // 最後の端数グループ（ASCII85 のみ）
  if (isAscii85 && remainder > 0) {
    const n = readUint32BE(bytes, fullGroups * 4);
    const chunk = encodeChunk(n, alphabet);
    // 端数バイト数 + 1 文字だけ出力
    parts.push(chunk.slice(0, remainder + 1));
  }

  const body = parts.join('');
  const encoded = isAscii85 ? `<~${body}~>` : body;

  return {
    encoded,
    inputBytes: bytes.length,
    outputLength: encoded.length,
  };
}

// ---------------------------------------------------------------------------
// デコード
// ---------------------------------------------------------------------------

/**
 * Base85 エンコード文字列をデコードする
 * @param encoded - デコード対象の Base85 文字列
 * @param variant - バリアント（ascii85 / z85）
 * @returns デコード結果
 */
export function decodeBase85(
  encoded: string,
  variant: Base85Variant = 'ascii85',
): Base85DecodeResult {
  const alphabet = getAlphabet(variant);
  const isAscii85 = variant === 'ascii85';
  const lookup = buildLookup(alphabet);

  // 空白・改行を除去
  let cleaned = encoded.replace(/\s/g, '');

  if (isAscii85) {
    // <~ ~> ラッパーを除去
    if (cleaned.startsWith('<~') && cleaned.endsWith('~>')) {
      cleaned = cleaned.slice(2, -2);
    } else {
      cleaned = cleaned.replace(/^<~/, '').replace(/~>$/, '');
    }
  }

  if (cleaned.length === 0) {
    return { decoded: '', bytes: new Uint8Array(0), success: true };
  }

  const outputBytes: number[] = [];

  if (isAscii85) {
    let i = 0;
    while (i < cleaned.length) {
      const ch = cleaned[i];

      // 特殊ケース 'z': 4 バイトの 0x00
      if (ch === 'z') {
        outputBytes.push(0, 0, 0, 0);
        i++;
        continue;
      }

      // 5 文字（または末尾の端数）を読み取る
      const remaining = cleaned.length - i;
      const chunkLen = Math.min(5, remaining);
      const chunk = cleaned.slice(i, i + chunkLen);
      i += chunkLen;

      // 文字バリデーション
      for (const c of chunk) {
        if (!lookup.has(c)) {
          return {
            decoded: '',
            bytes: new Uint8Array(0),
            success: false,
            error: `無効な文字: '${c}'`,
          };
        }
      }

      // 端数の場合は 'u' でパディング（最大値 84 で埋める）
      const padLen = 5 - chunkLen;
      const paddedChunk = chunk + 'u'.repeat(padLen);

      // Base85 → 32bit 整数
      let n = 0;
      for (const c of paddedChunk) {
        n = n * 85 + lookup.get(c)!;
      }

      // 32bit → 4 バイト（ビッグエンディアン）
      const byteCount = chunkLen - 1;
      const b = [
        (n >>> 24) & 0xff,
        (n >>> 16) & 0xff,
        (n >>> 8) & 0xff,
        n & 0xff,
      ];
      outputBytes.push(...b.slice(0, byteCount));
    }
  } else {
    // Z85: 入力長が 5 の倍数である必要がある
    if (cleaned.length % 5 !== 0) {
      return {
        decoded: '',
        bytes: new Uint8Array(0),
        success: false,
        error: `Z85 エンコード文字列の長さは 5 の倍数である必要があります（現在: ${cleaned.length} 文字）`,
      };
    }

    for (let i = 0; i < cleaned.length; i += 5) {
      const chunk = cleaned.slice(i, i + 5);

      for (const c of chunk) {
        if (!lookup.has(c)) {
          return {
            decoded: '',
            bytes: new Uint8Array(0),
            success: false,
            error: `無効な文字: '${c}'`,
          };
        }
      }

      let n = 0;
      for (const c of chunk) {
        n = n * 85 + lookup.get(c)!;
      }

      outputBytes.push(
        (n >>> 24) & 0xff,
        (n >>> 16) & 0xff,
        (n >>> 8) & 0xff,
        n & 0xff,
      );
    }
  }

  const resultBytes = new Uint8Array(outputBytes);

  // UTF-8 変換を試みる
  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(resultBytes);
    return { decoded, bytes: resultBytes, success: true };
  } catch {
    // バイナリデータは hex 表現で返す
    const hexStr = Array.from(resultBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    return { decoded: hexStr, bytes: resultBytes, success: true };
  }
}

// ---------------------------------------------------------------------------
// バリデーション
// ---------------------------------------------------------------------------

/**
 * 文字列が有効な Base85 エンコードかを検証する
 * @param input - 検証する文字列
 * @param variant - バリアント
 * @returns エラーメッセージ（問題なければ null）
 */
export function validateBase85(
  input: string,
  variant: Base85Variant = 'ascii85',
): string | null {
  const alphabet = getAlphabet(variant);
  let cleaned = input.replace(/\s/g, '');

  if (variant === 'ascii85') {
    cleaned = cleaned.replace(/^<~/, '').replace(/~>$/, '');
  }

  if (cleaned.length === 0) return null;

  if (variant === 'z85' && cleaned.length % 5 !== 0) {
    return `Z85 エンコード文字列の長さは 5 の倍数である必要があります（現在: ${cleaned.length} 文字）`;
  }

  for (const ch of cleaned) {
    // ASCII85 の特殊文字
    if (variant === 'ascii85' && (ch === 'z' || ch === 'y')) continue;
    if (!alphabet.includes(ch)) {
      return `無効な文字: '${ch}'`;
    }
  }

  return null;
}
