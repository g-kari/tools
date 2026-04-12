import { describe, it, expect } from "vite-plus/test";
import {
  generatePassword,
  calculateStrength,
  UPPERCASE_CHARS,
  LOWERCASE_CHARS,
  NUMBER_CHARS,
  SYMBOL_CHARS,
  CHAR_COUNTS,
  type PasswordOptions,
} from "../../app/utils/password";

const defaultOptions: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: false,
};

describe("generatePassword", () => {
  describe("文字数", () => {
    it("指定した長さのパスワードを生成する", () => {
      expect(generatePassword({ ...defaultOptions, length: 8 })).toHaveLength(8);
      expect(generatePassword({ ...defaultOptions, length: 32 })).toHaveLength(32);
      expect(generatePassword({ ...defaultOptions, length: 128 })).toHaveLength(128);
    });

    it("最小長さ4文字", () => {
      expect(generatePassword({ ...defaultOptions, length: 4 })).toHaveLength(4);
    });
  });

  describe("文字種の制約", () => {
    it("大文字のみ: A-Z のみを含む", () => {
      const pw = generatePassword({
        length: 50,
        uppercase: true,
        lowercase: false,
        numbers: false,
        symbols: false,
      });
      expect(pw).toHaveLength(50);
      expect(Array.from(pw).every((c) => UPPERCASE_CHARS.includes(c))).toBe(true);
    });

    it("小文字のみ: a-z のみを含む", () => {
      const pw = generatePassword({
        length: 50,
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
      });
      expect(Array.from(pw).every((c) => LOWERCASE_CHARS.includes(c))).toBe(true);
    });

    it("数字のみ: 0-9 のみを含む", () => {
      const pw = generatePassword({
        length: 50,
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
      });
      expect(Array.from(pw).every((c) => NUMBER_CHARS.includes(c))).toBe(true);
    });

    it("記号のみ: 記号文字のみを含む", () => {
      const pw = generatePassword({
        length: 50,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: true,
      });
      expect(Array.from(pw).every((c) => SYMBOL_CHARS.includes(c))).toBe(true);
    });

    it("全文字種: 許可された文字のみを含む", () => {
      const all = UPPERCASE_CHARS + LOWERCASE_CHARS + NUMBER_CHARS + SYMBOL_CHARS;
      const pw = generatePassword({
        length: 100,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
      });
      expect(Array.from(pw).every((c) => all.includes(c))).toBe(true);
    });
  });

  describe("空のオプション", () => {
    it("文字種が1つも選択されていない場合は空文字を返す", () => {
      const pw = generatePassword({
        length: 16,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
      });
      expect(pw).toBe("");
    });
  });

  describe("ランダム性", () => {
    it("連続して生成したパスワードは通常異なる", () => {
      const pw1 = generatePassword({ ...defaultOptions, length: 32 });
      const pw2 = generatePassword({ ...defaultOptions, length: 32 });
      // 確率的なテスト: 32文字で完全一致する可能性は極めて低い
      expect(pw1).not.toBe(pw2);
    });
  });
});

describe("calculateStrength", () => {
  describe("空文字", () => {
    it("空文字はスコア0・ラベル空を返す", () => {
      const result = calculateStrength("", defaultOptions);
      expect(result.score).toBe(0);
      expect(result.label).toBe("");
    });
  });

  describe("強度スコア", () => {
    it("非常に弱い: エントロピー < 28 → スコア1", () => {
      // lowercase only, length=4 → entropy = 4 * log2(26) ≈ 18.8
      const result = calculateStrength("abcd", {
        length: 4,
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
      });
      expect(result.score).toBe(1);
      expect(result.label).toBe("非常に弱い");
    });

    it("弱い: エントロピー 28〜36 → スコア2", () => {
      // lowercase only, length=6 → entropy = 6 * log2(26) ≈ 28.2
      const result = calculateStrength("abcdef", {
        length: 6,
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
      });
      expect(result.score).toBe(2);
      expect(result.label).toBe("弱い");
    });

    it("普通: エントロピー 36〜60 → スコア3", () => {
      // lowercase only, length=8 → entropy = 8 * log2(26) ≈ 37.6
      const result = calculateStrength("abcdefgh", {
        length: 8,
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
      });
      expect(result.score).toBe(3);
      expect(result.label).toBe("普通");
    });

    it("強い: エントロピー 60〜128 → スコア4", () => {
      // uppercase + lowercase + numbers, length=12 → entropy = 12 * log2(62) ≈ 71.4
      const result = calculateStrength("Abcdef123456", {
        length: 12,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: false,
      });
      expect(result.score).toBe(4);
      expect(result.label).toBe("強い");
    });

    it("非常に強い: エントロピー >= 128 → スコア5", () => {
      // all chars, length=24 → entropy = 24 * log2(88) ≈ 150.7
      const result = calculateStrength("Abcdef1!Abcdef1!Abcdef1!", {
        length: 24,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
      });
      expect(result.score).toBe(5);
      expect(result.label).toBe("非常に強い");
    });
  });

  describe("文字種とエントロピーの関係", () => {
    it("同じ長さなら文字種が多いほど強度が高い", () => {
      const lowercaseOnly = calculateStrength("abcdefghijkl", {
        length: 12,
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
      });
      const allChars = calculateStrength("Abcdef1!xyzw", {
        length: 12,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
      });
      expect(allChars.score).toBeGreaterThanOrEqual(lowercaseOnly.score);
    });

    it("同じ文字種なら長いほど強度が高い", () => {
      const short = calculateStrength("abcdef", {
        length: 6,
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
      });
      const long = calculateStrength("abcdefghijklmnopqrstuvwxyz", {
        length: 26,
        uppercase: false,
        lowercase: true,
        numbers: false,
        symbols: false,
      });
      expect(long.score).toBeGreaterThan(short.score);
    });
  });
});

describe("文字セット定数", () => {
  it("UPPERCASE_CHARS は26文字", () => {
    expect(UPPERCASE_CHARS.length).toBe(26);
    expect(CHAR_COUNTS.uppercase).toBe(26);
  });

  it("LOWERCASE_CHARS は26文字", () => {
    expect(LOWERCASE_CHARS.length).toBe(26);
    expect(CHAR_COUNTS.lowercase).toBe(26);
  });

  it("NUMBER_CHARS は10文字", () => {
    expect(NUMBER_CHARS.length).toBe(10);
    expect(CHAR_COUNTS.numbers).toBe(10);
  });

  it("SYMBOL_CHARS は CHAR_COUNTS.symbols と一致", () => {
    expect(SYMBOL_CHARS.length).toBe(CHAR_COUNTS.symbols);
  });

  it("各文字セットに重複なし", () => {
    const unique = (s: string) => new Set(s).size === s.length;
    expect(unique(UPPERCASE_CHARS)).toBe(true);
    expect(unique(LOWERCASE_CHARS)).toBe(true);
    expect(unique(NUMBER_CHARS)).toBe(true);
    expect(unique(SYMBOL_CHARS)).toBe(true);
  });
});
