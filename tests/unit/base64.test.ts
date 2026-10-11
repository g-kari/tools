import { describe, it, expect } from "vite-plus/test";
import { decodeBase64, encodeBase64, validateBase64 } from "../../app/utils/base64";

describe("Base64 Encode/Decode Functions", () => {
  describe("encodeBase64", () => {
    it("should encode Japanese text", () => {
      expect(encodeBase64("こんにちは").encoded).toBe("44GT44KT44Gr44Gh44Gv");
    });

    it("should encode ASCII text", () => {
      expect(encodeBase64("Hello").encoded).toBe("SGVsbG8=");
    });

    it("should encode text with spaces", () => {
      expect(encodeBase64("Hello World").encoded).toBe("SGVsbG8gV29ybGQ=");
    });

    it("should encode special characters", () => {
      expect(encodeBase64("hello!@#$%^&*()").encoded).toBe("aGVsbG8hQCMkJV4mKigp");
    });

    it("should handle empty string", () => {
      expect(encodeBase64("").encoded).toBe("");
    });

    it("should encode emoji", () => {
      expect(encodeBase64("😀").encoded).toBe("8J+YgA==");
    });

    it("should encode Korean text", () => {
      expect(encodeBase64("안녕").encoded).toBe("7JWI64WV");
    });

    it("should encode Chinese text", () => {
      expect(encodeBase64("中文").encoded).toBe("5Lit5paH");
    });

    it("should encode numbers", () => {
      expect(encodeBase64("1234567890").encoded).toBe("MTIzNDU2Nzg5MA==");
    });

    it("should encode multiline text", () => {
      expect(encodeBase64("Line 1\nLine 2\nLine 3").encoded).toBe("TGluZSAxCkxpbmUgMgpMaW5lIDM=");
    });

    it("should return correct inputBytes for UTF-8 text", () => {
      const result = encodeBase64("あ");
      expect(result.inputBytes).toBe(3);
    });

    it("should return correct outputLength", () => {
      const result = encodeBase64("Hello");
      expect(result.outputLength).toBe(result.encoded.length);
    });
  });

  describe("decodeBase64", () => {
    function expectDecoded(encoded: string, expected: string) {
      const result = decodeBase64(encoded);
      expect(result.success).toBe(true);
      if (!result.success) throw new Error("expected success");
      expect(result.decoded).toBe(expected);
    }

    it("should decode to Japanese text", () => {
      expectDecoded("44GT44KT44Gr44Gh44Gv", "こんにちは");
    });

    it("should decode to ASCII text", () => {
      expectDecoded("SGVsbG8=", "Hello");
    });

    it("should decode to text with spaces", () => {
      expectDecoded("SGVsbG8gV29ybGQ=", "Hello World");
    });

    it("should handle empty string", () => {
      expectDecoded("", "");
    });

    it("should decode to emoji", () => {
      expectDecoded("8J+YgA==", "😀");
    });

    it("should return error on invalid base64 string", () => {
      const result = decodeBase64("invalid!!!");
      expect(result.success).toBe(false);
    });

    it("should decode base64 string without padding", () => {
      expectDecoded("SGVsbG8", "Hello");
    });

    it("should decode multiline text", () => {
      expectDecoded("TGluZSAxCkxpbmUgMgpMaW5lIDM=", "Line 1\nLine 2\nLine 3");
    });
  });

  describe("Round-trip conversion", () => {
    function expectRoundTrip(original: string) {
      const encoded = encodeBase64(original).encoded;
      const result = decodeBase64(encoded);
      expect(result.success).toBe(true);
      if (!result.success) throw new Error("expected success");
      expect(result.decoded).toBe(original);
    }

    it("should preserve Japanese text through encode/decode", () => {
      expectRoundTrip("こんにちは世界");
    });

    it("should preserve mixed text through encode/decode", () => {
      expectRoundTrip("Hello, 世界! 123");
    });

    it("should preserve emoji through encode/decode", () => {
      expectRoundTrip("🎉🎊🎁");
    });

    it("should preserve special characters through encode/decode", () => {
      expectRoundTrip("!@#$%^&*()_+-=[]{}|;:,.<>?/~`");
    });

    it("should preserve multiline text through encode/decode", () => {
      expectRoundTrip("First Line\nSecond Line\nThird Line");
    });

    it("should preserve mixed multilingual text", () => {
      expectRoundTrip("English 日本語 한국어 中文 Español");
    });
  });

  describe("validateBase64", () => {
    it("should return null for valid base64", () => {
      expect(validateBase64("SGVsbG8=")).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(validateBase64("")).toBeNull();
    });

    it("should return null for whitespace-only", () => {
      expect(validateBase64("   ")).toBeNull();
    });

    it("should detect invalid characters", () => {
      expect(validateBase64("Hello!")).not.toBeNull();
    });
  });
});
