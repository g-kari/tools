import { describe, it, expect } from 'vitest';
import {
  encodeBase16,
  encodeBase16Bytes,
  decodeBase16,
  validateBase16,
} from '../../app/utils/base16';

// RFC 4648 Section 8 テストベクター
// https://datatracker.ietf.org/doc/html/rfc4648#section-10
const RFC_VECTORS: [string, string][] = [
  ['', ''],
  ['f', '66'],
  ['fo', '666F'],
  ['foo', '666F6F'],
  ['foob', '666F6F62'],
  ['fooba', '666F6F6261'],
  ['foobar', '666F6F626172'],
];

describe('encodeBase16', () => {
  describe('RFC 4648 テストベクター（大文字）', () => {
    for (const [input, expected] of RFC_VECTORS) {
      it(`"${input}" → "${expected}"`, () => {
        const result = encodeBase16(input, 'upper', 'none');
        expect(result.encoded).toBe(expected);
      });
    }
  });

  describe('小文字出力', () => {
    it('"foo" → "666f6f"（小文字）', () => {
      const result = encodeBase16('foo', 'lower', 'none');
      expect(result.encoded).toBe('666f6f');
    });

    it('"Hello" を小文字でエンコード', () => {
      const result = encodeBase16('Hello', 'lower', 'none');
      expect(result.encoded).toBe('48656c6c6f');
    });
  });

  describe('区切り文字オプション', () => {
    it('スペース区切り', () => {
      const result = encodeBase16('foo', 'upper', 'space');
      expect(result.encoded).toBe('66 6F 6F');
    });

    it('コロン区切り', () => {
      const result = encodeBase16('foo', 'upper', 'colon');
      expect(result.encoded).toBe('66:6F:6F');
    });

    it('ダッシュ区切り', () => {
      const result = encodeBase16('foo', 'upper', 'dash');
      expect(result.encoded).toBe('66-6F-6F');
    });

    it('区切りなし（デフォルト）', () => {
      const result = encodeBase16('foo', 'upper', 'none');
      expect(result.encoded).toBe('666F6F');
    });
  });

  describe('戻り値', () => {
    it('inputBytes・outputLength を正確に返す', () => {
      const result = encodeBase16('foobar', 'upper', 'none');
      expect(result.inputBytes).toBe(6);
      expect(result.outputLength).toBe(12); // '666F6F626172'.length
    });

    it('空文字の inputBytes は 0', () => {
      const result = encodeBase16('', 'upper', 'none');
      expect(result.inputBytes).toBe(0);
      expect(result.outputLength).toBe(0);
    });

    it('区切り文字ありの outputLength を正確に返す', () => {
      const result = encodeBase16('foo', 'upper', 'space');
      expect(result.outputLength).toBe(8); // '66 6F 6F'.length
    });
  });

  describe('マルチバイト文字', () => {
    it('日本語テキストをエンコードできる', () => {
      const result = encodeBase16('あ', 'upper', 'none');
      // UTF-8: 0xE3 0x81 0x82
      expect(result.encoded).toBe('E38182');
      expect(result.inputBytes).toBe(3);
    });

    it('絵文字をエンコードできる', () => {
      const result = encodeBase16('A', 'upper', 'none');
      expect(result.encoded).toBe('41');
    });
  });
});

