import { describe, it, expect } from 'vite-plus/test';
import {
  encodeText,
  decodeBytes,
  toHexString,
  hexToBytes,
  detectEncoding,
  encodeToAll,
  SUPPORTED_ENCODINGS,
} from '../../app/utils/encoding';

describe('encodeText', () => {
  it('UTF-8 でASCIIテキストをエンコードできる', () => {
    const bytes = encodeText('Hello', 'UTF8');
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it('UTF-8 で日本語をエンコードできる', () => {
    const bytes = encodeText('あ', 'UTF8');
    // UTF-8: あ = E3 81 82
    expect(bytes).toEqual(new Uint8Array([0xe3, 0x81, 0x82]));
  });

  it('Shift_JIS で日本語をエンコードできる', () => {
    const bytes = encodeText('あ', 'SJIS');
    // Shift_JIS: あ = 82 A0
    expect(bytes).toEqual(new Uint8Array([0x82, 0xa0]));
  });

  it('EUC-JP で日本語をエンコードできる', () => {
    const bytes = encodeText('あ', 'EUCJP');
    // EUC-JP: あ = A4 A2
    expect(bytes).toEqual(new Uint8Array([0xa4, 0xa2]));
  });

  it('空文字列は空バイト列を返す', () => {
    const bytes = encodeText('', 'UTF8');
    expect(bytes.length).toBe(0);
  });
});

describe('decodeBytes', () => {
  it('UTF-8 バイト列をデコードできる', () => {
    const bytes = new Uint8Array([0xe3, 0x81, 0x82]); // あ
    const text = decodeBytes(bytes, 'UTF8');
    expect(text).toBe('あ');
  });

  it('Shift_JIS バイト列をデコードできる', () => {
    const bytes = new Uint8Array([0x82, 0xa0]); // あ
    const text = decodeBytes(bytes, 'SJIS');
    expect(text).toBe('あ');
  });

  it('EUC-JP バイト列をデコードできる', () => {
    const bytes = new Uint8Array([0xa4, 0xa2]); // あ
    const text = decodeBytes(bytes, 'EUCJP');
    expect(text).toBe('あ');
  });

  it('空バイト列は空文字列を返す', () => {
    const text = decodeBytes(new Uint8Array(0), 'UTF8');
    expect(text).toBe('');
  });
});

describe('toHexString', () => {
  it('バイト列を16進数文字列に変換できる', () => {
    const bytes = new Uint8Array([0xe3, 0x81, 0x82]);
    expect(toHexString(bytes)).toBe('E3 81 82');
  });

  it('1バイトを正しくパディングする', () => {
    const bytes = new Uint8Array([0x0a, 0xff]);
    expect(toHexString(bytes)).toBe('0A FF');
  });

  it('空バイト列は空文字列を返す', () => {
    expect(toHexString(new Uint8Array(0))).toBe('');
  });
});

describe('hexToBytes', () => {
  it('スペース区切り16進数をバイト列に変換できる', () => {
    const bytes = hexToBytes('E3 81 82');
    expect(bytes).toEqual(new Uint8Array([0xe3, 0x81, 0x82]));
  });

  it('スペースなしの16進数も変換できる', () => {
    const bytes = hexToBytes('E38182');
    expect(bytes).toEqual(new Uint8Array([0xe3, 0x81, 0x82]));
  });

  it('小文字16進数も変換できる', () => {
    const bytes = hexToBytes('e3 81 82');
    expect(bytes).toEqual(new Uint8Array([0xe3, 0x81, 0x82]));
  });

  it('コロン区切りも受け付ける', () => {
    const bytes = hexToBytes('E3:81:82');
    expect(bytes).toEqual(new Uint8Array([0xe3, 0x81, 0x82]));
  });

  it('無効な16進数はnullを返す', () => {
    expect(hexToBytes('GG')).toBeNull();
  });

  it('奇数文字数はnullを返す', () => {
    expect(hexToBytes('E38')).toBeNull();
  });

  it('空文字列は空バイト列を返す', () => {
    const bytes = hexToBytes('');
    expect(bytes).toEqual(new Uint8Array(0));
  });
});

describe('detectEncoding', () => {
  it('UTF-8 バイト列を検出できる', () => {
    const bytes = encodeText('テスト', 'UTF8');
    const detected = detectEncoding(bytes);
    expect(detected).toBe('UTF8');
  });

  it('Shift_JIS バイト列を検出できる', () => {
    const bytes = encodeText('テスト', 'SJIS');
    const detected = detectEncoding(bytes);
    expect(detected).toBe('SJIS');
  });

  it('EUC-JP バイト列を検出できる', () => {
    const bytes = encodeText('テスト', 'EUCJP');
    const detected = detectEncoding(bytes);
    expect(detected).toBe('EUCJP');
  });
});

describe('encodeToAll', () => {
  it('全サポート文字コードの結果を返す', () => {
    const results = encodeToAll('Hello');
    expect(results.length).toBe(SUPPORTED_ENCODINGS.length);
  });

  it('各結果にエンコード情報・バイト列・Hexが含まれる', () => {
    const results = encodeToAll('あ');
    for (const result of results) {
      expect(result.encoding).toBeDefined();
      if (!result.error) {
        expect(result.bytes).toBeInstanceOf(Uint8Array);
        expect(result.byteCount).toBeGreaterThan(0);
        expect(result.hex).toBeTruthy();
      }
    }
  });

  it('空文字列は全てバイト数0を返す', () => {
    const results = encodeToAll('');
    for (const result of results) {
      expect(result.byteCount).toBe(0);
    }
  });

  it('UTF-8 の結果が最初に含まれる', () => {
    const results = encodeToAll('test');
    expect(results[0].encoding.code).toBe('UTF8');
  });
});

describe('エンコード→デコードの往復変換', () => {
  const testStrings = ['Hello', 'テスト', 'あいうえお', '日本語テスト123'];
  const encodings: Array<'UTF8' | 'SJIS' | 'EUCJP'> = ['UTF8', 'SJIS', 'EUCJP'];

  for (const str of testStrings) {
    for (const enc of encodings) {
      it(`"${str}" を ${enc} でエンコード→デコードできる`, () => {
        const encoded = encodeText(str, enc);
        const decoded = decodeBytes(encoded, enc);
        expect(decoded).toBe(str);
      });
    }
  }
});
