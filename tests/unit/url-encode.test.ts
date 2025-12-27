import { describe, it, expect } from 'vitest';

// URL encoding/decoding functions using built-in JavaScript functions
function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

function urlDecode(text: string): string {
  return decodeURIComponent(text);
}

describe('URL Encode/Decode Functions', () => {
  describe('urlEncode', () => {
    it('should encode Japanese text', () => {
      const result = urlEncode('こんにちは');
      expect(result).toBe('%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF');
    });

    it('should leave ASCII letters unchanged', () => {
      const result = urlEncode('Hello');
      expect(result).toBe('Hello');
    });

    it('should encode spaces as %20', () => {
      const result = urlEncode('Hello World');
      expect(result).toBe('Hello%20World');
    });

    it('should encode special characters', () => {
      const result = urlEncode('hello!@#$%^&*()');
      expect(result).toContain('%');
      // encodeURIComponent encodes @, #, $, %, ^, & but not !, *, (, )
      expect(result).toContain('%40'); // @
      expect(result).toContain('%23'); // #
      expect(result).toContain('%24'); // $
      expect(result).toContain('%25'); // %
      expect(result).toContain('%5E'); // ^
      expect(result).toContain('%26'); // &
    });

    it('should handle empty string', () => {
      const result = urlEncode('');
      expect(result).toBe('');
    });

    it('should encode emoji', () => {
      const result = urlEncode('😀');
      expect(result).toBe('%F0%9F%98%80');
    });

    it('should encode Korean text', () => {
      const result = urlEncode('안녕');
      expect(result).toBe('%EC%95%88%EB%85%95');
    });

    it('should encode Chinese text', () => {
      const result = urlEncode('中文');
      expect(result).toBe('%E4%B8%AD%E6%96%87');
    });

    it('should not encode unreserved characters', () => {
      const result = urlEncode('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~');
      expect(result).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~');
    });
  });

  describe('urlDecode', () => {
    it('should decode to Japanese text', () => {
      const result = urlDecode('%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF');
      expect(result).toBe('こんにちは');
    });

    it('should leave ASCII text unchanged', () => {
      const result = urlDecode('Hello');
      expect(result).toBe('Hello');
    });

    it('should decode %20 to space', () => {
      const result = urlDecode('Hello%20World');
      expect(result).toBe('Hello World');
    });

    it('should handle empty string', () => {
      const result = urlDecode('');
      expect(result).toBe('');
    });

    it('should decode emoji', () => {
      const result = urlDecode('%F0%9F%98%80');
      expect(result).toBe('😀');
    });

    it('should throw on invalid encoded string', () => {
      expect(() => urlDecode('%E3%81')).toThrow();
    });

    it('should throw on malformed percent encoding', () => {
      expect(() => urlDecode('%ZZ')).toThrow();
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve Japanese text through encode/decode', () => {
      const original = 'こんにちは世界';
      const encoded = urlEncode(original);
      const decoded = urlDecode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve mixed text through encode/decode', () => {
      const original = 'Hello, 世界! 123';
      const encoded = urlEncode(original);
      const decoded = urlDecode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve emoji through encode/decode', () => {
      const original = '🎉🎊🎁';
      const encoded = urlEncode(original);
      const decoded = urlDecode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve query string format', () => {
      const original = 'key=value&name=テスト';
      const encoded = urlEncode(original);
      const decoded = urlDecode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve URL path with special characters', () => {
      const original = '/path/to/ファイル.txt';
      const encoded = urlEncode(original);
      const decoded = urlDecode(encoded);
      expect(decoded).toBe(original);
    });
  });
});
