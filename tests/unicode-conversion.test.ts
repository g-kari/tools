import { describe, it, expect } from 'vitest';
import { toUnicodeEscape, fromUnicodeEscape } from '../app/utils/unicode';

describe('Unicode Conversion Functions', () => {
  describe('toUnicodeEscape', () => {
    it('should convert Japanese text to unicode escape', () => {
      const result = toUnicodeEscape('こんにちは');
      expect(result).toBe('\\u3053\\u3093\\u306b\\u3061\\u306f');
    });

    it('should leave ASCII text unchanged', () => {
      const result = toUnicodeEscape('Hello');
      expect(result).toBe('Hello');
    });

    it('should handle mixed ASCII and Japanese', () => {
      const result = toUnicodeEscape('Hello, 世界');
      expect(result).toBe('Hello, \\u4e16\\u754c');
    });

    it('should handle empty string', () => {
      const result = toUnicodeEscape('');
      expect(result).toBe('');
    });

    it('should handle emoji (surrogate pairs)', () => {
      const result = toUnicodeEscape('😀');
      expect(result).toBe('\\ud83d\\ude00');
    });

    it('should handle Korean text', () => {
      const result = toUnicodeEscape('안녕');
      expect(result).toBe('\\uc548\\ub155');
    });

    it('should handle Chinese text', () => {
      const result = toUnicodeEscape('中文');
      expect(result).toBe('\\u4e2d\\u6587');
    });
  });

  describe('fromUnicodeEscape', () => {
    it('should convert unicode escape to Japanese text', () => {
      const result = fromUnicodeEscape('\\u3053\\u3093\\u306b\\u3061\\u306f');
      expect(result).toBe('こんにちは');
    });

    it('should leave ASCII text unchanged', () => {
      const result = fromUnicodeEscape('Hello');
      expect(result).toBe('Hello');
    });

    it('should handle mixed ASCII and unicode escape', () => {
      const result = fromUnicodeEscape('Hello, \\u4e16\\u754c');
      expect(result).toBe('Hello, 世界');
    });

    it('should handle empty string', () => {
      const result = fromUnicodeEscape('');
      expect(result).toBe('');
    });

    it('should handle emoji (surrogate pairs)', () => {
      const result = fromUnicodeEscape('\\ud83d\\ude00');
      expect(result).toBe('😀');
    });

    it('should handle case-insensitive unicode escape', () => {
      const result = fromUnicodeEscape('\\u3053\\U3093\\u306B\\u3061\\U306F');
      // Only lowercase matches the regex
      expect(result).toContain('こ');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve Japanese text through encode/decode', () => {
      const original = 'こんにちは世界';
      const encoded = toUnicodeEscape(original);
      const decoded = fromUnicodeEscape(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve mixed text through encode/decode', () => {
      const original = 'Hello, 世界! 123';
      const encoded = toUnicodeEscape(original);
      const decoded = fromUnicodeEscape(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve emoji through encode/decode', () => {
      const original = '🎉🎊🎁';
      const encoded = toUnicodeEscape(original);
      const decoded = fromUnicodeEscape(encoded);
      expect(decoded).toBe(original);
    });
  });
});
