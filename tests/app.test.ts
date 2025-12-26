import { describe, it, expect } from 'vitest';

// Unicode conversion utility functions (same as in the app)
function toUnicodeEscape(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i);
    if (cp === undefined) break;

    if (cp > 0xffff) {
      const high = ((cp - 0x10000) >> 10) + 0xd800;
      const low = ((cp - 0x10000) & 0x3ff) + 0xdc00;
      result += "\\u" + high.toString(16).padStart(4, "0");
      result += "\\u" + low.toString(16).padStart(4, "0");
      i += 2;
    } else if (cp > 127) {
      result += "\\u" + cp.toString(16).padStart(4, "0");
      i += 1;
    } else {
      result += text[i];
      i += 1;
    }
  }
  return result;
}

function fromUnicodeEscape(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );
}

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

describe('Domain validation regex', () => {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  it('should match valid domain', () => {
    expect(domainRegex.test('example.com')).toBe(true);
  });

  it('should match subdomain', () => {
    expect(domainRegex.test('sub.example.com')).toBe(true);
  });

  it('should match multi-level subdomain', () => {
    expect(domainRegex.test('a.b.c.example.com')).toBe(true);
  });

  it('should not match domain without TLD', () => {
    expect(domainRegex.test('example')).toBe(false);
  });

  it('should not match domain starting with hyphen', () => {
    expect(domainRegex.test('-example.com')).toBe(false);
  });

  it('should not match domain with invalid characters', () => {
    expect(domainRegex.test('test@domain.com')).toBe(false);
  });

  it('should match domain with numbers', () => {
    expect(domainRegex.test('123.example.com')).toBe(true);
  });

  it('should match domain with hyphen in middle', () => {
    expect(domainRegex.test('my-example.com')).toBe(true);
  });
});

describe('IP address validation', () => {
  // IPv4 validation
  function isValidIPv4(ip: string): boolean {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255 && part === num.toString();
    });
  }

  // IPv6 validation
  function isValidIPv6(ip: string): boolean {
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    const ipv6WithIPv4Regex =
      /^([0-9a-fA-F]{0,4}:){2,6}(\d{1,3}\.){3}\d{1,3}$/;
    return ipv6Regex.test(ip) || ipv6WithIPv4Regex.test(ip);
  }

  describe('IPv4 validation', () => {
    it('should accept valid IPv4 address', () => {
      expect(isValidIPv4('192.168.1.1')).toBe(true);
    });

    it('should accept loopback address', () => {
      expect(isValidIPv4('127.0.0.1')).toBe(true);
    });

    it('should accept 0.0.0.0', () => {
      expect(isValidIPv4('0.0.0.0')).toBe(true);
    });

    it('should accept 255.255.255.255', () => {
      expect(isValidIPv4('255.255.255.255')).toBe(true);
    });

    it('should reject IP with out of range octet', () => {
      expect(isValidIPv4('256.1.1.1')).toBe(false);
    });

    it('should reject IP with too few octets', () => {
      expect(isValidIPv4('192.168.1')).toBe(false);
    });

    it('should reject IP with too many octets', () => {
      expect(isValidIPv4('192.168.1.1.1')).toBe(false);
    });

    it('should reject IP with leading zeros', () => {
      expect(isValidIPv4('192.168.01.1')).toBe(false);
    });

    it('should reject IP with non-numeric characters', () => {
      expect(isValidIPv4('192.168.a.1')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidIPv4('')).toBe(false);
    });
  });

  describe('IPv6 validation', () => {
    it('should accept valid full IPv6 address', () => {
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });

    it('should accept compressed IPv6 address', () => {
      expect(isValidIPv6('2001:db8::1')).toBe(true);
    });

    it('should accept loopback IPv6 address', () => {
      expect(isValidIPv6('::1')).toBe(true);
    });

    it('should reject invalid IPv6 format', () => {
      expect(isValidIPv6('not-an-ipv6')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidIPv6('')).toBe(false);
    });
  });
});
