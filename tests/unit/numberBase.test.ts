import { describe, expect, it } from "vite-plus/test";
import {
  bigIntToBase,
  parseStringToBigInt,
} from "../../app/utils/numberBase";

describe("bigIntToBase", () => {
  describe("2進数変換", () => {
    it("0n は '0' を返す", () => {
      expect(bigIntToBase(0n, 2)).toBe("0");
    });

    it("1n は '1' を返す", () => {
      expect(bigIntToBase(1n, 2)).toBe("1");
    });

    it("10n は '1010' を返す", () => {
      expect(bigIntToBase(10n, 2)).toBe("1010");
    });

    it("255n は '11111111' を返す", () => {
      expect(bigIntToBase(255n, 2)).toBe("11111111");
    });
  });

  describe("8進数変換", () => {
    it("8n は '10' を返す", () => {
      expect(bigIntToBase(8n, 8)).toBe("10");
    });

    it("255n は '377' を返す", () => {
      expect(bigIntToBase(255n, 8)).toBe("377");
    });
  });

  describe("10進数変換", () => {
    it("12345n は '12345' を返す", () => {
      expect(bigIntToBase(12345n, 10)).toBe("12345");
    });
  });

  describe("16進数変換", () => {
    it("255n は 'FF' を返す（大文字）", () => {
      expect(bigIntToBase(255n, 16)).toBe("FF");
    });

    it("16n は '10' を返す", () => {
      expect(bigIntToBase(16n, 16)).toBe("10");
    });

    it("171n は 'AB' を返す", () => {
      expect(bigIntToBase(171n, 16)).toBe("AB");
    });
  });

  describe("大きな数値", () => {
    it("非常に大きな BigInt も変換できる", () => {
      const big = BigInt("123456789012345678901234567890");
      const result = bigIntToBase(big, 10);
      expect(result).toBe("123456789012345678901234567890");
    });
  });
});

describe("parseStringToBigInt", () => {
  describe("2進数パース", () => {
    it("'1010' は 10n を返す", () => {
      expect(parseStringToBigInt("1010", 2)).toBe(10n);
    });

    it("'0' は 0n を返す", () => {
      expect(parseStringToBigInt("0", 2)).toBe(0n);
    });

    it("'11111111' は 255n を返す", () => {
      expect(parseStringToBigInt("11111111", 2)).toBe(255n);
    });

    it("'2' は null を返す（2進数に2は不正）", () => {
      expect(parseStringToBigInt("2", 2)).toBeNull();
    });
  });

  describe("8進数パース", () => {
    it("'10' は 8n を返す", () => {
      expect(parseStringToBigInt("10", 8)).toBe(8n);
    });

    it("'377' は 255n を返す", () => {
      expect(parseStringToBigInt("377", 8)).toBe(255n);
    });

    it("'8' は null を返す（8進数に8は不正）", () => {
      expect(parseStringToBigInt("8", 8)).toBeNull();
    });
  });

  describe("10進数パース", () => {
    it("'12345' は 12345n を返す", () => {
      expect(parseStringToBigInt("12345", 10)).toBe(12345n);
    });

    it("'A' は null を返す（10進数にAは不正）", () => {
      expect(parseStringToBigInt("A", 10)).toBeNull();
    });
  });

  describe("16進数パース", () => {
    it("'FF' は 255n を返す（大文字）", () => {
      expect(parseStringToBigInt("FF", 16)).toBe(255n);
    });

    it("'ff' は 255n を返す（小文字）", () => {
      expect(parseStringToBigInt("ff", 16)).toBe(255n);
    });

    it("'10' は 16n を返す", () => {
      expect(parseStringToBigInt("10", 16)).toBe(16n);
    });

    it("'AB' は 171n を返す", () => {
      expect(parseStringToBigInt("AB", 16)).toBe(171n);
    });

    it("'G' は null を返す（16進数にGは不正）", () => {
      expect(parseStringToBigInt("G", 16)).toBeNull();
    });
  });

  describe("空文字・空白の扱い", () => {
    it("空文字は null を返す", () => {
      expect(parseStringToBigInt("", 10)).toBeNull();
    });

    it("スペースのみは null を返す", () => {
      expect(parseStringToBigInt("   ", 10)).toBeNull();
    });

    it("前後のスペースはトリムして処理される", () => {
      expect(parseStringToBigInt("  42  ", 10)).toBe(42n);
    });
  });

  describe("往復変換", () => {
    it("2進数の往復変換が一致する", () => {
      const original = 12345n;
      const str = bigIntToBase(original, 2);
      expect(parseStringToBigInt(str, 2)).toBe(original);
    });

    it("16進数の往復変換が一致する", () => {
      const original = 65535n;
      const str = bigIntToBase(original, 16);
      expect(parseStringToBigInt(str, 16)).toBe(original);
    });

    it("大きな数値の往復変換が一致する", () => {
      const original = BigInt("9999999999999999999999");
      const str = bigIntToBase(original, 10);
      expect(parseStringToBigInt(str, 10)).toBe(original);
    });
  });
});
