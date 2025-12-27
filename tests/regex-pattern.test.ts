import { describe, it, expect } from 'vitest';
import { testRegexPattern } from '../app/utils/regex';

describe('Regex pattern testing', () => {

  it('should match simple pattern', () => {
    const result = testRegexPattern('\\d+', '', '123');
    expect(result.error).toBeNull();
    expect(result.matches).toBe(1);
  });

  it('should match with global flag', () => {
    const result = testRegexPattern('\\d+', 'g', '123 456 789');
    expect(result.error).toBeNull();
    expect(result.matches).toBe(3);
  });

  it('should match with case-insensitive flag', () => {
    const result = testRegexPattern('hello', 'i', 'HELLO world');
    expect(result.error).toBeNull();
    expect(result.matches).toBe(1);
  });

  it('should not match when pattern does not exist', () => {
    const result = testRegexPattern('xyz', '', 'abc');
    expect(result.error).toBeNull();
    expect(result.matches).toBe(0);
  });

  it('should handle email pattern', () => {
    const result = testRegexPattern('[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}', 'gi', 'test@example.com');
    expect(result.error).toBeNull();
    expect(result.matches).toBe(1);
  });

  it('should handle phone number pattern', () => {
    const result = testRegexPattern('\\d{3}-\\d{4}', 'g', '123-4567 and 890-1234');
    expect(result.error).toBeNull();
    expect(result.matches).toBe(2);
  });

  it('should return error for invalid regex', () => {
    const result = testRegexPattern('[', '', 'test');
    expect(result.error).not.toBeNull();
    expect(result.matches).toBe(0);
  });

  it('should handle multiline mode', () => {
    const result = testRegexPattern('^test', 'gm', 'test\ntest\ntest');
    expect(result.error).toBeNull();
    expect(result.matches).toBe(3);
  });

  it('should handle capture groups', () => {
    const pattern = '(\\d{3})-(\\d{4})';
    const testString = '123-4567';
    try {
      const regex = new RegExp(pattern, '');
      const match = regex.exec(testString);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('123');
      expect(match![2]).toBe('4567');
    } catch {
      throw new Error('Should not throw');
    }
  });

  it('should handle unicode mode', () => {
    const result = testRegexPattern('\\p{Emoji}', 'gu', '😀 hello 🎉');
    expect(result.error).toBeNull();
    expect(result.matches).toBe(2);
  });
});
