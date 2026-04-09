import { describe, it, expect } from "vite-plus/test";
import {
  encodeBase32,
  encodeBase32Bytes,
  decodeBase32,
  validateBase32,
} from "../../app/utils/base32";

// RFC 4648 付録 C: テストベクター (Standard Base32)
// https://datatracker.ietf.org/doc/html/rfc4648#section-10
const RFC_VECTORS: [string, string][] = [
  ["", ""],
  ["f", "MY======"],
  ["fo", "MZXQ===="],
  ["foo", "MZXW6==="],
  ["foob", "MZXW6YQ="],
  ["fooba", "MZXW6YTB"],
  ["foobar", "MZXW6YTBOI======"],
];

describe("encodeBase32", () => {
  describe("RFC 4648 テストベクター（Standard、パディングあり）", () => {
    for (const [input, expected] of RFC_VECTORS) {
      it(`"${input}" → "${expected}"`, () => {
        const result = encodeBase32(input, "standard", true);
        expect(result.encoded).toBe(expected);
      });
    }
  });

  describe("パディングなし", () => {
    it('"f" → "MY"（パディングなし）', () => {
      const result = encodeBase32("f", "standard", false);
      expect(result.encoded).toBe("MY");
    });

    it('"foo" → "MZXW6"（パディングなし）', () => {
      const result = encodeBase32("foo", "standard", false);
      expect(result.encoded).toBe("MZXW6");
    });
  });

  describe("Base32hex バリアント", () => {
    it('"foo" を Base32hex にエンコード', () => {
      const result = encodeBase32("foo", "hex", true);
      // RFC 4648 BASE32HEX("foo") = "CPNMU==="
      expect(result.encoded).toBe("CPNMU===");
    });
  });

  describe("戻り値", () => {
    it("inputBytes・outputLength を正確に返す", () => {
      const result = encodeBase32("foobar", "standard", true);
      expect(result.inputBytes).toBe(6);
      expect(result.outputLength).toBe(16); // 'MZXW6YTBOI======'.length
    });

    it("空文字の inputBytes は 0", () => {
      const result = encodeBase32("", "standard", true);
      expect(result.inputBytes).toBe(0);
      expect(result.outputLength).toBe(0);
    });
  });

  describe("マルチバイト文字", () => {
    it("日本語テキストをエンコードできる", () => {
      const result = encodeBase32("あ", "standard", true);
      // UTF-8: 0xE3 0x81 0x82 → 3バイト
      expect(result.inputBytes).toBe(3);
      expect(result.encoded.length).toBeGreaterThan(0);
      expect(result.encoded).not.toBe("");
    });
  });
});

