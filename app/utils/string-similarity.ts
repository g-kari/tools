/**
 * 文字列類似度計算ユーティリティ
 *
 * Levenshtein距離・Jaro-Winkler類似度・コサイン類似度・Hamming距離を計算する。
 */

/**
 * Levenshtein距離を計算する（編集距離）
 *
 * @param a 比較元文字列
 * @param b 比較先文字列
 * @returns 編集距離（挿入・削除・置換の最小操作回数）
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  // dp[i][j] = a[0..i-1] と b[0..j-1] のLevenshtein距離
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          1 +
          Math.min(
            dp[i - 1][j], // 削除
            dp[i][j - 1], // 挿入
            dp[i - 1][j - 1], // 置換
          );
      }
    }
  }

  return dp[m][n];
}

/**
 * Levenshtein距離から正規化された類似度（0〜1）を計算する
 *
 * @param a 比較元文字列
 * @param b 比較先文字列
 * @returns 類似度（1が完全一致、0が完全不一致）
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Jaro類似度を計算する
 *
 * @param a 比較元文字列
 * @param b 比較先文字列
 * @returns Jaro類似度（0〜1）
 */
export function jaroSimilarity(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  if (a === b) return 1;

  const matchWindow = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  if (matchWindow < 0) {
    // 両方が1文字の場合
    return a[0] === b[0] ? 1 : 0;
  }

  const aMatches = Array.from({ length: a.length }, () => false);
  const bMatches = Array.from({ length: b.length }, () => false);

  let matches = 0;
  let transpositions = 0;

  // マッチングフェーズ
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, b.length);

    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // 転置カウント
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  return (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;
}

/**
 * Jaro-Winkler類似度を計算する
 *
 * 共通プレフィックスが長いほど類似度を補正する。
 * 人名のあいまい照合によく使われる。
 *
 * @param a 比較元文字列
 * @param b 比較先文字列
 * @param scalingFactor プレフィックスのスケーリング係数（通常 0.1）
 * @returns Jaro-Winkler類似度（0〜1）
 */
export function jaroWinklerSimilarity(a: string, b: string, scalingFactor = 0.1): number {
  const jaro = jaroSimilarity(a, b);

  // 共通プレフィックス長（最大4文字）
  let prefixLen = 0;
  const maxPrefix = Math.min(4, Math.min(a.length, b.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (a[i] === b[i]) prefixLen++;
    else break;
  }

  return jaro + prefixLen * scalingFactor * (1 - jaro);
}

/**
 * 文字 n-gram のベクトルを生成する
 *
 * @param text 入力文字列
 * @param n n-gramのサイズ
 * @returns {Map<string, number>} n-gramとその出現回数のマップ
 */
function buildNgramVector(text: string, n: number): Map<string, number> {
  const vector = new Map<string, number>();
  if (text.length < n) {
    // n より短い場合は文字単位
    for (const ch of text) {
      vector.set(ch, (vector.get(ch) ?? 0) + 1);
    }
    return vector;
  }
  for (let i = 0; i <= text.length - n; i++) {
    const gram = text.slice(i, i + n);
    vector.set(gram, (vector.get(gram) ?? 0) + 1);
  }
  return vector;
}

/**
 * コサイン類似度を文字 n-gram ベクトルで計算する
 *
 * @param a 比較元文字列
 * @param b 比較先文字列
 * @param n n-gramのサイズ（デフォルト: 2）
 * @returns コサイン類似度（0〜1）
 */
export function cosineSimilarity(a: string, b: string, n = 2): number {
  if (a.length === 0 || b.length === 0) return 0;
  if (a === b) return 1;

  const vecA = buildNgramVector(a, n);
  const vecB = buildNgramVector(b, n);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [gram, countA] of vecA) {
    dotProduct += countA * (vecB.get(gram) ?? 0);
    normA += countA * countA;
  }
  for (const [, countB] of vecB) {
    normB += countB * countB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Hamming距離を計算する（同じ長さの文字列のみ）
 *
 * @param a 比較元文字列
 * @param b 比較先文字列
 * @returns Hamming距離。文字列長が異なる場合は null を返す
 */
export function hammingDistance(a: string, b: string): number | null {
  if (a.length !== b.length) return null;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) distance++;
  }
  return distance;
}

/**
 * Hamming距離から正規化された類似度を計算する
 *
 * @param a 比較元文字列
 * @param b 比較先文字列
 * @returns 類似度（0〜1）。長さが異なる場合は null
 */
export function hammingSimilarity(a: string, b: string): number | null {
  const dist = hammingDistance(a, b);
  if (dist === null) return null;
  if (a.length === 0) return 1;
  return 1 - dist / a.length;
}

/** 計算結果の型 */
export interface SimilarityResult {
  /** Levenshtein編集距離 */
  levenshteinDistance: number;
  /** Levenshtein正規化類似度（0〜1） */
  levenshteinSimilarity: number;
  /** Jaro-Winkler類似度（0〜1） */
  jaroWinkler: number;
  /** コサイン類似度（bigram, 0〜1） */
  cosine: number;
  /** Hamming距離（同長の場合のみ、異なれば null） */
  hammingDistance: number | null;
  /** Hamming正規化類似度（同長の場合のみ、異なれば null） */
  hammingSimilarity: number | null;
}

/**
 * 2つの文字列の類似度を一括計算する
 *
 * @param a 比較元文字列
 * @param b 比較先文字列
 * @returns 各指標の計算結果
 */
export function calculateSimilarity(a: string, b: string): SimilarityResult {
  return {
    levenshteinDistance: levenshteinDistance(a, b),
    levenshteinSimilarity: levenshteinSimilarity(a, b),
    jaroWinkler: jaroWinklerSimilarity(a, b),
    cosine: cosineSimilarity(a, b),
    hammingDistance: hammingDistance(a, b),
    hammingSimilarity: hammingSimilarity(a, b),
  };
}
