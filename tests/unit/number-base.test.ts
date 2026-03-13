import { describe, it, expect } from "vitest";
import { bigIntToBase, parseStringToBigInt } from "../../app/utils/numberBase";

/**
 * 文字列が各進数で有効かどうかを検証する
 * @param value - 検証する文字列
 * @param base - 進数
 * @returns 有効な場合true
 */
function isValidForBase(value: string, base: number): boolean {
  if (!value) return false;
  const validCharsMap: Record<number, RegExp> = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9a-fA-F]+$/,
  };
  const regex = validCharsMap[base];
  if (!regex) return false;
  return regex.test(value);
}

describe("数値進数変換", () => {
  describe("bigIntToBase - 2進数変換", () => {
    it("正の整数を2進数に変換できる", () => {
      expect(bigIntToBase(10n, 2)).toBe("1010");
    });

    it("1を2進数に変換できる", () => {
      expect(bigIntToBase(1n, 2)).toBe("1");
    });

    it("255を2進数に変換できる", () => {
      expect(bigIntToBase(255n, 2)).toBe("11111111");
    });

    it("256を2進数に変換できる", () => {
      expect(bigIntToBase(256n, 2)).toBe("100000000");
    });
  });

  describe("bigIntToBase - 8進数変換", () => {
    it("正の整数を8進数に変換できる", () => {
      expect(bigIntToBase(8n, 8)).toBe("10");
    });

    it("10を8進数に変換できる", () => {
      expect(bigIntToBase(10n, 8)).toBe("12");
    });

    it("255を8進数に変換できる", () => {
      expect(bigIntToBase(255n, 8)).toBe("377");
    });

    it("64を8進数に変換できる", () => {
      expect(bigIntToBase(64n, 8)).toBe("100");
    });
  });

  describe("bigIntToBase - 16進数変換", () => {
    it("正の整数を16進数に変換できる（大文字）", () => {
      expect(bigIntToBase(255n, 16)).toBe("FF");
    });

    it("10を16進数に変換できる", () => {
      expect(bigIntToBase(10n, 16)).toBe("A");
    });

    it("16を16進数に変換できる", () => {
      expect(bigIntToBase(16n, 16)).toBe("10");
    });

    it("256を16進数に変換できる", () => {
      expect(bigIntToBase(256n, 16)).toBe("100");
    });
  });

  describe("bigIntToBase - 0の変換", () => {
    it("0を2進数に変換できる", () => {
      expect(bigIntToBase(0n, 2)).toBe("0");
    });

    it("0を8進数に変換できる", () => {
      expect(bigIntToBase(0n, 8)).toBe("0");
    });

    it("0を10進数に変換できる", () => {
      expect(bigIntToBase(0n, 10)).toBe("0");
    });

    it("0を16進数に変換できる", () => {
      expect(bigIntToBase(0n, 16)).toBe("0");
    });
  });

  describe("bigIntToBase - 大きな数値のテスト", () => {
    it("Number.MAX_SAFE_INTEGERを超える値を正しく変換できる", () => {
      const bigNum = 9007199254740993n; // Number.MAX_SAFE_INTEGER + 2
      const decimal = bigIntToBase(bigNum, 10);
      expect(decimal).toBe("9007199254740993");
    });

    it("大きな値を16進数に変換できる", () => {
      const bigNum = BigInt("0xFFFFFFFFFFFFFFFF");
      const hex = bigIntToBase(bigNum, 16);
      expect(hex).toBe("FFFFFFFFFFFFFFFF");
    });

    it("大きな値を2進数に変換して桁数が正しい", () => {
      const bigNum = 1024n;
      const binary = bigIntToBase(bigNum, 2);
      expect(binary).toBe("10000000000");
      expect(binary.length).toBe(11);
    });
  });

  describe("parseStringToBigInt - 入力パース", () => {
    it("2進数の文字列をパースできる", () => {
      expect(parseStringToBigInt("1010", 2)).toBe(10n);
    });

    it("8進数の文字列をパースできる", () => {
      expect(parseStringToBigInt("12", 8)).toBe(10n);
    });

    it("10進数の文字列をパースできる", () => {
      expect(parseStringToBigInt("255", 10)).toBe(255n);
    });

    it("16進数の文字列をパースできる（大文字）", () => {
      expect(parseStringToBigInt("FF", 16)).toBe(255n);
    });

    it("16進数の文字列をパースできる（小文字）", () => {
      expect(parseStringToBigInt("ff", 16)).toBe(255n);
    });

    it("16進数の文字列をパースできる（混合ケース）", () => {
      expect(parseStringToBigInt("aB", 16)).toBe(171n);
    });

    it("0をパースできる", () => {
      expect(parseStringToBigInt("0", 10)).toBe(0n);
    });

    it("空文字列はnullを返す", () => {
      expect(parseStringToBigInt("", 10)).toBeNull();
    });

    it("空白のみはnullを返す", () => {
      expect(parseStringToBigInt("   ", 10)).toBeNull();
    });
  });

  describe("無効な入力の検証", () => {
    it("2進数に2以上の数字が含まれる場合はnullを返す", () => {
      expect(parseStringToBigInt("102", 2)).toBeNull();
    });

    it("2進数にアルファベットが含まれる場合はnullを返す", () => {
      expect(parseStringToBigInt("1a0", 2)).toBeNull();
    });

    it("8進数に8以上の数字が含まれる場合はnullを返す", () => {
      expect(parseStringToBigInt("89", 8)).toBeNull();
    });

    it("10進数にアルファベットが含まれる場合はnullを返す", () => {
      expect(parseStringToBigInt("12a", 10)).toBeNull();
    });

    it("16進数にG以降の文字が含まれる場合はnullを返す", () => {
      expect(parseStringToBigInt("GF", 16)).toBeNull();
    });

    it("特殊文字が含まれる場合はnullを返す", () => {
      expect(parseStringToBigInt("1+2", 10)).toBeNull();
    });
  });

  describe("isValidForBase - バリデーション", () => {
    it("2進数の有効な文字列を検証できる", () => {
      expect(isValidForBase("1010", 2)).toBe(true);
    });

    it("2進数の無効な文字列を検証できる", () => {
      expect(isValidForBase("1020", 2)).toBe(false);
    });

    it("8進数の有効な文字列を検証できる", () => {
      expect(isValidForBase("077", 8)).toBe(true);
    });

    it("8進数の無効な文字列を検証できる", () => {
      expect(isValidForBase("089", 8)).toBe(false);
    });

    it("10進数の有効な文字列を検証できる", () => {
      expect(isValidForBase("12345", 10)).toBe(true);
    });

    it("10進数の無効な文字列を検証できる", () => {
      expect(isValidForBase("12a45", 10)).toBe(false);
    });

    it("16進数の大文字を検証できる", () => {
      expect(isValidForBase("DEADBEEF", 16)).toBe(true);
    });

    it("16進数の小文字を検証できる", () => {
      expect(isValidForBase("deadbeef", 16)).toBe(true);
    });

    it("16進数の混合ケースを検証できる", () => {
      expect(isValidForBase("DeAdBeEf", 16)).toBe(true);
    });

    it("16進数の無効な文字列を検証できる", () => {
      expect(isValidForBase("GHIJ", 16)).toBe(false);
    });

    it("空文字列はfalseを返す", () => {
      expect(isValidForBase("", 10)).toBe(false);
    });
  });

  describe("相互変換の整合性テスト", () => {
    it("10進数 → 2進数 → 10進数 の往復変換が一致する", () => {
      const original = 42n;
      const binary = bigIntToBase(original, 2);
      const restored = parseStringToBigInt(binary, 2);
      expect(restored).toBe(original);
    });

    it("10進数 → 8進数 → 10進数 の往復変換が一致する", () => {
      const original = 100n;
      const octal = bigIntToBase(original, 8);
      const restored = parseStringToBigInt(octal, 8);
      expect(restored).toBe(original);
    });

    it("10進数 → 16進数 → 10進数 の往復変換が一致する", () => {
      const original = 65535n;
      const hex = bigIntToBase(original, 16);
      const restored = parseStringToBigInt(hex, 16);
      expect(restored).toBe(original);
    });

    it("2進数 → 16進数の変換が正しい", () => {
      // 11111111 (binary) = 255 (decimal) = FF (hex)
      const binaryVal = parseStringToBigInt("11111111", 2);
      expect(binaryVal).toBe(255n);
      expect(bigIntToBase(binaryVal!, 16)).toBe("FF");
    });
  });
});
