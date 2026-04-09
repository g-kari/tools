import { describe, expect, it } from "vite-plus/test";
import {
  safeAdd,
  bitRotateLeft,
  md5Ff,
  md5Gg,
  md5Hh,
  md5Ii,
  computeMd5Bytes,
  bytesToHex,
  bytesToBase64,
  computeWebCryptoHash,
  textToBytes,
  computeAllHashes,
  formatFileSize,
  HASH_ALGORITHMS,
} from "../../app/routes/hash";

// ===== safeAdd テスト =====

describe("safeAdd", () => {
  it("通常の加算が正しい", () => {
    expect(safeAdd(1, 2)).toBe(3);
  });

  it("ゼロとの加算が正しい", () => {
    expect(safeAdd(0, 0)).toBe(0);
    expect(safeAdd(42, 0)).toBe(42);
  });

  it("負の数の加算が正しい", () => {
    const result = safeAdd(-1, 1);
    expect(result).toBe(0);
  });

  it("大きな数の加算が数値を返す", () => {
    const result = safeAdd(0x7fffffff, 1);
    expect(typeof result).toBe("number");
  });
});

// ===== bitRotateLeft テスト =====

describe("bitRotateLeft", () => {
  it("0回転は変化なし", () => {
    expect(bitRotateLeft(0x12345678, 0)).toBe(0x12345678);
  });

  it("32回転は変化なし", () => {
    expect(bitRotateLeft(0x12345678, 32)).toBe(0x12345678);
  });

  it("数値を返す", () => {
    const result = bitRotateLeft(0x80000001, 1);
    expect(typeof result).toBe("number");
  });

  it("16ビット左回転が整合している", () => {
    const result = bitRotateLeft(0x00001234, 16);
    expect(result).toBe(0x12340000);
  });
});

// ===== MD5 補助関数テスト =====

describe("MD5 ラウンド関数", () => {
  it("md5Ff が数値を返す", () => {
    const result = md5Ff(1, 2, 3, 4, 5, 7, -680876936);
    expect(typeof result).toBe("number");
  });

  it("md5Gg が数値を返す", () => {
    const result = md5Gg(1, 2, 3, 4, 5, 5, -165796510);
    expect(typeof result).toBe("number");
  });

  it("md5Hh が数値を返す", () => {
    const result = md5Hh(1, 2, 3, 4, 5, 4, -378558);
    expect(typeof result).toBe("number");
  });

  it("md5Ii が数値を返す", () => {
    const result = md5Ii(1, 2, 3, 4, 5, 6, -198630844);
    expect(typeof result).toBe("number");
  });
});

// ===== computeMd5Bytes テスト =====

describe("computeMd5Bytes", () => {
  it("空文字列のMD5が正しい", () => {
    // MD5("") = d41d8cd98f00b204e9800998ecf8427e
    const data = new Uint8Array(0);
    const result = computeMd5Bytes(data);
    expect(bytesToHex(result)).toBe("d41d8cd98f00b204e9800998ecf8427e");
  });

  it('"abc" のMD5が正しい', () => {
    // MD5("abc") = 900150983cd24fb0d6963f7d28e17f72
    const data = textToBytes("abc");
    const result = computeMd5Bytes(data);
    expect(bytesToHex(result)).toBe("900150983cd24fb0d6963f7d28e17f72");
  });

  it('"hello world" のMD5が正しい', () => {
    // MD5("hello world") = 5eb63bbbe01eeed093cb22bb8f5acdc3
    const data = textToBytes("hello world");
    const result = computeMd5Bytes(data);
    expect(bytesToHex(result)).toBe("5eb63bbbe01eeed093cb22bb8f5acdc3");
  });

  it("結果は常に16バイト", () => {
    const data = textToBytes("test");
    const result = computeMd5Bytes(data);
    expect(result.length).toBe(16);
  });

  it("長い文字列でも決定論的に動作する", () => {
    const longText = "a".repeat(1000);
    const data = textToBytes(longText);
    const result = computeMd5Bytes(data);
    const result2 = computeMd5Bytes(data);
    expect(bytesToHex(result)).toBe(bytesToHex(result2));
  });

  it("日本語文字列のMD5が計算できる", () => {
    const data = textToBytes("こんにちは");
    const result = computeMd5Bytes(data);
    expect(result.length).toBe(16);
    expect(bytesToHex(result)).toMatch(/^[0-9a-f]{32}$/);
  });

  it('有名なテストベクタ: "The quick brown fox..."', () => {
    const data = textToBytes("The quick brown fox jumps over the lazy dog");
    const result = computeMd5Bytes(data);
    expect(bytesToHex(result)).toBe("9e107d9d372bb6826bd81d3542a419d6");
  });
});

// ===== bytesToHex テスト =====

