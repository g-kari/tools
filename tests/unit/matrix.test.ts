/**
 * 行列計算ユーティリティ テスト
 */
import { describe, it, expect } from 'vite-plus/test';
import {
  parseMatrix,
  matrixAdd,
  matrixSubtract,
  matrixMultiply,
  matrixScalar,
  matrixTranspose,
  matrixDeterminant,
  matrixInverse,
  matrixTrace,
  matrixRank,
  formatMatrixNum,
} from '../../app/utils/matrix';

describe('parseMatrix', () => {
  it('スペース区切りの行列をパースする', () => {
    const r = parseMatrix('1 2\n3 4');
    expect(r.error).toBeNull();
    expect(r.matrix).toEqual([[1, 2], [3, 4]]);
    expect(r.rows).toBe(2);
    expect(r.cols).toBe(2);
  });

  it('カンマ区切りの行列をパースする', () => {
    const r = parseMatrix('1,2,3\n4,5,6');
    expect(r.error).toBeNull();
    expect(r.matrix).toEqual([[1, 2, 3], [4, 5, 6]]);
  });

  it('小数・負数を含む行列をパースする', () => {
    const r = parseMatrix('1.5 -2.0\n-3 4.25');
    expect(r.error).toBeNull();
    expect(r.matrix).toEqual([[1.5, -2.0], [-3, 4.25]]);
  });

  it('空文字列はエラーを返す', () => {
    expect(parseMatrix('').error).not.toBeNull();
  });

  it('列数が不一致の場合はエラーを返す', () => {
    expect(parseMatrix('1 2\n3 4 5').error).not.toBeNull();
  });

  it('数値以外の値が含まれる場合はエラーを返す', () => {
    expect(parseMatrix('1 abc\n3 4').error).not.toBeNull();
  });

  it('1×1 行列をパースする', () => {
    const r = parseMatrix('42');
    expect(r.matrix).toEqual([[42]]);
    expect(r.rows).toBe(1);
    expect(r.cols).toBe(1);
  });
});

describe('matrixAdd', () => {
  it('2×2 行列を加算する', () => {
    const a = [[1, 2], [3, 4]];
    const b = [[5, 6], [7, 8]];
    const r = matrixAdd(a, b);
    expect(r.error).toBeNull();
    expect(r.result).toEqual([[6, 8], [10, 12]]);
  });

  it('サイズ不一致の場合はエラー', () => {
    expect(matrixAdd([[1, 2]], [[1], [2]]).error).not.toBeNull();
  });
});

describe('matrixSubtract', () => {
  it('2×2 行列を減算する', () => {
    const a = [[5, 6], [7, 8]];
    const b = [[1, 2], [3, 4]];
    const r = matrixSubtract(a, b);
    expect(r.result).toEqual([[4, 4], [4, 4]]);
  });

  it('サイズ不一致の場合はエラー', () => {
    expect(matrixSubtract([[1, 2]], [[1, 2, 3]]).error).not.toBeNull();
  });
});

describe('matrixMultiply', () => {
  it('2×2 行列を乗算する', () => {
    const a = [[1, 2], [3, 4]];
    const b = [[5, 6], [7, 8]];
    const r = matrixMultiply(a, b);
    expect(r.error).toBeNull();
    expect(r.result).toEqual([
      [1 * 5 + 2 * 7, 1 * 6 + 2 * 8],
      [3 * 5 + 4 * 7, 3 * 6 + 4 * 8],
    ]);
  });

  it('2×3 と 3×2 行列を乗算して 2×2 を返す', () => {
    const a = [[1, 2, 3], [4, 5, 6]];
    const b = [[7, 8], [9, 10], [11, 12]];
    const r = matrixMultiply(a, b);
    expect(r.error).toBeNull();
    expect(r.result![0][0]).toBe(1 * 7 + 2 * 9 + 3 * 11);
  });

  it('列数・行数不一致の場合はエラー', () => {
    expect(matrixMultiply([[1, 2]], [[1, 2]]).error).not.toBeNull();
  });
});

describe('matrixScalar', () => {
  it('スカラー倍を計算する', () => {
    const a = [[1, 2], [3, 4]];
    const r = matrixScalar(a, 3);
    expect(r.result).toEqual([[3, 6], [9, 12]]);
  });

  it('0 倍は零行列を返す', () => {
    const r = matrixScalar([[1, 2], [3, 4]], 0);
    expect(r.result).toEqual([[0, 0], [0, 0]]);
  });
});

