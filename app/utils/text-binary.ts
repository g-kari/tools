/**
 * テキスト ↔ バイナリ変換ユーティリティ
 * テキストを UTF-8 バイト列の2進数表現に変換、またはその逆変換を提供する
 */

/** バイト間の区切り文字オプション */
export type BinaryDelimiter = 'space' | 'none' | 'comma' | 'newline';

/** グループサイズオプション（ビット数） */
export type BinaryGroupSize = 4 | 8;

/** テキスト→バイナリ エンコード結果 */
export interface TextToBinaryResult {
  encoded: string;
  inputBytes: number;
  charCount: number;
  byteBreakdown: ByteInfo[];
}

/** バイナリ→テキスト デコード成功結果 */
export interface BinaryToTextSuccess {
  success: true;
  decoded: string;
  bytes: Uint8Array;
}

/** バイナリ→テキスト デコードエラー結果 */
export interface BinaryToTextError {
  success: false;
  error: string;
}

/** 文字ごとのバイト情報 */
export interface ByteInfo {
  /** 元の文字（1文字）またはバイト */
  char: string;
  /** Unicode コードポイント (U+XXXX) */
  codePoint: string;
  /** UTF-8 バイト列（16進数表記） */
  hexBytes: string[];
  /** UTF-8 バイト列（2進数表記） */
  binaryBytes: string[];
}

const DELIMITERS: Record<BinaryDelimiter, string> = {
  space: ' ',
  none: '',
  comma: ',',
  newline: '\n',
};

/**
 * 1バイトを8ビットの2進数文字列に変換する
 */
function byteToBinary(byte: number): string {
  return byte.toString(2).padStart(8, '0');
}

/**
 * テキストを UTF-8 バイト列の2進数表現にエンコードする
 * @param text - エンコードするテキスト（UTF-8）
 * @param delimiter - バイト間の区切り文字
 * @param groupSize - グループサイズ（4=ニブル/8=バイト）
 * @returns エンコード結果
 */
export function textToBinary(
  text: string,
  delimiter: BinaryDelimiter = 'space',
  groupSize: BinaryGroupSize = 8,
): TextToBinaryResult {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const sep = DELIMITERS[delimiter];

  const binaries: string[] = [];
  for (const byte of bytes) {
    const bits = byteToBinary(byte);
    if (groupSize === 4) {
      binaries.push(bits.slice(0, 4));
      binaries.push(bits.slice(4, 8));
    } else {
      binaries.push(bits);
    }
  }

  const breakdown = buildByteBreakdown(text);

  return {
    encoded: binaries.join(sep),
    inputBytes: bytes.length,
    charCount: [...text].length,
    byteBreakdown: breakdown,
  };
}

/**
 * 文字ごとのバイト情報を構築する（最大 64 文字まで）
 */
function buildByteBreakdown(text: string): ByteInfo[] {
  const encoder = new TextEncoder();
  const chars = [...text].slice(0, 64);
  return chars.map((ch) => {
    const cp = ch.codePointAt(0) ?? 0;
    const bytes = encoder.encode(ch);
    return {
      char: ch,
      codePoint: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
      hexBytes: Array.from(bytes).map((b) =>
        b.toString(16).toUpperCase().padStart(2, '0'),
      ),
      binaryBytes: Array.from(bytes).map(byteToBinary),
    };
  });
}

/**
 * 2進数文字列を検証する（スペース・コンマ・改行区切りを許容）
 * @param input - 検証する文字列
 * @returns エラーメッセージ、または null（有効な場合）
 */
export function validateBinary(input: string): string | null {
  const tokens = input.trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) return null;

  for (const token of tokens) {
    if (!/^[01]+$/.test(token)) {
      return `無効な文字が含まれています: "${token.replace(/[^01]/g, (c) => c)}"。使用できるのは 0 と 1 のみです。`;
    }
    if (token.length !== 8 && token.length !== 4) {
      return `ビット列の長さが不正です: "${token}"（${token.length}ビット）。8ビット（1バイト）または4ビット（ニブル）のグループを入力してください。`;
    }
  }

  // ニブル（4ビット）の場合はペア数チェック
  const nibbles = tokens.filter((t) => t.length === 4);
  if (nibbles.length > 0 && nibbles.length % 2 !== 0) {
    return 'ニブル（4ビット）の数が奇数です。4ビットグループは2つで1バイトを表します。';
  }

  return null;
}

/**
 * 2進数文字列をテキストにデコードする
 * @param input - デコードする2進数文字列（スペース・コンマ・改行区切り）
 * @returns デコード結果またはエラー
 */
export function binaryToText(
  input: string,
): BinaryToTextSuccess | BinaryToTextError {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { success: true, decoded: '', bytes: new Uint8Array(0) };
  }

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);

  // バリデーション
  const validationError = validateBinary(trimmed);
  if (validationError) {
    return { success: false, error: validationError };
  }

  // ニブルをバイトに結合
  const byteTokens: string[] = [];
  if (tokens[0]?.length === 4) {
    for (let i = 0; i + 1 < tokens.length; i += 2) {
      byteTokens.push((tokens[i] ?? '') + (tokens[i + 1] ?? ''));
    }
  } else {
    byteTokens.push(...tokens);
  }

  // バイト列に変換
  const bytes = new Uint8Array(byteTokens.length);
  for (let i = 0; i < byteTokens.length; i++) {
    bytes[i] = parseInt(byteTokens[i] ?? '0', 2);
  }

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const decoded = decoder.decode(bytes);
    return { success: true, decoded, bytes };
  } catch {
    return {
      success: false,
      error:
        '有効な UTF-8 テキストにデコードできません。バイナリデータが含まれている可能性があります。',
    };
  }
}

/**
 * 入力文字列がバイナリ表現かどうかを推定する
 * @param input - 判定する文字列
 * @returns バイナリ表現と推定される場合 true
 */
export function looksLikeBinary(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  // スペース・コンマ・改行以外に 0/1 以外の文字が含まれていればバイナリでない
  return /^[01\s,\n]+$/.test(trimmed) && /[01]/.test(trimmed);
}