describe("bytesToHex", () => {
  it("空のバイト配列は空文字列", () => {
    expect(bytesToHex(new Uint8Array(0))).toBe("");
  });

  it('ゼロバイトは "00"', () => {
    expect(bytesToHex(new Uint8Array([0]))).toBe("00");
  });

  it('255は "ff"', () => {
    expect(bytesToHex(new Uint8Array([255]))).toBe("ff");
  });

  it('15は "0f" （ゼロ埋め）', () => {
    expect(bytesToHex(new Uint8Array([15]))).toBe("0f");
  });

  it("複数バイトが正しく変換される", () => {
    expect(bytesToHex(new Uint8Array([0xd4, 0x1d, 0x8c, 0xd9]))).toBe("d41d8cd9");
  });

  it("結果は小文字16進数のみ", () => {
    const result = bytesToHex(new Uint8Array([0xab, 0xcd, 0xef]));
    expect(result).toBe("abcdef");
  });
});

// ===== bytesToBase64 テスト =====

describe("bytesToBase64", () => {
  it("空のバイト配列は空文字列", () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe("");
  });

  it('"Hello" のBase64変換が正しい', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    expect(bytesToBase64(bytes)).toBe("SGVsbG8=");
  });

  it("結果が有効なBase64文字列である", () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 4, 5]);
    const result = bytesToBase64(bytes);
    expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

// ===== computeWebCryptoHash テスト =====

