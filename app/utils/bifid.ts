/**
 * Bifid暗号（ビフィド暗号）ユーティリティ
 * ポリュビオスの方陣を使って行座標と列座標を分離・再結合する分割転置暗号
 */

/**
 * キーワードから5×5のポリュビオス方陣を構築する
 * I と J は同一視（J は I に置換）
 * @param key キーワード（英字）
 * @returns 5×5の文字グリッド
 */
export function buildBifidSquare(key: string): string[][] {
  const upper = key.toUpperCase().replace(/J/g, "I");
  const seen = new Set<string>();
  const letters: string[] = [];

  for (const ch of upper + "ABCDEFGHIKLMNOPQRSTUVWXYZ") {
    if (/[A-Z]/.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      letters.push(ch);
    }
  }

  return Array.from({ length: 5 }, (_, r) => letters.slice(r * 5, (r + 1) * 5));
}

/**
 * 方陣内で文字の座標を検索する
 * @param grid 5×5グリッド
 * @param ch 検索する文字
 * @returns [行, 列]のタプル（見つからない場合は [-1, -1]）
 */
export function findInSquare(grid: string[][], ch: string): [number, number] {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c] === ch) return [r, c];
    }
  }
  return [-1, -1];
}

/**
 * テキストをBifid暗号でエンコードする
 * アルファベット以外の文字は除去される
 * @param text 変換するテキスト
 * @param key キーワード
 * @param period 分割周期（0 または 1 以下でテキスト全体を一括処理）
 * @returns エンコードされた暗号文（大文字）
 */
export function encodeBifid(text: string, key: string, period = 0): string {
  const upper = text
    .toUpperCase()
    .replace(/J/g, "I")
    .replace(/[^A-Z]/g, "");
  if (!upper) return "";

  const grid = buildBifidSquare(key);
  const coords = Array.from(upper).map((ch) => findInSquare(grid, ch));
  const chunkSize = period > 1 ? period : upper.length;
  const result: string[] = [];

  for (let start = 0; start < coords.length; start += chunkSize) {
    const chunk = coords.slice(start, start + chunkSize);
    const rows = chunk.map(([r]) => r);
    const cols = chunk.map(([, c]) => c);
    const combined = [...rows, ...cols];

    for (let i = 0; i < combined.length - 1; i += 2) {
      result.push(grid[combined[i]][combined[i + 1]]);
    }
  }

  return result.join("");
}

/**
 * Bifid暗号でデコードする
 * アルファベット以外の文字は除去される
 * @param text 変換する暗号文
 * @param key キーワード
 * @param period 分割周期（0 または 1 以下でテキスト全体を一括処理）
 * @returns デコードされた平文（大文字）
 */
export function decodeBifid(text: string, key: string, period = 0): string {
  const upper = text
    .toUpperCase()
    .replace(/J/g, "I")
    .replace(/[^A-Z]/g, "");
  if (!upper) return "";

  const grid = buildBifidSquare(key);
  const coords = Array.from(upper).map((ch) => findInSquare(grid, ch));
  const chunkSize = period > 1 ? period : upper.length;
  const result: string[] = [];

  for (let start = 0; start < coords.length; start += chunkSize) {
    const chunk = coords.slice(start, start + chunkSize);
    const combined = chunk.flatMap(([r, c]) => [r, c]);
    const mid = chunk.length;
    const rows = combined.slice(0, mid);
    const cols = combined.slice(mid);

    for (let i = 0; i < mid; i++) {
      result.push(grid[rows[i]][cols[i]]);
    }
  }

  return result.join("");
}
