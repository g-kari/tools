/**
 * IEEE 754 浮動小数点数解析ユーティリティ
 * float32（単精度）と float64（倍精度）の内部表現を解析する
 * Cloudflare Workers 対応・外部ライブラリ不要
 */

/** 浮動小数点数の精度 */
export type FloatPrecision = 'float32' | 'float64';

/** IEEE 754 解析結果 */
export interface IEEE754Result {
  /** 符号ビット (0: 正, 1: 負) */
  signBit: number;
  /** 指数部ビット配列 (MSBから順) */
  exponentBits: number[];
  /** 仮数部ビット配列 (MSBから順) */
  mantissaBits: number[];
  /** 指数部の生の値 (バイアス適用前) */
  exponentRaw: number;
  /** バイアス値 (float32: 127, float64: 1023) */
  exponentBias: number;
  /** 実際の指数値 */
  exponentActual: number;
  /** 仮数部の小数値 (1.fraction または 0.fraction の小数部分) */
  mantissaFraction: number;
  /** NaN かどうか */
  isNaN: boolean;
  /** 無限大かどうか */
  isInfinity: boolean;
  /** 非正規化数かどうか */
  isSubnormal: boolean;
  /** ゼロかどうか */
  isZero: boolean;
  /** 負のゼロかどうか */
  isNegativeZero: boolean;
  /** 16進数表現 (大文字) */
  hexRepresentation: string;
  /** 2進数表現 (全ビット) */
  binaryRepresentation: string;
  /** 元の数値 */
  decimalValue: number;
  /** 精度 */
  precision: FloatPrecision;
}

/**
 * 数値から float32 を解析する
 * @param value - 解析する数値（float32 に変換される）
 * @returns IEEE754解析結果
 */
export function analyzeFloat32(value: number): IEEE754Result {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setFloat32(0, value, false); // big-endian
  const bits = view.getUint32(0, false);

  const signBit = (bits >>> 31) & 1;
  const exponentRaw = (bits >>> 23) & 0xff;
  const mantissaRaw = bits & 0x7fffff;

  const exponentBits = Array.from({ length: 8 }, (_, i) => (exponentRaw >>> (7 - i)) & 1);
  const mantissaBits = Array.from({ length: 23 }, (_, i) => (mantissaRaw >>> (22 - i)) & 1);

  const exponentBias = 127;
  const isSubnormal = exponentRaw === 0 && mantissaRaw !== 0;
  const isZero = exponentRaw === 0 && mantissaRaw === 0;
  const isInfinityVal = exponentRaw === 0xff && mantissaRaw === 0;
  const isNaNVal = exponentRaw === 0xff && mantissaRaw !== 0;
  const isNegativeZero = isZero && signBit === 1;

  const mantissaFraction = mantissaRaw / 2 ** 23;
  const exponentActual = isSubnormal ? 1 - exponentBias : exponentRaw - exponentBias;

  const hexRepresentation = bits.toString(16).padStart(8, '0').toUpperCase();
  const binaryRepresentation = bits.toString(2).padStart(32, '0');

  return {
    signBit,
    exponentBits,
    mantissaBits,
    exponentRaw,
    exponentBias,
    exponentActual,
    mantissaFraction,
    isNaN: isNaNVal,
    isInfinity: isInfinityVal,
    isSubnormal,
    isZero,
    isNegativeZero,
    hexRepresentation,
    binaryRepresentation,
    decimalValue: view.getFloat32(0, false),
    precision: 'float32',
  };
}

/**
 * 数値から float64 を解析する
 * @param value - 解析する数値（float64）
 * @returns IEEE754解析結果
 */
export function analyzeFloat64(value: number): IEEE754Result {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setFloat64(0, value, false); // big-endian

  const highBits = view.getUint32(0, false);
  const lowBits = view.getUint32(4, false);

  const signBit = (highBits >>> 31) & 1;
  const exponentRaw = (highBits >>> 20) & 0x7ff;
  const mantissaHighRaw = highBits & 0xfffff;
  const mantissaLowRaw = lowBits;

  const exponentBits = Array.from({ length: 11 }, (_, i) => (exponentRaw >>> (10 - i)) & 1);
  const mantissaBits = [
    ...Array.from({ length: 20 }, (_, i) => (mantissaHighRaw >>> (19 - i)) & 1),
    ...Array.from({ length: 32 }, (_, i) => (mantissaLowRaw >>> (31 - i)) & 1),
  ];

  const mantissaRawBigInt = (BigInt(mantissaHighRaw) << 32n) | BigInt(mantissaLowRaw);
  const exponentBias = 1023;
  const isSubnormal = exponentRaw === 0 && mantissaRawBigInt !== 0n;
  const isZero = exponentRaw === 0 && mantissaRawBigInt === 0n;
  const isInfinityVal = exponentRaw === 0x7ff && mantissaRawBigInt === 0n;
  const isNaNVal = exponentRaw === 0x7ff && mantissaRawBigInt !== 0n;
  const isNegativeZero = isZero && signBit === 1;

  const mantissaFraction = Number(mantissaRawBigInt) / 2 ** 52;
  const exponentActual = isSubnormal ? 1 - exponentBias : exponentRaw - exponentBias;

  const hexHigh = highBits.toString(16).padStart(8, '0').toUpperCase();
  const hexLow = lowBits.toString(16).padStart(8, '0').toUpperCase();
  const hexRepresentation = hexHigh + hexLow;
  const binaryRepresentation =
    highBits.toString(2).padStart(32, '0') + lowBits.toString(2).padStart(32, '0');

  return {
    signBit,
    exponentBits,
    mantissaBits,
    exponentRaw,
    exponentBias,
    exponentActual,
    mantissaFraction,
    isNaN: isNaNVal,
    isInfinity: isInfinityVal,
    isSubnormal,
    isZero,
    isNegativeZero,
    hexRepresentation,
    binaryRepresentation,
    decimalValue: value,
    precision: 'float64',
  };
}

