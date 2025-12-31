import { describe, it, expect } from 'vitest';
import {
  countChars,
  countCharsWithoutSpaces,
  countBytes,
  countLines,
  countWords,
  countParagraphs,
} from '../../app/routes/char-count';

describe('Character Count Functions', () => {
  describe('countChars', () => {
    it('should return 0 for empty string', () => {
      expect(countChars('')).toBe(0);
    });

    it('should count ASCII characters correctly', () => {
      expect(countChars('Hello')).toBe(5);
      expect(countChars('Hello World')).toBe(11);
    });

    it('should count Japanese characters correctly', () => {
      expect(countChars('こんにちは')).toBe(5);
      expect(countChars('日本語')).toBe(3);
    });

    it('should count spaces', () => {
      expect(countChars('a b c')).toBe(5);
      expect(countChars('   ')).toBe(3);
    });

    it('should count newlines as characters', () => {
      expect(countChars('a\nb')).toBe(3);
    });

    it('should count emoji as single characters', () => {
      expect(countChars('👍')).toBe(1);
      expect(countChars('👍🎉🚀')).toBe(3);
      expect(countChars('Hello 👋')).toBe(7);
    });

    it('should handle mixed content', () => {
      expect(countChars('Hello 世界 👋')).toBe(10);
    });
  });

  describe('countCharsWithoutSpaces', () => {
    it('should return 0 for empty string', () => {
      expect(countCharsWithoutSpaces('')).toBe(0);
    });

    it('should return 0 for whitespace only', () => {
      expect(countCharsWithoutSpaces('   ')).toBe(0);
      expect(countCharsWithoutSpaces('\t\n ')).toBe(0);
    });

    it('should exclude spaces', () => {
      expect(countCharsWithoutSpaces('Hello World')).toBe(10);
      expect(countCharsWithoutSpaces('a b c')).toBe(3);
    });

    it('should exclude tabs and newlines', () => {
      expect(countCharsWithoutSpaces('a\tb\nc')).toBe(3);
    });

    it('should count Japanese characters without spaces', () => {
      expect(countCharsWithoutSpaces('こん にち は')).toBe(5);
    });
  });

  describe('countBytes', () => {
    it('should return 0 for empty string', () => {
      expect(countBytes('')).toBe(0);
    });

    it('should count ASCII characters as 1 byte each', () => {
      expect(countBytes('Hello')).toBe(5);
      expect(countBytes('abc123')).toBe(6);
    });

    it('should count Japanese characters as 3 bytes each (UTF-8)', () => {
      expect(countBytes('あ')).toBe(3);
      expect(countBytes('あいう')).toBe(9);
      expect(countBytes('日本語')).toBe(9);
    });

    it('should count emoji as 4 bytes each (UTF-8)', () => {
      expect(countBytes('👍')).toBe(4);
      expect(countBytes('👍🎉')).toBe(8);
    });

    it('should handle mixed content', () => {
      // 'Hello' = 5 bytes, ' ' = 1 byte, '世界' = 6 bytes
      expect(countBytes('Hello 世界')).toBe(12);
    });
  });

  describe('countLines', () => {
    it('should return 0 for empty string', () => {
      expect(countLines('')).toBe(0);
    });

    it('should return 1 for single line', () => {
      expect(countLines('Hello')).toBe(1);
      expect(countLines('Single line')).toBe(1);
    });

    it('should count multiple lines with LF', () => {
      expect(countLines('Line 1\nLine 2')).toBe(2);
      expect(countLines('a\nb\nc')).toBe(3);
    });

    it('should count lines with CRLF', () => {
      expect(countLines('Line 1\r\nLine 2')).toBe(2);
    });

    it('should count lines with CR', () => {
      expect(countLines('Line 1\rLine 2')).toBe(2);
    });

    it('should count trailing newline as an additional line', () => {
      expect(countLines('Line 1\n')).toBe(2);
      expect(countLines('Line 1\nLine 2\n')).toBe(3);
    });
  });

  describe('countWords', () => {
    it('should return 0 for empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('should return 0 for whitespace only', () => {
      expect(countWords('   ')).toBe(0);
      expect(countWords('\t\n')).toBe(0);
    });

    it('should count single word', () => {
      expect(countWords('Hello')).toBe(1);
    });

    it('should count multiple words', () => {
      expect(countWords('Hello World')).toBe(2);
      expect(countWords('one two three')).toBe(3);
    });

    it('should handle multiple spaces between words', () => {
      expect(countWords('Hello    World')).toBe(2);
    });

    it('should handle leading and trailing spaces', () => {
      expect(countWords('  Hello World  ')).toBe(2);
    });

    it('should count Japanese text as single word units', () => {
      expect(countWords('こんにちは世界')).toBe(1);
    });

    it('should handle mixed Japanese and English', () => {
      expect(countWords('Hello 世界')).toBe(2);
    });
  });

  describe('countParagraphs', () => {
    it('should return 0 for empty string', () => {
      expect(countParagraphs('')).toBe(0);
    });

    it('should return 0 for whitespace only', () => {
      expect(countParagraphs('   ')).toBe(0);
      expect(countParagraphs('\n\n\n')).toBe(0);
    });

    it('should return 1 for single paragraph', () => {
      expect(countParagraphs('Hello World')).toBe(1);
      expect(countParagraphs('Single paragraph')).toBe(1);
    });

    it('should count paragraphs separated by empty lines', () => {
      expect(countParagraphs('Para 1\n\nPara 2')).toBe(2);
      expect(countParagraphs('Para 1\n\nPara 2\n\nPara 3')).toBe(3);
    });

    it('should treat single newlines as same paragraph', () => {
      expect(countParagraphs('Line 1\nLine 2')).toBe(1);
    });

    it('should handle multiple blank lines as single separator', () => {
      expect(countParagraphs('Para 1\n\n\n\nPara 2')).toBe(2);
    });
  });
});
