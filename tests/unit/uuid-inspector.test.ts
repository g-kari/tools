import { describe, it, expect } from "vite-plus/test";
import { parseUUID, UUID_NIL, UUID_MAX } from "../../app/utils/uuid-inspector";

describe("parseUUID", () => {
  describe("無効な入力", () => {
    it("空文字列は invalid を返す", () => {
      const r = parseUUID("");
      expect(r.valid).toBe(false);
    });

    it("形式が不正な文字列は invalid を返す", () => {
      const r = parseUUID("not-a-uuid");
      expect(r.valid).toBe(false);
    });

    it("短すぎる文字列は invalid を返す", () => {
      const r = parseUUID("12345678-1234-1234-1234");
      expect(r.valid).toBe(false);
    });
  });

  describe("NIL / Max UUID", () => {
    it("NIL UUID を認識する", () => {
      const r = parseUUID(UUID_NIL);
      expect(r.valid).toBe(true);
      expect(r.isNil).toBe(true);
      expect(r.isMax).toBeFalsy();
    });

    it("Max UUID を認識する", () => {
      const r = parseUUID(UUID_MAX);
      expect(r.valid).toBe(true);
      expect(r.isMax).toBe(true);
      expect(r.isNil).toBeFalsy();
    });
  });

  describe("v4 UUID", () => {
    it("v4 UUID を正しく解析する", () => {
      const r = parseUUID("550e8400-e29b-41d4-a716-446655440000");
      expect(r.valid).toBe(true);
      expect(r.version).toBe(4);
      expect(r.versionLabel).toContain("v4");
    });

    it("大文字 UUID を正規化する", () => {
      const r = parseUUID("550E8400-E29B-41D4-A716-446655440000");
      expect(r.valid).toBe(true);
      expect(r.normalized).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("バリアント RFC 4122 を検出する", () => {
      const r = parseUUID("550e8400-e29b-41d4-a716-446655440000");
      expect(r.variant).toBe("rfc4122");
    });

    it("hexBytes が 16 要素", () => {
      const r = parseUUID("550e8400-e29b-41d4-a716-446655440000");
      expect(r.hexBytes).toHaveLength(16);
    });

    it("components が正しい形式", () => {
      const r = parseUUID("550e8400-e29b-41d4-a716-446655440000");
      expect(r.components?.timeLow).toBe("550e8400");
      expect(r.components?.timeMid).toBe("e29b");
      expect(r.components?.timeHiAndVersion).toBe("41d4");
      expect(r.components?.node).toBe("446655440000");
    });
  });

  describe("v1 UUID", () => {
    it("v1 UUID のバージョンを認識する", () => {
      const r = parseUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
      expect(r.valid).toBe(true);
      expect(r.version).toBe(1);
    });

    it("v1 UUID にタイムスタンプが含まれる", () => {
      const r = parseUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
      expect(r.timestamp).toBeInstanceOf(Date);
    });

    it("v1 UUID に MAC アドレスが含まれる", () => {
      const r = parseUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
      expect(r.macAddress).toMatch(/^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/);
    });

    it("v1 UUID にクロックシーケンスが含まれる", () => {
      const r = parseUUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
      expect(typeof r.clockSequence).toBe("number");
    });
  });

  describe("v7 UUID", () => {
    it("v7 UUID のバージョンを認識する", () => {
      const r = parseUUID("01906028-0000-7000-8000-000000000000");
      expect(r.valid).toBe(true);
      expect(r.version).toBe(7);
    });

    it("v7 UUID に Unix ms が含まれる", () => {
      const r = parseUUID("01906028-0000-7000-8000-000000000000");
      expect(typeof r.unixMs).toBe("bigint");
    });
  });

  describe("ハイフンなし入力", () => {
    it("ハイフンなしの 32 文字を受け入れる", () => {
      const r = parseUUID("550e8400e29b41d4a716446655440000");
      expect(r.valid).toBe(true);
      expect(r.normalized).toBe("550e8400-e29b-41d4-a716-446655440000");
    });
  });
});
