import { describe, it, expect } from 'vitest';
import {
  convertCssLine,
  convertCss,
  PROPERTY_MAP,
  VALUE_MAP,
} from '../../app/utils/css-logical';

describe('PROPERTY_MAP', () => {
  it('margin の物理プロパティが含まれている', () => {
    expect(PROPERTY_MAP['margin-top']).toBe('margin-block-start');
    expect(PROPERTY_MAP['margin-bottom']).toBe('margin-block-end');
    expect(PROPERTY_MAP['margin-left']).toBe('margin-inline-start');
    expect(PROPERTY_MAP['margin-right']).toBe('margin-inline-end');
  });

  it('padding の物理プロパティが含まれている', () => {
    expect(PROPERTY_MAP['padding-top']).toBe('padding-block-start');
    expect(PROPERTY_MAP['padding-bottom']).toBe('padding-block-end');
    expect(PROPERTY_MAP['padding-left']).toBe('padding-inline-start');
    expect(PROPERTY_MAP['padding-right']).toBe('padding-inline-end');
  });

  it('border-radius の物理プロパティが含まれている', () => {
    expect(PROPERTY_MAP['border-top-left-radius']).toBe('border-start-start-radius');
    expect(PROPERTY_MAP['border-top-right-radius']).toBe('border-start-end-radius');
    expect(PROPERTY_MAP['border-bottom-left-radius']).toBe('border-end-start-radius');
    expect(PROPERTY_MAP['border-bottom-right-radius']).toBe('border-end-end-radius');
  });

  it('サイジングプロパティが含まれている', () => {
    expect(PROPERTY_MAP['width']).toBe('inline-size');
    expect(PROPERTY_MAP['height']).toBe('block-size');
    expect(PROPERTY_MAP['min-width']).toBe('min-inline-size');
    expect(PROPERTY_MAP['min-height']).toBe('min-block-size');
    expect(PROPERTY_MAP['max-width']).toBe('max-inline-size');
    expect(PROPERTY_MAP['max-height']).toBe('max-block-size');
  });

  it('position inset プロパティが含まれている', () => {
    expect(PROPERTY_MAP['top']).toBe('inset-block-start');
    expect(PROPERTY_MAP['bottom']).toBe('inset-block-end');
    expect(PROPERTY_MAP['left']).toBe('inset-inline-start');
    expect(PROPERTY_MAP['right']).toBe('inset-inline-end');
  });

  it('overflow プロパティが含まれている', () => {
    expect(PROPERTY_MAP['overflow-x']).toBe('overflow-inline');
    expect(PROPERTY_MAP['overflow-y']).toBe('overflow-block');
  });
});

describe('VALUE_MAP', () => {
  it('float の値マッピングが含まれている', () => {
    expect(VALUE_MAP['float']?.['left']).toBe('inline-start');
    expect(VALUE_MAP['float']?.['right']).toBe('inline-end');
  });

  it('text-align の値マッピングが含まれている', () => {
    expect(VALUE_MAP['text-align']?.['left']).toBe('start');
    expect(VALUE_MAP['text-align']?.['right']).toBe('end');
  });

  it('resize の値マッピングが含まれている', () => {
    expect(VALUE_MAP['resize']?.['horizontal']).toBe('inline');
    expect(VALUE_MAP['resize']?.['vertical']).toBe('block');
  });
});

describe('convertCssLine', () => {
  it('margin-left を変換する', () => {
    const result = convertCssLine('  margin-left: 16px;');
    expect(result.changed).toBe(true);
    expect(result.converted).toBe('  margin-inline-start: 16px;');
  });

  it('padding-top を変換する', () => {
    const result = convertCssLine('  padding-top: 8px;');
    expect(result.changed).toBe(true);
    expect(result.converted).toBe('  padding-block-start: 8px;');
  });

  it('width を変換する', () => {
    const result = convertCssLine('  width: 320px;');
    expect(result.changed).toBe(true);
    expect(result.converted).toBe('  inline-size: 320px;');
  });

  it('left を変換する', () => {
    const result = convertCssLine('  left: 0;');
    expect(result.changed).toBe(true);
    expect(result.converted).toBe('  inset-inline-start: 0;');
  });

  it('float: left を変換する', () => {
    const result = convertCssLine('  float: left;');
    expect(result.changed).toBe(true);
    expect(result.converted).toBe('  float: inline-start;');
  });

  it('text-align: right を変換する', () => {
    const result = convertCssLine('  text-align: right;');
    expect(result.changed).toBe(true);
    expect(result.converted).toBe('  text-align: end;');
  });

  it('text-align: center は変換しない', () => {
    const result = convertCssLine('  text-align: center;');
    expect(result.changed).toBe(false);
    expect(result.converted).toBe('  text-align: center;');
  });

  it('空行はそのまま返す', () => {
    const result = convertCssLine('');
    expect(result.changed).toBe(false);
    expect(result.converted).toBe('');
  });

  it('セレクタ行はそのまま返す', () => {
    const result = convertCssLine('.foo {');
    expect(result.changed).toBe(false);
    expect(result.converted).toBe('.foo {');
  });

  it('コメント行はそのまま返す', () => {
    const result = convertCssLine('  /* margin */');
    expect(result.changed).toBe(false);
    expect(result.converted).toBe('  /* margin */');
  });

  it('変換不要なプロパティはそのまま返す', () => {
    const result = convertCssLine('  color: red;');
    expect(result.changed).toBe(false);
    expect(result.converted).toBe('  color: red;');
  });

  it('インデントを保持する', () => {
    const result = convertCssLine('    margin-right: auto;');
    expect(result.changed).toBe(true);
    expect(result.converted).toBe('    margin-inline-end: auto;');
  });

  it('border-top-left-radius を変換する', () => {
    const result = convertCssLine('  border-top-left-radius: 8px;');
    expect(result.changed).toBe(true);
    expect(result.converted).toBe('  border-start-start-radius: 8px;');
  });

  it('border-top を変換する', () => {
    const result = convertCssLine('  border-top: 1px solid #ccc;');
    expect(result.changed).toBe(true);
    expect(result.converted).toBe('  border-block-start: 1px solid #ccc;');
  });

  it('overflow-x を変換する', () => {
    const result = convertCssLine('  overflow-x: hidden;');
    expect(result.changed).toBe(true);
    expect(result.converted).toBe('  overflow-inline: hidden;');
  });
});

describe('convertCss', () => {
  it('複数行の CSS を変換する', () => {
    const input = `.card {
  margin-left: auto;
  margin-right: auto;
  padding-top: 16px;
  color: red;
}`;
    const result = convertCss(input);
    expect(result.changedCount).toBe(3);
    expect(result.output).toContain('margin-inline-start: auto;');
    expect(result.output).toContain('margin-inline-end: auto;');
    expect(result.output).toContain('padding-block-start: 16px;');
    expect(result.output).toContain('color: red;');
  });

  it('変換なしの CSS は changedCount が 0', () => {
    const input = `.foo {
  color: blue;
  display: flex;
}`;
    const result = convertCss(input);
    expect(result.changedCount).toBe(0);
    expect(result.output).toBe(input);
  });

  it('空文字列を渡すと空文字列が返る', () => {
    const result = convertCss('');
    expect(result.output).toBe('');
    expect(result.changedCount).toBe(0);
  });

  it('lines 配列の長さが入力行数と一致する', () => {
    const input = 'width: 100px;\nheight: 200px;';
    const result = convertCss(input);
    expect(result.lines).toHaveLength(2);
  });
});
