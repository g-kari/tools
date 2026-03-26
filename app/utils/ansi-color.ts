/**
 * @fileoverview ANSIエスケープコードユーティリティ
 * ターミナルのテキストスタイリング用ANSIエスケープシーケンスを生成する
 */

/** テキスト属性 */
export interface AnsiStyle {
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  blink: boolean;
  inverse: boolean;
  /** 前景色: null = デフォルト, 標準色 / 256色 / RGB カラーを指定 */
  fgColor: AnsiColor | null;
  /** 背景色: null = デフォルト, 標準色 / 256色 / RGB カラーを指定 */
  bgColor: AnsiColor | null;
}

/**
 * ANSIカラーの種別
 * - standard: 標準16色 (コード番号 30-37, 90-97)
 * - 256: 256色 (コード番号 0-255)
 * - rgb: Truecolor (R, G, B 各0-255)
 */
export type AnsiColorType =
  | { type: 'standard'; code: number }
  | { type: '256'; code: number }
  | { type: 'rgb'; r: number; g: number; b: number };

/** ANSIカラー型エイリアス */
export type AnsiColor = AnsiColorType;

/** デフォルトスタイル（スタイルなし） */
export const DEFAULT_STYLE: AnsiStyle = {
  bold: false,
  dim: false,
  italic: false,
  underline: false,
  strikethrough: false,
  blink: false,
  inverse: false,
  fgColor: null,
  bgColor: null,
};

/**
 * 標準16色の定義
 * fg: 前景色コード, bg: 背景色コード, hex: 参考HEXカラー
 */
export const STANDARD_COLORS = [
  { name: '黒', fg: 30, bg: 40, hex: '#000000' },
  { name: '赤', fg: 31, bg: 41, hex: '#cc0000' },
  { name: '緑', fg: 32, bg: 42, hex: '#4e9a06' },
  { name: '黄', fg: 33, bg: 43, hex: '#c4a000' },
  { name: '青', fg: 34, bg: 44, hex: '#3465a4' },
  { name: 'マゼンタ', fg: 35, bg: 45, hex: '#75507b' },
  { name: 'シアン', fg: 36, bg: 46, hex: '#06989a' },
  { name: '白', fg: 37, bg: 47, hex: '#d3d7cf' },
  // Bright variants (90-97)
  { name: '明黒（灰）', fg: 90, bg: 100, hex: '#555753' },
  { name: '明赤', fg: 91, bg: 101, hex: '#ef2929' },
  { name: '明緑', fg: 92, bg: 102, hex: '#8ae234' },
  { name: '明黄', fg: 93, bg: 103, hex: '#fce94f' },
  { name: '明青', fg: 94, bg: 104, hex: '#729fcf' },
  { name: '明マゼンタ', fg: 95, bg: 105, hex: '#ad7fa8' },
  { name: '明シアン', fg: 96, bg: 106, hex: '#34e2e2' },
  { name: '明白', fg: 97, bg: 107, hex: '#eeeeec' },
] as const;

/**
 * AnsiColorをANSIコード配列に変換する内部ユーティリティ
 * @param color ANSIカラー設定
 * @param isBackground 背景色として扱う場合は true
 * @returns ANSIエスケープコード番号の配列
 */
function colorToCodes(color: AnsiColor, isBackground: boolean): number[] {
  switch (color.type) {
    case 'standard':
      return [color.code + (isBackground ? 10 : 0)];
    case '256':
      return [isBackground ? 48 : 38, 5, color.code];
    case 'rgb':
      return [isBackground ? 48 : 38, 2, color.r, color.g, color.b];
  }
}

/**
 * AnsiStyleからANSIエスケープシーケンスを生成し、テキストに適用する
 *
 * @param style ANSIスタイル設定
 * @param text スタイルを適用するテキスト
 * @returns ANSIエスケープシーケンスで囲まれたテキスト。スタイルなしの場合はそのままのテキストを返す
 *
 * @example
 * ```ts
 * const styled = applyAnsiStyle({ ...DEFAULT_STYLE, bold: true }, 'Hello');
 * // '\x1b[1mHello\x1b[0m'
 * ```
 */
