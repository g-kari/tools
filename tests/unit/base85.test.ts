import { describe, it, expect } from "vite-plus/test";
import {
  encodeBase85,
  encodeBase85Bytes,
  decodeBase85,
  validateBase85,
} from "../../app/utils/base85";

// ---------------------------------------------------------------------------
// ASCII85 既知テストベクター
// ---------------------------------------------------------------------------

// ASCII85 の既知テストベクター
// "Man " (スペース込み 4バイト) → "<~9jqo^~>" は有名なサンプル
// "Man" (3バイト) → "<~9jqo~>" (端数処理により 4文字出力)
const ASCII85_VECTORS: [string, string][] = [
  ["Man ", "<~9jqo^~>"],
  ["Man", "<~9jqo~>"],
];

// ---------------------------------------------------------------------------
// encodeBase85 (ASCII85)
// ---------------------------------------------------------------------------

describe("encodeBase85 – ASCII85", () => {
  it("空文字列は <~~> を返す", () => {
    const result = encodeBase85("", "ascii85");
    expect(result.encoded).toBe("<~~>");
    expect(result.inputBytes).toBe(0);
    expect(result.outputLength).toBe(4);
  });

  it("inputBytes・outputLength を正確に返す", () => {
    const result = encodeBase85("abc", "ascii85");
    expect(result.inputBytes).toBe(3);
    expect(result.outputLength).toBe(result.encoded.length);
  });

  it("出力が <~ で始まり ~> で終わる", () => {
    const result = encodeBase85("Hello", "ascii85");
    expect(result.encoded.startsWith("<~")).toBe(true);
    expect(result.encoded.endsWith("~>")).toBe(true);
  });

  it('"Man " (スペース付き4バイト) の既知ベクター', () => {
    expect(encodeBase85("Man ", "ascii85").encoded).toBe("<~9jqo^~>");
  });

  it('"Man" (3バイト端数処理) の既知ベクター', () => {
    expect(encodeBase85("Man", "ascii85").encoded).toBe("<~9jqo~>");
  });

  it('4バイト全て 0x00 は "z" に圧縮される', () => {
    const bytes = new Uint8Array([0, 0, 0, 0, 65]);
    const result = encodeBase85Bytes(bytes, "ascii85");
    expect(result.encoded).toContain("z");
  });

  it("日本語テキストをエンコードできる", () => {
    const result = encodeBase85("あ", "ascii85");
    expect(result.inputBytes).toBe(3); // UTF-8: E3 81 82
    expect(result.encoded.startsWith("<~")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// decodeBase85 (ASCII85)
// ---------------------------------------------------------------------------

describe("decodeBase85 – ASCII85", () => {
  it("空文字列は成功し空を返す", () => {
    const result = decodeBase85("<~~>", "ascii85");
    expect(result.success).toBe(true);
    expect(result.decoded).toBe("");
  });

  it('"<~9jqo^~>" をデコードして "Man " (スペース付き) になる', () => {
    const result = decodeBase85("<~9jqo^~>", "ascii85");
    expect(result.success).toBe(true);
    expect(result.decoded).toBe("Man ");
  });

  it('"<~9jqo~>" をデコードして "Man" になる', () => {
    const result = decodeBase85("<~9jqo~>", "ascii85");
    expect(result.success).toBe(true);
    expect(result.decoded).toBe("Man");
  });

  it("無効な文字はエラーを返す", () => {
    // '~' は ASCII85 アルファベットの範囲外（'!' to 'u'）
    const result = decodeBase85("<~abc~invalid~>", "ascii85");
    expect(result.success).toBe(false);
  });

  it("空白を含む文字列も正常にデコード", () => {
    const encoded = encodeBase85("Hello World", "ascii85").encoded;
    const withSpaces = encoded.replace("~>", " ~>");
    const result = decodeBase85(withSpaces, "ascii85");
    expect(result.success).toBe(true);
    expect(result.decoded).toBe("Hello World");
  });
});

// ---------------------------------------------------------------------------
// ラウンドトリップ (ASCII85)
// ---------------------------------------------------------------------------

describe("ラウンドトリップ – ASCII85", () => {
  const testCases = ["Hello", "Hello, World!", "abc", "12345", "foo bar baz", "Man"];

  for (const text of testCases) {
    it(`"${text}" のラウンドトリップ`, () => {
      const encoded = encodeBase85(text, "ascii85").encoded;
      const decoded = decodeBase85(encoded, "ascii85");
      expect(decoded.success).toBe(true);
      expect(decoded.decoded).toBe(text);
    });
  }

  it("日本語のラウンドトリップ", () => {
    const original = "こんにちは世界";
    const encoded = encodeBase85(original, "ascii85").encoded;
    const decoded = decodeBase85(encoded, "ascii85");
    expect(decoded.success).toBe(true);
    expect(decoded.decoded).toBe(original);
  });

  it("各バイト長のラウンドトリップ（1〜7バイト）", () => {
    for (let len = 1; len <= 7; len++) {
      const bytes = new Uint8Array(len).fill(0x41);
      const encoded = encodeBase85Bytes(bytes, "ascii85").encoded;
      const decoded = decodeBase85(encoded, "ascii85");
      expect(decoded.success).toBe(true);
      expect(decoded.bytes.length).toBe(len);
    }
  });
});

// ---------------------------------------------------------------------------
// encodeBase85 (Z85)
// ---------------------------------------------------------------------------

describe("encodeBase85 – Z85", () => {
  it("空文字列は空文字列を返す", () => {
    const result = encodeBase85("", "z85");
    expect(result.encoded).toBe("");
    expect(result.inputBytes).toBe(0);
  });

  it("4の倍数バイトをエンコードできる", () => {
    const bytes = new Uint8Array([0x86, 0x4f, 0xd2, 0x6f]);
    const result = encodeBase85Bytes(bytes, "z85");
    expect(result.encoded.length).toBe(5);
  });

  it("4の倍数でないバイト数は例外を投げる", () => {
    const bytes = new Uint8Array([1, 2, 3]);
    expect(() => encodeBase85Bytes(bytes, "z85")).toThrow();
  });

  it("出力に <~ ~> ラッパーがない", () => {
    const bytes = new Uint8Array(4).fill(0x41);
    const result = encodeBase85Bytes(bytes, "z85");
    expect(result.encoded.startsWith("<~")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// decodeBase85 (Z85)
// ---------------------------------------------------------------------------

describe("decodeBase85 – Z85", () => {
  it("空文字列は成功し空を返す", () => {
    const result = decodeBase85("", "z85");
    expect(result.success).toBe(true);
    expect(result.decoded).toBe("");
  });

  it("5の倍数でない文字列はエラーを返す", () => {
    const result = decodeBase85("abcd", "z85");
    expect(result.success).toBe(false);
    expect(result.error).toContain("5 の倍数");
  });

  it("無効な文字はエラーを返す", () => {
    const result = decodeBase85("あいうえお", "z85");
    expect(result.success).toBe(false);
    expect(result.error).toContain("無効な文字");
  });
});

// ---------------------------------------------------------------------------
// ラウンドトリップ (Z85)
// ---------------------------------------------------------------------------

describe("ラウンドトリップ – Z85", () => {
  it("4バイト倍数データのラウンドトリップ", () => {
    const bytes = new Uint8Array([0x86, 0x4f, 0xd2, 0x6f, 0x85, 0x09, 0x1b, 0xf4]);
    const encoded = encodeBase85Bytes(bytes, "z85").encoded;
    const decoded = decodeBase85(encoded, "z85");
    expect(decoded.success).toBe(true);
    expect(Array.from(decoded.bytes)).toEqual(Array.from(bytes));
  });

  it("各バイト境界（4, 8, 12, 16バイト）のラウンドトリップ", () => {
    for (const len of [4, 8, 12, 16]) {
      const bytes = new Uint8Array(len).fill(0x42);
      const encoded = encodeBase85Bytes(bytes, "z85").encoded;
      const decoded = decodeBase85(encoded, "z85");
      expect(decoded.success).toBe(true);
      expect(decoded.bytes.length).toBe(len);
    }
  });
});

// ---------------------------------------------------------------------------
// validateBase85
// ---------------------------------------------------------------------------

describe("validateBase85", () => {
  it("ASCII85: 有効な文字列は null を返す", () => {
    expect(validateBase85("<~9jqo^~>", "ascii85")).toBeNull();
    expect(validateBase85("<~~>", "ascii85")).toBeNull();
    expect(validateBase85("", "ascii85")).toBeNull();
  });

  it("ASCII85: 有効な特殊文字 z を許可する", () => {
    expect(validateBase85("<~z~>", "ascii85")).toBeNull();
  });

  it("ASCII85: 無効な文字はエラーを返す", () => {
    expect(validateBase85("<~日本語~>", "ascii85")).not.toBeNull();
  });

  it("Z85: 有効な文字列は null を返す", () => {
    expect(validateBase85("Hello", "z85")).toBeNull();
    expect(validateBase85("", "z85")).toBeNull();
  });

  it("Z85: 5の倍数でない文字列はエラーを返す", () => {
    expect(validateBase85("abcd", "z85")).not.toBeNull();
  });

  it("Z85: 無効な文字はエラーを返す", () => {
    expect(validateBase85("あいうえお", "z85")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// encodeBase85Bytes
// ---------------------------------------------------------------------------

describe("encodeBase85Bytes", () => {
  it("空のバイト列を処理できる", () => {
    const result = encodeBase85Bytes(new Uint8Array(0), "ascii85");
    expect(result.encoded).toBe("<~~>");
    expect(result.inputBytes).toBe(0);
  });

  it("バイト列から直接エンコードできる", () => {
    const bytes = new Uint8Array([0x4d, 0x61, 0x6e, 0x20]); // "Man " (4バイト)
    const result = encodeBase85Bytes(bytes, "ascii85");
    expect(result.encoded).toBe("<~9jqo^~>");
    expect(result.inputBytes).toBe(4);
  });

  it("3バイトの端数処理", () => {
    const bytes = new Uint8Array([0x4d, 0x61, 0x6e]); // "Man" (3バイト)
    const result = encodeBase85Bytes(bytes, "ascii85");
    expect(result.encoded).toBe("<~9jqo~>");
    expect(result.inputBytes).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 既知ベクター
// ---------------------------------------------------------------------------

describe("既知ベクター – ASCII85", () => {
  for (const [text, encoded] of ASCII85_VECTORS) {
    it(`"${text}" のエンコードが "${encoded}" と一致する`, () => {
      expect(encodeBase85(text, "ascii85").encoded).toBe(encoded);
    });

    it(`"${encoded}" のデコードで "${text}" を返す`, () => {
      const result = decodeBase85(encoded, "ascii85");
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(text);
    });
  }
});
