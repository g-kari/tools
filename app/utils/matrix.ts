/**
 * 行列計算ユーティリティ関数
 * 加算・減算・乗算・転置・逆行列・行列式・トレース・ランクなどを計算
 */

/** 行列の型エイリアス（2次元配列）*/
export type Matrix = number[][];

/** 行列のパース結果 */
export interface MatrixParseResult {
  /** パース済み行列（エラー時は null）*/
  matrix: Matrix | null;
  /** 行数 */
  rows: number;
  /** 列数 */
  cols: number;
  /** エラーメッセージ（成功時は null）*/
  error: string | null;
}

/** 行列演算の結果 */
export interface MatrixOpResult {
  /** 行列結果（スカラー演算時は null）*/
  result: Matrix | null;
  /** スカラー結果（行列演算時は null）*/
  scalar: number | null;
  /** エラーメッセージ（成功時は null）*/
  error: string | null;
}

/**
 * テキストから行列をパースする
 * スペース・タブ・カンマ区切りが列、改行が行
 * @param text - 入力テキスト
 * @returns パース結果
 */
export function parseMatrix(text: string): MatrixParseResult {
  const lines = text
    .trim()
    .split('\n')
    .filter((l) => l.trim() !== '');

  if (lines.length === 0) {
    return { matrix: null, rows: 0, cols: 0, error: 'データが入力されていません' };
  }

  const matrix: Matrix = [];
  let cols = -1;

  for (const line of lines) {
    const values = line
      .trim()
      .split(/[\s\t,]+/)
      .filter((s) => s !== '');
    if (cols === -1) {
      cols = values.length;
    } else if (values.length !== cols) {
      return {
        matrix: null,
        rows: 0,
        cols: 0,
        error: `行の列数が不一致です（${cols} 列 vs ${values.length} 列）`,
      };
    }
    const row: number[] = values.map((v) => parseFloat(v));
    if (row.some((n) => isNaN(n))) {
      return { matrix: null, rows: 0, cols: 0, error: '数値以外の値が含まれています' };
    }
    matrix.push(row);
  }

  if (cols === 0) {
    return { matrix: null, rows: 0, cols: 0, error: '列数が 0 です' };
  }

  return { matrix, rows: matrix.length, cols, error: null };
}

/**
 * 数値を見やすい形式にフォーマットする（行列表示用）
 * @param v - 数値
 */
export function formatMatrixNum(v: number): string {
  if (!isFinite(v)) return String(v);
  // 整数か判定
  const rounded = Math.round(v * 1e10) / 1e10;
  if (Number.isInteger(rounded)) return String(rounded);
  return parseFloat(rounded.toFixed(6)).toString();
}

/**
 * 行列の加算 (A + B)
 */
export function matrixAdd(a: Matrix, b: Matrix): MatrixOpResult {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    return {
      result: null,
      scalar: null,
      error: `行列のサイズが一致しません（A: ${a.length}×${a[0].length}、B: ${b.length}×${b[0].length}）`,
    };
  }
  const result = a.map((row, i) => row.map((v, j) => v + b[i][j]));
  return { result, scalar: null, error: null };
}

/**
 * 行列の減算 (A − B)
 */
export function matrixSubtract(a: Matrix, b: Matrix): MatrixOpResult {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    return {
      result: null,
      scalar: null,
      error: `行列のサイズが一致しません（A: ${a.length}×${a[0].length}、B: ${b.length}×${b[0].length}）`,
    };
  }
  const result = a.map((row, i) => row.map((v, j) => v - b[i][j]));
  return { result, scalar: null, error: null };
}

/**
 * 行列の乗算 (A × B)
 * A の列数と B の行数が一致する必要あり
 */
export function matrixMultiply(a: Matrix, b: Matrix): MatrixOpResult {
  if (a[0].length !== b.length) {
    return {
      result: null,
      scalar: null,
      error: `A の列数 (${a[0].length}) と B の行数 (${b.length}) が一致しません`,
    };
  }
  const rows = a.length;
  const cols = b[0].length;
  const inner = a[0].length;
  const result: Matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < inner; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return { result, scalar: null, error: null };
}

/**
 * スカラー倍 (k × A)
 */
export function matrixScalar(a: Matrix, k: number): MatrixOpResult {
  const result = a.map((row) => row.map((v) => v * k));
  return { result, scalar: null, error: null };
}

/**
 * 転置行列 (Aᵀ)
 */