describe("decodeBase32", () => {
  describe("RFC 4648 テストベクター", () => {
    for (const [expected, encoded] of RFC_VECTORS) {
      it(`"${encoded}" → "${expected}"`, () => {
        const result = decodeBase32(encoded, "standard");
        expect(result.success).toBe(true);
        expect(result.decoded).toBe(expected);
      });
    }
  });

  describe("パディングなし入力", () => {
    it('"MY" → "f"（パディングなし）', () => {
      const result = decodeBase32("MY", "standard");
      expect(result.success).toBe(true);
      expect(result.decoded).toBe("f");
    });

    it('"MZXW6" → "foo"（パディングなし）', () => {
      const result = decodeBase32("MZXW6", "standard");
      expect(result.success).toBe(true);
      expect(result.decoded).toBe("foo");
    });
  });

  describe("大文字小文字の正規化", () => {
    it("小文字入力も受け付ける", () => {
      const result = decodeBase32("mzxw6ytb", "standard");
      expect(result.success).toBe(true);
      expect(result.decoded).toBe("fooba");
    });

    it("混在した大文字小文字も受け付ける", () => {
      const result = decodeBase32("MzXw6", "standard");
      expect(result.success).toBe(true);
      expect(result.decoded).toBe("foo");
    });
  });

  describe("空白の除去", () => {
    it("空白を含む文字列を正常にデコード", () => {
      // 'MZXW6YTB' は "fooba" のエンコード（空白を挿入してもデコードできる）
      const result = decodeBase32("MZXW 6YTB", "standard");
      expect(result.success).toBe(true);
      expect(result.decoded).toBe("fooba");
    });
  });

  describe("無効な入力", () => {
    it("無効な文字はエラーを返す（Standard）", () => {
      const result = decodeBase32("MY1=====", "standard");
      expect(result.success).toBe(false);
      expect(result.error).toContain("無効な文字");
    });

    it("無効な文字はエラーを返す（Base32hex）", () => {
      // HEX_ALPHABET は 0–9, A–V。W は範囲外で無効。
      const result = decodeBase32("MW====", "hex");
      expect(result.success).toBe(false);
      expect(result.error).toContain("無効な文字");
    });
  });

  describe("マルチバイト文字のラウンドトリップ", () => {
    it("日本語のエンコード→デコードが正常に動作", () => {
      const original = "こんにちは";
      const encoded = encodeBase32(original, "standard", true).encoded;
      const decoded = decodeBase32(encoded, "standard");
      expect(decoded.success).toBe(true);
      expect(decoded.decoded).toBe(original);
    });
  });

  describe("ラウンドトリップ", () => {
    const testCases = ["Hello, World!", "abc", "12345", "テスト"];

    for (const text of testCases) {
      it(`"${text}" のラウンドトリップ（パディングあり）`, () => {
        const encoded = encodeBase32(text, "standard", true).encoded;
        const decoded = decodeBase32(encoded, "standard");
        expect(decoded.success).toBe(true);
        expect(decoded.decoded).toBe(text);
      });

      it(`"${text}" のラウンドトリップ（パディングなし）`, () => {
        const encoded = encodeBase32(text, "standard", false).encoded;
        const decoded = decodeBase32(encoded, "standard");
        expect(decoded.success).toBe(true);
        expect(decoded.decoded).toBe(text);
      });
    }
  });
});

describe("encodeBase32Bytes", () => {
  it("バイト列から直接エンコードできる", () => {
    const bytes = new Uint8Array([0x66, 0x6f, 0x6f]); // "foo"
    const result = encodeBase32Bytes(bytes, "standard", true);
    expect(result.encoded).toBe("MZXW6===");
    expect(result.inputBytes).toBe(3);
  });

  it("空のバイト列を処理できる", () => {
    const result = encodeBase32Bytes(new Uint8Array(0), "standard", true);
    expect(result.encoded).toBe("");
    expect(result.inputBytes).toBe(0);
  });
});

describe("validateBase32", () => {
  it("有効な Standard Base32 は null を返す", () => {
    expect(validateBase32("MZXW6===")).toBeNull();
    expect(validateBase32("MZXW6YTB")).toBeNull();
    expect(validateBase32("")).toBeNull();
  });

  it("無効な文字はエラーを返す", () => {
    expect(validateBase32("ABC1=")).not.toBeNull();
    expect(validateBase32("ABC1=")).toContain("無効な文字");
  });

  it("不正な文字数はエラーを返す", () => {
    // 1 mod 8 = 1 → 無効
    expect(validateBase32("M")).not.toBeNull();
    // 3 mod 8 = 3 → 無効
    expect(validateBase32("MZX")).not.toBeNull();
    // 6 mod 8 = 6 → 無効
    expect(validateBase32("MZXW6Y")).not.toBeNull();
  });

  it("有効な長さ（mod 8 が 0, 2, 4, 5, 7）は null を返す", () => {
    expect(validateBase32("MY")).toBeNull(); // 2 mod 8 = 2
    expect(validateBase32("MZXQ")).toBeNull(); // 4 mod 8 = 4
    expect(validateBase32("MZXW6")).toBeNull(); // 5 mod 8 = 5
    expect(validateBase32("MZXW6YT")).toBeNull(); // 7 mod 8 = 7
  });

  it("Base32hex バリアントで無効な文字を検出", () => {
    // Standard の 'Z' は Base32hex では無効（0–9, A–V まで）
    // 実はA-V まで → W, X, Y, Z が無効
    expect(validateBase32("Z", "hex")).not.toBeNull();
    expect(validateBase32("W", "hex")).not.toBeNull();
  });
});
