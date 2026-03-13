import { describe, it, expect } from 'vitest';
import { evaluateJsonPath, formatJson, formatResults, getSampleJson } from '../../app/utils/json-path';

describe('JSONPath Utility Functions', () => {
  const sampleData = JSON.stringify({
    store: {
      book: [
        { category: "reference", author: "Nigel Rees", title: "Sayings of the Century", price: 8.95 },
        { category: "fiction", author: "Evelyn Waugh", title: "Sword of Honour", price: 12.99 },
        { category: "fiction", author: "Herman Melville", title: "Moby Dick", isbn: "0-553-21311-3", price: 8.99 }
      ],
      bicycle: { color: "red", price: 19.95 }
    }
  });

  describe('evaluateJsonPath', () => {
    it('should extract all book titles', () => {
      const result = evaluateJsonPath(sampleData, '$.store.book[*].title');
      expect(result).toEqual(['Sayings of the Century', 'Sword of Honour', 'Moby Dick']);
    });

    it('should extract all authors recursively', () => {
      const result = evaluateJsonPath(sampleData, '$..author');
      expect(result).toEqual(['Nigel Rees', 'Evelyn Waugh', 'Herman Melville']);
    });

    it('should extract a specific nested value', () => {
      const result = evaluateJsonPath(sampleData, '$.store.bicycle.color');
      expect(result).toEqual(['red']);
    });

    it('should filter books by price', () => {
      const result = evaluateJsonPath(sampleData, '$..book[?(@.price<10)].title');
      expect(result).toContain('Sayings of the Century');
      expect(result).toContain('Moby Dick');
      expect(result).not.toContain('Sword of Honour');
    });

    it('should return empty array when no match', () => {
      const result = evaluateJsonPath(sampleData, '$.nonexistent');
      expect(result).toEqual([]);
    });

    it('should throw error for empty JSON', () => {
      expect(() => evaluateJsonPath('', '$.a')).toThrow('JSONを入力してください');
    });

    it('should throw error for empty path', () => {
      expect(() => evaluateJsonPath('{"a":1}', '')).toThrow('JSONPath式を入力してください');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => evaluateJsonPath('invalid json', '$.a')).toThrow('無効なJSON形式です');
    });

    it('should handle simple object access', () => {
      const result = evaluateJsonPath('{"name":"Alice","age":30}', '$.name');
      expect(result).toEqual(['Alice']);
    });

    it('should handle array indexing', () => {
      const result = evaluateJsonPath('[1,2,3]', '$[1]');
      expect(result).toEqual([2]);
    });
  });

  describe('formatJson', () => {
    it('should format JSON with default indent', () => {
      const result = formatJson('{"a":1,"b":2}');
      expect(result).toContain('\n');
      expect(result).toContain('  "a": 1');
    });

    it('should format JSON with custom indent', () => {
      const result = formatJson('{"a":1}', 4);
      expect(result).toContain('    "a": 1');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => formatJson('invalid')).toThrow('無効なJSON形式です');
    });
  });

  describe('formatResults', () => {
    it('should return message for empty results', () => {
      const result = formatResults([]);
      expect(result).toBe('一致する値がありません');
    });

    it('should return single value as JSON', () => {
      const result = formatResults(['hello']);
      expect(result).toBe('"hello"');
    });

    it('should return array as JSON for multiple results', () => {
      const result = formatResults([1, 2, 3]);
      expect(JSON.parse(result)).toEqual([1, 2, 3]);
    });
  });

  describe('getSampleJson', () => {
    it('should return valid JSON string', () => {
      const sample = getSampleJson();
      expect(() => JSON.parse(sample)).not.toThrow();
    });

    it('should contain store with books', () => {
      const parsed = JSON.parse(getSampleJson()) as { store: { book: unknown[] } };
      expect(parsed.store).toBeDefined();
      expect(Array.isArray(parsed.store.book)).toBe(true);
    });
  });
});
