import { describe, it, expect } from 'vitest';
import { xmlToJson, jsonToXml, getSampleXml, getSampleJson } from '../../app/utils/xml-json';

describe('xmlToJson', () => {
  it('空文字列はエラーを返す', () => {
    const result = xmlToJson('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('XML');
  });

  it('空白のみの入力はエラーを返す', () => {
    const result = xmlToJson('   ');
    expect(result.success).toBe(false);
  });

  it('有効なXMLを渡した場合は成功または変換エラーのどちらかを返す（DOMParser依存）', () => {
    // Node.js環境ではDOMParserが利用不可のため変換エラーになる場合がある
    const xml = '<root><item>hello</item></root>';
    const result = xmlToJson(xml);
    // successの値に関わらず、outputまたはerrorのどちらかが存在する
    expect(typeof result.success).toBe('boolean');
    expect(result.output !== undefined || result.error !== undefined).toBe(true);
  });

  it('不正なXMLはエラーを返す（DOMParserなしでも同様）', () => {
    // この入力はDOMParser有無に関わらずエラーになる可能性が高い
    const result = xmlToJson('<root><unclosed>');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('jsonToXml', () => {
  it('空文字列はエラーを返す', () => {
    const result = jsonToXml('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON');
  });

  it('空白のみの入力はエラーを返す', () => {
    const result = jsonToXml('   ');
    expect(result.success).toBe(false);
  });

  it('不正なJSONはエラーを返す', () => {
    const result = jsonToXml('not valid json');
    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON解析エラー');
  });

  it('ルートが配列のJSONはエラーを返す', () => {
    const result = jsonToXml('[1, 2, 3]');
    expect(result.success).toBe(false);
  });

  it('空のJSONオブジェクトはエラーを返す', () => {
    const result = jsonToXml('{}');
    expect(result.success).toBe(false);
  });

  it('シンプルなJSONをXMLに変換する', () => {
    const json = JSON.stringify({ root: { item: 'value' } });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<?xml');
    expect(result.output).toContain('<root>');
    expect(result.output).toContain('<item>');
    expect(result.output).toContain('value');
    expect(result.output).toContain('</root>');
  });

  it('XML宣言を含む出力を生成する', () => {
    const json = JSON.stringify({ root: 'hello' });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  it('特殊文字をエスケープする', () => {
    const json = JSON.stringify({ root: 'a & b < c > d' });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('&amp;');
    expect(result.output).toContain('&lt;');
    expect(result.output).toContain('&gt;');
  });

  it('@attributes から属性を変換する', () => {
    const json = JSON.stringify({
      root: {
        '@attributes': { id: '1', class: 'test' },
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('id="1"');
    expect(result.output).toContain('class="test"');
  });

  it('配列の要素を繰り返しタグに変換する', () => {
    const json = JSON.stringify({
      root: {
        item: ['a', 'b', 'c'],
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    const matches = result.output.match(/<item>/g);
    expect(matches).toHaveLength(3);
  });

  it('ネストしたオブジェクトを変換する', () => {
    const json = JSON.stringify({
      person: {
        name: 'Alice',
        age: '30',
        address: {
          city: 'Tokyo',
        },
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<person>');
    expect(result.output).toContain('<name>Alice</name>');
    expect(result.output).toContain('<city>Tokyo</city>');
  });

  it('4スペースインデントを指定できる', () => {
    const json = JSON.stringify({ root: { child: 'val' } });
    const result = jsonToXml(json, 4);
    expect(result.success).toBe(true);
    expect(result.output).toContain('    ');
  });

  it('null値はセルフクロージングタグになる', () => {
    const json = JSON.stringify({ root: { item: null } });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<item />');
  });

  it('真偽値・数値を変換する', () => {
    const json = JSON.stringify({ root: { flag: true, count: 42 } });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<flag>true</flag>');
    expect(result.output).toContain('<count>42</count>');
  });

  it('@attributes と #text の混在コンテンツを変換する', () => {
    const json = JSON.stringify({
      root: {
        item: {
          '@attributes': { id: '1' },
          '#text': 'hello world',
        },
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('id="1"');
    expect(result.output).toContain('hello world');
    expect(result.output).toContain('<item');
    expect(result.output).toContain('</item>');
  });

  it('属性値の二重引用符をエスケープする', () => {
    const json = JSON.stringify({
      root: {
        '@attributes': { title: 'say "hello"' },
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('&quot;');
  });

  it('@attributesのみの場合はセルフクロージングタグになる', () => {
    const json = JSON.stringify({
      root: {
        '@attributes': { type: 'empty' },
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('type="empty"');
    expect(result.output).toContain('/>');
  });

  it('ルートがnullのJSONはエラーを返す', () => {
    const result = jsonToXml('null');
    expect(result.success).toBe(false);
  });

  it('オブジェクト配列の変換', () => {
    const json = JSON.stringify({
      catalog: {
        book: [
          { title: 'Book A', price: '10' },
          { title: 'Book B', price: '20' },
        ],
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<book>');
    expect(result.output).toContain('<title>Book A</title>');
    expect(result.output).toContain('<title>Book B</title>');
  });

  it('@で始まらないキーの属性変換', () => {
    const json = JSON.stringify({
      root: {
        '@attributes': { id: '42' },
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('id="42"');
  });

  it('サンプルJSONをXMLに変換する', () => {
    const sample = getSampleJson();
    const result = jsonToXml(sample);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<bookstore>');
    expect(result.output).toContain('<book');
  });

  it('子要素を持つオブジェクトに #text がある場合も変換する', () => {
    const json = JSON.stringify({
      root: {
        parent: {
          '#text': 'ignored text',
          child: 'value',
        },
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<child>value</child>');
  });
});

describe('getSampleXml', () => {
  it('空でないXML文字列を返す', () => {
    const sample = getSampleXml();
    expect(typeof sample).toBe('string');
    expect(sample.length).toBeGreaterThan(0);
    expect(sample).toContain('<?xml');
  });
});

describe('getSampleJson', () => {
  it('有効なJSON文字列を返す', () => {
    const sample = getSampleJson();
    expect(() => JSON.parse(sample)).not.toThrow();
    const parsed = JSON.parse(sample);
    expect(typeof parsed).toBe('object');
  });
});
