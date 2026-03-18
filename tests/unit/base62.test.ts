import { describe, it, expect } from 'vitest';
import {
  encodeBase62,
  encodeBase62Bytes,
  decodeBase62,
  validateBase62,
  encodeIntBase62,
  decodeIntBase62,
} from '../../app/utils/base62';

// 既知テストベクター（双方向確認済み）
const KNOWN_VECTORS: [string, string][] = [
  // [テキスト, Base62（標準）]
  ['Hello', '5TP3P3v'],
  ['Hello World', '73XpUgyMwkGr29M'],
];

describe('encodeBase62', () => {
  describe('標準アルファベット (0-9A-Za-z)', () => {
    it('空文字列は空文字列を返す', () => {
      const result = encodeBase62('', 'standard');
      expect(result.encoded).toBe('');
      expect(result.inputBytes).toBe(0);
      expect(result.outputLength).toBe(0);
    });

    it('inputBytes・outputLength を正確に返す', () => {
      const result = encodeBase62('abc', 'standard');
      expect(result.inputBytes).toBe(3);
      expect(result.outputLength).toBe(result.encoded.length);
    });

    it('出力が [0-9A-Za-z] のみで構成される', () => {
      const result = encodeBase62('Hello, World! 123', 'standard');
      expect(result.encoded).toMatch(/^[0-9A-Za-z]+$/);
    });
  });

  describe('小文字優先アルファベット (0-9a-zA-Z)', () => {
    it('出力が [0-9a-zA-Z] のみで構成される', () => {
      const result = encodeBase62('Hello', 'lower-first');
      expect(result.encoded).toMatch(/^[0-9A-Za-z]+$/);
    });

    it('標準と異なる出力を返す', () => {
      const standard = encodeBase62('Hello World', 'standard').encoded;
      const lowerFirst = encodeBase62('Hello World', 'lower-first').encoded;
      // 内容が異なることを確認（順序が違うため）
      expect(standard).not.toBe(lowerFirst);
    });
  });

  describe('マルチバイト文字', () => {
    it('日本語テキストをエンコードできる', () => {
      const result = encodeBase62('あ', 'standard');
      expect(result.inputBytes).toBe(3); // UTF-8: E3 81 82
      expect(result.encoded.length).toBeGreaterThan(0);
    });
  });

  describe('先頭ゼロバイトの処理', () => {
    it('先頭 0x00 バイトは "0" として表現される', () => {
      const bytes = new Uint8Array([0x00, 0x00, 0x01]);
      const result = encodeBase62Bytes(bytes, 'standard');
      expect(result.encoded.startsWith('00')).toBe(true);
    });
  });
});

describe('decodeBase62', () => {
  describe('標準アルファベット', () => {
    it('空文字列は空文字列を返す', () => {
      const result = decodeBase62('', 'standard');
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('');
    });

    it('空白を含む文字列を正常にデコード', () => {
      const encoded = encodeBase62('Hello', 'standard').encoded;
      const result = decodeBase62(`${encoded.slice(0, 2)} ${encoded.slice(2)}`, 'standard');
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('Hello');
    });
  });

  describe('無効な文字', () => {
    it('特殊文字は無効として検出される', () => {
      const result = decodeBase62('Hello+World', 'standard');
      expect(result.success).toBe(false);
      expect(result.error).toContain('無効な文字');
    });

    it('記号は無効として検出される', () => {
      const result = decodeBase62('abc!def', 'standard');
      expect(result.success).toBe(false);
      expect(result.error).toContain('無効な文字');
    });
  });
});

describe('ラウンドトリップ', () => {
  const testCases = ['Hello', 'Hello, World!', 'abc', '12345', 'foo bar baz'];

  for (const text of testCases) {
    it(`"${text}" のラウンドトリップ（標準）`, () => {
      const encoded = encodeBase62(text, 'standard').encoded;
      const decoded = decodeBase62(encoded, 'standard');
      expect(decoded.success).toBe(true);
      expect(decoded.decoded).toBe(text);
    });

    it(`"${text}" のラウンドトリップ（小文字優先）`, () => {
      const encoded = encodeBase62(text, 'lower-first').encoded;
      const decoded = decodeBase62(encoded, 'lower-first');
      expect(decoded.success).toBe(true);
      expect(decoded.decoded).toBe(text);
    });
  }

  it('日本語のラウンドトリップ', () => {
    const original = 'こんにちは世界';
    const encoded = encodeBase62(original, 'standard').encoded;
    const decoded = decodeBase62(encoded, 'standard');
    expect(decoded.success).toBe(true);
    expect(decoded.decoded).toBe(original);
  });
});