describe('matrixTranspose', () => {
  it('2×2 行列を転置する', () => {
    const r = matrixTranspose([[1, 2], [3, 4]]);
    expect(r.result).toEqual([[1, 3], [2, 4]]);
  });

  it('2×3 行列を転置して 3×2 を返す', () => {
    const r = matrixTranspose([[1, 2, 3], [4, 5, 6]]);
    expect(r.result).toEqual([[1, 4], [2, 5], [3, 6]]);
  });
});

describe('matrixDeterminant', () => {
  it('1×1 行列の行列式', () => {
    const r = matrixDeterminant([[7]]);
    expect(r.scalar).toBe(7);
  });

  it('2×2 行列の行列式', () => {
    // [[1,2],[3,4]] → 1*4 - 2*3 = -2
    const r = matrixDeterminant([[1, 2], [3, 4]]);
    expect(r.scalar).toBeCloseTo(-2, 8);
  });

  it('3×3 行列の行列式', () => {
    // [[1,2,3],[4,5,6],[7,8,9]] → 0
    const r = matrixDeterminant([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    expect(r.scalar).toBeCloseTo(0, 6);
  });

  it('単位行列の行列式は 1', () => {
    const r = matrixDeterminant([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    expect(r.scalar).toBeCloseTo(1, 8);
  });

  it('非正方行列はエラー', () => {
    expect(matrixDeterminant([[1, 2, 3]]).error).not.toBeNull();
  });
});

describe('matrixInverse', () => {
  it('2×2 行列の逆行列', () => {
    // [[2,1],[5,3]] の逆行列は [[3,-1],[-5,2]]
    const r = matrixInverse([[2, 1], [5, 3]]);
    expect(r.error).toBeNull();
    expect(r.result![0][0]).toBeCloseTo(3, 6);
    expect(r.result![0][1]).toBeCloseTo(-1, 6);
    expect(r.result![1][0]).toBeCloseTo(-5, 6);
    expect(r.result![1][1]).toBeCloseTo(2, 6);
  });

  it('単位行列の逆行列は単位行列', () => {
    const r = matrixInverse([[1, 0], [0, 1]]);
    expect(r.result).toEqual([[1, 0], [0, 1]]);
  });

  it('特異行列はエラー', () => {
    // [[1,2],[2,4]] は特異行列
    expect(matrixInverse([[1, 2], [2, 4]]).error).not.toBeNull();
  });

  it('非正方行列はエラー', () => {
    expect(matrixInverse([[1, 2, 3]]).error).not.toBeNull();
  });
});

describe('matrixTrace', () => {
  it('2×2 行列のトレース', () => {
    const r = matrixTrace([[1, 2], [3, 4]]);
    expect(r.scalar).toBe(5);
  });

  it('3×3 行列のトレース', () => {
    const r = matrixTrace([[1, 0, 0], [0, 2, 0], [0, 0, 3]]);
    expect(r.scalar).toBe(6);
  });

  it('非正方行列はエラー', () => {
    expect(matrixTrace([[1, 2, 3]]).error).not.toBeNull();
  });
});

describe('matrixRank', () => {
  it('フルランク 2×2 行列', () => {
    const r = matrixRank([[1, 2], [3, 4]]);
    expect(r.scalar).toBe(2);
  });

  it('ランク欠損の 2×2 行列', () => {
    // [[1,2],[2,4]] はランク 1
    const r = matrixRank([[1, 2], [2, 4]]);
    expect(r.scalar).toBe(1);
  });

  it('3×3 零行列のランクは 0', () => {
    const r = matrixRank([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    expect(r.scalar).toBe(0);
  });

  it('3×3 単位行列のランクは 3', () => {
    const r = matrixRank([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    expect(r.scalar).toBe(3);
  });

  it('2×3 フルランク行列', () => {
    // ランクは min(2,3) = 2 になる可能性（線形独立な行が 2 つ）
    const r = matrixRank([[1, 0, 0], [0, 1, 0]]);
    expect(r.scalar).toBe(2);
  });
});

describe('formatMatrixNum', () => {
  it('整数をフォーマットする', () => {
    expect(formatMatrixNum(5)).toBe('5');
    expect(formatMatrixNum(-3)).toBe('-3');
  });

  it('小数をフォーマットする', () => {
    expect(formatMatrixNum(1.5)).toBe('1.5');
  });

  it('数値誤差を丸める', () => {
    // 0.1+0.2 の誤差
    expect(formatMatrixNum(0.30000000001)).toBe('0.3');
  });

  it('Infinity を文字列で返す', () => {
    expect(formatMatrixNum(Infinity)).toBe('Infinity');
  });
});
