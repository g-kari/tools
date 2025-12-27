import { describe, it, expect, vi, beforeAll } from 'vitest';

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

const UPPERCASE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARS = "abcdefghijklmnopqrstuvwxyz";
const NUMBER_CHARS = "0123456789";
const SYMBOL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

function generatePassword(options: PasswordOptions): string {
  let charset = "";
  if (options.uppercase) charset += UPPERCASE_CHARS;
  if (options.lowercase) charset += LOWERCASE_CHARS;
  if (options.numbers) charset += NUMBER_CHARS;
  if (options.symbols) charset += SYMBOL_CHARS;

  if (charset.length === 0) {
    return "";
  }

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);

  let password = "";
  for (let i = 0; i < options.length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}

function calculateStrength(password: string, options: PasswordOptions): { score: number; label: string } {
  if (password.length === 0) return { score: 0, label: "" };

  let charsetSize = 0;
  if (options.uppercase) charsetSize += 26;
  if (options.lowercase) charsetSize += 26;
  if (options.numbers) charsetSize += 10;
  if (options.symbols) charsetSize += 26;

  const entropy = password.length * Math.log2(charsetSize || 1);

  if (entropy < 28) return { score: 1, label: "非常に弱い" };
  if (entropy < 36) return { score: 2, label: "弱い" };
  if (entropy < 60) return { score: 3, label: "普通" };
  if (entropy < 128) return { score: 4, label: "強い" };
  return { score: 5, label: "非常に強い" };
}

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
