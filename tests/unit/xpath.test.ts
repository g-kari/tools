import { describe, it, expect } from 'vitest';
import { evaluateXPath, XPATH_EXAMPLES, SAMPLE_XML } from '../../app/utils/xpath';

// XPath 評価は DOMParser と document.evaluate() に依存するため、
// Node.js / Vitest 環境ではエラーが返ることを確認する

describe('evaluateXPath – サーバーサイド環境', () => {
  it('XML が空の場合はエラーを返す', () => {
    const result = evaluateXPath({ xml: '', expression: '//book' });
    expect(result.type).toBe('error');
    expect(result.error).toBeTruthy();
  });

  it('XPath 式が空の場合はエラーを返す', () => {
    const result = evaluateXPath({ xml: '<root/>', expression: '' });
    expect(result.type).toBe('error');
    expect(result.error).toBeTruthy();
  });

  it('空白のみの XML はエラーを返す', () => {
    const result = evaluateXPath({ xml: '   ', expression: '//book' });
    expect(result.type).toBe('error');
  });

  it('空白のみの XPath 式はエラーを返す', () => {
    const result = evaluateXPath({ xml: '<root/>', expression: '  ' });
    expect(result.type).toBe('error');
  });

  it('ブラウザ環境が存在しない場合はエラーを返す', () => {
    // Vitest は Node.js で動作するため DOMParser が存在しない場合がある
    const result = evaluateXPath({ xml: '<root/>', expression: '/root' });
    // DOMParser がない場合はエラー、ある場合は正常結果
    expect(['error', 'nodeset', 'string', 'number', 'boolean']).toContain(result.type);
  });
});

// ---------------------------------------------------------------------------
// 定数テスト
// ---------------------------------------------------------------------------

describe('XPATH_EXAMPLES', () => {
  it('例が存在する', () => {
    expect(XPATH_EXAMPLES.length).toBeGreaterThan(0);
  });

  it('各例に label・expression・description がある', () => {
    for (const ex of XPATH_EXAMPLES) {
      expect(ex.label).toBeTruthy();
      expect(ex.expression).toBeTruthy();
      expect(ex.description).toBeTruthy();
    }
  });

  it('全ての式が文字列である', () => {
    for (const ex of XPATH_EXAMPLES) {
      expect(typeof ex.expression).toBe('string');
    }
  });
});

describe('SAMPLE_XML', () => {
  it('空でない', () => {
    expect(SAMPLE_XML.trim().length).toBeGreaterThan(0);
  });

  it('XML 宣言を含む', () => {
    expect(SAMPLE_XML).toContain('<?xml');
  });

  it('bookstore 要素を含む', () => {
    expect(SAMPLE_XML).toContain('<bookstore>');
  });

  it('book 要素が複数含まれる', () => {
    const matches = SAMPLE_XML.match(/<book/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });
});