/**
 * ビット配列から数値に変換する
 * @param bits - ビット配列（MSBから順, length = 32 or 64）
 * @param precision - 精度
 * @returns 変換された数値
 */
export function bitsToNumber(bits: number[], precision: FloatPrecision): number {
  const buf = new ArrayBuffer(precision === 'float32' ? 4 : 8);
  const view = new DataView(buf);

  if (precision === 'float32') {
    let uint32 = 0;
    for (let i = 0; i < 32; i++) {
      if (bits[i]) uint32 = (uint32 | (1 << (31 - i))) >>> 0;
    }
    view.setUint32(0, uint32, false);
    return view.getFloat32(0, false);
  } else {
    let highBits = 0;
    let lowBits = 0;
    for (let i = 0; i < 32; i++) {
      if (bits[i]) highBits = (highBits | (1 << (31 - i))) >>> 0;
    }
    for (let i = 0; i < 32; i++) {
      if (bits[32 + i]) lowBits = (lowBits | (1 << (31 - i))) >>> 0;
    }
    view.setUint32(0, highBits, false);
    view.setUint32(4, lowBits, false);
    return view.getFloat64(0, false);
  }
}

/**
 * 16進数文字列から数値に変換する
 * @param hex - 16進数文字列（8文字 or 16文字）
 * @param precision - 精度
 * @returns 変換された数値
 */
export function hexToNumber(hex: string, precision: FloatPrecision): number {
  const clean = hex.replace(/[\s_]/g, '').replace(/^0x/i, '');
  const expectedLength = precision === 'float32' ? 8 : 16;
  const padded = clean.padStart(expectedLength, '0').slice(-expectedLength);

  const buf = new ArrayBuffer(precision === 'float32' ? 4 : 8);
  const view = new DataView(buf);

  if (precision === 'float32') {
    const uint32 = parseInt(padded, 16);
    view.setUint32(0, uint32, false);
    return view.getFloat32(0, false);
  } else {
    view.setUint32(0, parseInt(padded.slice(0, 8), 16), false);
    view.setUint32(4, parseInt(padded.slice(8, 16), 16), false);
    return view.getFloat64(0, false);
  }
}

/**
 * IEEE754結果から数式表現文字列を生成する
 * @param result - IEEE754解析結果
 * @returns 数式文字列
 */
export function getFormula(result: IEEE754Result): string {
  if (result.isNaN) return 'NaN';
  if (result.isInfinity) return result.signBit === 1 ? '-∞' : '+∞';
  if (result.isZero) return result.signBit === 1 ? '-0' : '0';

  const signStr = result.signBit === 1 ? '(-1)' : '(+1)';
  const expStr = `2^${result.exponentActual}`;

  if (result.isSubnormal) {
    return `${signStr} × ${expStr} × 0.${result.mantissaBits.join('')}₂`;
  }

  return `${signStr} × ${expStr} × 1.${result.mantissaBits.join('')}₂`;
}

/**
 * 特殊な値の説明文字列を返す
 * @param result - IEEE754解析結果
 * @returns 説明文字列（null = 通常の数値）
 */
export function getSpecialValueLabel(result: IEEE754Result): string | null {
  if (result.isNaN) return 'NaN（非数）';
  if (result.isInfinity) return result.signBit === 1 ? '-Infinity（負の無限大）' : '+Infinity（正の無限大）';
  if (result.isNegativeZero) return '-0（負のゼロ）';
  if (result.isZero) return '+0（ゼロ）';
  if (result.isSubnormal) return '非正規化数（Subnormal）';
  return null;
}

/**
 * よく使う定数の16進表現テーブル（float32）
 */
export const FLOAT32_PRESETS: { label: string; value: number }[] = [
  { label: '0', value: 0 },
  { label: '-0', value: -0 },
  { label: '1', value: 1 },
  { label: '-1', value: -1 },
  { label: '0.1', value: 0.1 },
  { label: '0.5', value: 0.5 },
  { label: 'π (pi)', value: Math.PI },
  { label: 'MAX', value: 3.4028235e38 },
  { label: 'MIN_POS', value: 1.1754944e-38 },
  { label: '+Infinity', value: Infinity },
  { label: '-Infinity', value: -Infinity },
  { label: 'NaN', value: NaN },
];

/**
 * よく使う定数のテーブル（float64）
 */
export const FLOAT64_PRESETS: { label: string; value: number }[] = [
  { label: '0', value: 0 },
  { label: '-0', value: -0 },
  { label: '1', value: 1 },
  { label: '-1', value: -1 },
  { label: '0.1', value: 0.1 },
  { label: '0.1 + 0.2', value: 0.1 + 0.2 },
  { label: 'π (pi)', value: Math.PI },
  { label: 'e', value: Math.E },
  { label: 'MAX_SAFE_INT', value: Number.MAX_SAFE_INTEGER },
  { label: '+Infinity', value: Infinity },
  { label: '-Infinity', value: -Infinity },
  { label: 'NaN', value: NaN },
];
