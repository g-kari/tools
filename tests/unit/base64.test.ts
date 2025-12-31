import { describe, it, expect } from 'vitest';

// Base64 encoding/decoding functions using built-in JavaScript functions
function base64Encode(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

function base64Decode(text: string): string {
  return decodeURIComponent(escape(atob(text)));
}

describe('Base64 Encode/Decode Functions', () => {
  describe('base64Encode', () => {
    it('should encode Japanese text', () => {
      const result = base64Encode('こんにちは');
      expect(result).toBe('44GT44KT44Gr44Gh44Gv');
    });

    it('should encode ASCII text', () => {
      const result = base64Encode('Hello');
      expect(result).toBe('SGVsbG8=');
    });

    it('should encode text with spaces', () => {
      const result = base64Encode('Hello World');
      expect(result).toBe('SGVsbG8gV29ybGQ=');
    });

    it('should encode special characters', () => {
      const result = base64Encode('hello!@#$%^&*()');
      expect(result).toBe('aGVsbG8hQCMkJV4mKigp');
    });

    it('should handle empty string', () => {
      const result = base64Encode('');
      expect(result).toBe('');
    });

    it('should encode emoji', () => {
      const result = base64Encode('😀');
      expect(result).toBe('8J+YgA==');
    });

    it('should encode Korean text', () => {
      const result = base64Encode('안녕');
      expect(result).toBe('7JWI64WV');
    });

    it('should encode Chinese text', () => {
      const result = base64Encode('中文');
      expect(result).toBe('5Lit5paH');
    });

    it('should encode numbers', () => {
      const result = base64Encode('1234567890');
      expect(result).toBe('MTIzNDU2Nzg5MA==');
    });

    it('should encode multiline text', () => {
      const result = base64Encode('Line 1\nLine 2\nLine 3');
      expect(result).toBe('TGluZSAxCkxpbmUgMgpMaW5lIDM=');
    });
  });

  describe('base64Decode', () => {
    it('should decode to Japanese text', () => {
      const result = base64Decode('44GT44KT44Gr44Gh44Gv');
      expect(result).toBe('こんにちは');
    });

    it('should decode to ASCII text', () => {
      const result = base64Decode('SGVsbG8=');
      expect(result).toBe('Hello');
    });

    it('should decode to text with spaces', () => {
      const result = base64Decode('SGVsbG8gV29ybGQ=');
      expect(result).toBe('Hello World');
    });

    it('should handle empty string', () => {
      const result = base64Decode('');
      expect(result).toBe('');
    });

    it('should decode to emoji', () => {
      const result = base64Decode('8J+YgA==');
      expect(result).toBe('😀');
    });

    it('should throw on invalid base64 string', () => {
      expect(() => base64Decode('invalid!!!')).toThrow();
    });

    it('should decode base64 string without padding', () => {
      // SGVsbG8 is valid base64 (without padding) and decodes to "Hello"
      const result = base64Decode('SGVsbG8');
      expect(result).toBe('Hello');
    });

    it('should decode multiline text', () => {
      const result = base64Decode('TGluZSAxCkxpbmUgMgpMaW5lIDM=');
      expect(result).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve Japanese text through encode/decode', () => {
      const original = 'こんにちは世界';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve mixed text through encode/decode', () => {
      const original = 'Hello, 世界! 123';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve emoji through encode/decode', () => {
      const original = '🎉🎊🎁';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve special characters through encode/decode', () => {
      const original = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve multiline text through encode/decode', () => {
      const original = 'First Line\nSecond Line\nThird Line';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve mixed multilingual text', () => {
      const original = 'English 日本語 한국어 中文 Español';
      const encoded = base64Encode(original);
      const decoded = base64Decode(encoded);
      expect(decoded).toBe(original);
    });
  });
});
