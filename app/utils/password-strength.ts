/**
 * パスワード強度解析ユーティリティ
 * 入力されたパスワードのエントロピー・パターン・クラック時間を計算する
 */

/** 強度スコア (0: とても弱い 〜 4: とても強い) */
export type StrengthScore = 0 | 1 | 2 | 3 | 4;

/** 強度ラベル */
export type StrengthLabel =
  | 'とても弱い'
  | '弱い'
  | '普通'
  | '強い'
  | 'とても強い';

/** 文字クラスの内訳 */
export interface CharacterClasses {
  /** 小文字 (a-z) を含む */
  lowercase: boolean;
  /** 大文字 (A-Z) を含む */
  uppercase: boolean;
  /** 数字 (0-9) を含む */
  digits: boolean;
  /** 記号 を含む */
  symbols: boolean;
}

/** クラック時間の推定結果 */
export interface CrackTimes {
  /** オンライン（レート制限あり: 100回/時間）*/
  onlineThrottled: string;
  /** オンライン（レート制限なし: 10回/秒）*/
  onlineUnthrottled: string;
  /** オフライン（低速: bcrypt等 10,000回/秒）*/
  offlineSlow: string;
  /** オフライン（高速: MD5等 10,000,000,000回/秒）*/
  offlineFast: string;
}

/** パスワード強度解析結果 */
export interface PasswordStrengthResult {
  /** 強度スコア */
  score: StrengthScore;
  /** 強度ラベル */
  label: StrengthLabel;
  /** エントロピー（ビット数） */
  entropy: number;
  /** パスワードの長さ */
  length: number;
  /** 有効文字セットサイズ */
  charsetSize: number;
  /** 文字クラスの内訳 */
  characterClasses: CharacterClasses;
  /** 同一文字の連続（3文字以上）が含まれる */
  hasRepeats: boolean;
  /** キーボード配列・アルファベット・数字の連続パターンが含まれる */
  hasSequence: boolean;
  /** よく使われるパスワードに一致する */
  isCommonPassword: boolean;
  /** 改善アドバイス */
  suggestions: string[];
  /** クラック時間の推定 */
  crackTimes: CrackTimes;
}

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/** よく使われるパスワード上位リスト（小文字） */
const COMMON_PASSWORDS = new Set([
  'password', '123456', 'password123', 'admin', 'qwerty',
  'letmein', '12345', '12345678', '1234567890', 'abc123',
  'password1', 'iloveyou', 'monkey', 'dragon', 'master',
  'sunshine', 'princess', 'welcome', 'shadow', 'superman',
  'michael', 'jessica', 'ninja', 'football', 'baseball',
  'trustno1', 'batman', 'test', 'hello', 'login', 'pass',
  'admin123', 'root', 'toor', 'passw0rd', 'p@ssword',
  'p@ssw0rd', '111111', '123123', '123456789', '654321',
  'aaaaaa', 'qwerty123', 'zxcvbnm', 'asdfgh', '1q2w3e',
  'qazwsx', 'administrator', 'changeme', 'access', 'guest',
  '000000', 'password!', 'pass123', 'test123', 'qwertyuiop',
]);

/** 連続パターンの基準文字列 */
const SEQUENCE_BASES = [
  'abcdefghijklmnopqrstuvwxyz',
  'qwertyuiopasdfghjklzxcvbnm',
  '0123456789',
  'zyxwvutsrqponmlkjihgfedcba',
  'mnbvcxzlkjhgfdsapoiuytrewq',
];

/**
 * 3文字以上の連続パターン（キーボード配列・アルファベット順・数字順）を検出する
 */
function detectSequence(password: string): boolean {
  const lower = password.toLowerCase();
  for (const base of SEQUENCE_BASES) {
    for (let i = 0; i <= base.length - 3; i++) {
      if (lower.includes(base.slice(i, i + 3))) return true;
    }
  }
  return false;
}

/**
 * 同一文字が3回以上連続しているか検出する
 */
function detectRepeats(password: string): boolean {
  return /(.)\1\1/.test(password);
}

/**
 * 実際の文字から有効な文字セットサイズを計算する
 */
function calcCharsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^a-zA-Z0-9]/.test(password)) size += 32;
  return size;
}

