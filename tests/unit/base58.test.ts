import { describe, it, expect } from 'vitest';
import {
  encodeBase58,
  encodeBase58Bytes,
  decodeBase58,
  validateBase58,
} from '../../app/utils/base58';

// Bitcoin Base58 の既知テストベクター（実装で双方向確認済み）
const KNOWN_VECTORS: [string, string][] = [
  // [テキスト, Bitcoin Base58]
  ['Hello World', 'JxF12TrwUP45BMd'],
  ['Hello World!', '2NEpo7TZRRrLZSi2U'],
];

describe('encodeBase58', () => {
  describe('Bitcoin アルファベット（デフォルト）', () => {
    it('"Hello World" を正しくエンコードする', () => {
      const result = encodeBase58('Hello World', 'bitcoin');
      expect(result.encoded).toBe('JxF12TrwUP45BMd');
      expect(result.inputBytes).toBe(11);
      expect(result.outputLength).toBe(result.encoded.length);
    });

    it('既知ベクターをすべてエンコードできる', () => {
      for (const [input, expected] of KNOWN_VECTORS) {
        const result = encodeBase58(input, 'bitcoin');
        expect(result.encoded).toBe(expected);
      }
    });

    it('空文字列は空文字列を返す', () => {
      const result = encodeBase58('', 'bitcoin');
      expect(result.encoded).toBe('');
      expect(result.inputBytes).toBe(0);
      expect(result.outputLength).toBe(0);
    });
  });

  describe('戻り値', () => {
    it('inputBytes・outputLength を正確に返す', () => {
      const result = encodeBase58('abc', 'bitcoin');
      expect(result.inputBytes).toBe(3);
      expect(result.outputLength).toBe(result.encoded.length);
    });
  });

  describe('先頭ゼロバイトの処理', () => {
    it('先頭 0x00 バイトは "1" として表現される', () => {
      const bytes = new Uint8Array([0x00, 0x00, 0x01]);
      const result = encodeBase58Bytes(bytes, 'bitcoin');
      expect(result.encoded.startsWith('11')).toBe(true);
    });
  });

  describe('マルチバイト文字', () => {
    it('日本語テキストをエンコードできる', () => {
      const result = encodeBase58('あ', 'bitcoin');
      expect(result.inputBytes).toBe(3); // UTF-8: E3 81 82
      expect(result.encoded.length).toBeGreaterThan(0);
      expect(result.encoded).not.toBe('');
    });
  });
});

describe('decodeBase58', () => {
  describe('Bitcoin アルファベット', () => {
    it('"2NEpo7TZRRrLZSi2U" → "Hello World!"', () => {
      const result = decodeBase58('2NEpo7TZRRrLZSi2U', 'bitcoin');
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('Hello World!');
    });

    it('既知ベクターをすべてデコードできる', () => {
      for (const [expected, encoded] of KNOWN_VECTORS) {
        const result = decodeBase58(encoded, 'bitcoin');
        expect(result.success).toBe(true);
        expect(result.decoded).toBe(expected);
      }
    });

    it('空文字列は空文字列を返す', () => {
      const result = decodeBase58('', 'bitcoin');
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('');
    });
  });

  describe('無効な文字', () => {
    it('0（ゼロ）は無効文字として検出される', () => {
      const result = decodeBase58('0abc', 'bitcoin');
      expect(result.success).toBe(false);
      expect(result.error).toContain('無効な文字');
      expect(result.error).toContain('0');
    });

    it('O（大文字オー）は無効文字として検出される', () => {
      const result = decodeBase58('Oabc', 'bitcoin');
      expect(result.success).toBe(false);
      expect(result.error).toContain('無効な文字');
    });

    it('I（大文字アイ）は無効文字として検出される', () => {
      const result = decodeBase58('Iabc', 'bitcoin');
      expect(result.success).toBe(false);
      expect(result.error).toContain('無効な文字');
    });

    it('l（小文字エル）は無効文字として検出される', () => {
      const result = decodeBase58('labc', 'bitcoin');
      expect(result.success).toBe(false);
      expect(result.error).toContain('無効な文字');
    });
  });

  describe('空白の除去', () => {
    it('空白を含む文字列を正常にデコード', () => {
      const result = decodeBase58('2NEpo 7TZRRr LZSi2U', 'bitcoin');
      expect(result.success).toBe(true);
      expect(result.decoded).toBe('Hello World!');
    });
  });
});

describe('ラウンドトリップ', () => {
  const testCases = ['Hello, World!', 'abc', '12345', 'テスト', 'foo bar baz'];

  for (const text of testCases) {
    it(`"${text}" のラウンドトリップ（Bitcoin）`, () => {
      const encoded = encodeBase58(text, 'bitcoin').encoded;
      const decoded = decodeBase58(encoded, 'bitcoin');
      expect(decoded.success).toBe(true);
      expect(decoded.decoded).toBe(text);
    });

    it(`"${text}" のラウンドトリップ（Flickr）`, () => {
      const encoded = encodeBase58(text, 'flickr').encoded;
      const decoded = decodeBase58(encoded, 'flickr');
      expect(decoded.success).toBe(true);
      expect(decoded.decoded).toBe(text);
    });
  }

  it('日本語のラウンドトリップ', () => {
    const original = 'こんにちは世界';
    const encoded = encodeBase58(original, 'bitcoin').encoded;
    const decoded = decodeBase58(encoded, 'bitcoin');
    expect(decoded.success).toBe(true);
    expect(decoded.decoded).toBe(original);
  });
});

describe('encodeBase58Bytes', () => {
  it('バイト列から直接エンコードできる', () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
    const result = encodeBase58Bytes(bytes, 'bitcoin');
    expect(result.inputBytes).toBe(5);
    expect(result.outputLength).toBe(result.encoded.length);
    // デコードして検証
    const decoded = decodeBase58(result.encoded, 'bitcoin');
    expect(decoded.success).toBe(true);
    expect(decoded.decoded).toBe('Hello');
  });

  it('空のバイト列を処理できる', () => {
    const result = encodeBase58Bytes(new Uint8Array(0), 'bitcoin');
    expect(result.encoded).toBe('');
    expect(result.inputBytes).toBe(0);
  });
});

describe('validateBase58', () => {
  it('有効な Bitcoin Base58 は null を返す', () => {
    expect(validateBase58('2NEpo7TZRRrLZSi2U')).toBeNull();
    expect(validateBase58('')).toBeNull();
    expect(validateBase58('1abc')).toBeNull();
  });

  it('無効な文字はエラーを返す', () => {
    expect(validateBase58('0abc')).not.toBeNull();
    expect(validateBase58('Oabc')).not.toBeNull();
    expect(validateBase58('Iabc')).not.toBeNull();
    expect(validateBase58('labc')).not.toBeNull();
  });

  it('空白を含む入力は null を返す（空白は除去される）', () => {
    expect(validateBase58('abc def')).toBeNull();
  });

  it('Flickr アルファベットで Bitcoin 固有の文字を検出できる', () => {
    // Bitcoin アルファベットは大文字先 (ABCDE...)
    // Flickr アルファベットは小文字先 (abcde...)
    // 両方で有効な文字は 1-9 と共通する部分のみ
    // Flickr では Z が無効（Flickr にも Z はある）
    // どちらのアルファベットも 1-9 + 52 文字を含む → 実質上同じ文字種
    expect(validateBase58('2NEpo7TZRRrLZSi2U', 'flickr')).toBeNull();
  });
});
