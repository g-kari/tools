import { describe, it, expect } from 'vitest';

// JSON utility functions (same as in the app)
function formatJson(text: string, indent: number = 2): string {
  const parsed = JSON.parse(text);
  return JSON.stringify(parsed, null, indent);
}

function minifyJson(text: string): string {
  const parsed = JSON.parse(text);
  return JSON.stringify(parsed);
}

describe('JSON Formatter Functions', () => {
  describe('formatJson', () => {
    it('should format a simple object', () => {
      const input = '{"name":"太郎","age":30}';
      const result = formatJson(input);
      expect(result).toBe('{\n  "name": "太郎",\n  "age": 30\n}');
    });

    it('should format a nested object', () => {
      const input = '{"user":{"name":"太郎","address":{"city":"東京"}}}';
      const result = formatJson(input);
      expect(result).toContain('{\n');
      expect(result).toContain('"user"');
      expect(result).toContain('"address"');
    });

    it('should format an array', () => {
      const input = '[1,2,3]';
      const result = formatJson(input);
      expect(result).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('should format with custom indent', () => {
      const input = '{"a":1}';
      const result = formatJson(input, 4);
      expect(result).toBe('{\n    "a": 1\n}');
    });

    it('should handle empty object', () => {
      const input = '{}';
      const result = formatJson(input);
      expect(result).toBe('{}');
    });

    it('should handle empty array', () => {
      const input = '[]';
      const result = formatJson(input);
      expect(result).toBe('[]');
    });

    it('should handle boolean values', () => {
      const input = '{"active":true,"deleted":false}';
      const result = formatJson(input);
      expect(result).toContain('"active": true');
      expect(result).toContain('"deleted": false');
    });

    it('should handle null values', () => {
      const input = '{"value":null}';
      const result = formatJson(input);
      expect(result).toContain('"value": null');
    });

    it('should handle string with special characters', () => {
      const input = '{"text":"Hello\\nWorld"}';
      const result = formatJson(input);
      expect(result).toContain('"text": "Hello\\nWorld"');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => formatJson('invalid')).toThrow();
    });

    it('should throw error for unclosed brace', () => {
      expect(() => formatJson('{"a":1')).toThrow();
    });

    it('should throw error for trailing comma', () => {
      expect(() => formatJson('{"a":1,}')).toThrow();
    });
  });

  describe('minifyJson', () => {
    it('should minify a formatted object', () => {
      const input = '{\n  "name": "太郎",\n  "age": 30\n}';
      const result = minifyJson(input);
      expect(result).toBe('{"name":"太郎","age":30}');
    });

    it('should minify a nested object', () => {
      const input = `{
        "user": {
          "name": "太郎",
          "address": {
            "city": "東京"
          }
        }
      }`;
      const result = minifyJson(input);
      expect(result).toBe('{"user":{"name":"太郎","address":{"city":"東京"}}}');
    });

    it('should minify an array', () => {
      const input = '[\n  1,\n  2,\n  3\n]';
      const result = minifyJson(input);
      expect(result).toBe('[1,2,3]');
    });

    it('should handle already minified JSON', () => {
      const input = '{"a":1}';
      const result = minifyJson(input);
      expect(result).toBe('{"a":1}');
    });

    it('should handle empty object', () => {
      const input = '{ }';
      const result = minifyJson(input);
      expect(result).toBe('{}');
    });

    it('should handle empty array', () => {
      const input = '[ ]';
      const result = minifyJson(input);
      expect(result).toBe('[]');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => minifyJson('not json')).toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => minifyJson('')).toThrow();
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve data through format/minify cycle', () => {
      const original = '{"name":"太郎","items":[1,2,3],"active":true}';
      const formatted = formatJson(original);
      const minified = minifyJson(formatted);
      expect(minified).toBe(original);
    });

    it('should preserve nested structures', () => {
      const original = '{"a":{"b":{"c":1}}}';
      const formatted = formatJson(original);
      const minified = minifyJson(formatted);
      expect(minified).toBe(original);
    });

    it('should preserve arrays of objects', () => {
      const original = '[{"id":1},{"id":2}]';
      const formatted = formatJson(original);
      const minified = minifyJson(formatted);
      expect(minified).toBe(original);
    });
  });
});
