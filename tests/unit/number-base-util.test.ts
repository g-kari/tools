import { describe, it, expect } from "vitest";
import {
  BASES,
  BASE_LABELS,
  BASE_PREFIXES,
  isValidForBase,
  parseToDecimal,
  decimalToBase,
  convertBase,
  isInSafeRange,
  type Base,
} from "../../app/utils/number-base";

describe("number-base ユーティリティ", () => {
  describe("定数", () => {
    it("BASES に 2, 8, 10, 16 が含まれる", () => {
      expect(BASES).toContain(2);
      expect(BASES).toContain(8);
      expect(BASES).toContain(10);
      expect(BASES).toContain(16);
      expect(BASES).toHaveLength(4);
    });

    it("BASE_LABELS に各基数のラベルが定義されている", () => {
      expect(BASE_LABELS[2]).toBe("2進数（Binary）");
      expect(BASE_LABELS[8]).toBe("8進数（Octal）");
      expect(BASE_LABELS[10]).toBe("10進数（Decimal）");
      expect(BASE_LABELS[16]).toBe("16進数（Hex）");
    });

    it("BASE_PREFIXES に各基数のプレフィックスが定義されている", () => {
      expect(BASE_PREFIXES[2]).toBe("0b");
      expect(BASE_PREFIXES[8]).toBe("0o");
      expect(BASE_PREFIXES[10]).toBe("");
      expect(BASE_PREFIXES[16]).toBe("0x");
    });
  });

  describe("isValidForBase - 入力バリデーション", () => {
    it("空文字列は有効（入力中）", () => {
      expect(isValidForBase("", 2)).toBe(true);
      expect(isValidForBase("", 10)).toBe(true);
    });

    it("'-' のみは有効（負数入力中）", () => {
      expect(isValidForBase("-", 10)).toBe(true);
      expect(isValidForBase("-", 16)).toBe(true);
    });

    it("2進数: 0と1のみ有効", () => {
      expect(isValidForBase("101010", 2)).toBe(true);
      expect(isValidForBase("0", 2)).toBe(true);
      expect(isValidForBase("1", 2)).toBe(true);
    });

    it("2進数: 2以上の数字は無効", () => {
      expect(isValidForBase("102", 2)).toBe(false);
      expect(isValidForBase("1a1", 2)).toBe(false);
    });

    it("8進数: 0〜7のみ有効", () => {
      expect(isValidForBase("0777", 8)).toBe(true);
      expect(isValidForBase("123", 8)).toBe(true);
    });

    it("8進数: 8以上の数字は無効", () => {
      expect(isValidForBase("089", 8)).toBe(false);
    });

    it("10進数: 0〜9のみ有効", () => {
      expect(isValidForBase("12345", 10)).toBe(true);
      expect(isValidForBase("0", 10)).toBe(true);
    });

    it("10進数: アルファベットは無効", () => {
      expect(isValidForBase("12a34", 10)).toBe(false);
    });

    it("16進数: 0〜9とA〜Fが有効（大文字・小文字混在）", () => {
      expect(isValidForBase("DEADBEEF", 16)).toBe(true);
      expect(isValidForBase("deadbeef", 16)).toBe(true);
      expect(isValidForBase("DeAdBeEf", 16)).toBe(true);
      expect(isValidForBase("0123456789ABCDEF", 16)).toBe(true);
    });

    it("16進数: G以降の文字は無効", () => {
      expect(isValidForBase("GHIJ", 16)).toBe(false);
    });

    it("負の値も有効", () => {
      expect(isValidForBase("-1010", 2)).toBe(true);
      expect(isValidForBase("-FF", 16)).toBe(true);
      expect(isValidForBase("-255", 10)).toBe(true);
    });
  });

  describe("parseToDecimal - 10進数への変換", () => {
    it("2進数の文字列を10進数に変換する", () => {
      expect(parseToDecimal("1010", 2)).toBe(10);
      expect(parseToDecimal("11111111", 2)).toBe(255);
      expect(parseToDecimal("0", 2)).toBe(0);
    });

    it("8進数の文字列を10進数に変換する", () => {
      expect(parseToDecimal("12", 8)).toBe(10);
      expect(parseToDecimal("377", 8)).toBe(255);
    });

    it("10進数の文字列をそのまま返す", () => {
      expect(parseToDecimal("255", 10)).toBe(255);
      expect(parseToDecimal("0", 10)).toBe(0);
    });

    it("16進数の文字列を10進数に変換する", () => {
      expect(parseToDecimal("FF", 16)).toBe(255);
      expect(parseToDecimal("ff", 16)).toBe(255);
      expect(parseToDecimal("A", 16)).toBe(10);
    });

    it("空文字列はnullを返す", () => {
      expect(parseToDecimal("", 10)).toBeNull();
    });

    it("'-' のみはnullを返す", () => {
      expect(parseToDecimal("-", 10)).toBeNull();
    });

    it("無効な文字列はnullを返す", () => {
      expect(parseToDecimal("XYZ", 16)).toBeNull();
      expect(parseToDecimal("102", 2)).toBeNull();
    });
  });

  describe("decimalToBase - 指定基数への変換", () => {
    it("10進数を2進数に変換する", () => {
      expect(decimalToBase(10, 2)).toBe("1010");
      expect(decimalToBase(255, 2)).toBe("11111111");
      expect(decimalToBase(0, 2)).toBe("0");
    });

    it("10進数を8進数に変換する", () => {
      expect(decimalToBase(10, 8)).toBe("12");
      expect(decimalToBase(255, 8)).toBe("377");
    });

    it("10進数を16進数に変換する（大文字）", () => {
      expect(decimalToBase(255, 16)).toBe("FF");
      expect(decimalToBase(10, 16)).toBe("A");
      expect(decimalToBase(16, 16)).toBe("10");
    });

    it("10進数をそのまま返す", () => {
      expect(decimalToBase(255, 10)).toBe("255");
    });

    it("負の値を変換する", () => {
      expect(decimalToBase(-10, 2)).toBe("-1010");
      expect(decimalToBase(-255, 16)).toBe("-FF");
    });

    it("整数でない値は空文字列を返す", () => {
      expect(decimalToBase(1.5, 10)).toBe("");
      expect(decimalToBase(NaN, 10)).toBe("");
    });
  });

  describe("convertBase - 基数間の変換", () => {
    it("2進数から10進数への変換", () => {
      expect(convertBase("1010", 2, 10)).toBe("10");
    });

    it("10進数から2進数への変換", () => {
      expect(convertBase("10", 10, 2)).toBe("1010");
    });

    it("16進数から2進数への変換", () => {
      expect(convertBase("FF", 16, 2)).toBe("11111111");
    });

    it("2進数から16進数への変換", () => {
      expect(convertBase("11111111", 2, 16)).toBe("FF");
    });

    it("8進数から16進数への変換", () => {
      expect(convertBase("377", 8, 16)).toBe("FF");
    });

    it("同一基数への変換は大文字で返す", () => {
      expect(convertBase("ff", 16, 16)).toBe("FF");
    });

    it("無効な入力はnullを返す", () => {
      expect(convertBase("XYZ", 16, 10)).toBeNull();
      expect(convertBase("", 10, 2)).toBeNull();
    });

    it("往復変換で元の値に戻る", () => {
      const original = "12345";
      const toBinary = convertBase(original, 10, 2);
      expect(toBinary).not.toBeNull();
      const backToDecimal = convertBase(toBinary!, 2, 10);
      expect(backToDecimal).toBe(original);
    });
  });

  describe("isInSafeRange - 安全な整数範囲チェック", () => {
    it("通常の値は範囲内", () => {
      expect(isInSafeRange("255", 10)).toBe(true);
      expect(isInSafeRange("FF", 16)).toBe(true);
      expect(isInSafeRange("0", 10)).toBe(true);
    });

    it("Number.MAX_SAFE_INTEGER は範囲内", () => {
      const maxSafe = Number.MAX_SAFE_INTEGER.toString();
      expect(isInSafeRange(maxSafe, 10)).toBe(true);
    });

    it("Number.MAX_SAFE_INTEGER を超える値は範囲外", () => {
      // Number.MAX_SAFE_INTEGER + 1 = 9007199254740992
      expect(isInSafeRange("9007199254740992", 10)).toBe(false);
    });

    it("空文字列は範囲内（入力なし）", () => {
      expect(isInSafeRange("", 10)).toBe(true);
    });

    it("無効な値は範囲内として扱う", () => {
      expect(isInSafeRange("XYZ", 16)).toBe(true);
    });

    it("型 Base の全基数で動作する", () => {
      const bases: Base[] = [2, 8, 10, 16];
      for (const base of bases) {
        expect(isInSafeRange("0", base)).toBe(true);
      }
    });
  });
});
