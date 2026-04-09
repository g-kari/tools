import { describe, it, expect } from "vite-plus/test";
import {
  generateULID,
  isValidULID,
  parseULID,
  ULID_LENGTH,
} from "../../app/utils/ulid";

describe("generateULID", () => {
  it("26 文字の文字列を生成する", () => {
    const ulid = generateULID();
    expect(ulid.length).toBe(ULID_LENGTH);
  });

  it("大文字の Crockford Base32 文字のみを含む", () => {
    const ulid = generateULID();
    expect(ulid).toMatch(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/);
  });

  it("連続生成で異なる値を返す", () => {
    const results = new Set(Array.from({ length: 10 }, () => generateULID()));
    expect(results.size).toBe(10);
  });

  it("生成した ULID は isValidULID で有効と判定される", () => {
    for (let i = 0; i < 5; i++) {
      expect(isValidULID(generateULID())).toBe(true);
    }
  });
});

describe("isValidULID", () => {
  it("有効な ULID を true と判定する", () => {
    expect(isValidULID("01ARZ3NDEKTSV4RRFFQ69G5FAV")).toBe(true);
    expect(isValidULID("7ZZZZZZZZZZZZZZZZZZZZZZZZZ")).toBe(true);
  });

  it("小文字の ULID も有効と判定する", () => {
    expect(isValidULID("01arz3ndektsv4rrffq69g5fav")).toBe(true);
  });

  it("26 文字未満は無効", () => {
    expect(isValidULID("01ARZ3NDEKTSV4RRFFQ69G5FA")).toBe(false);
  });

  it("26 文字超は無効", () => {
    expect(isValidULID("01ARZ3NDEKTSV4RRFFQ69G5FAVX")).toBe(false);
  });

  it("I/L/O/U を含む場合は無効", () => {
    expect(isValidULID("I1ARZ3NDEKTSV4RRFFQ69G5FAV")).toBe(false);
    expect(isValidULID("01ARZ3NDEKTSV4RRFFQ69G5FAL")).toBe(false);
    expect(isValidULID("O1ARZ3NDEKTSV4RRFFQ69G5FAV")).toBe(false);
    expect(isValidULID("01ARZ3NDEKTSV4RRFFQ69G5FUV")).toBe(false);
  });

  it("空文字は無効", () => {
    expect(isValidULID("")).toBe(false);
  });

  it("タイムスタンプ上限超過は無効", () => {
    // 先頭が 8 以上で 10 文字: 1n << 50n = 48 ビット上限を超える
    expect(isValidULID("80000000000000000000000000")).toBe(false);
  });
});

describe("parseULID", () => {
  const KNOWN_ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

  it("有効な ULID を正しくパースする", () => {
    const result = parseULID(KNOWN_ULID);
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe(KNOWN_ULID);
    expect(result.timestampPart).toBe("01ARZ3NDEK");
    expect(result.randomnessPart).toBe("TSV4RRFFQ69G5FAV");
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.unixMs).toBeGreaterThan(0);
  });

  it("小文字入力を正規化する", () => {
    const result = parseULID(KNOWN_ULID.toLowerCase());
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe(KNOWN_ULID);
  });

  it("無効な文字を含む場合はエラーを返す", () => {
    const result = parseULID("I1ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("I");
  });

  it("長さが不正な場合はエラーを返す", () => {
    const result = parseULID("SHORT");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("26 文字");
  });

  it("タイムスタンプが正しく復元される", () => {
    const before = Date.now();
    const ulid = generateULID();
    const after = Date.now();
    const result = parseULID(ulid);
    expect(result.valid).toBe(true);
    expect(result.unixMs).toBeGreaterThanOrEqual(before);
    expect(result.unixMs).toBeLessThanOrEqual(after);
  });

  it("空白を含む入力は trim して処理する", () => {
    const result = parseULID(`  ${KNOWN_ULID}  `);
    expect(result.valid).toBe(true);
  });

  it("raw フィールドに元の文字列を保持する", () => {
    const input = "  " + KNOWN_ULID.toLowerCase() + "  ";
    const result = parseULID(input);
    expect(result.raw).toBe(input);
  });
});

describe("ULID_LENGTH", () => {
  it("26 である", () => {
    expect(ULID_LENGTH).toBe(26);
  });
});
