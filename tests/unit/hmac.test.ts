import { describe, it, expect } from "vitest";
import {
  textToBytes,
  bytesToHex,
  bytesToBase64,
  computeHmac,
  computeAllHmacs,
  HMAC_ALGORITHMS,
} from "../../app/utils/hmac";

describe("textToBytes", () => {
  it("ASCII テキストをバイト列に変換する", () => {
    const result = textToBytes("hello");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(5);
    expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
  });

  it("空文字列を空の Uint8Array に変換する", () => {
    const result = textToBytes("");
    expect(result.length).toBe(0);
  });

  it("マルチバイト文字（日本語）を正しく変換する", () => {
    const result = textToBytes("あ");
    // UTF-8 で「あ」は E3 81 82 の 3 バイト
    expect(result.length).toBe(3);
  });
});

describe("bytesToHex", () => {
  it("バイト列を小文字 16 進数文字列に変換する", () => {
    const bytes = new Uint8Array([0, 1, 15, 16, 255]);
    expect(bytesToHex(bytes)).toBe("00010f10ff");
  });

  it("空のバイト列を空文字列に変換する", () => {
    expect(bytesToHex(new Uint8Array([]))).toBe("");
  });
});

describe("bytesToBase64", () => {
  it("バイト列を Base64 文字列に変換する", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(bytesToBase64(bytes)).toBe("SGVsbG8=");
  });

  it("空のバイト列を空文字列に変換する", () => {
    expect(bytesToBase64(new Uint8Array([]))).toBe("");
  });
});

describe("computeHmac", () => {
  it("HMAC-SHA-256 を計算する（RFC 4231 テストベクター）", async () => {
    // RFC 4231 Test Case 1: key=0x0b*20, data="Hi There"
    const key = new Uint8Array(20).fill(0x0b);
    const message = textToBytes("Hi There");
    const result = await computeHmac("SHA-256", key, message);
    expect(bytesToHex(result)).toBe(
      "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7"
    );
  });

  it("空のメッセージで HMAC を計算できる", async () => {
    const key = textToBytes("key");
    const message = textToBytes("");
    const result = await computeHmac("SHA-256", key, message);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32); // SHA-256 は 32 バイト
  });

  it("HMAC-SHA-512 で 64 バイトの結果を返す", async () => {
    const key = textToBytes("key");
    const message = textToBytes("message");
    const result = await computeHmac("SHA-512", key, message);
    expect(result.length).toBe(64);
  });
});

describe("computeAllHmacs", () => {
  it("全アルゴリズムの結果を返す", async () => {
    const message = textToBytes("hello");
    const key = textToBytes("world");
    const results = await computeAllHmacs(message, key);
    expect(results.length).toBe(HMAC_ALGORITHMS.length);
  });

  it("HEX フォーマットで 16 進数文字列を返す", async () => {
    const message = textToBytes("test");
    const key = textToBytes("key");
    const results = await computeAllHmacs(message, key, "hex");
    for (const result of results) {
      expect(result.value).toMatch(/^[0-9a-f]+$/);
    }
  });

  it("Base64 フォーマットで Base64 文字列を返す", async () => {
    const message = textToBytes("test");
    const key = textToBytes("key");
    const results = await computeAllHmacs(message, key, "base64");
    for (const result of results) {
      expect(result.value).toMatch(/^[A-Za-z0-9+/]+=*$/);
    }
  });

  it("HMAC-SHA-1 が deprecated フラグを持つ", async () => {
    const message = textToBytes("test");
    const key = textToBytes("key");
    const results = await computeAllHmacs(message, key);
    const sha1Result = results.find((r) => r.algorithmName === "HMAC-SHA-1");
    expect(sha1Result?.deprecated).toBe(true);
  });

  it("HMAC-SHA-256 が deprecated フラグを持たない", async () => {
    const message = textToBytes("test");
    const key = textToBytes("key");
    const results = await computeAllHmacs(message, key);
    const sha256Result = results.find(
      (r) => r.algorithmName === "HMAC-SHA-256"
    );
    expect(sha256Result?.deprecated).toBeUndefined();
  });

  it("各アルゴリズムの bits が正しい", async () => {
    const message = textToBytes("test");
    const key = textToBytes("key");
    const results = await computeAllHmacs(message, key);
    const bitsMap: Record<string, number> = {
      "HMAC-SHA-1": 160,
      "HMAC-SHA-256": 256,
      "HMAC-SHA-384": 384,
      "HMAC-SHA-512": 512,
    };
    for (const result of results) {
      expect(result.bits).toBe(bitsMap[result.algorithmName]);
    }
  });
});

describe("HMAC_ALGORITHMS", () => {
  it("4 つのアルゴリズムを持つ", () => {
    expect(HMAC_ALGORITHMS.length).toBe(4);
  });

  it("SHA-1 / SHA-256 / SHA-384 / SHA-512 を含む", () => {
    const names = HMAC_ALGORITHMS.map((a) => a.algorithm);
    expect(names).toContain("SHA-1");
    expect(names).toContain("SHA-256");
    expect(names).toContain("SHA-384");
    expect(names).toContain("SHA-512");
  });
});
