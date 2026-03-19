import { describe, test, expect } from 'vitest';
import {
  generateAsciiTable,
  filterAsciiEntries,
  toBinary,
  toHex,
  toOctal,
  ASCII_TABLE,
} from '../../app/utils/ascii-table';

describe('generateAsciiTable', () => {
  test('128エントリを生成する', () => {
    const table = generateAsciiTable();
    expect(table).toHaveLength(128);
  });

  test('最初のエントリはNUL (0)', () => {
    const table = generateAsciiTable();
    expect(table[0]).toMatchObject({
      dec: 0,
      hex: '0x00',
      oct: '000',
      bin: '00000000',
      char: 'NUL',
      printable: false,
      category: 'control',
    });
  });

  test('スペース (32) は印刷可能文字', () => {
    const table = generateAsciiTable();
    const space = table[32]!;
    expect(space.dec).toBe(32);
    expect(space.char).toBe(' ');
    expect(space.printable).toBe(true);
    expect(space.category).toBe('printable');
    expect(space.description).toBe('Space');
  });

  test('大文字A (65) のエントリ', () => {
    const table = generateAsciiTable();
    const A = table[65]!;
    expect(A.dec).toBe(65);
    expect(A.hex).toBe('0x41');
    expect(A.oct).toBe('101');
    expect(A.char).toBe('A');
    expect(A.printable).toBe(true);
    expect(A.entity).toBe('&#65;');
  });

  test('改行 (10) の説明', () => {
    const table = generateAsciiTable();
    const lf = table[10]!;
    expect(lf.char).toBe('LF');
    expect(lf.printable).toBe(false);
    expect(lf.category).toBe('control');
    expect(lf.description).toContain('Line Feed');
  });

  test('DEL (127) は制御文字', () => {
    const table = generateAsciiTable();
    const del = table[127]!;
    expect(del.dec).toBe(127);
    expect(del.char).toBe('DEL');
    expect(del.printable).toBe(false);
    expect(del.category).toBe('control');
  });

  test('全10進数は 0〜127 の範囲', () => {
    const table = generateAsciiTable();
    table.forEach((entry, i) => {
      expect(entry.dec).toBe(i);
    });
  });

  test('バイナリは8桁', () => {
    const table = generateAsciiTable();
    table.forEach((entry) => {
      expect(entry.bin).toHaveLength(8);
      expect(entry.bin).toMatch(/^[01]{8}$/);
    });
  });

  test('HTMLエンティティの形式', () => {
    const table = generateAsciiTable();
    table.forEach((entry) => {
      expect(entry.entity).toBe(`&#${entry.dec};`);
    });
  });
});

describe('filterAsciiEntries', () => {
  test('filter="all" は全エントリを返す', () => {
    const result = filterAsciiEntries(ASCII_TABLE, 'all', '');
    expect(result).toHaveLength(128);
  });

  test('filter="control" は制御文字のみ返す', () => {
    const result = filterAsciiEntries(ASCII_TABLE, 'control', '');
    expect(result.every((e) => e.category === 'control')).toBe(true);
    expect(result).toHaveLength(33); // 0-31 + 127
  });

  test('filter="printable" は印刷可能文字のみ返す', () => {
    const result = filterAsciiEntries(ASCII_TABLE, 'printable', '');
    expect(result.every((e) => e.category === 'printable')).toBe(true);
    expect(result).toHaveLength(95); // 32-126
  });

  test('query="65" は10進数65を含むエントリを返す', () => {
    const result = filterAsciiEntries(ASCII_TABLE, 'all', '65');
    expect(result.some((e) => e.dec === 65)).toBe(true);
  });

  test('query="0x41" は16進数0x41のエントリを返す', () => {
    const result = filterAsciiEntries(ASCII_TABLE, 'all', '0x41');
    expect(result.some((e) => e.dec === 65)).toBe(true);
  });

  test('query="nul" (大文字小文字無視) はNULを返す', () => {
    const result = filterAsciiEntries(ASCII_TABLE, 'all', 'nul');
    expect(result.some((e) => e.dec === 0)).toBe(true);
  });

  test('空のqueryはフィルタリングしない', () => {
    const result = filterAsciiEntries(ASCII_TABLE, 'all', '');
    expect(result).toHaveLength(128);
  });

  test('空白のみのqueryはフィルタリングしない', () => {
    const result = filterAsciiEntries(ASCII_TABLE, 'all', '   ');
    expect(result).toHaveLength(128);
  });

  test('存在しないqueryは空配列を返す', () => {
    const result = filterAsciiEntries(ASCII_TABLE, 'all', 'xyzzy99999');
    expect(result).toHaveLength(0);
  });

  test('説明でも検索できる', () => {
    const result = filterAsciiEntries(ASCII_TABLE, 'all', 'space');
    expect(result.some((e) => e.dec === 32)).toBe(true);
  });
});

describe('toBinary', () => {
  test('0 は "00000000"', () => {
    expect(toBinary(0)).toBe('00000000');
  });

  test('127 は "01111111"', () => {
    expect(toBinary(127)).toBe('01111111');
  });

  test('65 は "01000001"', () => {
    expect(toBinary(65)).toBe('01000001');
  });
});

describe('toHex', () => {
  test('0 は "0x00"', () => {
    expect(toHex(0)).toBe('0x00');
  });

  test('65 は "0x41"', () => {
    expect(toHex(65)).toBe('0x41');
  });

  test('127 は "0x7F"', () => {
    expect(toHex(127)).toBe('0x7F');
  });
});

describe('toOctal', () => {
  test('0 は "000"', () => {
    expect(toOctal(0)).toBe('000');
  });

  test('65 は "101"', () => {
    expect(toOctal(65)).toBe('101');
  });

  test('127 は "177"', () => {
    expect(toOctal(127)).toBe('177');
  });
});
