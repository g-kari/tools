import { describe, it, expect } from 'vitest';

/**
 * テキスト行を昇順ソート
 * @param lines - ソートする行の配列
 * @returns 昇順ソートされた行の配列
 */
function sortAscending(lines: string[]): string[] {
  return lines.sort((a, b) => a.localeCompare(b, 'ja'));
}

/**
 * テキスト行を降順ソート
 * @param lines - ソートする行の配列
 * @returns 降順ソートされた行の配列
 */
function sortDescending(lines: string[]): string[] {
  return lines.sort((a, b) => b.localeCompare(a, 'ja'));
}

/**
 * 重複行を削除
 * @param lines - 処理する行の配列
 * @returns 重複を削除した行の配列
 */
function removeDuplicates(lines: string[]): string[] {
  return Array.from(new Set(lines));
}

/**
 * ソートと重複削除を同時実行
 * @param lines - 処理する行の配列
 * @returns ソートされ、重複を削除した行の配列
 */
function sortAndRemoveDuplicates(lines: string[]): string[] {
  const unique = Array.from(new Set(lines));
  return unique.sort((a, b) => a.localeCompare(b, 'ja'));
}

describe('Text Sort Functions', () => {
  describe('sortAscending', () => {
    it('should sort English words in ascending order', () => {
      const input = ['cherry', 'apple', 'banana'];
      const result = sortAscending(input);
      expect(result).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should sort Japanese words in ascending order', () => {
      const input = ['りんご', 'みかん', 'バナナ'];
      const result = sortAscending(input);
      expect(result).toEqual(['バナナ', 'みかん', 'りんご']);
    });

    it('should sort numbers as strings', () => {
      const input = ['10', '2', '1', '20'];
      const result = sortAscending(input);
      expect(result).toEqual(['1', '10', '2', '20']);
    });

    it('should handle empty array', () => {
      const input: string[] = [];
      const result = sortAscending(input);
      expect(result).toEqual([]);
    });

    it('should handle single item', () => {
      const input = ['only'];
      const result = sortAscending(input);
      expect(result).toEqual(['only']);
    });

    it('should handle mixed case', () => {
      const input = ['Apple', 'banana', 'Cherry'];
      const result = sortAscending(input);
      expect(result[0]).toBe('Apple');
    });
  });

  describe('sortDescending', () => {
    it('should sort English words in descending order', () => {
      const input = ['apple', 'banana', 'cherry'];
      const result = sortDescending(input);
      expect(result).toEqual(['cherry', 'banana', 'apple']);
    });

    it('should sort Japanese words in descending order', () => {
      const input = ['バナナ', 'みかん', 'りんご'];
      const result = sortDescending(input);
      expect(result).toEqual(['りんご', 'みかん', 'バナナ']);
    });

    it('should handle empty array', () => {
      const input: string[] = [];
      const result = sortDescending(input);
      expect(result).toEqual([]);
    });
  });

  describe('removeDuplicates', () => {
    it('should remove duplicate lines', () => {
      const input = ['apple', 'banana', 'apple', 'cherry', 'banana'];
      const result = removeDuplicates(input);
      expect(result).toHaveLength(3);
      expect(result).toContain('apple');
      expect(result).toContain('banana');
      expect(result).toContain('cherry');
    });

    it('should handle no duplicates', () => {
      const input = ['apple', 'banana', 'cherry'];
      const result = removeDuplicates(input);
      expect(result).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should handle all duplicates', () => {
      const input = ['apple', 'apple', 'apple'];
      const result = removeDuplicates(input);
      expect(result).toEqual(['apple']);
    });

    it('should handle empty array', () => {
      const input: string[] = [];
      const result = removeDuplicates(input);
      expect(result).toEqual([]);
    });

    it('should preserve order of first occurrence', () => {
      const input = ['c', 'b', 'a', 'b', 'c'];
      const result = removeDuplicates(input);
      expect(result).toEqual(['c', 'b', 'a']);
    });

    it('should handle Japanese text duplicates', () => {
      const input = ['りんご', 'バナナ', 'りんご', 'みかん'];
      const result = removeDuplicates(input);
      expect(result).toHaveLength(3);
      expect(result).toContain('りんご');
      expect(result).toContain('バナナ');
      expect(result).toContain('みかん');
    });
  });

  describe('sortAndRemoveDuplicates', () => {
    it('should sort and remove duplicates', () => {
      const input = ['cherry', 'apple', 'banana', 'apple', 'cherry'];
      const result = sortAndRemoveDuplicates(input);
      expect(result).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should work with Japanese text', () => {
      const input = ['りんご', 'みかん', 'バナナ', 'りんご', 'みかん'];
      const result = sortAndRemoveDuplicates(input);
      expect(result).toEqual(['バナナ', 'みかん', 'りんご']);
    });

    it('should handle empty array', () => {
      const input: string[] = [];
      const result = sortAndRemoveDuplicates(input);
      expect(result).toEqual([]);
    });

    it('should handle single item', () => {
      const input = ['only'];
      const result = sortAndRemoveDuplicates(input);
      expect(result).toEqual(['only']);
    });

    it('should handle all same items', () => {
      const input = ['same', 'same', 'same'];
      const result = sortAndRemoveDuplicates(input);
      expect(result).toEqual(['same']);
    });
  });
});
