/**
 * パスワード生成オプション
 */
export interface PasswordOptions {
  /** パスワードの文字数 */
  length: number;
  /** 大文字（A-Z）を含めるか */
  uppercase: boolean;
  /** 小文字（a-z）を含めるか */
  lowercase: boolean;
  /** 数字（0-9）を含めるか */
  numbers: boolean;
  /** 記号（!@#$%^&*など）を含めるか */
  symbols: boolean;
}

/** 大文字アルファベット文字セット */
export const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** 小文字アルファベット文字セット */
export const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
/** 数字文字セット */
export const NUMBER_CHARS = "0123456789";
/** 記号文字セット */
export const SYMBOL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

/**
 * エントロピー計算用の各文字セットの文字数
 */
export const CHAR_COUNTS = {
  uppercase: UPPERCASE_CHARS.length, // 26
  lowercase: LOWERCASE_CHARS.length, // 26
  numbers: NUMBER_CHARS.length, // 10
  symbols: SYMBOL_CHARS.length, // 26
} as const;

/**
 * Generate a cryptographically secure random password using rejection sampling
 * to avoid modulo bias.
 */
export function generatePassword(options: PasswordOptions): string {
  let charset = "";
  if (options.uppercase) charset += UPPERCASE_CHARS;
  if (options.lowercase) charset += LOWERCASE_CHARS;
  if (options.numbers) charset += NUMBER_CHARS;
  if (options.symbols) charset += SYMBOL_CHARS;

  if (charset.length === 0) {
    return "";
  }

  const charsetLength = charset.length;
  // Calculate the largest multiple of charsetLength that fits in a Uint32
  // This is used for rejection sampling to avoid modulo bias
  const maxValid = Math.floor(0xffffffff / charsetLength) * charsetLength;

  let password = "";
  const array = new Uint32Array(1);

  for (let i = 0; i < options.length; i++) {
    let randomValue: number;
    // Rejection sampling: reject values that would cause bias
    do {
      crypto.getRandomValues(array);
      randomValue = array[0];
    } while (randomValue >= maxValid);

    password += charset[randomValue % charsetLength];
  }

  return password;
}

/**
 * Calculate password strength based on entropy.
 */
export function calculateStrength(
  password: string,
  options: PasswordOptions
): { score: number; label: string } {
  if (password.length === 0) return { score: 0, label: "" };

  let charsetSize = 0;
  if (options.uppercase) charsetSize += CHAR_COUNTS.uppercase;
  if (options.lowercase) charsetSize += CHAR_COUNTS.lowercase;
  if (options.numbers) charsetSize += CHAR_COUNTS.numbers;
  if (options.symbols) charsetSize += CHAR_COUNTS.symbols;

  const entropy = password.length * Math.log2(charsetSize || 1);

  if (entropy < 28) return { score: 1, label: "非常に弱い" };
  if (entropy < 36) return { score: 2, label: "弱い" };
  if (entropy < 60) return { score: 3, label: "普通" };
  if (entropy < 128) return { score: 4, label: "強い" };
  return { score: 5, label: "非常に強い" };
}
