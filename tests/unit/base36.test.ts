import { describe, it, expect } from "vite-plus/test";
import {
  encodeBase36,
  decodeBase36,
  validateBase36,
  encodeIntBase36,
  decodeIntBase36,
} from "../../app/utils/base36";

describe("encodeBase36", () => {
  describe("小文字モード (lower)", () => {
    it("空文字列は空文字列を返す", () => {
      const result = encodeBase36("", "lower");
      expect(result.encoded).toBe("");
      expect(result.inputBytes).toBe(0);
      expect(result.outputLength).toBe(0);
    });

    it("inputBytes・outputLength を正確に返す", () => {
      const result = encodeBase36("abc", "lower");
      expect(result.inputBytes).toBe(3);
      expect(result.outputLength).toBe(result.encoded.length);
    });

    it("出力が [0-9a-z] のみで構成される", () => {
      const result = encodeBase36("Hello, World! 123", "lower");
      expect(result.encoded).toMatch(/^[0-9a-z]+$/);
    });
  });

  describe("大文字モード (upper)", () => {
    it("出力が [0-9A-Z] のみで構成される", () => {
      const result = encodeBase36("Hello", "upper");
      expect(result.encoded).toMatch(/^[0-9A-Z]+$/);
    });

    it("小文字と大文字は大文字小文字以外は同じ値", () => {
      const lower = encodeBase36("Hello", "lower").encoded;
      const upper = encodeBase36("Hello", "upper").encoded;
      expect(lower.toUpperCase()).toBe(upper);
    });
  });

  describe("エンコードとデコードのラウンドトリップ", () => {
    const testCases = ["Hello", "Hello World", "abc123", "日本語テスト", "!@#$%^&*()"];

    testCases.forEach((text) => {
      it(`"${text}" をエンコード→デコードすると元に戻る`, () => {
        const encoded = encodeBase36(text, "lower").encoded;
        const decoded = decodeBase36(encoded);
        expect(decoded.success).toBe(true);
        expect(decoded.decoded).toBe(text);
      });
    });
  });
});

describe("decodeBase36", () => {
  it("空文字列は空文字列を返す", () => {
    const result = decodeBase36("");
    expect(result.success).toBe(true);
    expect(result.decoded).toBe("");
  });

  it("大文字小文字を区別しない", () => {
    const encoded = encodeBase36("test", "lower").encoded;
    const upper = encoded.toUpperCase();
    const resultLower = decodeBase36(encoded);
    const resultUpper = decodeBase36(upper);
    expect(resultLower.success).toBe(true);
    expect(resultUpper.success).toBe(true);
    expect(resultLower.decoded).toBe(resultUpper.decoded);
  });

  it("無効な文字でエラーを返す", () => {
    const result = decodeBase36("hello!world");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("先頭の空白を無視する", () => {
    const encoded = encodeBase36("test", "lower").encoded;
    const result = decodeBase36("  " + encoded + "  ");
    expect(result.success).toBe(true);
    expect(result.decoded).toBe("test");
  });
});

describe("validateBase36", () => {
  it("空文字列は null を返す", () => {
    expect(validateBase36("")).toBeNull();
  });

  it("有効な小文字 Base36 文字列は null を返す", () => {
    expect(validateBase36("0123456789abcdefghijklmnopqrstuvwxyz")).toBeNull();
  });

  it("有効な大文字 Base36 文字列は null を返す", () => {
    expect(validateBase36("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBeNull();
  });

  it("無効な文字（!）でエラーメッセージを返す", () => {
    const result = validateBase36("abc!def");
    expect(result).not.toBeNull();
    expect(result).toContain("!");
  });

  it("無効な文字（+）でエラーメッセージを返す", () => {
    const result = validateBase36("abc+def");
    expect(result).not.toBeNull();
  });

  it("空白は無視される", () => {
    expect(validateBase36("  abc  ")).toBeNull();
  });
});

describe("encodeIntBase36", () => {
  it('0 を "0" にエンコードする', () => {
    expect(encodeIntBase36(0n)).toBe("0");
  });

  it('255 を "73" にエンコードする（小文字）', () => {
    expect(encodeIntBase36(255n, "lower")).toBe("73");
  });

  it('255 を "73" にエンコードする（大文字）', () => {
    expect(encodeIntBase36(255n, "upper")).toBe("73");
  });

  it('1000 を "rs" にエンコードする', () => {
    expect(encodeIntBase36(1000n, "lower")).toBe("rs");
  });

  it("負の整数で例外をスローする", () => {
    expect(() => encodeIntBase36(-1n)).toThrow();
  });

  it("JavaScript の Number.toString(36) と互換性がある", () => {
    const testValues = [0, 1, 10, 100, 1000, 65535, 1234567890];
    testValues.forEach((n) => {
      const expected = n.toString(36);
      const result = encodeIntBase36(BigInt(n), "lower");
      expect(result).toBe(expected);
    });
  });
});

describe("decodeIntBase36", () => {
  it('"0" を 0 にデコードする', () => {
    expect(decodeIntBase36("0")).toBe(0n);
  });

  it('"73" を 255 にデコードする', () => {
    expect(decodeIntBase36("73")).toBe(255n);
  });

  it('"rs" を 1000 にデコードする', () => {
    expect(decodeIntBase36("rs")).toBe(1000n);
  });

  it("大文字も正しくデコードする", () => {
    expect(decodeIntBase36("FF")).toBe(decodeIntBase36("ff"));
  });

  it("JavaScript の parseInt(str, 36) と互換性がある", () => {
    const testStrings = ["0", "1", "z", "ff", "1000", "zzzz"];
    testStrings.forEach((s) => {
      const expected = BigInt(parseInt(s, 36));
      const result = decodeIntBase36(s);
      expect(result).toBe(expected);
    });
  });

  it("encodeIntBase36 との往復変換が正確", () => {
    const testValues = [0n, 1n, 35n, 36n, 255n, 1000n, 99999n];
    testValues.forEach((n) => {
      const encoded = encodeIntBase36(n, "lower");
      const decoded = decodeIntBase36(encoded);
      expect(decoded).toBe(n);
    });
  });
});
