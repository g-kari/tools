import { describe, it, expect } from 'vitest';
import {
  encodePunycodeLabel,
  decodePunycodeLabel,
  encodeDomain,
  decodeDomain,
  autoConvertDomain,
} from '~/utils/punycode';

// ---------------------------------------------------------------------------
// RFC 3492 公式テストベクター（Section 7.1）より抜粋
// ---------------------------------------------------------------------------

describe('encodePunycodeLabel', () => {
  it('ASCII のみのラベルはそのまま返す', () => {
    expect(encodePunycodeLabel('example')).toBe('example');
    expect(encodePunycodeLabel('google')).toBe('google');
  });

  it('日本語ラベルをエンコードする', () => {
    // 「日本語」(U+65E5 U+672C U+8A9E) の正しい Punycode
    expect(encodePunycodeLabel('日本語')).toBe('xn--wgv71a119e');
  });

  it('ドイツ語ウムラウトをエンコードする', () => {
    // 「münchen」→ xn--mnchen-3ya
    expect(encodePunycodeLabel('münchen')).toBe('xn--mnchen-3ya');
  });

  it('中国語ラベルをエンコードする', () => {
    // 「中文」→ xn--fiq228c
    expect(encodePunycodeLabel('中文')).toBe('xn--fiq228c');
  });

  it('混在ラベル（ASCII + Unicode）をエンコードする', () => {
    // 「bücher」→ xn--bcher-kva
    expect(encodePunycodeLabel('bücher')).toBe('xn--bcher-kva');
  });

  it('韓国語ラベルをエンコードする', () => {
    // 「한국」→ xn--3e0b707e
    expect(encodePunycodeLabel('한국')).toBe('xn--3e0b707e');
  });
});

describe('decodePunycodeLabel', () => {
  it('xn-- で始まらないラベルはそのまま返す', () => {
    expect(decodePunycodeLabel('example')).toBe('example');
    expect(decodePunycodeLabel('google')).toBe('google');
  });

  it('日本語ラベルをデコードする', () => {
    expect(decodePunycodeLabel('xn--wgv71a119e')).toBe('日本語');
  });

  it('ドイツ語ウムラウトをデコードする', () => {
    expect(decodePunycodeLabel('xn--mnchen-3ya')).toBe('münchen');
  });

  it('中国語ラベルをデコードする', () => {
    expect(decodePunycodeLabel('xn--fiq228c')).toBe('中文');
  });

  it('混在ラベルをデコードする', () => {
    expect(decodePunycodeLabel('xn--bcher-kva')).toBe('bücher');
  });

  it('韓国語ラベルをデコードする', () => {
    expect(decodePunycodeLabel('xn--3e0b707e')).toBe('한국');
  });
});

describe('エンコード/デコードの往復整合性', () => {
  const testInputs = ['日本語', 'münchen', '中文', '한국', 'bücher', 'ñoño', 'café'];

  for (const input of testInputs) {
    it(`"${input}" をエンコードしてデコードすると元の文字列に戻る`, () => {
      const encoded = encodePunycodeLabel(input);
      expect(encoded).toMatch(/^xn--/);
      const decoded = decodePunycodeLabel(encoded);
      expect(decoded).toBe(input);
    });
  }
});

describe('encodeDomain', () => {
  it('ASCII ドメインはそのまま返す', () => {
    const result = encodeDomain('example.com');
    expect(result.output).toBe('example.com');
    expect(result.hasConversion).toBe(false);
  });

  it('日本語ドメインをエンコードする', () => {
    const result = encodeDomain('日本語.jp');
    expect(result.output).toBe('xn--wgv71a119e.jp');
    expect(result.hasConversion).toBe(true);
    expect(result.labels).toHaveLength(2);
    expect(result.labels[0].changed).toBe(true);
    expect(result.labels[1].changed).toBe(false);
  });

  it('サブドメイン付きドメインをエンコードする', () => {
    const result = encodeDomain('www.日本語.jp');
    expect(result.output).toBe('www.xn--wgv71a119e.jp');
    expect(result.labels[0].changed).toBe(false);
    expect(result.labels[1].changed).toBe(true);
    expect(result.labels[2].changed).toBe(false);
  });

  it('複数ラベルが Unicode のドメインをエンコードする', () => {
    const result = encodeDomain('日本語.日本');
    expect(result.hasConversion).toBe(true);
    expect(result.labels.every((l) => l.changed)).toBe(true);
  });
});

describe('decodeDomain', () => {
  it('xn-- なしのドメインはそのまま返す', () => {
    const result = decodeDomain('example.com');
    expect(result.output).toBe('example.com');
    expect(result.hasConversion).toBe(false);
  });

  it('Punycode ドメインをデコードする', () => {
    const result = decodeDomain('xn--wgv71a119e.jp');
    expect(result.output).toBe('日本語.jp');
    expect(result.hasConversion).toBe(true);
  });

  it('混在ドメインをデコードする', () => {
    const result = decodeDomain('www.xn--wgv71a119e.jp');
    expect(result.output).toBe('www.日本語.jp');
  });
});

describe('autoConvertDomain', () => {
  it('Unicode ドメインはエンコードモードを選択する', () => {
    const { mode, result } = autoConvertDomain('日本語.jp');
    expect(mode).toBe('encode');
    expect(result.output).toBe('xn--wgv71a119e.jp');
  });

  it('Punycode ドメインはデコードモードを選択する', () => {
    const { mode, result } = autoConvertDomain('xn--wgv71a119e.jp');
    expect(mode).toBe('decode');
    expect(result.output).toBe('日本語.jp');
  });

  it('ASCII ドメインはエンコードモード（変換なし）を選択する', () => {
    const { mode, result } = autoConvertDomain('example.com');
    expect(mode).toBe('encode');
    expect(result.output).toBe('example.com');
    expect(result.hasConversion).toBe(false);
  });
});
