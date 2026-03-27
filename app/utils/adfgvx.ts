/**
 * ADFGVX暗号ユーティリティ
 * 第一次世界大戦中にドイツ軍が使用した暗号方式。
 * ポリビウス方陣による換字（フラクション化）と縦列転置の2段階で構成される。
 * 暗号文はA・D・F・G・V・Xの6文字のみで構成される。
 */

/** ポリビウス方陣の行・列ヘッダー */
const HEADERS = ["A", "D", "F", "G", "V", "X"] as const;

/** 方陣に使用するアルファベット（A-Z + 0-9 = 36文字） */
const BASE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * キーワードを使って36文字のポリビウスアルファベットを生成する
 * @param key キーワード（重複除去後に残りのアルファベットを追加）
 * @returns 36文字の混合アルファベット
 */
export function createPolybiusAlphabet(key: string): string {
  const normalized = key.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const seen = new Set<string>();
  let result = "";

  for (const char of normalized) {
    if (!seen.has(char)) {
      seen.add(char);
      result += char;
    }
  }

  for (const char of BASE_ALPHABET) {
    if (!seen.has(char)) {
      result += char;
    }
  }

  return result;
}

/**
 * 6×6のポリビウス方陣を生成する
 * @param key キーワード
 * @returns 6×6の文字グリッド
 */
export function createPolybiusSquare(key: string): string[][] {
  const alphabet = createPolybiusAlphabet(key);
  const square: string[][] = [];
  for (let i = 0; i < 6; i++) {
    square.push(alphabet.slice(i * 6, (i + 1) * 6).split(""));
  }
  return square;
}

/**
 * 1文字をADFGVXの2文字ペアに換字する
 * @param char 換字する文字（大文字英数字）
 * @param square ポリビウス方陣
 * @returns ADFGVX2文字ペア（方陣にない文字はnull）
 */
function substituteChar(char: string, square: string[][]): string | null {
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      if (square[row][col] === char) {
        return HEADERS[row] + HEADERS[col];
      }
    }
  }
  return null;
}

/**
 * ADFGVX2文字ペアを元の文字に逆換字する
 * @param pair ADFGVX2文字ペア
 * @param square ポリビウス方陣
 * @returns 元の文字（無効なペアはnull）
 */
function reverseSubstituteChar(pair: string, square: string[][]): string | null {
  const row = HEADERS.indexOf(pair[0] as (typeof HEADERS)[number]);
  const col = HEADERS.indexOf(pair[1] as (typeof HEADERS)[number]);
  if (row === -1 || col === -1) return null;
  return square[row][col];
}

/**
 * 転置キーに基づく列の読み取り順を計算する
 * @param key 転置キー（英字のみ）
 * @returns 元の列インデックスを昇順ソート順で並べた配列
 */
function getColumnOrder(key: string): number[] {
  const chars = key.split("").map((char, i) => ({ char, i }));
  chars.sort((a, b) => a.char.localeCompare(b.char) || a.i - b.i);
  return chars.map((item) => item.i);
}

/**
 * 縦列転置暗号化を行う
 * @param text 転置するテキスト
 * @param key 転置キー（英字のみ使用）
 * @returns 転置後のテキスト
 */
function columnTranspose(text: string, key: string): string {
  const normalizedKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (normalizedKey.length === 0) return text;

  const numCols = normalizedKey.length;
  const numRows = Math.ceil(text.length / numCols);

  // 行×列のグリッドにテキストを配置
  const grid: string[][] = [];
  for (let r = 0; r < numRows; r++) {
    const row: string[] = [];
    for (let c = 0; c < numCols; c++) {
      const idx = r * numCols + c;
      row.push(idx < text.length ? text[idx] : "");
    }
    grid.push(row);
  }

  // ソート順に列を読み取る
  const order = getColumnOrder(normalizedKey);
  let result = "";
  for (const col of order) {
    for (let row = 0; row < numRows; row++) {
      result += grid[row][col];
    }
  }
  return result;
}

/**
 * 縦列転置の逆操作を行う
 * @param text 逆転置するテキスト
 * @param key 転置キー（英字のみ使用）
 * @returns 逆転置後のテキスト
 */