describe('encodeBase62Bytes', () => {
  it('バイト列から直接エンコードできる', () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
    const result = encodeBase62Bytes(bytes, 'standard');
    expect(result.inputBytes).toBe(5);
    expect(result.outputLength).toBe(result.encoded.length);
    // デコードして検証
    const decoded = decodeBase62(result.encoded, 'standard');
    expect(decoded.success).toBe(true);
    expect(decoded.decoded).toBe('Hello');
  });

  it('空のバイト列を処理できる', () => {
    const result = encodeBase62Bytes(new Uint8Array(0), 'standard');
    expect(result.encoded).toBe('');
    expect(result.inputBytes).toBe(0);
  });
});

describe('encodeIntBase62 / decodeIntBase62', () => {
  it('0 は "0" を返す', () => {
    expect(encodeIntBase62(0n, 'standard')).toBe('0');
  });

  it('10 は "A" を返す（標準: 0-9 + A から A が 10番目）', () => {
    // 標準アルファベット 0-9A-Za-z なので 10 → 'A'
    expect(encodeIntBase62(10n, 'standard')).toBe('A');
  });

  it('61 は "z" を返す（最後の文字）', () => {
    expect(encodeIntBase62(61n, 'standard')).toBe('z');
  });

  it('62 は "10" を返す（繰り上がり）', () => {
    expect(encodeIntBase62(62n, 'standard')).toBe('10');
  });

  it('大きな数値のラウンドトリップ', () => {
    const n = 1234567890123456789n;
    const encoded = encodeIntBase62(n, 'standard');
    const decoded = decodeIntBase62(encoded, 'standard');
    expect(decoded).toBe(n);
  });

  it('負の整数は例外を投げる', () => {
    expect(() => encodeIntBase62(-1n, 'standard')).toThrow();
  });

  it('小文字優先でのラウンドトリップ', () => {
    const n = 987654321n;
    const encoded = encodeIntBase62(n, 'lower-first');
    const decoded = decodeIntBase62(encoded, 'lower-first');
    expect(decoded).toBe(n);
  });

  it('decodeIntBase62: 無効な文字は例外を投げる', () => {
    expect(() => decodeIntBase62('hello!', 'standard')).toThrow();
  });
});

describe('validateBase62', () => {
  it('有効な Base62 は null を返す', () => {
    expect(validateBase62('0123456789', 'standard')).toBeNull();
    expect(validateBase62('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 'standard')).toBeNull();
    expect(validateBase62('')).toBeNull();
  });

  it('無効な文字はエラーを返す', () => {
    expect(validateBase62('abc+def')).not.toBeNull();
    expect(validateBase62('abc/def')).not.toBeNull();
    expect(validateBase62('abc=def')).not.toBeNull();
    expect(validateBase62('abc!def')).not.toBeNull();
  });

  it('空白を含む入力は null を返す（空白は除去される）', () => {
    expect(validateBase62('abc def')).toBeNull();
  });

  it('標準アルファベットはすべての英数字を許可する', () => {
    expect(validateBase62('0OIl', 'standard')).toBeNull(); // 0, O, I, l はすべて有効
  });
});

describe('既知ベクター', () => {
  for (const [text, encoded] of KNOWN_VECTORS) {
    it(`"${text}" のエンコードと一致する`, () => {
      expect(encodeBase62(text, 'standard').encoded).toBe(encoded);
    });

    it(`"${encoded}" のデコードで "\"${text}\"" を返す`, () => {
      const result = decodeBase62(encoded, 'standard');
      expect(result.success).toBe(true);
      expect(result.decoded).toBe(text);
    });
  }
});