export function matrixTranspose(a: Matrix): MatrixOpResult {
  const rows = a.length;
  const cols = a[0].length;
  const result: Matrix = Array.from({ length: cols }, (_, i) =>
    Array.from({ length: rows }, (_, j) => a[j][i]),
  );
  return { result, scalar: null, error: null };
}

/**
 * 行列式を計算する (det(A))
 * ガウス消去法（部分ピボット選択）を使用
 * 正方行列のみ対応
 */
export function matrixDeterminant(a: Matrix): MatrixOpResult {
  const n = a.length;
  if (n !== a[0].length) {
    return {
      result: null,
      scalar: null,
      error: '正方行列でなければ行列式を計算できません',
    };
  }
  if (n === 1) return { result: null, scalar: a[0][0], error: null };
  if (n === 2) {
    return {
      result: null,
      scalar: a[0][0] * a[1][1] - a[0][1] * a[1][0],
      error: null,
    };
  }

  const m: number[][] = a.map((row) => [...row]);
  let det = 1;
  let sign = 1;

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[maxRow][col])) {
        maxRow = row;
      }
    }
    if (maxRow !== col) {
      [m[col], m[maxRow]] = [m[maxRow], m[col]];
      sign *= -1;
    }
    if (m[col][col] === 0) {
      return { result: null, scalar: 0, error: null };
    }
    det *= m[col][col];
    for (let row = col + 1; row < n; row++) {
      const factor = m[row][col] / m[col][col];
      for (let j = col; j < n; j++) {
        m[row][j] -= factor * m[col][j];
      }
    }
  }

  const val = Math.round(det * sign * 1e10) / 1e10;
  return { result: null, scalar: val, error: null };
}

/**
 * 逆行列を計算する (A⁻¹)
 * ガウス・ジョルダン消去法を使用
 * 正方行列のみ対応
 */
export function matrixInverse(a: Matrix): MatrixOpResult {
  const n = a.length;
  if (n !== a[0].length) {
    return {
      result: null,
      scalar: null,
      error: '正方行列でなければ逆行列を計算できません',
    };
  }

  // 拡大行列 [A | I] を作成
  const m: number[][] = a.map((row, i) => {
    const id = Array<number>(n).fill(0);
    id[i] = 1;
    return [...row, ...id];
  });

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[maxRow][col])) {
        maxRow = row;
      }
    }
    [m[col], m[maxRow]] = [m[maxRow], m[col]];

    if (Math.abs(m[col][col]) < 1e-12) {
      return {
        result: null,
        scalar: null,
        error: '逆行列が存在しません（特異行列）',
      };
    }

    const pivot = m[col][col];
    for (let j = 0; j < 2 * n; j++) {
      m[col][j] /= pivot;
    }

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = m[row][col];
      for (let j = 0; j < 2 * n; j++) {
        m[row][j] -= factor * m[col][j];
      }
    }
  }

  // 右半分が逆行列、数値誤差を丸める
  const result: Matrix = m.map((row) =>
    row.slice(n).map((v) => Math.round(v * 1e10) / 1e10),
  );
  return { result, scalar: null, error: null };
}

/**
 * トレースを計算する (tr(A))
 * 対角成分の和。正方行列のみ対応
 */
export function matrixTrace(a: Matrix): MatrixOpResult {
  if (a.length !== a[0].length) {
    return {
      result: null,
      scalar: null,
      error: '正方行列でなければトレースを計算できません',
    };
  }
  const trace = a.reduce((sum, row, i) => sum + row[i], 0);
  return { result: null, scalar: trace, error: null };
}

/**
 * ランクを計算する (rank(A))
 * ガウス消去法による行簡約を使用
 */
export function matrixRank(a: Matrix): MatrixOpResult {
  const rows = a.length;
  const cols = a[0].length;
  const m: number[][] = a.map((row) => [...row]);
  let rank = 0;
  const EPS = 1e-9;

  for (let col = 0; col < cols && rank < rows; col++) {
    let pivotRow = -1;
    for (let row = rank; row < rows; row++) {
      if (Math.abs(m[row][col]) > EPS) {
        pivotRow = row;
        break;
      }
    }
    if (pivotRow === -1) continue;

    [m[rank], m[pivotRow]] = [m[pivotRow], m[rank]];

    const pivot = m[rank][col];
    for (let j = 0; j < cols; j++) {
      m[rank][j] /= pivot;
    }

    for (let row = 0; row < rows; row++) {
      if (row === rank) continue;
      const factor = m[row][col];
      for (let j = 0; j < cols; j++) {
        m[row][j] -= factor * m[rank][j];
      }
    }
    rank++;
  }

  return { result: null, scalar: rank, error: null };
}
