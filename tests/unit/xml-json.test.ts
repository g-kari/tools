import { describe, it, expect } from 'vitest';
import { xmlToJson, jsonToXml, getSampleXml, getSampleJson } from '../../app/utils/xml-json';

describe('xmlToJson', () => {
  it('should return error for empty input', () => {
    const result = xmlToJson('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('XML');
  });

  it('should return error for whitespace-only input', () => {
    const result = xmlToJson('   ');
    expect(result.success).toBe(false);
  });
});

describe('jsonToXml', () => {
  it('should return error for empty input', () => {
    const result = jsonToXml('');
    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON');
  });

  it('should return error for whitespace-only input', () => {
    const result = jsonToXml('   ');
    expect(result.success).toBe(false);
  });

  it('should return error for invalid JSON', () => {
    const result = jsonToXml('not valid json');
    expect(result.success).toBe(false);
    expect(result.error).toContain('JSON解析エラー');
  });

  it('should return error for JSON array at root', () => {
    const result = jsonToXml('[1, 2, 3]');
    expect(result.success).toBe(false);
  });

  it('should return error for empty JSON object', () => {
    const result = jsonToXml('{}');
    expect(result.success).toBe(false);
  });

  it('should convert simple JSON to XML', () => {
    const json = JSON.stringify({ root: { item: 'value' } });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<?xml');
    expect(result.output).toContain('<root>');
    expect(result.output).toContain('<item>');
    expect(result.output).toContain('value');
    expect(result.output).toContain('</root>');
  });

  it('should include XML declaration', () => {
    const json = JSON.stringify({ root: 'hello' });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  it('should escape special characters in XML output', () => {
    const json = JSON.stringify({ root: 'a & b < c > d' });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('&amp;');
    expect(result.output).toContain('&lt;');
    expect(result.output).toContain('&gt;');
  });

  it('should convert attributes from @attributes', () => {
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

  it('should handle array values as repeated elements', () => {
    const json = JSON.stringify({
      root: {
        item: ['a', 'b', 'c'],
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    // 配列の各要素が同名タグで出力される
    const matches = result.output.match(/<item>/g);
    expect(matches).toHaveLength(3);
  });

  it('should handle nested objects', () => {
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

  it('should use 4-space indent when specified', () => {
    const json = JSON.stringify({ root: { child: 'val' } });
    const result = jsonToXml(json, 4);
    expect(result.success).toBe(true);
    expect(result.output).toContain('    ');
  });

  it('should handle null value as self-closing tag', () => {
    const json = JSON.stringify({ root: { item: null } });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<item />');
  });

  it('should handle boolean and number values', () => {
    const json = JSON.stringify({ root: { flag: true, count: 42 } });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('<flag>true</flag>');
    expect(result.output).toContain('<count>42</count>');
  });

  it('should handle @attributes with #text (mixed content)', () => {
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

  it('should escape quotes in attribute values', () => {
    const json = JSON.stringify({
      root: {
        '@attributes': { title: 'say "hello"' },
      },
    });
    const result = jsonToXml(json);
    expect(result.success).toBe(true);
    expect(result.output).toContain('&quot;');
  });

  it('should handle @attributes only (empty element with attributes)', () => {
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

  it('should return error for null JSON value at root', () => {
    const result = jsonToXml('null');
    expect(result.success).toBe(false);
  });
});

describe('getSampleXml', () => {
  it('should return non-empty XML string', () => {
    const sample = getSampleXml();
    expect(typeof sample).toBe('string');
    expect(sample.length).toBeGreaterThan(0);
    expect(sample).toContain('<?xml');
  });
});

describe('getSampleJson', () => {
  it('should return valid JSON string', () => {
    const sample = getSampleJson();
    expect(() => JSON.parse(sample)).not.toThrow();
    const parsed = JSON.parse(sample);
    expect(typeof parsed).toBe('object');
  });
});
