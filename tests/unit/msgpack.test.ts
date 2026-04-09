import { describe, it, expect } from 'vite-plus/test';
import { encodeToMsgpack, decodeFromMsgpack } from '../../app/utils/msgpack';

describe('MessagePack Functions', () => {
  describe('encodeToMsgpack', () => {
    it('should encode a simple object to hex', () => {
      const input = '{"name":"太郎","age":30}';
      const result = encodeToMsgpack(input);
      expect(result.hex).toBeTruthy();
      expect(result.bytes).toBeGreaterThan(0);
      // hex文字列はスペース区切りの2文字16進数
      const parts = result.hex.split(' ');
      expect(parts.every((p) => /^[0-9a-f]{2}$/.test(p))).toBe(true);
    });

    it('should return byte count', () => {
      const input = '{"a":1}';
      const result = encodeToMsgpack(input);
      expect(result.bytes).toBe(result.hex.split(' ').length);
    });

    it('should encode an array', () => {
      const input = '[1,2,3]';
      const result = encodeToMsgpack(input);
      expect(result.hex).toBeTruthy();
      expect(result.bytes).toBeGreaterThan(0);
    });

    it('should encode nested object', () => {
      const input = '{"user":{"name":"Alice","active":true}}';
      const result = encodeToMsgpack(input);
      expect(result.hex).toBeTruthy();
      expect(result.bytes).toBeGreaterThan(0);
    });

    it('should encode null values', () => {
      const input = '{"value":null}';
      const result = encodeToMsgpack(input);
      expect(result.hex).toBeTruthy();
    });

    it('should encode boolean values', () => {
      const input = '{"active":true,"deleted":false}';
      const result = encodeToMsgpack(input);
      expect(result.hex).toBeTruthy();
    });

    it('should throw error for invalid JSON', () => {
      expect(() => encodeToMsgpack('not json')).toThrow();
    });

    it('should throw error for unclosed brace', () => {
      expect(() => encodeToMsgpack('{"a":1')).toThrow();
    });
  });

  describe('decodeFromMsgpack', () => {
    it('should decode hex back to JSON', () => {
      const original = { name: '太郎', age: 30 };
      const encoded = encodeToMsgpack(JSON.stringify(original));
      const decoded = decodeFromMsgpack(encoded.hex);
      expect(JSON.parse(decoded)).toEqual(original);
    });

    it('should decode array', () => {
      const original = [1, 2, 3];
      const encoded = encodeToMsgpack(JSON.stringify(original));
      const decoded = decodeFromMsgpack(encoded.hex);
      expect(JSON.parse(decoded)).toEqual(original);
    });

    it('should produce formatted JSON output', () => {
      const encoded = encodeToMsgpack('{"a":1}');
      const decoded = decodeFromMsgpack(encoded.hex);
      // 整形されたJSONを確認（インデントあり）
      expect(decoded).toContain('\n');
    });

    it('should throw error for empty input', () => {
      expect(() => decodeFromMsgpack('')).toThrow('入力が空です');
    });

    it('should throw error for invalid hex', () => {
      expect(() => decodeFromMsgpack('zz xx')).toThrow();
    });

    it('should throw error for hex with wrong length', () => {
      expect(() => decodeFromMsgpack('a b')).toThrow();
    });

    it('should handle whitespace-separated hex', () => {
      const original = { key: 'value' };
      const encoded = encodeToMsgpack(JSON.stringify(original));
      // 改行区切りでも動作するか確認
      const hexWithNewlines = encoded.hex.replace(/ /g, '\n');
      const decoded = decodeFromMsgpack(hexWithNewlines);
      expect(JSON.parse(decoded)).toEqual(original);
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve data through encode/decode cycle', () => {
      const original = { name: '太郎', items: [1, 2, 3], active: true };
      const encoded = encodeToMsgpack(JSON.stringify(original));
      const decoded = decodeFromMsgpack(encoded.hex);
      expect(JSON.parse(decoded)).toEqual(original);
    });

    it('should preserve nested structures', () => {
      const original = { a: { b: { c: 1 } } };
      const encoded = encodeToMsgpack(JSON.stringify(original));
      const decoded = decodeFromMsgpack(encoded.hex);
      expect(JSON.parse(decoded)).toEqual(original);
    });

    it('should preserve arrays of objects', () => {
      const original = [{ id: 1 }, { id: 2 }];
      const encoded = encodeToMsgpack(JSON.stringify(original));
      const decoded = decodeFromMsgpack(encoded.hex);
      expect(JSON.parse(decoded)).toEqual(original);
    });

    it('should be smaller or equal to JSON for typical data', () => {
      const original = { name: 'Alice', age: 30, city: 'Tokyo' };
      const jsonBytes = new TextEncoder().encode(JSON.stringify(original)).length;
      const msgpackBytes = encodeToMsgpack(JSON.stringify(original)).bytes;
      // MessagePackはJSONより小さいかほぼ同じであることを確認
      expect(msgpackBytes).toBeLessThanOrEqual(jsonBytes);
    });
  });
});