describe("computeWebCryptoHash", () => {
  it("SHA-256 空文字列のハッシュが正しい", async () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb924...
    const data = new Uint8Array(0);
    const result = await computeWebCryptoHash("SHA-256", data);
    expect(bytesToHex(result)).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("SHA-1 の結果は20バイト", async () => {
    const data = textToBytes("test");
    const result = await computeWebCryptoHash("SHA-1", data);
    expect(result.length).toBe(20);
  });

  it("SHA-256 の結果は32バイト", async () => {
    const data = textToBytes("test");
    const result = await computeWebCryptoHash("SHA-256", data);
    expect(result.length).toBe(32);
  });

  it("SHA-384 の結果は48バイト", async () => {
    const data = textToBytes("test");
    const result = await computeWebCryptoHash("SHA-384", data);
    expect(result.length).toBe(48);
  });

  it("SHA-512 の結果は64バイト", async () => {
    const data = textToBytes("test");
    const result = await computeWebCryptoHash("SHA-512", data);
    expect(result.length).toBe(64);
  });

  it('"The quick brown fox..." の SHA-1 が正しい', async () => {
    const data = textToBytes("The quick brown fox jumps over the lazy dog");
    const result = await computeWebCryptoHash("SHA-1", data);
    expect(bytesToHex(result)).toBe("2fd4e1c67a2d28fced849ee1bb76e7391b93eb12");
  });

  it('"The quick brown fox..." の SHA-256 が正しい', async () => {
    const data = textToBytes("The quick brown fox jumps over the lazy dog");
    const result = await computeWebCryptoHash("SHA-256", data);
    expect(bytesToHex(result)).toBe(
      "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
    );
  });
});

// ===== textToBytes テスト =====

describe("textToBytes", () => {
  it("ASCII文字列が正しく変換される", () => {
    const bytes = textToBytes("abc");
    expect(bytes[0]).toBe(97);
    expect(bytes[1]).toBe(98);
    expect(bytes[2]).toBe(99);
    expect(bytes.length).toBe(3);
  });

  it("空文字列は空のバイト配列", () => {
    expect(textToBytes("").length).toBe(0);
  });

  it("日本語がUTF-8でエンコードされる", () => {
    const bytes = textToBytes("あ");
    // 'あ' はUTF-8で3バイト: 0xE3, 0x81, 0x82
    expect(bytes.length).toBe(3);
    expect(bytes[0]).toBe(0xe3);
    expect(bytes[1]).toBe(0x81);
    expect(bytes[2]).toBe(0x82);
  });

  it("Uint8Arrayを返す", () => {
    const result = textToBytes("test");
    expect(result).toBeInstanceOf(Uint8Array);
  });
});

// ===== computeAllHashes テスト =====

describe("computeAllHashes", () => {
  it("5種類のアルゴリズム結果を返す", async () => {
    const data = textToBytes("test");
    const results = await computeAllHashes(data);
    expect(results).toHaveLength(5);
  });

  it("各結果に key, hexValue, base64Value が含まれる", async () => {
    const data = textToBytes("test");
    const results = await computeAllHashes(data);
    for (const result of results) {
      expect(result).toHaveProperty("key");
      expect(result).toHaveProperty("hexValue");
      expect(result).toHaveProperty("base64Value");
    }
  });

  it("MD5の結果が含まれ、hexValueは32文字", async () => {
    const data = textToBytes("test");
    const results = await computeAllHashes(data);
    const md5 = results.find((r) => r.key === "md5");
    expect(md5).toBeDefined();
    expect(md5!.hexValue).toHaveLength(32);
  });

  it("SHA-256の結果が含まれ、hexValueは64文字", async () => {
    const data = textToBytes("test");
    const results = await computeAllHashes(data);
    const sha256 = results.find((r) => r.key === "sha256");
    expect(sha256).toBeDefined();
    expect(sha256!.hexValue).toHaveLength(64);
  });

  it("SHA-1の結果が含まれ、hexValueは40文字", async () => {
    const data = textToBytes("test");
    const results = await computeAllHashes(data);
    const sha1 = results.find((r) => r.key === "sha1");
    expect(sha1).toBeDefined();
    expect(sha1!.hexValue).toHaveLength(40);
  });

  it("SHA-384の結果が含まれ、hexValueは96文字", async () => {
    const data = textToBytes("test");
    const results = await computeAllHashes(data);
    const sha384 = results.find((r) => r.key === "sha384");
    expect(sha384).toBeDefined();
    expect(sha384!.hexValue).toHaveLength(96);
  });

  it("SHA-512の結果が含まれ、hexValueは128文字", async () => {
    const data = textToBytes("test");
    const results = await computeAllHashes(data);
    const sha512 = results.find((r) => r.key === "sha512");
    expect(sha512).toBeDefined();
    expect(sha512!.hexValue).toHaveLength(128);
  });

  it("hexValue は小文字16進数のみ", async () => {
    const data = textToBytes("hello");
    const results = await computeAllHashes(data);
    for (const result of results) {
      expect(result.hexValue).toMatch(/^[0-9a-f]+$/);
    }
  });

  it("base64Value は有効なBase64", async () => {
    const data = textToBytes("hello");
    const results = await computeAllHashes(data);
    for (const result of results) {
      expect(result.base64Value).toMatch(/^[A-Za-z0-9+/]+=*$/);
    }
  });

  it("同じ入力で同じ結果が返る（決定論的）", async () => {
    const data = textToBytes("deterministic test");
    const results1 = await computeAllHashes(data);
    const results2 = await computeAllHashes(data);
    for (let i = 0; i < results1.length; i++) {
      expect(results1[i].hexValue).toBe(results2[i].hexValue);
    }
  });

  it("異なる入力で異なる結果が返る", async () => {
    const data1 = textToBytes("input1");
    const data2 = textToBytes("input2");
    const results1 = await computeAllHashes(data1);
    const results2 = await computeAllHashes(data2);
    const sha256_1 = results1.find((r) => r.key === "sha256");
    const sha256_2 = results2.find((r) => r.key === "sha256");
    expect(sha256_1!.hexValue).not.toBe(sha256_2!.hexValue);
  });

  it("空のバイト配列でも正しく計算できる", async () => {
    const data = new Uint8Array(0);
    const results = await computeAllHashes(data);
    expect(results).toHaveLength(5);
    const md5 = results.find((r) => r.key === "md5");
    expect(md5!.hexValue).toBe("d41d8cd98f00b204e9800998ecf8427e");
  });
});

// ===== formatFileSize テスト =====

describe("formatFileSize", () => {
  it('0バイトは "0 B"', () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it('512バイトは "512 B"', () => {
    expect(formatFileSize(512)).toBe("512 B");
  });

  it('1023バイトは "1023 B"', () => {
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it('1024バイトは "1.0 KB"', () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
  });

  it('2048バイトは "2.0 KB"', () => {
    expect(formatFileSize(2048)).toBe("2.0 KB");
  });

  it('1536バイトは "1.5 KB"', () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it('1MB は "1.0 MB"', () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
  });
});

// ===== HASH_ALGORITHMS テスト =====

describe("HASH_ALGORITHMS", () => {
  it("5種類のアルゴリズムが定義されている", () => {
    expect(HASH_ALGORITHMS).toHaveLength(5);
  });

  it("MD5が非推奨フラグを持つ", () => {
    const md5 = HASH_ALGORITHMS.find((a) => a.key === "md5");
    expect(md5).toBeDefined();
    expect(md5!.deprecated).toBe(true);
  });

  it("SHA-1が非推奨フラグを持つ", () => {
    const sha1 = HASH_ALGORITHMS.find((a) => a.key === "sha1");
    expect(sha1).toBeDefined();
    expect(sha1!.deprecated).toBe(true);
  });

  it("SHA-256は非推奨フラグを持たない", () => {
    const sha256 = HASH_ALGORITHMS.find((a) => a.key === "sha256");
    expect(sha256).toBeDefined();
    expect(sha256!.deprecated).toBeUndefined();
  });

  it("SHA-384は非推奨フラグを持たない", () => {
    const sha384 = HASH_ALGORITHMS.find((a) => a.key === "sha384");
    expect(sha384).toBeDefined();
    expect(sha384!.deprecated).toBeUndefined();
  });

  it("SHA-512は非推奨フラグを持たない", () => {
    const sha512 = HASH_ALGORITHMS.find((a) => a.key === "sha512");
    expect(sha512).toBeDefined();
    expect(sha512!.deprecated).toBeUndefined();
  });

  it("各アルゴリズムにkey, labelが含まれる", () => {
    for (const algo of HASH_ALGORITHMS) {
      expect(typeof algo.key).toBe("string");
      expect(typeof algo.label).toBe("string");
    }
  });
});
