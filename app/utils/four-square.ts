/**
 * 四方格子暗号（Four-Square Cipher）ユーティリティ
 * 4つの5×5ポリュビオス方陣を使ったダイグラフ換字式暗号
 */

/** 標準アルファベット方陣（J を除く25文字） */
const STANDARD_SQUARE: string[] = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'.split('');

/**
 * キーワードから5×5のポリュビオス方陣を構築する
 * I と J は同一視（J は I に置換）
 * @param key キーワード（英字）
 * @returns 5×5の文字グリッド（2次元配列）
 */
export function buildFourSquareGrid(key: string): string[][] {
  const upper = key.toUpperCase().replace(/J/g, 'I');
  const seen = new Set<string>();
  const letters: string[] = [];

  for (const ch of upper + 'ABCDEFGHIKLMNOPQRSTUVWXYZ') {
    if (/[A-Z]/.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      letters.push(ch);
    }
  }

  return Array.from({ length: 5 }, (_, r) => letters.slice(r * 5, (r + 1) * 5));
}

/**
 * 標準方陣（固定）を5×5グリッドとして返す
 * @returns 標準アルファベット5×5グリッド
 */
export function buildStandardGrid(): string[][] {
  return Array.from({ length: 5 }, (_, r) => STANDARD_SQUARE.slice(r * 5, (r + 1) * 5));
}

/**
 * グリッド内で文字の座標を検索する
 * @param grid 5×5グリッド
 * @param ch 検索する文字
 * @returns [行, 列]のタプル（見つからない場合は [-1, -1]）
 */
export function findInGrid(grid: string[][], ch: string): [number, number] {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c] === ch) return [r, c];
    }
  }
  return [-1, -1];
}

/**
 * テキストを四方格子暗号で暗号化する
 * アルファベット以外の文字は除去され、J は I に変換される
 * 奇数文字の場合は末尾に X を補填する
 * @param text 暗号化するテキスト
 * @param key1 右上方陣のキーワード
 * @param key2 左下方陣のキーワード
 * @returns 暗号化されたテキスト（スペース区切りのダイグラフ）
 */
export function fourSquareEncrypt(text: string, key1: string, key2: string): string {
  const plain = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  if (!plain) return '';

  const padded = plain.length % 2 === 0 ? plain : plain + 'X';

  // 四方陣の構築
  const topLeft = buildStandardGrid(); // 平文用（左上）
  const topRight = buildFourSquareGrid(key1); // 暗号文用（右上）
  const bottomLeft = buildFourSquareGrid(key2); // 暗号文用（左下）
  const bottomRight = buildStandardGrid(); // 平文用（右下）

  const result: string[] = [];

  for (let i = 0; i < padded.length; i += 2) {
    const a = padded[i];
    const b = padded[i + 1];

    const [r1, c1] = findInGrid(topLeft, a);
    const [r2, c2] = findInGrid(bottomRight, b);

    if (r1 === -1 || r2 === -1) continue;

    result.push(topRight[r1][c2] + bottomLeft[r2][c1]);
  }

  return result.join(' ');
}

/**
 * 四方格子暗号で復号化する
 * @param text 復号化する暗号文
 * @param key1 右上方陣のキーワード
 * @param key2 左下方陣のキーワード
 * @returns 復号化されたテキスト（大文字）
 */
export function fourSquareDecrypt(text: string, key1: string, key2: string): string {
  const cipher = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  if (!cipher || cipher.length % 2 !== 0) return '';

  // 四方陣の構築
  const topLeft = buildStandardGrid(); // 平文用（左上）
  const topRight = buildFourSquareGrid(key1); // 暗号文用（右上）
  const bottomLeft = buildFourSquareGrid(key2); // 暗号文用（左下）
  const bottomRight = buildStandardGrid(); // 平文用（右下）

  const result: string[] = [];

  for (let i = 0; i < cipher.length; i += 2) {
    const e1 = cipher[i];
    const e2 = cipher[i + 1];

    const [r1, c2] = findInGrid(topRight, e1);
    const [r2, c1] = findInGrid(bottomLeft, e2);

    if (r1 === -1 || r2 === -1) continue;

    result.push(topLeft[r1][c1] + bottomRight[r2][c2]);
  }

  return result.join(' ');
}

/**
 * 暗号化・復号化のダイグラフペアを取得する（可視化用）
 * @param text 入力テキスト
 * @param key1 右上方陣のキーワード
 * @param key2 左下方陣のキーワード
 * @param mode 暗号化か復号化か
 * @returns ダイグラフペアの配列 [{plain, cipher}]
 */
export function getFourSquareDigraphs(
  text: string,
  key1: string,
  key2: string,
  mode: 'encrypt' | 'decrypt'
): Array<{ input: string; output: string }> {
  if (mode === 'encrypt') {
    const plain = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    if (!plain) return [];
    const padded = plain.length % 2 === 0 ? plain : plain + 'X';

    const topLeft = buildStandardGrid();
    const topRight = buildFourSquareGrid(key1);
    const bottomLeft = buildFourSquareGrid(key2);
    const bottomRight = buildStandardGrid();

    const pairs: Array<{ input: string; output: string }> = [];
    for (let i = 0; i < padded.length; i += 2) {
      const a = padded[i];
      const b = padded[i + 1];
      const [r1, c1] = findInGrid(topLeft, a);
      const [r2, c2] = findInGrid(bottomRight, b);
      if (r1 === -1 || r2 === -1) continue;
      pairs.push({ input: a + b, output: topRight[r1][c2] + bottomLeft[r2][c1] });
    }
    return pairs;
  } else {
    const cipher = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
    if (!cipher || cipher.length % 2 !== 0) return [];

    const topLeft = buildStandardGrid();
    const topRight = buildFourSquareGrid(key1);
    const bottomLeft = buildFourSquareGrid(key2);
    const bottomRight = buildStandardGrid();

    const pairs: Array<{ input: string; output: string }> = [];
    for (let i = 0; i < cipher.length; i += 2) {
      const e1 = cipher[i];
      const e2 = cipher[i + 1];
      const [r1, c2] = findInGrid(topRight, e1);
      const [r2, c1] = findInGrid(bottomLeft, e2);
      if (r1 === -1 || r2 === -1) continue;
      pairs.push({ input: e1 + e2, output: topLeft[r1][c1] + bottomRight[r2][c2] });
    }
    return pairs;
  }
}
