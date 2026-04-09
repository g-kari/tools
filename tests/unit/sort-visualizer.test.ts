import { describe, it, expect } from 'vite-plus/test';
import {
  generateArray,
  bubbleSortSteps,
  selectionSortSteps,
  insertionSortSteps,
  mergeSortSteps,
  quickSortSteps,
  getSortSteps,
  ALGORITHM_LABELS,
  ALGORITHM_COMPLEXITY,
} from '../../app/utils/sort-visualizer';

describe('generateArray', () => {
  it('指定サイズの配列を生成する', () => {
    expect(generateArray(10)).toHaveLength(10);
    expect(generateArray(30)).toHaveLength(30);
  });

  it('1 から n までの値を含む', () => {
    const arr = generateArray(5);
    expect(arr.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('bubbleSortSteps', () => {
  it('最終ステップで配列がソートされている', () => {
    const input = [3, 1, 4, 1, 5, 9, 2, 6];
    const steps = bubbleSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([...input].sort((a, b) => a - b));
  });

  it('全インデックスが sorted に含まれる', () => {
    const input = [5, 3, 1, 4, 2];
    const steps = bubbleSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.sorted).toHaveLength(input.length);
  });

  it('既にソート済みの配列でも動作する', () => {
    const input = [1, 2, 3, 4, 5];
    const steps = bubbleSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([1, 2, 3, 4, 5]);
  });

  it('逆順の配列をソートする', () => {
    const input = [5, 4, 3, 2, 1];
    const steps = bubbleSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([1, 2, 3, 4, 5]);
  });

  it('各ステップで comparing/swapping は最大2要素', () => {
    const input = [3, 1, 4, 2];
    const steps = bubbleSortSteps(input);
    for (const step of steps) {
      expect(step.comparing.length).toBeLessThanOrEqual(2);
      expect(step.swapping.length).toBeLessThanOrEqual(2);
    }
  });
});

describe('selectionSortSteps', () => {
  it('最終ステップで配列がソートされている', () => {
    const input = [64, 25, 12, 22, 11];
    const steps = selectionSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([11, 12, 22, 25, 64]);
  });

  it('同じ値を含む配列をソートする', () => {
    const input = [3, 1, 2, 1, 3];
    const steps = selectionSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([1, 1, 2, 3, 3]);
  });

  it('1要素の配列でも動作する', () => {
    const input = [42];
    const steps = selectionSortSteps(input);
    expect(steps.length).toBeGreaterThan(0);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([42]);
  });
});

describe('insertionSortSteps', () => {
  it('最終ステップで配列がソートされている', () => {
    const input = [12, 11, 13, 5, 6];
    const steps = insertionSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([5, 6, 11, 12, 13]);
  });

  it('逆順配列をソートする', () => {
    const input = [9, 7, 5, 3, 1];
    const steps = insertionSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([1, 3, 5, 7, 9]);
  });

  it('ステップ数が正の整数である', () => {
    const input = [4, 2, 3, 1];
    const steps = insertionSortSteps(input);
    expect(steps.length).toBeGreaterThan(0);
  });
});

describe('mergeSortSteps', () => {
  it('最終ステップで配列がソートされている', () => {
    const input = [38, 27, 43, 3, 9, 82, 10];
    const steps = mergeSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([3, 9, 10, 27, 38, 43, 82]);
  });

  it('2要素の配列をソートする', () => {
    const input = [2, 1];
    const steps = mergeSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([1, 2]);
  });

  it('全インデックスが sorted に含まれる', () => {
    const input = [5, 3, 8, 1, 2];
    const steps = mergeSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.sorted).toHaveLength(input.length);
  });
});

describe('quickSortSteps', () => {
  it('最終ステップで配列がソートされている', () => {
    const input = [10, 7, 8, 9, 1, 5];
    const steps = quickSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([1, 5, 7, 8, 9, 10]);
  });

  it('重複要素を含む配列をソートする', () => {
    const input = [3, 6, 8, 10, 1, 2, 1];
    const steps = quickSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([...input].sort((a, b) => a - b));
  });

  it('1要素の配列でも動作する', () => {
    const input = [1];
    const steps = quickSortSteps(input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual([1]);
  });
});

describe('getSortSteps', () => {
  const input = [4, 2, 5, 1, 3];
  const sorted = [1, 2, 3, 4, 5];

  it.each([
    ['bubble' as const],
    ['selection' as const],
    ['insertion' as const],
    ['merge' as const],
    ['quick' as const],
  ])('%s ソートが正しくソートする', (alg) => {
    const steps = getSortSteps(alg, input);
    const last = steps[steps.length - 1];
    expect(last.array).toEqual(sorted);
  });
});

describe('ALGORITHM_LABELS', () => {
  it('全アルゴリズムのラベルが定義されている', () => {
    expect(ALGORITHM_LABELS.bubble).toBe('バブルソート');
    expect(ALGORITHM_LABELS.selection).toBe('選択ソート');
    expect(ALGORITHM_LABELS.insertion).toBe('挿入ソート');
    expect(ALGORITHM_LABELS.merge).toBe('マージソート');
    expect(ALGORITHM_LABELS.quick).toBe('クイックソート');
  });
});

describe('ALGORITHM_COMPLEXITY', () => {
  it('全アルゴリズムの計算量が定義されている', () => {
    const algs = ['bubble', 'selection', 'insertion', 'merge', 'quick'] as const;
    for (const alg of algs) {
      const c = ALGORITHM_COMPLEXITY[alg];
      expect(c).toHaveProperty('best');
      expect(c).toHaveProperty('average');
      expect(c).toHaveProperty('worst');
      expect(c).toHaveProperty('space');
    }
  });

  it('マージソートは O(n log n) である', () => {
    expect(ALGORITHM_COMPLEXITY.merge.best).toBe('O(n log n)');
    expect(ALGORITHM_COMPLEXITY.merge.worst).toBe('O(n log n)');
  });

  it('バブルソートの最良は O(n)', () => {
    expect(ALGORITHM_COMPLEXITY.bubble.best).toBe('O(n)');
  });
});