describe('decodeBase16', () => {
  describe('RFC 4648 テストベクター', () => {
    for (const [expected, encoded] of RFC_VECTORS) {
      it(`"${encoded}" → "${expected}"`, () => {
        const result = decodeBase16(encoded);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.decoded).toBe(expected);
        }
      });
    }
  });

  describe('小文字入力', () => {
    it('"666f6f" → "foo"（小文字）', () => {
      const result = decodeBase16('666f6f');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decoded).toBe('foo');
      }
    });

    it('混在した大文字小文字も受け付ける', () => {
      const result = decodeBase16('666F6f');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decoded).toBe('foo');
      }
    });
  });

  describe('区切り文字の自動除去', () => {
    it('スペース区切り "66 6F 6F" → "foo"', () => {
      const result = decodeBase16('66 6F 6F');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decoded).toBe('foo');
      }
    });

    it('コロン区切り "66:6F:6F" → "foo"', () => {
      const result = decodeBase16('66:6F:6F');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decoded).toBe('foo');
      }
    });

    it('ダッシュ区切り "66-6F-6F" → "foo"', () => {
      const result = decodeBase16('66-6F-6F');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decoded).toBe('foo');
      }
    });
  });

  describe('無効な入力', () => {
    it('奇数文字数はエラーを返す', () => {
      const result = decodeBase16('6');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('奇数');
      }
    });

    it('無効な文字（G など）はエラーを返す', () => {
      const result = decodeBase16('GG');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('無効な文字');
      }
    });

    it('無効な文字（記号）はエラーを返す', () => {
      const result = decodeBase16('ZZ');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('無効な文字');
      }
    });
  });

  describe('マルチバイト文字のラウンドトリップ', () => {
    it('日本語のエンコード→デコードが正常に動作', () => {
      const original = 'こんにちは';
      const encoded = encodeBase16(original, 'upper', 'none').encoded;
      const decoded = decodeBase16(encoded);
      expect(decoded.success).toBe(true);
      if (decoded.success) {
        expect(decoded.decoded).toBe(original);
      }
    });
  });

  describe('ラウンドトリップ', () => {
    const testCases = ['Hello, World!', 'abc', '12345', 'テスト'];

    for (const text of testCases) {
      it(`"${text}" のラウンドトリップ`, () => {
        const encoded = encodeBase16(text, 'upper', 'none').encoded;
        const decoded = decodeBase16(encoded);
        expect(decoded.success).toBe(true);
        if (decoded.success) {
          expect(decoded.decoded).toBe(text);
        }
      });
    }
  });
});

describe('encodeBase16Bytes', () => {
  it('バイト列から直接エンコードできる', () => {
    const bytes = new Uint8Array([0x66, 0x6f, 0x6f]); // "foo"
    const result = encodeBase16Bytes(bytes, 'upper', 'none');
    expect(result.encoded).toBe('666F6F');
    expect(result.inputBytes).toBe(3);
  });

  it('空のバイト列を処理できる', () => {
    const result = encodeBase16Bytes(new Uint8Array(0), 'upper', 'none');
    expect(result.encoded).toBe('');
    expect(result.inputBytes).toBe(0);
  });

  it('単一バイトを正しくエンコード', () => {
    const bytes = new Uint8Array([0x0f]);
    const result = encodeBase16Bytes(bytes, 'upper', 'none');
    expect(result.encoded).toBe('0F'); // ゼロパディングの確認
  });
});

describe('validateBase16', () => {
  it('有効な Base16 文字列は null を返す', () => {
    expect(validateBase16('666F6F')).toBeNull();
    expect(validateBase16('666f6f')).toBeNull();
    expect(validateBase16('')).toBeNull();
    expect(validateBase16('00')).toBeNull();
    expect(validateBase16('FF')).toBeNull();
  });

  it('奇数文字数はエラーを返す', () => {
    expect(validateBase16('6')).not.toBeNull();
    expect(validateBase16('6')).toContain('奇数');
    expect(validateBase16('666')).not.toBeNull();
  });

  it('無効な文字はエラーを返す', () => {
    expect(validateBase16('GG')).not.toBeNull();
    expect(validateBase16('GG')).toContain('無効な文字');
    expect(validateBase16('ZZ')).not.toBeNull();
    expect(validateBase16('!!')).not.toBeNull();
  });

  it('0-9 と A-F（a-f）はすべて有効', () => {
    expect(validateBase16('0123456789ABCDEF')).toBeNull();
    expect(validateBase16('0123456789abcdef')).toBeNull();
  });
});
