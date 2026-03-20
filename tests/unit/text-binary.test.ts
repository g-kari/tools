import { describe, expect, it } from 'vitest';
import {
  textToBinary,
  binaryToText,
  looksLikeBinary,
  validateBinary,
} from '../../app/utils/text-binary';

describe('textToBinary', () => {
  describe('ASCII 文字', () => {
    it('"A" を正しく変換する', () => {
      const result = textToBinary('A');
      expect(result.encoded).toBe('01000001');
      expect(result.inputBytes).toBe(1);
      expect(result.charCount).toBe(1);
    });

    it('"Hello" をスペース区切りで変換する', () => {
      const result = textToBinary('Hello', 'space');
      expect(result.encoded).toBe(
        '01001000 01100101 01101100 01101100 01101111',
      );
      expect(result.inputBytes).toBe(5);
      expect(result.charCount).toBe(5);
    });

    it('"AB" を区切りなしで変換する', () => {
      const result = textToBinary('AB', 'none');
      expect(result.encoded).toBe('0100000101000010');
    });

    it('"A,B" をコンマ区切りで変換する', () => {
      const result = textToBinary('AB', 'comma');
      expect(result.encoded).toBe('01000001,01000010');
    });

    it('"AB" を改行区切りで変換する', () => {
      const result = textToBinary('AB', 'newline');
      expect(result.encoded).toBe('01000001\n01000010');
    });
  });

  describe('日本語文字（UTF-8 マルチバイト）', () => {
    it('"あ" は 3 バイト（24 ビット）になる', () => {
      const result = textToBinary('あ');
      expect(result.inputBytes).toBe(3);
      expect(result.charCount).toBe(1);
      // UTF-8 の "あ" は E3 81 82
      expect(result.encoded).toBe('11100011 10000001 10000010');
    });

    it('"日本" は 6 バイトになる', () => {
      const result = textToBinary('日本');
      expect(result.inputBytes).toBe(6);
      expect(result.charCount).toBe(2);
    });
  });

  describe('空文字列', () => {
    it('空文字列はバイト数 0 を返す', () => {
      const result = textToBinary('');
      expect(result.encoded).toBe('');
      expect(result.inputBytes).toBe(0);
      expect(result.charCount).toBe(0);
    });
  });

  describe('byteBreakdown', () => {
    it('"A" の byteBreakdown が正しい', () => {
      const result = textToBinary('A');
      expect(result.byteBreakdown).toHaveLength(1);
      expect(result.byteBreakdown[0]?.char).toBe('A');
      expect(result.byteBreakdown[0]?.codePoint).toBe('U+0041');
      expect(result.byteBreakdown[0]?.hexBytes).toEqual(['41']);
      expect(result.byteBreakdown[0]?.binaryBytes).toEqual(['01000001']);
    });

    it('"あ" の byteBreakdown に 3 バイトが含まれる', () => {
      const result = textToBinary('あ');
      expect(result.byteBreakdown[0]?.hexBytes).toHaveLength(3);
      expect(result.byteBreakdown[0]?.binaryBytes).toHaveLength(3);
      expect(result.byteBreakdown[0]?.codePoint).toBe('U+3042');
    });

    it('64 文字を超えると byteBreakdown は 64 件に切り捨てる', () => {
      const long = 'A'.repeat(100);
      const result = textToBinary(long);
      expect(result.byteBreakdown).toHaveLength(64);
    });
  });
});

describe('binaryToText', () => {
  describe('正常なデコード', () => {
    it('空文字列はデコード成功し空文字列を返す', () => {
      const result = binaryToText('');
      expect(result.success).toBe(true);
      if (result.success) expect(result.decoded).toBe('');
    });

    it('"01000001" を "A" にデコードする', () => {
      const result = binaryToText('01000001');
      expect(result.success).toBe(true);
      if (result.success) expect(result.decoded).toBe('A');
    });

    it('スペース区切りの "Hello" をデコードする', () => {
      const result = binaryToText(
        '01001000 01100101 01101100 01101100 01101111',
      );
      expect(result.success).toBe(true);
      if (result.success) expect(result.decoded).toBe('Hello');
    });

    it('コンマ区切りをデコードできる', () => {
      const result = binaryToText('01000001,01000010');
      expect(result.success).toBe(true);
      if (result.success) expect(result.decoded).toBe('AB');
    });

    it('改行区切りをデコードできる', () => {
      const result = binaryToText('01000001\n01000010');
      expect(result.success).toBe(true);
      if (result.success) expect(result.decoded).toBe('AB');
    });

    it('"あ" の UTF-8 バイナリをデコードする', () => {
      const result = binaryToText('11100011 10000001 10000010');
      expect(result.success).toBe(true);
      if (result.success) expect(result.decoded).toBe('あ');
    });
  });

  describe('往復変換', () => {
    it('ASCII テキストで往復変換が成功する', () => {
      const original = 'Hello World';
      const encoded = textToBinary(original, 'space');
      const decoded = binaryToText(encoded.encoded);
      expect(decoded.success).toBe(true);
      if (decoded.success) expect(decoded.decoded).toBe(original);
    });

    it('日本語テキストで往復変換が成功する', () => {
      const original = 'こんにちは';
      const encoded = textToBinary(original, 'space');
      const decoded = binaryToText(encoded.encoded);
      expect(decoded.success).toBe(true);
      if (decoded.success) expect(decoded.decoded).toBe(original);
    });

    it('混合テキストで往復変換が成功する', () => {
      const original = 'Hello, 世界!';
      const encoded = textToBinary(original, 'space');
      const decoded = binaryToText(encoded.encoded);
      expect(decoded.success).toBe(true);
      if (decoded.success) expect(decoded.decoded).toBe(original);
    });
  });

  describe('エラーケース', () => {
    it('無効な文字（0/1 以外）を含む場合はエラー', () => {
      const result = binaryToText('0100ABC1');
      expect(result.success).toBe(false);
    });

    it('8ビット以外の長さのトークンはエラー', () => {
      const result = binaryToText('010 101');
      expect(result.success).toBe(false);
    });
  });
});

describe('validateBinary', () => {
  it('有効なバイナリ（スペース区切り8ビット）は null を返す', () => {
    expect(validateBinary('01000001 01000010')).toBeNull();
  });

  it('空文字列は null を返す', () => {
    expect(validateBinary('')).toBeNull();
    expect(validateBinary('   ')).toBeNull();
  });

  it('無効な文字を含む場合はエラーメッセージを返す', () => {
    const result = validateBinary('0100ABC1');
    expect(result).not.toBeNull();
    expect(result).toContain('無効な文字');
  });

  it('長さが 8 でも 4 でもないトークンはエラー', () => {
    const result = validateBinary('010 1011');
    expect(result).not.toBeNull();
  });
});

describe('looksLikeBinary', () => {
  it('0と1のみの文字列はバイナリと判定する', () => {
    expect(looksLikeBinary('01000001')).toBe(true);
    expect(looksLikeBinary('01000001 01000010')).toBe(true);
    expect(looksLikeBinary('01000001,01000010')).toBe(true);
  });

  it('テキストはバイナリでないと判定する', () => {
    expect(looksLikeBinary('Hello')).toBe(false);
    expect(looksLikeBinary('こんにちは')).toBe(false);
    expect(looksLikeBinary('ABC123')).toBe(false);
  });

  it('空文字列は false を返す', () => {
    expect(looksLikeBinary('')).toBe(false);
    expect(looksLikeBinary('   ')).toBe(false);
  });
});
