import { describe, it, expect } from 'vitest';

/**
 * テキストをハッシュ化する関数
 * @param text - ハッシュ化するテキスト
 * @param algorithm - 使用するハッシュアルゴリズム
 * @param salt - オプションのソルト文字列
 * @returns ハッシュ化された16進数文字列
 */
async function generateHash(
  text: string,
  algorithm: 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512',
  salt: string = ''
): Promise<string> {
  const textWithSalt = salt ? text + salt : text;
  const encoder = new TextEncoder();
  const data = encoder.encode(textWithSalt);

  // MD5はWeb Crypto APIでサポートされていないため、簡易実装
  if (algorithm === 'MD5') {
    return md5(textWithSalt);
  }

  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * MD5ハッシュの簡易実装
 * @param str - ハッシュ化する文字列
 * @returns MD5ハッシュ値（16進数文字列）
 */
function md5(str: string): string {
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function md5cycle(x: number[], k: number[]): void {
    let a = x[0],
      b = x[1],
      c = x[2],
      d = x[3];

    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = addUnsigned(a, x[0]);
    x[1] = addUnsigned(b, x[1]);
    x[2] = addUnsigned(c, x[2]);
    x[3] = addUnsigned(d, x[3]);
  }

  function cmn(
    q: number,
    a: number,
    b: number,
    x: number,
    s: number,
    t: number
  ): number {
    a = addUnsigned(addUnsigned(a, q), addUnsigned(x, t));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function ff(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ): number {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function gg(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ): number {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function hh(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ): number {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(
    a: number,
    b: number,
    c: number,
    d: number,
    x: number,
    s: number,
    t: number
  ): number {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const utf8Encode = new TextEncoder();
  const bytes = utf8Encode.encode(str);
  const msgLen = bytes.length;
  const wordCount = ((msgLen + 8) >>> 6) + 1;
  const wordArray = new Array(wordCount * 16);

  for (let i = 0; i < wordCount * 16; i++) {
    wordArray[i] = 0;
  }

  for (let i = 0; i < msgLen; i++) {
    wordArray[i >>> 2] |= bytes[i] << ((i % 4) * 8);
  }

  wordArray[msgLen >>> 2] |= 0x80 << ((msgLen % 4) * 8);
  wordArray[wordCount * 16 - 2] = msgLen * 8;

  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

  for (let i = 0; i < wordArray.length; i += 16) {
    md5cycle(state, wordArray.slice(i, i + 16));
  }

  const hex = [];
  for (let i = 0; i < 4; i++) {
    const s = state[i];
    hex.push(
      ((s >> 0) & 0xff).toString(16).padStart(2, '0'),
      ((s >> 8) & 0xff).toString(16).padStart(2, '0'),
      ((s >> 16) & 0xff).toString(16).padStart(2, '0'),
      ((s >> 24) & 0xff).toString(16).padStart(2, '0')
    );
  }

  return hex.join('');
}

describe('Hash Generator Functions', () => {
  describe('MD5', () => {
    it('should generate MD5 hash for simple text', async () => {
      const result = await generateHash('hello', 'MD5');
      expect(result).toBe('5d41402abc4b2a76b9719d911017c592');
    });

    it('should generate MD5 hash for empty string', async () => {
      const result = await generateHash('', 'MD5');
      expect(result).toBe('d41d8cd98f00b204e9800998ecf8427e');
    });

    it('should generate MD5 hash for Japanese text', async () => {
      const result = await generateHash('こんにちは', 'MD5');
      expect(result).toBe('c0e89a293bd36c7a768e4e9d2c5475a8');
    });

    it('should generate MD5 hash with salt', async () => {
      const resultWithoutSalt = await generateHash('password', 'MD5');
      const resultWithSalt = await generateHash('password', 'MD5', 'salt123');
      expect(resultWithSalt).not.toBe(resultWithoutSalt);
      expect(resultWithSalt).toBe('153ef369bd2a6ca3ecde0dd486b1aed9');
    });

    it('should generate different hashes for different inputs', async () => {
      const hash1 = await generateHash('test1', 'MD5');
      const hash2 = await generateHash('test2', 'MD5');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('SHA-1', () => {
    it('should generate SHA-1 hash for simple text', async () => {
      const result = await generateHash('hello', 'SHA-1');
      expect(result).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
    });

    it('should generate SHA-1 hash for empty string', async () => {
      const result = await generateHash('', 'SHA-1');
      expect(result).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
    });

    it('should generate SHA-1 hash for Japanese text', async () => {
      const result = await generateHash('こんにちは', 'SHA-1');
      expect(result).toHaveLength(40); // SHA-1 is 160 bits = 40 hex chars
      expect(result).toBe('20427a708c3f6f07cf12ab23557982d9e6d23b61');
    });

    it('should generate SHA-1 hash with salt', async () => {
      const resultWithoutSalt = await generateHash('password', 'SHA-1');
      const resultWithSalt = await generateHash('password', 'SHA-1', 'salt123');
      expect(resultWithSalt).not.toBe(resultWithoutSalt);
    });
  });

  describe('SHA-256', () => {
    it('should generate SHA-256 hash for simple text', async () => {
      const result = await generateHash('hello', 'SHA-256');
      expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('should generate SHA-256 hash for empty string', async () => {
      const result = await generateHash('', 'SHA-256');
      expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should generate SHA-256 hash for Japanese text', async () => {
      const result = await generateHash('こんにちは', 'SHA-256');
      expect(result).toHaveLength(64); // SHA-256 is 256 bits = 64 hex chars
    });

    it('should generate SHA-256 hash with salt', async () => {
      const resultWithoutSalt = await generateHash('password', 'SHA-256');
      const resultWithSalt = await generateHash('password', 'SHA-256', 'salt123');
      expect(resultWithSalt).not.toBe(resultWithoutSalt);
    });

    it('should generate different hashes for different salts', async () => {
      const hash1 = await generateHash('password', 'SHA-256', 'salt1');
      const hash2 = await generateHash('password', 'SHA-256', 'salt2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('SHA-512', () => {
    it('should generate SHA-512 hash for simple text', async () => {
      const result = await generateHash('hello', 'SHA-512');
      expect(result).toBe('9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043');
    });

    it('should generate SHA-512 hash for empty string', async () => {
      const result = await generateHash('', 'SHA-512');
      expect(result).toBe('cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e');
    });

    it('should generate SHA-512 hash for Japanese text', async () => {
      const result = await generateHash('こんにちは', 'SHA-512');
      expect(result).toHaveLength(128); // SHA-512 is 512 bits = 128 hex chars
    });

    it('should generate SHA-512 hash with salt', async () => {
      const resultWithoutSalt = await generateHash('password', 'SHA-512');
      const resultWithSalt = await generateHash('password', 'SHA-512', 'salt123');
      expect(resultWithSalt).not.toBe(resultWithoutSalt);
    });
  });

  describe('Hash properties', () => {
    it('should generate consistent hashes for same input', async () => {
      const hash1 = await generateHash('test', 'SHA-256');
      const hash2 = await generateHash('test', 'SHA-256');
      expect(hash1).toBe(hash2);
    });

    it('should generate only hexadecimal characters', async () => {
      const result = await generateHash('test123', 'SHA-256');
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it('should handle special characters', async () => {
      const result = await generateHash('!@#$%^&*()', 'SHA-256');
      expect(result).toHaveLength(64);
    });

    it('should handle emoji', async () => {
      const result = await generateHash('😀🎉', 'SHA-256');
      expect(result).toHaveLength(64);
    });

    it('should handle very long text', async () => {
      const longText = 'a'.repeat(10000);
      const result = await generateHash(longText, 'SHA-256');
      expect(result).toHaveLength(64);
    });
  });

  describe('Different algorithms produce different hashes', () => {
    it('should generate different hashes for different algorithms', async () => {
      const text = 'test';
      const md5Hash = await generateHash(text, 'MD5');
      const sha1Hash = await generateHash(text, 'SHA-1');
      const sha256Hash = await generateHash(text, 'SHA-256');
      const sha512Hash = await generateHash(text, 'SHA-512');

      expect(md5Hash).not.toBe(sha1Hash);
      expect(md5Hash).not.toBe(sha256Hash);
      expect(md5Hash).not.toBe(sha512Hash);
      expect(sha1Hash).not.toBe(sha256Hash);
      expect(sha1Hash).not.toBe(sha512Hash);
      expect(sha256Hash).not.toBe(sha512Hash);
    });

    it('should generate hashes of expected lengths', async () => {
      const text = 'test';
      const md5Hash = await generateHash(text, 'MD5');
      const sha1Hash = await generateHash(text, 'SHA-1');
      const sha256Hash = await generateHash(text, 'SHA-256');
      const sha512Hash = await generateHash(text, 'SHA-512');

      expect(md5Hash).toHaveLength(32); // 128 bits = 32 hex chars
      expect(sha1Hash).toHaveLength(40); // 160 bits = 40 hex chars
      expect(sha256Hash).toHaveLength(64); // 256 bits = 64 hex chars
      expect(sha512Hash).toHaveLength(128); // 512 bits = 128 hex chars
    });
  });
});
