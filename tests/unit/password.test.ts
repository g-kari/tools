import { describe, it, expect, beforeAll } from 'vitest';
import {
  generatePassword,
  calculateStrength,
  CHAR_COUNTS,
} from '../../app/utils/password';

// Mock crypto.getRandomValues for Node.js environment
beforeAll(() => {
  if (!globalThis.crypto) {
    const nodeCrypto = require('crypto');
    globalThis.crypto = {
      getRandomValues: (array: Uint32Array) => {
        const bytes = nodeCrypto.randomBytes(array.length * 4);
        for (let i = 0; i < array.length; i++) {
          array[i] = bytes.readUInt32LE(i * 4);
        }
        return array;
      },
    } as Crypto;
  }
});

describe('Password generation', () => {
  it('should generate password with specified length', () => {
    const password = generatePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
    });
    expect(password.length).toBe(16);
  });

  it('should generate password with only uppercase characters', () => {
    const password = generatePassword({
      length: 20,
      uppercase: true,
      lowercase: false,
      numbers: false,
      symbols: false,
    });
    expect(password.length).toBe(20);
    expect(/^[A-Z]+$/.test(password)).toBe(true);
  });

  it('should generate password with only lowercase characters', () => {
    const password = generatePassword({
      length: 20,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
    });
    expect(password.length).toBe(20);
    expect(/^[a-z]+$/.test(password)).toBe(true);
  });

  it('should generate password with only numbers', () => {
    const password = generatePassword({
      length: 20,
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
    });
    expect(password.length).toBe(20);
    expect(/^[0-9]+$/.test(password)).toBe(true);
  });

  it('should generate password with mixed characters', () => {
    const password = generatePassword({
      length: 100,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    expect(password.length).toBe(100);
    // With 100 chars, it's statistically very likely to have all types
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
  });

  it('should return empty string when no character type is selected', () => {
    const password = generatePassword({
      length: 16,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
    });
    expect(password).toBe("");
  });

  it('should handle minimum length', () => {
    const password = generatePassword({
      length: 4,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
    });
    expect(password.length).toBe(4);
  });

  it('should handle maximum length', () => {
    const password = generatePassword({
      length: 128,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    expect(password.length).toBe(128);
  });

  it('should generate different passwords on each call', () => {
    const options = {
      length: 32,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    };
    const password1 = generatePassword(options);
    const password2 = generatePassword(options);
    // Extremely unlikely to be the same
    expect(password1).not.toBe(password2);
  });
});

describe('Password strength calculation', () => {
  it('should return empty for empty password', () => {
    const result = calculateStrength("", {
      length: 0,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
    });
    expect(result.score).toBe(0);
    expect(result.label).toBe("");
  });

  it('should return "非常に弱い" for very short passwords', () => {
    const result = calculateStrength("abcd", {
      length: 4,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
    });
    expect(result.score).toBe(1);
    expect(result.label).toBe("非常に弱い");
  });

  it('should return "弱い" for short passwords with limited charset', () => {
    const result = calculateStrength("abcdefg", {
      length: 7,
      uppercase: false,
      lowercase: true,
      numbers: false,
      symbols: false,
    });
    expect(result.score).toBe(2);
    expect(result.label).toBe("弱い");
  });

  it('should return "普通" for medium strength passwords', () => {
    // Entropy = 8 * log2(62) = 8 * 5.954 = 47.6 bits -> score 3
    const result = calculateStrength("Abcd1234", {
      length: 8,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
    });
    expect(result.score).toBe(3);
    expect(result.label).toBe("普通");
  });

  it('should return "強い" for strong passwords', () => {
    // Entropy = 16 * log2(62) = 16 * 5.954 = 95.3 bits -> score 4
    const result = calculateStrength("Abcd1234Efgh5678", {
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
    });
    expect(result.score).toBe(4);
    expect(result.label).toBe("強い");
  });

  it('should return "非常に強い" for very strong passwords', () => {
    const result = calculateStrength("A".repeat(30), {
      length: 30,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    expect(result.score).toBe(5);
    expect(result.label).toBe("非常に強い");
  });
});

describe('Character counts', () => {
  it('should have correct character counts for entropy calculation', () => {
    expect(CHAR_COUNTS.uppercase).toBe(26);
    expect(CHAR_COUNTS.lowercase).toBe(26);
    expect(CHAR_COUNTS.numbers).toBe(10);
    // SYMBOL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?" has 26 characters
    expect(CHAR_COUNTS.symbols).toBe(26);
  });
});