export function applyAnsiStyle(style: AnsiStyle, text: string): string {
  const codes: number[] = [];

  if (style.bold) codes.push(1);
  if (style.dim) codes.push(2);
  if (style.italic) codes.push(3);
  if (style.underline) codes.push(4);
  if (style.blink) codes.push(5);
  if (style.inverse) codes.push(7);
  if (style.strikethrough) codes.push(9);

  if (style.fgColor) {
    const fgCodes = colorToCodes(style.fgColor, false);
    codes.push(...fgCodes);
  }

  if (style.bgColor) {
    const bgCodes = colorToCodes(style.bgColor, true);
    codes.push(...bgCodes);
  }

  if (codes.length === 0) return text;

  const ESC = '\x1b';
  const openSeq = `${ESC}[${codes.join(';')}m`;
  const closeSeq = `${ESC}[0m`;

  return `${openSeq}${text}${closeSeq}`;
}

/**
 * エスケープ文字のフォーマット種別
 * - bash: `\e` 形式（bash echo -e）
 * - bash-octal: `\033` 形式（bash octal）
 * - raw: 実際のエスケープバイト (0x1b)
 * - python: `\x1b` 形式（Python）
 * - unicode: `\u001b` 形式（Node.js / JavaScript）
 */
export type EscapeFormat = 'bash' | 'bash-octal' | 'raw' | 'python' | 'unicode';

/**
 * シェルスクリプト等で使用するエスケープ文字列を取得する
 *
 * @param format エスケープ文字の形式
 * @returns エスケープ文字列
 */
export function getEscapeChar(format: EscapeFormat): string {
  switch (format) {
    case 'bash':
      return '\\e';
    case 'bash-octal':
      return '\\033';
    case 'raw':
      return '\x1b';
    case 'python':
      return '\\x1b';
    case 'unicode':
      return '\\u001b';
  }
}

/**
 * AnsiStyleから各言語・シェル向けのコードを生成する
 *
 * @param style ANSIスタイル設定
 * @param text スタイルを適用するテキスト（空の場合は 'Hello, World!' を使用）
 * @param format エスケープ文字の形式
 * @returns 生成されたコード文字列
 *
 * @example
 * ```ts
 * const code = generateShellCode({ ...DEFAULT_STYLE, bold: true }, 'Hello', 'bash');
 * // 'echo -e "\\e[1mHello\\e[0m"'
 * ```
 */
export function generateShellCode(
  style: AnsiStyle,
  text: string,
  format: EscapeFormat
): string {
  const codes: number[] = [];

  if (style.bold) codes.push(1);
  if (style.dim) codes.push(2);
  if (style.italic) codes.push(3);
  if (style.underline) codes.push(4);
  if (style.blink) codes.push(5);
  if (style.inverse) codes.push(7);
  if (style.strikethrough) codes.push(9);

  if (style.fgColor) {
    const fgCodes = colorToCodes(style.fgColor, false);
    codes.push(...fgCodes);
  }

  if (style.bgColor) {
    const bgCodes = colorToCodes(style.bgColor, true);
    codes.push(...bgCodes);
  }

  if (codes.length === 0) return `"${text || 'Hello, World!'}"`;

  const esc = getEscapeChar(format);
  const displayText = text || 'Hello, World!';

  switch (format) {
    case 'bash':
    case 'bash-octal':
      return `echo -e "${esc}[${codes.join(';')}m${displayText}${esc}[0m"`;
    case 'python':
      return `print(f"${esc}[${codes.join(';')}m${displayText}${esc}[0m")`;
    case 'unicode':
      return `console.log("${esc}[${codes.join(';')}m${displayText}${esc}[0m")`;
    case 'raw':
      return `\x1b[${codes.join(';')}m${displayText}\x1b[0m`;
    default:
      return `"${esc}[${codes.join(';')}m${displayText}${esc}[0m"`;
  }
}

/**
 * HEX文字列をRGB値に変換する
 *
 * @param hex HEX文字列（`#RRGGBB` または `RRGGBB` 形式）
 * @returns RGB値のオブジェクト。無効な場合は null
 *
 * @example
 * ```ts
 * hexToRgb('#ff0000'); // { r: 255, g: 0, b: 0 }
 * hexToRgb('00ff00');  // { r: 0, g: 255, b: 0 }
 * hexToRgb('invalid'); // null
 * ```
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/**
 * RGB値をHEX文字列に変換する
 *
 * @param r 赤チャンネル (0-255)
 * @param g 緑チャンネル (0-255)
 * @param b 青チャンネル (0-255)
 * @returns `#RRGGBB` 形式のHEX文字列
 *
 * @example
 * ```ts
 * rgbToHex(255, 0, 0);   // '#ff0000'
 * rgbToHex(0, 255, 0);   // '#00ff00'
 * rgbToHex(0, 0, 255);   // '#0000ff'
 * ```
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  );
}
