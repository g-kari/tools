/**
 * 大字変換ユーティリティ
 *
 * アラビア数字と大字（壱・弐・参など、法的文書で使用される漢数字）を
 * 相互変換する関数を提供します。
 */

/** 大字の数字（0〜9） */
const DAIJI_DIGITS: readonly string[] = [
  '〇', '壱', '弐', '参', '肆', '伍', '陸', '漆', '捌', '玖',
];

/** 4桁グループ内の位単位 */
const DAIJI_POSITION: readonly [string, number][] = [
  ['仟', 1000],
  ['佰', 100],
  ['拾', 10],
  ['', 1],
];

/** 万単位（4桁ごとの区切り） */
const DAIJI_MYRIAD: readonly string[] = ['', '萬', '億', '兆', '京'];

/** 大字→数値のマッピング（大字・通常漢字どちらも受け付ける） */
const DIGIT_MAP: Readonly<Record<string, number>> = {
  '〇': 0, '零': 0, '0': 0,
  '壱': 1, '一': 1, '１': 1, '1': 1,
  '弐': 2, '二': 2, '２': 2, '2': 2,
  '参': 3, '三': 3, '３': 3, '3': 3,
  '肆': 4, '四': 4, '４': 4, '4': 4,
  '伍': 5, '五': 5, '５': 5, '5': 5,
  '陸': 6, '六': 6, '６': 6, '6': 6,
  '漆': 7, '柒': 7, '七': 7, '７': 7, '7': 7,
  '捌': 8, '八': 8, '８': 8, '8': 8,
  '玖': 9, '九': 9, '９': 9, '9': 9,
};

/** 位単位→数値のマッピング */
const POSITION_MAP: Readonly<Record<string, number>> = {
  '拾': 10, '十': 10,
  '佰': 100, '百': 100,
  '仟': 1000, '千': 1000,
};

/** 万単位→数値のマッピング（降順で処理） */
const MYRIAD_UNITS: readonly { char: string; value: bigint }[] = [
  { char: '京', value: 10000000000000000n },
  { char: '兆', value: 1000000000000n },
  { char: '億', value: 100000000n },
  { char: '萬', value: 10000n },
  { char: '万', value: 10000n },
];

/** 対照表データ */
export const DAIJI_REFERENCE: readonly { arabic: string; daiji: string; reading: string }[] = [
  { arabic: '0', daiji: '零', reading: 'れい・ゼロ' },
  { arabic: '1', daiji: '壱', reading: 'いち' },
  { arabic: '2', daiji: '弐', reading: 'に' },
  { arabic: '3', daiji: '参', reading: 'さん' },
  { arabic: '4', daiji: '肆', reading: 'し' },
  { arabic: '5', daiji: '伍', reading: 'ご' },
  { arabic: '6', daiji: '陸', reading: 'ろく' },
  { arabic: '7', daiji: '漆', reading: 'しち' },
  { arabic: '8', daiji: '捌', reading: 'はち' },
  { arabic: '9', daiji: '玖', reading: 'く' },
  { arabic: '10', daiji: '拾', reading: 'じゅう' },
  { arabic: '100', daiji: '佰', reading: 'ひゃく' },
  { arabic: '1,000', daiji: '仟', reading: 'せん' },
  { arabic: '10,000', daiji: '萬', reading: 'まん' },
  { arabic: '100,000,000', daiji: '億', reading: 'おく' },
  { arabic: '1,000,000,000,000', daiji: '兆', reading: 'ちょう' },
  { arabic: '10,000,000,000,000,000', daiji: '京', reading: 'けい' },
];

/** 入力の最大桁数 */
const MAX_DIGITS = 20;

/**
 * 1〜9999の整数を大字の4桁グループ文字列に変換する
 * @param num - 変換する整数（1〜9999）
 * @returns 大字文字列
 */
function groupToDaiji(num: number): string {
  if (num <= 0 || num > 9999) return '';

  let result = '';
  let remaining = num;

  for (const [unit, value] of DAIJI_POSITION) {
    const digit = Math.floor(remaining / value);
    remaining %= value;
    if (digit > 0) {
      result += DAIJI_DIGITS[digit] + unit;
    }
  }

  return result;
}

/**
 * アラビア数字の文字列を大字に変換する
 * @param input - 変換する数値文字列（0〜最大20桁の整数）
 * @returns 大字文字列、無効な入力の場合はnull
 */
export function toDaiji(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const isNegative = trimmed.startsWith('-');
  const digits = isNegative ? trimmed.slice(1) : trimmed;

  if (!/^\d+$/.test(digits)) return null;
  if (digits.length > MAX_DIGITS) return null;

  // 先頭の0を除去
  const normalized = digits.replace(/^0+/, '') || '0';

  if (normalized === '0') return '零';

  const n = BigInt(normalized);

  // 右から4桁ずつグループに分割
  const groups: number[] = [];
  let remaining = n;
  while (remaining > 0n) {
    groups.push(Number(remaining % 10000n));
    remaining = remaining / 10000n;
  }

  if (groups.length > DAIJI_MYRIAD.length) return null;

  let result = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group !== 0) {
      result += groupToDaiji(group) + DAIJI_MYRIAD[i];
    }
  }

  return isNegative ? 'マイナス' + result : result;
}

/**
 * 4桁グループの大字文字列を数値に変換する
 * @param s - 大字の4桁グループ文字列
 * @returns 数値（0〜9999）、無効な場合はnull
 */
function parseGroupDaiji(s: string): number | null {
  if (!s) return 0;

  let result = 0;
  let currentDigit: number | null = null;

  for (const char of s) {
    if (char in DIGIT_MAP) {
      currentDigit = DIGIT_MAP[char];
    } else if (char in POSITION_MAP) {
      const digit = currentDigit ?? 1; // 位単位のみの場合は1とみなす（例: 仟 → 1000）
      result += digit * POSITION_MAP[char];
      currentDigit = null;
    } else {
      return null;
    }
  }

  if (currentDigit !== null) {
    result += currentDigit;
  }

  if (result < 0 || result > 9999) return null;
  return result;
}

/**
 * 大字をアラビア数字の文字列に変換する
 * @param input - 変換する大字文字列（大字・通常漢数字どちらも可）
 * @returns アラビア数字文字列、無効な入力の場合はnull
 */
export function fromDaiji(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed === '零' || trimmed === '〇') return '0';

  const isNegative = trimmed.startsWith('マイナス');
  let s = isNegative ? trimmed.slice(4) : trimmed;

  if (!s) return null;

  let total = 0n;

  // 万単位（大きい順）で分割して処理
  for (const { char, value } of MYRIAD_UNITS) {
    const idx = s.indexOf(char);
    if (idx >= 0) {
      const groupStr = s.slice(0, idx);
      s = s.slice(idx + char.length);
      const groupVal = parseGroupDaiji(groupStr);
      if (groupVal === null) return null;
      // グループが空（0）の場合は 1 として扱う（例: 万 → 壱萬 = 10000）
      total += BigInt(groupVal === 0 ? 1 : groupVal) * value;
    }
  }

  // 残り（万未満）の部分を解析
  if (s.length > 0) {
    const groupVal = parseGroupDaiji(s);
    if (groupVal === null) return null;
    total += BigInt(groupVal);
  }

  if (total < 0n) return null;

  const result = total.toString();
  return isNegative ? '-' + result : result;
}
