/**
 * スキュタレー暗号（Scytale cipher）ユーティリティ
 * 古代スパルタで使用された転置暗号。テキストをグリッドに行方向で書き込み、列方向に読み取る。
 */

/**
 * テキストをスキュタレー暗号でエンコードする
 * @param text 変換するテキスト
 * @param diameter 円柱の直径（列数、2以上）
 * @returns エンコードされたテキスト
 */
export function encodeScytale(text: string, diameter: number): string {
  if (text.length === 0) return text;
  const cols = Math.max(2, Math.floor(diameter));
  const rows = Math.ceil(text.length / cols);
  const total = rows * cols;

  // グリッドを行方向に埋める（不足分は空白でパディング）
  const grid: string[] = text.split("").concat(Array(total - text.length).fill(" "));

  // 列方向に読み取る
  let result = "";
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      result += grid[r * cols + c];
    }
  }

  return result;
}

/**
 * スキュタレー暗号でデコードする
 * @param text 変換するテキスト
 * @param diameter 円柱の直径（列数、2以上）
 * @returns デコードされたテキスト（末尾の空白パディングを除去）
 */
export function decodeScytale(text: string, diameter: number): string {
  if (text.length === 0) return text;
  const cols = Math.max(2, Math.floor(diameter));
  // デコード時は元のグリッドの行数が列数（diameterが行に相当）
  const rows = Math.ceil(text.length / cols);

  // エンコード時と同じグリッドサイズ
  const encRows = rows;
  const encCols = cols;

  // 暗号文は列優先で書かれているので、行優先に並び替えてデコード
  // エンコード: (r, c) → position c * encRows + r
  // デコード: position を (c, r) に逆変換して元の (r, c) 順に読む

  const grid: string[] = new Array(encRows * encCols).fill(" ");
  for (let c = 0; c < encCols; c++) {
    for (let r = 0; r < encRows; r++) {
      const srcIdx = c * encRows + r;
      if (srcIdx < text.length) {
        grid[r * encCols + c] = text[srcIdx];
      }
    }
  }

  // 行方向に読み取り、末尾の空白パディングを除去
  return grid.join("").trimEnd();
}

/**
 * スキュタレー暗号のグリッドを可視化する
 * @param text テキスト
 * @param diameter 列数（円柱の直径）
 * @param mode 'plain'=平文グリッド（行方向書き込み）, 'cipher'=暗号グリッド（列方向書き込み後の行表示）
 * @returns グリッドの各行を文字配列として返す（パディングは '·'）
 */
export function visualizeScytale(
  text: string,
  diameter: number,
  mode: "plain" | "cipher",
): string[][] {
  if (text.length === 0) return [];

  const cols = Math.max(2, Math.floor(diameter));
  const rows = Math.ceil(text.length / cols);
  const total = rows * cols;

  if (mode === "plain") {
    // 行方向に書き込んだグリッド
    const result: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        row.push(idx < text.length ? text[idx] : "·");
      }
      result.push(row);
    }
    return result;
  } else {
    // エンコード後のテキストを行方向に並べたグリッド
    const encoded = encodeScytale(text, diameter);
    const encRows = Math.ceil(encoded.length / cols);
    const result: string[][] = [];
    for (let r = 0; r < encRows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const ch = encoded[idx];
        row.push(ch !== undefined ? (ch === " " ? "·" : ch) : "·");
      }
      result.push(row);
    }
    // 列数が total の場合より少ない行しかない場合を補正
    const padRows = rows - result.length;
    for (let i = 0; i < padRows; i++) {
      result.push(Array(cols).fill("·"));
    }
    return result.slice(0, rows);
  }
}

/**
 * スキュタレー暗号で有効なdiameterの範囲を返す
 * @returns { min: number; max: number }
 */
export function getScytaleDiameterRange(): { min: number; max: number } {
  return { min: 2, max: 20 };
}