/** 秒数を人間が読みやすい文字列に変換する */
function formatSeconds(seconds: number): string {
  if (!isFinite(seconds) || seconds > 3.15e13) return '事実上不可能';
  if (seconds < 1) return '1秒未満';
  if (seconds < 60) return `${Math.round(seconds)} 秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} 分`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} 時間`;
  if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} 日`;
  if (seconds < 86400 * 365 * 1000) return `${Math.round(seconds / (86400 * 365))} 年`;
  return `${(seconds / (86400 * 365)).toExponential(1)} 年`;
}

// ---------------------------------------------------------------------------
// メイン関数
// ---------------------------------------------------------------------------

/**
 * パスワードを解析して強度情報を返す
 * @param password - 解析対象のパスワード文字列
 * @returns 解析結果
 */
export function analyzePassword(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: 'とても弱い',
      entropy: 0,
      length: 0,
      charsetSize: 0,
      characterClasses: { lowercase: false, uppercase: false, digits: false, symbols: false },
      hasRepeats: false,
      hasSequence: false,
      isCommonPassword: false,
      suggestions: ['パスワードを入力してください'],
      crackTimes: {
        onlineThrottled: '-',
        onlineUnthrottled: '-',
        offlineSlow: '-',
        offlineFast: '-',
      },
    };
  }

  const length = password.length;
  const charsetSize = calcCharsetSize(password);
  const entropy = charsetSize > 0 ? length * Math.log2(charsetSize) : 0;

  const isCommonPassword = COMMON_PASSWORDS.has(password.toLowerCase());
  const hasSequence = detectSequence(password);
  const hasRepeats = detectRepeats(password);

  const characterClasses: CharacterClasses = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    digits: /[0-9]/.test(password),
    symbols: /[^a-zA-Z0-9]/.test(password),
  };

  // 有効エントロピー（パターン・よく使われるパスワードで減点）
  let effectiveEntropy = entropy;
  if (isCommonPassword) effectiveEntropy = Math.min(effectiveEntropy, 10);
  if (hasSequence) effectiveEntropy *= 0.7;
  if (hasRepeats) effectiveEntropy *= 0.8;

  // スコア算出
  let score: StrengthScore;
  if (isCommonPassword || length < 6 || effectiveEntropy < 20) {
    score = 0;
  } else if (effectiveEntropy < 36) {
    score = 1;
  } else if (effectiveEntropy < 60) {
    score = 2;
  } else if (effectiveEntropy < 100) {
    score = 3;
  } else {
    score = 4;
  }

  const LABELS: StrengthLabel[] = ['とても弱い', '弱い', '普通', '強い', 'とても強い'];
  const label = LABELS[score];

  // クラック時間推定（平均試行回数 = 2^entropy / 2）
  const avgCombinations = Math.pow(2, effectiveEntropy - 1);
  const crackTimes: CrackTimes = {
    onlineThrottled: formatSeconds(avgCombinations / (100 / 3600)),   // 100/時間
    onlineUnthrottled: formatSeconds(avgCombinations / 10),           // 10/秒
    offlineSlow: formatSeconds(avgCombinations / 10_000),             // 10k/秒
    offlineFast: formatSeconds(avgCombinations / 10_000_000_000),     // 10G/秒
  };

  // 改善アドバイス
  const suggestions: string[] = [];
  if (isCommonPassword) {
    suggestions.push('よく使われるパスワードです。別のパスワードを使用してください');
  }
  if (length < 8) {
    suggestions.push('8文字以上にすることをお勧めします');
  } else if (length < 12 && score < 3) {
    suggestions.push('12文字以上でより安全になります');
  }
  if (!characterClasses.uppercase) {
    suggestions.push('大文字 (A-Z) を追加してください');
  }
  if (!characterClasses.digits) {
    suggestions.push('数字 (0-9) を追加してください');
  }
  if (!characterClasses.symbols) {
    suggestions.push('記号 (!@#$% など) を追加してください');
  }
  if (hasSequence) {
    suggestions.push('連続した文字 (abc, 123, qwerty など) は避けてください');
  }
  if (hasRepeats) {
    suggestions.push('同じ文字の連続 (aaa, 111 など) は避けてください');
  }
  if (suggestions.length === 0) {
    suggestions.push('このパスワードは十分に安全です！');
  }

  return {
    score,
    label,
    entropy: Math.round(entropy * 10) / 10,
    length,
    charsetSize,
    characterClasses,
    hasRepeats,
    hasSequence,
    isCommonPassword,
    suggestions,
    crackTimes,
  };
}
