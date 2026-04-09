/**
 * ビット演算計算機のユーティリティ関数
 * JavaScript の bitwise 演算は 32ビット符号付き整数で動作する
 */

/** サポートする基数 */
export type Base = 2 | 8 | 10 | 16;

/** ビット演算の結果 */
export interface BitwiseResult {
  label: string;
  symbol: string;
  value: number;
  description: string;
}

/**
 * 文字列を指定の基数で整数にパースする
 * パースできない場合は null を返す
 */
export function parseInteger(s: string, base: Base): number | null {
  const trimmed = s.trim();
  if (trimmed === "" || trimmed === "-") return null;

  const isNegative = trimmed.startsWith("-");
  const digits = isNegative ? trimmed.slice(1) : trimmed;

  if (digits === "") return null;

  // 各基数の有効文字チェック
  const patterns: Record<Base, RegExp> = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9a-fA-F]+$/,
  };

  if (!patterns[base].test(digits)) return null;

  const value = parseInt(digits, base);
  if (isNaN(value)) return null;

  const signed = isNegative ? -value : value;

  if (base === 10) {
    // 10進数は符号付き32ビット整数の範囲のみ受け入れる
    if (signed < -2147483648 || signed > 2147483647) return null;
    return signed;
  }

  // 2進数・8進数・16進数は符号なし32ビット（0〜0xFFFFFFFF）も受け入れ、
  // 符号付き32ビット整数に変換する（Two's complement）
  if (signed < 0 || signed > 4294967295) return null;
  return signed | 0;
}

/**
 * 整数を指定の基数の文字列に変換する
 * 負数は符号付きで返す（2進数は Two's complement 32bit 表示）
 */
export function formatInteger(n: number, base: Base): string {
  // 32ビット符号付き整数として正規化
  const n32 = n | 0;

  if (base === 2) {
    if (n32 < 0) {
      // Two's complement 表示（32ビット）
      return (n32 >>> 0).toString(2);
    }
    return n32.toString(2);
  }

  if (n32 < 0) {
    return "-" + (-n32).toString(base);
  }
  return n32.toString(base);
}

/**
 * 32ビット2進数文字列（ゼロパディング）を返す
 */
export function toBinary32(n: number): string {
  return ((n | 0) >>> 0).toString(2).padStart(32, "0");
}

/**
 * 2進数文字列を4ビットごとにスペース区切りで表示する
 */
export function formatBinaryGroups(bin32: string): string {
  return bin32.match(/.{1,4}/g)!.join(" ");
}

/**
 * ビット演算の結果一覧を生成する
 */
export function computeResults(a: number, b: number): BitwiseResult[] {
  const a32 = a | 0;
  const b32 = b | 0;

  return [
    {
      label: "AND",
      symbol: "&",
      value: a32 & b32,
      description: "両方のビットが1のとき1",
    },
    {
      label: "OR",
      symbol: "|",
      value: a32 | b32,
      description: "どちらかのビットが1のとき1",
    },
    {
      label: "XOR",
      symbol: "^",
      value: a32 ^ b32,
      description: "ビットが異なるとき1",
    },
    {
      label: "NOT A",
      symbol: "~A",
      value: ~a32,
      description: "Aのビットを反転",
    },
    {
      label: "NOT B",
      symbol: "~B",
      value: ~b32,
      description: "Bのビットを反転",
    },
    {
      label: "A << 1",
      symbol: "<<",
      value: a32 << 1,
      description: "Aを1ビット左シフト（×2）",
    },
    {
      label: "A >> 1",
      symbol: ">>",
      value: a32 >> 1,
      description: "Aを1ビット右シフト（符号付き）",
    },
    {
      label: "A >>> 1",
      symbol: ">>>",
      value: (a32 >>> 1) | 0,
      description: "Aを1ビット右シフト（符号なし）",
    },
  ];
}

/**
 * 任意シフト量でのシフト演算を計算する
 */
export function computeShift(
  value: number,
  shiftAmount: number,
): {
  leftShift: number;
  rightShift: number;
  unsignedRightShift: number;
} {
  const v = value | 0;
  const s = Math.max(0, Math.min(31, shiftAmount));
  return {
    leftShift: v << s,
    rightShift: v >> s,
    unsignedRightShift: (v >>> s) | 0,
  };
}

/**
 * ビットが立っているポジション（0-indexed from LSB）の一覧を返す
 */
export function getSetBits(n: number): number[] {
  const n32 = (n | 0) >>> 0;
  const positions: number[] = [];
  for (let i = 0; i < 32; i++) {
    if ((n32 >> i) & 1) {
      positions.push(i);
    }
  }
  return positions;
}

/**
 * ポップカウント（セットビット数）を返す
 */
export function popcount(n: number): number {
  return getSetBits(n).length;
}
