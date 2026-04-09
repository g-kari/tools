/**
 * ポリュビオス暗号ユーティリティ
 * 5×5グリッドを用いた座標換字式暗号のエンコード/デコードを提供する
 * I と J は同一セルに割り当て（標準的な実装）
 */

/** ポリュビオス方陣の標準アルファベット（I/J統合） */
const DEFAULT_ALPHABET = "ABCDEFGHIKLMNOPQRSTUVWXYZ";

/**
 * アルファベットキーからポリュビオス方陣（5×5）を生成する
 * @param key カスタムキーワード（省略時は標準ABCDEFGHIKLMNOPQRSTUVWXYZ）
 * @returns 25文字の方陣文字列
 */
export function buildSquare(key: string = ""): string {
  const upper = key.toUpperCase().replace(/J/g, "I");
  const seen = new Set<string>();
  let square = "";

  for (const ch of upper + DEFAULT_ALPHABET) {
    if (/[A-Z]/.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      square += ch;
    }
  }

  return square;
}

/**
 * テキストをポリュビオス暗号でエンコードする
 * 英字以外の文字はそのまま保持する
 * @param text 変換するテキスト
 * @param key カスタムキーワード（省略時は標準配置）
 * @returns 座標ペアに変換されたテキスト（英字が数字ペアに変換される）
 */
export function encodePolybius(text: string, key: string = ""): string {
  const square = buildSquare(key);
  return text
    .toUpperCase()
    .split("")
    .map((ch) => {
      if (ch === "J") {
        const idx = square.indexOf("I");
        if (idx === -1) return ch;
        const row = Math.floor(idx / 5) + 1;
        const col = (idx % 5) + 1;
        return `${row}${col}`;
      }
      const idx = square.indexOf(ch);
      if (idx === -1) return ch;
      const row = Math.floor(idx / 5) + 1;
      const col = (idx % 5) + 1;
      return `${row}${col}`;
    })
    .join("");
}

/**
 * ポリュビオス暗号でエンコードされたテキストをデコードする
 * 数字ペア以外の文字はそのまま保持する
 * @param text デコードするテキスト（数字ペアの連続）
 * @param key カスタムキーワード（エンコード時と同じキー）
 * @returns デコードされたテキスト
 */
export function decodePolybius(text: string, key: string = ""): string {
  const square = buildSquare(key);
  const result: string[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (!ch) break;

    if (/[1-5]/.test(ch) && i + 1 < text.length && /[1-5]/.test(text[i + 1] ?? "")) {
      const row = parseInt(ch, 10) - 1;
      const col = parseInt(text[i + 1] ?? "1", 10) - 1;
      const idx = row * 5 + col;
      const letter = square[idx];
      result.push(letter ?? "?");
      i += 2;
    } else {
      result.push(ch);
      i++;
    }
  }

  return result.join("");
}

/**
 * ポリュビオス方陣の2次元配列表現を返す（表示用）
 * @param key カスタムキーワード
 * @returns 5×5の文字配列
 */
export function getSquareGrid(key: string = ""): string[][] {
  const square = buildSquare(key);
  return Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => square[row * 5 + col] ?? ""),
  );
}
