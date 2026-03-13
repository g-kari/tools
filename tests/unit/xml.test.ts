import { describe, it, expect } from 'vitest';
import { formatXml, minifyXml, validateXml } from '../../app/utils/xml';

describe('formatXml', () => {
  describe('基本的な整形', () => {
    /**
     * 単純なXMLを整形するテスト
     */
    it('単純なXMLを整形する', () => {
      const xml = '<root><child>テキスト</child></root>';
      const result = formatXml(xml);
      expect(result).toContain('<root>');
      expect(result).toContain('  <child>テキスト</child>');
      expect(result).toContain('</root>');
    });

    /**
     * ネストしたXMLを整形するテスト
     */
    it('ネストしたXMLを整形する', () => {
      const xml = '<root><parent><child>値</child></parent></root>';
      const result = formatXml(xml);
      const lines = result.split('\n');
      // root, parent, child, /parent, /root の順に期待
      expect(lines[0]).toBe('<root>');
      expect(lines[1]).toBe('  <parent>');
      expect(lines[2]).toBe('    <child>値</child>');
      expect(lines[3]).toBe('  </parent>');
      expect(lines[4]).toBe('</root>');
    });

    /**
     * セルフクロージングタグを整形するテスト
     */
    it('セルフクロージングタグを整形する', () => {
      const xml = '<root><br/><hr/></root>';
      const result = formatXml(xml);
      expect(result).toContain('  <br/>');
      expect(result).toContain('  <hr/>');
    });

    /**
     * XMLデクラレーション付きを整形するテスト
     */
    it('XMLデクラレーション付きを整形する', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root><item>値</item></root>';
      const result = formatXml(xml);
      const lines = result.split('\n');
      expect(lines[0]).toBe('<?xml version="1.0" encoding="UTF-8"?>');
      expect(lines[1]).toBe('<root>');
      expect(lines[2]).toBe('  <item>値</item>');
      expect(lines[3]).toBe('</root>');
    });

    /**
     * インデント4スペースで整形するテスト
     */
    it('インデント4スペースで整形する', () => {
      const xml = '<root><child>値</child></root>';
      const result = formatXml(xml, 4);
      expect(result).toContain('    <child>値</child>');
    });
  });

  describe('エラーケース', () => {
    /**
     * 空文字列でエラーをスローするテスト
     */
    it('空文字列でエラーをスローする', () => {
      expect(() => formatXml('')).toThrow();
    });

    /**
     * 無効なXML（タグが閉じられていない）でエラーをスローするテスト
     */
    it('無効なXML（タグが閉じられていない）でエラーをスローする', () => {
      expect(() => formatXml('<root><child')).toThrow();
    });
  });
});

describe('minifyXml', () => {
  describe('基本的な圧縮', () => {
    /**
     * 整形済みXMLを圧縮するテスト
     */
    it('整形済みXMLを圧縮する', () => {
      const xml = '<root>\n  <child>値</child>\n</root>';
      const result = minifyXml(xml);
      expect(result).toBe('<root><child>値</child></root>');
    });

    /**
     * テキストノードを持つXMLを圧縮するテスト
     */
    it('テキストノードを持つXMLを圧縮する', () => {
      const xml = '<person>\n  <name>太郎</name>\n  <age>30</age>\n</person>';
      const result = minifyXml(xml);
      expect(result).toBe('<person><name>太郎</name><age>30</age></person>');
    });

    /**
     * 既に圧縮されたXMLはそのままになるテスト
     */
    it('既に圧縮されたXMLはそのままになる', () => {
      const xml = '<root><child>値</child></root>';
      const result = minifyXml(xml);
      expect(result).toBe(xml);
    });
  });

  describe('エラーケース', () => {
    /**
     * 空文字列でエラーをスローするテスト
     */
    it('空文字列でエラーをスローする', () => {
      expect(() => minifyXml('')).toThrow();
    });
  });
});

describe('validateXml', () => {
  describe('有効なXML', () => {
    /**
     * 有効なXMLがvalid: trueを返すテスト
     */
    it('有効なXMLはvalid: trueを返す', () => {
      const result = validateXml('<root><child>値</child></root>');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    /**
     * XMLデクラレーション付きは有効なテスト
     */
    it('XMLデクラレーション付きは有効', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root><item>値</item></root>';
      const result = validateXml(xml);
      expect(result.valid).toBe(true);
    });

    /**
     * セルフクロージングタグを含む有効なXMLのテスト
     */
    it('セルフクロージングタグを含む有効なXMLを検証する', () => {
      const result = validateXml('<root><br/><child>テキスト</child></root>');
      expect(result.valid).toBe(true);
    });
  });

  describe('無効なXML', () => {
    /**
     * 閉じタグなしのXMLがvalid: falseを返すテスト
     */
    it('閉じタグなしはvalid: falseを返す', () => {
      const result = validateXml('<root><child>値</child>');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    /**
     * 閉じタグ不一致のXMLがvalid: falseを返すテスト
     */
    it('閉じタグ不一致はvalid: falseを返す', () => {
      const result = validateXml('<root><child>値</other></root>');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    /**
     * 空文字列がvalid: falseを返すテスト
     */
    it('空文字列はvalid: falseを返す', () => {
      const result = validateXml('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});

describe('ラウンドトリップテスト', () => {
  /**
   * format後にminifyすると元の構造が保持されるテスト
   */
  it('format後にminifyすると元の構造が保持される', () => {
    const original = '<root><child>値</child><other>データ</other></root>';
    const formatted = formatXml(original);
    const minified = minifyXml(formatted);
    // 構造が同等であることを確認
    expect(minified).toBe(original);
  });
});
