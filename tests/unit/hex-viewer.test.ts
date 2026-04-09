import { describe, it, expect } from 'vite-plus/test';
import {
  byteToHex,
  byteToAsciiChar,
  formatOffset,
  toHexRows,
  toHexDumpText,
  textToBytes,
  formatFileSize,
  DEFAULT_HEX_OPTIONS,
} from '~/utils/hex-viewer';

describe('byteToHex', () => {
  it('0 を "00" に変換する', () => {
    expect(byteToHex(0, false)).toBe('00');
  });
  it('255 を "ff" に変換する', () => {
    expect(byteToHex(255, false)).toBe('ff');
  });
  it('uppercase=true で大文字に変換する', () => {
    expect(byteToHex(255, true)).toBe('FF');
  });
  it('0x1a を "1a" に変換する', () => {
    expect(byteToHex(0x1a, false)).toBe('1a');
  });
});

describe('byteToAsciiChar', () => {
  it('表示可能文字（0x41 = A）をそのまま返す', () => {
    expect(byteToAsciiChar(0x41)).toBe('A');
  });
  it('スペース（0x20）をそのまま返す', () => {
    expect(byteToAsciiChar(0x20)).toBe(' ');
  });
  it('DEL（0x7e = ~）をそのまま返す', () => {
    expect(byteToAsciiChar(0x7e)).toBe('~');
  });
  it('制御文字（0x00）を "." に変換する', () => {
    expect(byteToAsciiChar(0x00)).toBe('.');
  });
  it('制御文字（0x1f）を "." に変換する', () => {
    expect(byteToAsciiChar(0x1f)).toBe('.');
  });
  it('0x7f を "." に変換する', () => {
    expect(byteToAsciiChar(0x7f)).toBe('.');
  });
  it('0x80以上を "." に変換する', () => {
    expect(byteToAsciiChar(0x80)).toBe('.');
    expect(byteToAsciiChar(0xff)).toBe('.');
  });
});

describe('formatOffset', () => {
  it('0 を "00000000" にフォーマットする', () => {
    expect(formatOffset(0, false)).toBe('00000000');
  });
  it('16 を "00000010" にフォーマットする', () => {
    expect(formatOffset(16, false)).toBe('00000010');
  });
  it('uppercase=true で大文字にする', () => {
    expect(formatOffset(0xabc, true)).toBe('00000ABC');
  });
  it('大きな値も正しくフォーマットする', () => {
    expect(formatOffset(0xdeadbeef, false)).toBe('deadbeef');
  });
});

describe('toHexRows', () => {
  it('空データは空配列を返す', () => {
    const rows = toHexRows(new Uint8Array([]), DEFAULT_HEX_OPTIONS);
    expect(rows).toHaveLength(0);
  });

  it('16バイト以下のデータは1行になる', () => {
    const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
    const rows = toHexRows(data, DEFAULT_HEX_OPTIONS);
    expect(rows).toHaveLength(1);
    expect(rows[0].offset).toBe(0);
    expect(rows[0].hexBytes.slice(0, 5)).toEqual(['48', '65', '6c', '6c', '6f']);
    // 残りはパディング（空文字）
    expect(rows[0].hexBytes[15]).toBe('');
    expect(rows[0].ascii).toBe('Hello');
  });

  it('17バイトのデータは2行になる', () => {
    const data = new Uint8Array(17).fill(0x41); // 'A' x 17
    const rows = toHexRows(data, DEFAULT_HEX_OPTIONS);
    expect(rows).toHaveLength(2);
    expect(rows[0].offset).toBe(0);
    expect(rows[1].offset).toBe(16);
  });

  it('bytesPerRow=8 の場合、8バイトごとに行が分かれる', () => {
    const data = new Uint8Array(16).fill(0x00);
    const rows = toHexRows(data, { ...DEFAULT_HEX_OPTIONS, bytesPerRow: 8 });
    expect(rows).toHaveLength(2);
    expect(rows[0].hexBytes).toHaveLength(8);
  });

  it('uppercase=true の場合、16進数が大文字になる', () => {
    const data = new Uint8Array([0xab, 0xcd]);
    const rows = toHexRows(data, { ...DEFAULT_HEX_OPTIONS, uppercase: true });
    expect(rows[0].hexBytes[0]).toBe('AB');
    expect(rows[0].hexBytes[1]).toBe('CD');
  });

  it('maxBytes を超えたデータはカットされる', () => {
    const data = new Uint8Array(100).fill(0x00);
    const rows = toHexRows(data, { ...DEFAULT_HEX_OPTIONS, maxBytes: 16 });
    expect(rows).toHaveLength(1);
  });

  it('制御文字は ASCII 表示で "." になる', () => {
    const data = new Uint8Array([0x00, 0x41, 0x0a]); // NUL, A, LF
    const rows = toHexRows(data, DEFAULT_HEX_OPTIONS);
    expect(rows[0].ascii).toBe('.A.');
  });
});

describe('toHexDumpText', () => {
  it('空データは空文字列を返す', () => {
    const result = toHexDumpText(new Uint8Array([]), DEFAULT_HEX_OPTIONS);
    expect(result).toBe('');
  });

  it('正しい xxd 形式の出力を生成する', () => {
    const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
    const result = toHexDumpText(data, DEFAULT_HEX_OPTIONS);
    expect(result).toContain('00000000:');
    expect(result).toContain('48');
    expect(result).toContain('Hello');
  });

  it('maxBytes 超過時に省略メッセージを追加する', () => {
    const data = new Uint8Array(20).fill(0x00);
    const result = toHexDumpText(data, { ...DEFAULT_HEX_OPTIONS, maxBytes: 16 });
    expect(result).toContain('4 バイト省略');
  });
});

describe('textToBytes', () => {
  it('"Hello" を UTF-8 バイト配列に変換する', () => {
    const bytes = textToBytes('Hello');
    expect(bytes).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it('日本語を UTF-8 バイト配列に変換する', () => {
    const bytes = textToBytes('あ');
    // UTF-8: 0xe3, 0x81, 0x82
    expect(bytes).toEqual(new Uint8Array([0xe3, 0x81, 0x82]));
  });

  it('空文字列は空のバイト配列を返す', () => {
    expect(textToBytes('')).toEqual(new Uint8Array([]));
  });
});

describe('formatFileSize', () => {
  it('1023 B は "1023 B" と表示される', () => {
    expect(formatFileSize(1023)).toBe('1023 B');
  });
  it('1024 B は "1.0 KB" と表示される', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });
  it('1.5 MB は "1.5 MB" と表示される', () => {
    expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
  });
});
