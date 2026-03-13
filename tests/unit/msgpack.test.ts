import { describe, it, expect } from 'vitest';
import {
  msgpackEncode,
  msgpackDecode,
  uint8ArrayToHex,
  hexToUint8Array,
} from '../../app/lib/msgpack';

describe('MessagePack変換', () => {
  describe('uint8ArrayToHex', () => {
    it('空配列を空文字列に変換する', () => {
      const result = uint8ArrayToHex(new Uint8Array([]));
      expect(result).toBe('');
    });

    it('[0xc0] を "c0" に変換する', () => {
      const result = uint8ArrayToHex(new Uint8Array([0xc0]));
      expect(result).toBe('c0');
    });

    it('[0xff, 0x00] を "ff 00" に変換する', () => {
      const result = uint8ArrayToHex(new Uint8Array([0xff, 0x00]));
      // 実装はスペース区切りで出力する
      expect(result).toBe('ff 00');
    });

    it('[0x8b, 0x69, 0x14] を "8b 69 14" に変換する', () => {
      const result = uint8ArrayToHex(new Uint8Array([0x8b, 0x69, 0x14]));
      expect(result).toBe('8b 69 14');
    });

    it('全バイト値を正しく変換する', () => {
      const result = uint8ArrayToHex(new Uint8Array([0x00, 0x0f, 0x10]));
      expect(result).toBe('00 0f 10');
    });
  });

  describe('hexToUint8Array', () => {
    it('空文字列を空配列に変換する', () => {
      const result = hexToUint8Array('');
      expect(result).toEqual(new Uint8Array([]));
    });

    it('"c0" を [0xc0] に変換する', () => {
      const result = hexToUint8Array('c0');
      expect(result).toEqual(new Uint8Array([0xc0]));
    });

    it('"C0" (大文字) を [0xc0] に変換する', () => {
      const result = hexToUint8Array('C0');
      expect(result).toEqual(new Uint8Array([0xc0]));
    });

    it('"ff00" を [0xff, 0x00] に変換する', () => {
      const result = hexToUint8Array('ff00');
      expect(result).toEqual(new Uint8Array([0xff, 0x00]));
    });

    it('"FF 00" (スペース区切り) を [0xff, 0x00] に変換する', () => {
      const result = hexToUint8Array('FF 00');
      expect(result).toEqual(new Uint8Array([0xff, 0x00]));
    });

    it('"ff:00" (コロン区切り) を [0xff, 0x00] に変換する', () => {
      const result = hexToUint8Array('ff:00');
      expect(result).toEqual(new Uint8Array([0xff, 0x00]));
    });

    it('奇数長の文字列はエラーをスローする', () => {
      expect(() => hexToUint8Array('abc')).toThrow();
    });

    it('無効な16進数文字はエラーをスローする', () => {
      expect(() => hexToUint8Array('zz')).toThrow();
    });

    it('改行を含む文字列を正しく処理する', () => {
      const result = hexToUint8Array('ff\n00');
      expect(result).toEqual(new Uint8Array([0xff, 0x00]));
    });
  });

  describe('null のエンコード/デコード', () => {
    it('null を [0xc0] にエンコードする', () => {
      const result = msgpackEncode(null);
      expect(result).toEqual(new Uint8Array([0xc0]));
    });

    it('[0xc0] を null にデコードする', () => {
      const result = msgpackDecode(new Uint8Array([0xc0]));
      expect(result).toBeNull();
    });
  });

  describe('boolean のエンコード/デコード', () => {
    it('false を [0xc2] にエンコードする', () => {
      const result = msgpackEncode(false);
      expect(result).toEqual(new Uint8Array([0xc2]));
    });

    it('true を [0xc3] にエンコードする', () => {
      const result = msgpackEncode(true);
      expect(result).toEqual(new Uint8Array([0xc3]));
    });

    it('[0xc2] を false にデコードする', () => {
      const result = msgpackDecode(new Uint8Array([0xc2]));
      expect(result).toBe(false);
    });

    it('[0xc3] を true にデコードする', () => {
      const result = msgpackDecode(new Uint8Array([0xc3]));
      expect(result).toBe(true);
    });
  });

  describe('整数のエンコード/デコード', () => {
    it('0 を [0x00] にエンコードする (positive fixint)', () => {
      const result = msgpackEncode(0);
      expect(result).toEqual(new Uint8Array([0x00]));
    });

    it('127 を [0x7f] にエンコードする (positive fixint)', () => {
      const result = msgpackEncode(127);
      expect(result).toEqual(new Uint8Array([0x7f]));
    });

    it('128 を [0xcc, 0x80] にエンコードする (uint8)', () => {
      const result = msgpackEncode(128);
      expect(result).toEqual(new Uint8Array([0xcc, 0x80]));
    });

    it('255 を [0xcc, 0xff] にエンコードする (uint8)', () => {
      const result = msgpackEncode(255);
      expect(result).toEqual(new Uint8Array([0xcc, 0xff]));
    });

    it('-1 を [0xff] にエンコードする (negative fixint)', () => {
      const result = msgpackEncode(-1);
      expect(result).toEqual(new Uint8Array([0xff]));
    });

    it('-32 を [0xe0] にエンコードする (negative fixint)', () => {
      const result = msgpackEncode(-32);
      expect(result).toEqual(new Uint8Array([0xe0]));
    });

    it('256 を uint16 形式でエンコードする', () => {
      const result = msgpackEncode(256);
      expect(result).toEqual(new Uint8Array([0xcd, 0x01, 0x00]));
    });

    it('-33 を int8 形式でエンコードする', () => {
      const result = msgpackEncode(-33);
      expect(result).toEqual(new Uint8Array([0xd0, 0xdf]));
    });
  });

  describe('文字列のエンコード/デコード', () => {
    it('空文字列 "" を [0xa0] にエンコードする (fixstr)', () => {
      const result = msgpackEncode('');
      expect(result).toEqual(new Uint8Array([0xa0]));
    });

    it('"a" を [0xa1, 0x61] にエンコードする', () => {
      const result = msgpackEncode('a');
      expect(result).toEqual(new Uint8Array([0xa1, 0x61]));
    });

    it('"hello" を正しいバイト列にエンコードする', () => {
      const result = msgpackEncode('hello');
      expect(result).toEqual(
        new Uint8Array([0xa5, 0x68, 0x65, 0x6c, 0x6c, 0x6f])
      );
    });

    it('"hello" をデコードして "hello" を返す', () => {
      const result = msgpackDecode(
        new Uint8Array([0xa5, 0x68, 0x65, 0x6c, 0x6c, 0x6f])
      );
      expect(result).toBe('hello');
    });
  });

  describe('配列のエンコード/デコード', () => {
    it('空配列 [] を [0x90] にエンコードする (fixarray)', () => {
      const result = msgpackEncode([]);
      expect(result).toEqual(new Uint8Array([0x90]));
    });

    it('[1, 2] を [0x92, 0x01, 0x02] にエンコードする', () => {
      const result = msgpackEncode([1, 2]);
      expect(result).toEqual(new Uint8Array([0x92, 0x01, 0x02]));
    });

    it('[0x90] を [] にデコードする', () => {
      const result = msgpackDecode(new Uint8Array([0x90]));
      expect(result).toEqual([]);
    });
  });

  describe('オブジェクトのエンコード/デコード', () => {
    it('空オブジェクト {} を [0x80] にエンコードする (fixmap)', () => {
      const result = msgpackEncode({});
      expect(result).toEqual(new Uint8Array([0x80]));
    });

    it('{"a": 1} のエンコード結果が正しいバイト長を持つ', () => {
      const result = msgpackEncode({ a: 1 });
      // fixmap(1) + fixstr(1) "a" + positive fixint(1) 1 = 1 + 2 + 1 = 4バイト
      expect(result.length).toBe(4);
      expect(result[0]).toBe(0x81); // fixmap with 1 entry
    });

    it('[0x80] を {} にデコードする', () => {
      const result = msgpackDecode(new Uint8Array([0x80]));
      expect(result).toEqual({});
    });
  });

  describe('ラウンドトリップ変換', () => {
    it('null の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(null))).toBeNull();
    });

    it('true の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(true))).toBe(true);
    });

    it('false の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(false))).toBe(false);
    });

    it('整数 0 の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(0))).toBe(0);
    });

    it('整数 1 の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(1))).toBe(1);
    });

    it('整数 127 の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(127))).toBe(127);
    });

    it('整数 128 の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(128))).toBe(128);
    });

    it('整数 255 の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(255))).toBe(255);
    });

    it('文字列 "hello" の往復変換', () => {
      expect(msgpackDecode(msgpackEncode('hello'))).toBe('hello');
    });

    it('日本語文字列 "こんにちは" の往復変換', () => {
      expect(msgpackDecode(msgpackEncode('こんにちは'))).toBe('こんにちは');
    });

    it('混合配列 [1, "a", null] の往復変換', () => {
      const original = [1, 'a', null];
      expect(msgpackDecode(msgpackEncode(original))).toEqual(original);
    });

    it('オブジェクト {"key": "value", "num": 42} の往復変換', () => {
      const original = { key: 'value', num: 42 };
      expect(msgpackDecode(msgpackEncode(original))).toEqual(original);
    });

    it('ネストオブジェクト {"a": {"b": [1, 2, 3]}} の往復変換', () => {
      const original = { a: { b: [1, 2, 3] } };
      expect(msgpackDecode(msgpackEncode(original))).toEqual(original);
    });

    it('浮動小数点数 1.5 の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(1.5))).toBeCloseTo(1.5);
    });

    it('浮動小数点数 -0.5 の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(-0.5))).toBeCloseTo(-0.5);
    });

    it('空文字列の往復変換', () => {
      expect(msgpackDecode(msgpackEncode(''))).toBe('');
    });

    it('空配列の往復変換', () => {
      expect(msgpackDecode(msgpackEncode([]))).toEqual([]);
    });

    it('空オブジェクトの往復変換', () => {
      expect(msgpackDecode(msgpackEncode({}))).toEqual({});
    });
  });

  describe('エラーハンドリング', () => {
    it('msgpackEncode(undefined) はエラーをスローする', () => {
      expect(() => msgpackEncode(undefined as unknown as null)).toThrow();
    });

    it('msgpackDecode(空のUint8Array) はエラーをスローする', () => {
      expect(() => msgpackDecode(new Uint8Array([]))).toThrow();
    });

    it('msgpackEncode(function) はエラーをスローする', () => {
      expect(() =>
        msgpackEncode((() => {}) as unknown as null)
      ).toThrow();
    });

    it('不正なMessagePackバイトはデコード時にエラーをスローする', () => {
      // 0xc1 は MessagePack の未使用バイト
      expect(() => msgpackDecode(new Uint8Array([0xc1]))).toThrow();
    });
  });
});