function reverseColumnTranspose(text: string, key: string): string {
  const normalizedKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (normalizedKey.length === 0) return text;

  const numCols = normalizedKey.length;
  const numRows = Math.ceil(text.length / numCols);
  const remainder = text.length % numCols;

  const order = getColumnOrder(normalizedKey);

  // 各列の長さを計算（不均等な場合を考慮）
  // 元のグリッドでは列インデックス0〜(remainder-1)がnumRows行、remainder以降はnumRows-1行
  const colLengths = new Array(numCols).fill(numRows);
  if (remainder > 0) {
    for (let c = remainder; c < numCols; c++) {
      colLengths[c]--;
    }
  }

  // テキストを列ごとに分割（ソート順で読み取った列に対応）
  const columns: string[] = new Array(numCols).fill("");
  let pos = 0;
  for (const origCol of order) {
    const len = colLengths[origCol];
    columns[origCol] = text.slice(pos, pos + len);
    pos += len;
  }

  // 行ごとに読み取る
  let result = "";
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (r < columns[c].length) {
        result += columns[c][r];
      }
    }
  }
  return result;
}

/**
 * ADFGVX暗号化を行う
 * 手順1: ポリビウス方陣で換字（各文字→2文字ペア）
 * 手順2: 縦列転置
 * @param text 暗号化するテキスト（英数字以外は無視）
 * @param polybiusKey ポリビウス方陣のキーワード
 * @param transpositionKey 縦列転置のキーワード（英字のみ）
 * @returns 暗号化されたテキスト（ADFGVX文字列）
 */
export function adfgvxEncrypt(
  text: string,
  polybiusKey: string,
  transpositionKey: string
): string {
  const square = createPolybiusSquare(polybiusKey);
  const normalizedTransKey = transpositionKey.toUpperCase().replace(/[^A-Z]/g, "");

  // 手順1: 換字（英数字のみ処理、スペース・記号は除去）
  let substituted = "";
  for (const char of text) {
    const upper = char.toUpperCase();
    if (/[A-Z0-9]/.test(upper)) {
      const pair = substituteChar(upper, square);
      if (pair) substituted += pair;
    }
  }

  if (!substituted) return "";

  // 転置キーがない場合はADFGVX暗号として不完全のため空文字を返す
  if (normalizedTransKey.length === 0) return "";

  // 手順2: 縦列転置
  return columnTranspose(substituted, normalizedTransKey);
}

/**
 * ADFGVX復号化を行う
 * 手順1: 縦列転置の逆操作
 * 手順2: ポリビウス方陣による逆換字（2文字ペア→元の文字）
 * @param text 復号化するテキスト（ADFGVX文字のみ）
 * @param polybiusKey ポリビウス方陣のキーワード
 * @param transpositionKey 縦列転置のキーワード（英字のみ）
 * @returns 復号化されたテキスト（大文字英数字）
 */
export function adfgvxDecrypt(
  text: string,
  polybiusKey: string,
  transpositionKey: string
): string {
  const square = createPolybiusSquare(polybiusKey);
  const normalizedTransKey = transpositionKey.toUpperCase().replace(/[^A-Z]/g, "");

  // ADFGVXの文字のみ抽出
  const normalized = text.toUpperCase().replace(/[^ADFGVX]/g, "");
  if (normalized.length % 2 !== 0) return "";

  // 手順1: 縦列転置の逆操作
  const unTransposed =
    normalizedTransKey.length > 0
      ? reverseColumnTranspose(normalized, normalizedTransKey)
      : normalized;

  // 手順2: 逆換字
  let result = "";
  for (let i = 0; i < unTransposed.length; i += 2) {
    const pair = unTransposed.slice(i, i + 2);
    const char = reverseSubstituteChar(pair, square);
    if (char !== null) result += char;
  }
  return result;
}

/**
 * 転置キーが有効か検証する
 * @param key 転置キー
 * @returns 英字を1文字以上含む場合true
 */
export function isValidTranspositionKey(key: string): boolean {
  return /[A-Za-z]/.test(key);
}

/**
 * ポリビウスキーが有効か検証する（空でも有効: デフォルトアルファベット使用）
 * @param key ポリビウスキー
 * @returns 常にtrue（空キーはデフォルト順で動作）
 */
export function isValidPolybiusKey(_key: string): boolean {
  return true;
}
