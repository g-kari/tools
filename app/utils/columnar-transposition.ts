/**
 * 列転置暗号（Columnar Transposition Cipher）ユーティリティ
 * キーワードのアルファベット順に列を並び替えることで暗号化する転置式暗号
 */

/**
 * キーワードから列の読み取り順序（ランク）を生成する
 * 同じ文字が複数ある場合は左から順にランク付け
 * @param key キーワード（1文字以上）
 * @returns 各列インデックスのランク配列
 */
export function buildColumnOrder(key: string): number[] {
  const upper = key.toUpperCase();
  const indexed = Array.from(upper).map((char, i) => ({ char, i }));
  const sorted = [...indexed].sort((a, b) =>
    a.char !== b.char ? a.char.localeCompare(b.char) : a.i - b.i
  );
  const order = new Array<number>(upper.length);
  sorted.forEach(({ i }, rank) => {
    order[i] = rank;
  });
  return order;
}

/**
 * テキストを列転置暗号でエンコードする
 * @param text 変換するテキスト
 * @param key キーワード
 * @param padChar 不足セルを埋めるパディング文字（デフォルト: 'X'）
 * @returns エンコードされた暗号文（パディングを含む）
 */
export function encodeColumnar(text: string, key: string, padChar = 'X'): string {
  if (!key || key.length === 0 || text.length === 0) return text;

  const keyLen = key.length;
  const rows = Math.ceil(text.length / keyLen);
  const padded = text.padEnd(rows * keyLen, padChar);

  // グリッドを行優先で構築
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(Array.from(padded.slice(r * keyLen, (r + 1) * keyLen)));
  }

  // 列のランク順に読み出す
  const order = buildColumnOrder(key);
  const rankToCol = new Array<number>(keyLen);
  order.forEach((rank, col) => {
    rankToCol[rank] = col;
  });

  let result = '';
  for (let rank = 0; rank < keyLen; rank++) {
    const col = rankToCol[rank];
    for (let r = 0; r < rows; r++) {
      result += grid[r][col];
    }
  }

  return result;
}

/**
 * 列転置暗号でデコードする
 * パディング文字は末尾から自動的に除去される
 * @param text 変換する暗号文
 * @param key キーワード
 * @param padChar パディング文字（末尾から除去される）
 * @returns デコードされた平文（末尾パディング除去済み）
 */
export function decodeColumnar(text: string, key: string, padChar = 'X'): string {
  if (!key || key.length === 0 || text.length === 0) return text;

  const keyLen = key.length;
  const rows = Math.ceil(text.length / keyLen);

  const order = buildColumnOrder(key);
  const rankToCol = new Array<number>(keyLen);
  order.forEach((rank, col) => {
    rankToCol[rank] = col;
  });

  // 暗号文を列ごとに均等分割（エンコード時はパディング込みで均等）
  const columns: string[] = new Array(keyLen);
  let offset = 0;
  for (let rank = 0; rank < keyLen; rank++) {
    const col = rankToCol[rank];
    columns[col] = text.slice(offset, offset + rows);
    offset += rows;
  }

  // 行優先で読み出す
  let result = '';
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < keyLen; col++) {
      const ch = columns[col]?.[r];
      if (ch !== undefined) {
        result += ch;
      }
    }
  }

  // 末尾のパディング文字を除去（列転置暗号の標準的な復号処理）
  const pad = padChar.toUpperCase()[0] ?? 'X';
  let end = result.length;
  while (end > 0 && result[end - 1] === pad) {
    end--;
  }
  return result.slice(0, end);
}

/**
 * グリッドの可視化データを生成する
 * @param text 平文（エンコード時）または暗号文（デコード時）
 * @param key キーワード
 * @param padChar パディング文字
 * @returns グリッドの行列データ（各セルに文字とパディングフラグ）
 */
export function buildGrid(
  text: string,
  key: string,
  padChar = 'X'
): { char: string; isPad: boolean }[][] {
  if (!key || !text) return [];

  const keyLen = key.length;
  const rows = Math.ceil(text.length / keyLen);
  const padded = text.padEnd(rows * keyLen, padChar);

  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: keyLen }, (__, c) => {
      const idx = r * keyLen + c;
      const char = padded[idx] ?? padChar;
      return { char, isPad: idx >= text.length };
    })
  );
}
