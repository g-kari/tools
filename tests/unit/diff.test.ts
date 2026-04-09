import { describe, it, expect } from 'vite-plus/test';
import { computeDiff } from '../../app/routes/diff';

/**
 * DiffLine型の定義（テスト用）
 * computeDiffが返す各行の型
 */
interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

describe('computeDiff', () => {
  describe('同一テキスト', () => {
    it('同一テキストの場合、全行がunchangedになる', () => {
      const text = 'line1\nline2\nline3';
      const result = computeDiff(text, text);
      expect(result).toEqual([
        { type: 'unchanged', value: 'line1' },
        { type: 'unchanged', value: 'line2' },
        { type: 'unchanged', value: 'line3' },
      ]);
    });

    it('単一行の同一テキスト', () => {
      const result = computeDiff('hello', 'hello');
      expect(result).toEqual([{ type: 'unchanged', value: 'hello' }]);
    });
  });

  describe('行追加', () => {
    it('末尾に行が追加された場合、新しい行がaddedになる', () => {
      const oldText = 'line1\nline2';
      const newText = 'line1\nline2\nline3';
      const result = computeDiff(oldText, newText);
      expect(result).toContainEqual({ type: 'added', value: 'line3' });
      expect(result.filter((l: DiffLine) => l.type === 'unchanged')).toHaveLength(2);
    });

    it('先頭に行が追加された場合', () => {
      const oldText = 'line2\nline3';
      const newText = 'line1\nline2\nline3';
      const result = computeDiff(oldText, newText);
      expect(result).toContainEqual({ type: 'added', value: 'line1' });
    });

    it('中間に行が追加された場合', () => {
      const oldText = 'line1\nline3';
      const newText = 'line1\nline2\nline3';
      const result = computeDiff(oldText, newText);
      expect(result).toContainEqual({ type: 'added', value: 'line2' });
      expect(result).toContainEqual({ type: 'unchanged', value: 'line1' });
      expect(result).toContainEqual({ type: 'unchanged', value: 'line3' });
    });
  });

  describe('行削除', () => {
    it('末尾の行が削除された場合、削除された行がremovedになる', () => {
      const oldText = 'line1\nline2\nline3';
      const newText = 'line1\nline2';
      const result = computeDiff(oldText, newText);
      expect(result).toContainEqual({ type: 'removed', value: 'line3' });
      expect(result.filter((l: DiffLine) => l.type === 'unchanged')).toHaveLength(2);
    });

    it('先頭の行が削除された場合', () => {
      const oldText = 'line1\nline2\nline3';
      const newText = 'line2\nline3';
      const result = computeDiff(oldText, newText);
      expect(result).toContainEqual({ type: 'removed', value: 'line1' });
    });
  });

  describe('行変更', () => {
    it('行が変更された場合、旧行がremoved、新行がaddedになる', () => {
      const oldText = 'line1\nold line\nline3';
      const newText = 'line1\nnew line\nline3';
      const result = computeDiff(oldText, newText);
      expect(result).toContainEqual({ type: 'removed', value: 'old line' });
      expect(result).toContainEqual({ type: 'added', value: 'new line' });
      expect(result).toContainEqual({ type: 'unchanged', value: 'line1' });
      expect(result).toContainEqual({ type: 'unchanged', value: 'line3' });
    });
  });

  describe('空文字列', () => {
    it('両方が空文字列の場合、空の結果を返す', () => {
      const result = computeDiff('', '');
      expect(result).toEqual([]);
    });

    it('旧テキストが空で新テキストに内容がある場合、全行がaddedになる', () => {
      const result = computeDiff('', 'line1\nline2');
      expect(result.every((l: DiffLine) => l.type === 'added')).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('新テキストが空で旧テキストに内容がある場合、全行がremovedになる', () => {
      const result = computeDiff('line1\nline2', '');
      expect(result.every((l: DiffLine) => l.type === 'removed')).toBe(true);
      expect(result).toHaveLength(2);
    });
  });

  describe('複数行の複雑な差分', () => {
    it('追加・削除・変更が混在する差分', () => {
      const oldText = 'header\nold content\nfooter\nremoved line';
      const newText = 'header\nnew content\ninserted line\nfooter';
      const result = computeDiff(oldText, newText);

      // headerは変更なし
      expect(result).toContainEqual({ type: 'unchanged', value: 'header' });
      // old contentが削除され、new contentが追加
      expect(result).toContainEqual({ type: 'removed', value: 'old content' });
      expect(result).toContainEqual({ type: 'added', value: 'new content' });
      // inserted lineが追加
      expect(result).toContainEqual({ type: 'added', value: 'inserted line' });
      // footerは変更なし
      expect(result).toContainEqual({ type: 'unchanged', value: 'footer' });
      // removed lineが削除
      expect(result).toContainEqual({ type: 'removed', value: 'removed line' });
    });

    it('日本語テキストの差分', () => {
      const oldText = 'こんにちは\n世界';
      const newText = 'こんにちは\n日本';
      const result = computeDiff(oldText, newText);
      expect(result).toContainEqual({ type: 'unchanged', value: 'こんにちは' });
      expect(result).toContainEqual({ type: 'removed', value: '世界' });
      expect(result).toContainEqual({ type: 'added', value: '日本' });
    });

    it('全行が異なる場合', () => {
      const oldText = 'aaa\nbbb';
      const newText = 'ccc\nddd';
      const result = computeDiff(oldText, newText);
      const removed = result.filter((l: DiffLine) => l.type === 'removed');
      const added = result.filter((l: DiffLine) => l.type === 'added');
      expect(removed).toHaveLength(2);
      expect(added).toHaveLength(2);
    });
  });
});
