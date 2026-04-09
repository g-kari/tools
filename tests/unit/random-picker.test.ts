import { describe, it, expect } from 'vite-plus/test';
import { parseItems, pickRandom } from '~/routes/random-picker';

describe('parseItems', () => {
  it('改行区切りのテキストを配列に分割する', () => {
    const result = parseItems('Alice\nBob\nCharlie');
    expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('空行を除外する', () => {
    const result = parseItems('Alice\n\nBob\n\nCharlie');
    expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('前後の空白をトリムする', () => {
    const result = parseItems('  Alice  \n  Bob  ');
    expect(result).toEqual(['Alice', 'Bob']);
  });

  it('空文字列を渡すと空配列を返す', () => {
    expect(parseItems('')).toEqual([]);
  });

  it('空白のみの行を除外する', () => {
    expect(parseItems('   \n   \n')).toEqual([]);
  });
});

describe('pickRandom', () => {
  it('指定した個数の項目を返す', () => {
    const items = ['A', 'B', 'C', 'D', 'E'];
    const result = pickRandom(items, 3);
    expect(result).toHaveLength(3);
  });

  it('返された項目は元リストに含まれている', () => {
    const items = ['A', 'B', 'C', 'D', 'E'];
    const result = pickRandom(items, 3);
    for (const item of result) {
      expect(items).toContain(item);
    }
  });

  it('重複なしで抽出する', () => {
    const items = ['A', 'B', 'C', 'D', 'E'];
    const result = pickRandom(items, 5);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it('count が items.length より大きい場合は全件返す', () => {
    const items = ['A', 'B', 'C'];
    const result = pickRandom(items, 10);
    expect(result).toHaveLength(3);
  });

  it('空配列を渡すと空配列を返す', () => {
    expect(pickRandom([], 3)).toEqual([]);
  });

  it('count が 0 以下の場合は空配列を返す', () => {
    expect(pickRandom(['A', 'B', 'C'], 0)).toEqual([]);
    expect(pickRandom(['A', 'B', 'C'], -1)).toEqual([]);
  });

  it('1件の場合は配列の中から正しい項目を返す', () => {
    const items = ['A', 'B', 'C'];
    const result = pickRandom(items, 1);
    expect(result).toHaveLength(1);
    expect(items).toContain(result[0]);
  });

  it('元の配列を変更しない', () => {
    const items = ['A', 'B', 'C', 'D', 'E'];
    const original = [...items];
    pickRandom(items, 3);
    expect(items).toEqual(original);
  });

  it('大量の試行でランダム性を確認する', () => {
    const items = ['A', 'B', 'C', 'D', 'E'];
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (let i = 0; i < 500; i++) {
      const [picked] = pickRandom(items, 1);
      counts[picked]++;
    }
    // 全項目が1回以上選ばれていることを確認（確率的にほぼ確実）
    for (const key of Object.keys(counts)) {
      expect(counts[key]).toBeGreaterThan(0);
    }
  });
});
