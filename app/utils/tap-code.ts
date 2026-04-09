/**
 * タップコードユーティリティ
 * 5×5グリッドを用いた叩音換字式暗号（Tap Code）のエンコード/デコードを提供する
 * C と K は同一セルに割り当て（標準的な実装）
 * 各文字は「行タップ数, 列タップ数」のペアで表現される
 */

/** タップコードグリッド（5×5、C/K統合） */
const TAP_GRID = [
  ["A", "B", "C", "D", "E"],
  ["F", "G", "H", "I", "J"],
  ["L", "M", "N", "O", "P"],
  ["Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z"],
] as const;

/** 文字から座標（行・列）へのマッピング */
const CHAR_TO_POS = new Map<string, [number, number]>();

for (let r = 0; r < TAP_GRID.length; r++) {
  for (let c = 0; c < TAP_GRID[r].length; c++) {
    const ch = TAP_GRID[r][c];
    CHAR_TO_POS.set(ch, [r + 1, c + 1]);
  }
}
// K は C と同じ位置
CHAR_TO_POS.set("K", CHAR_TO_POS.get("C")!);

/**
 * タップコードの表示形式の型定義
 * - "dots": ドット記法（例: ". .." = A B）
 * - "numbers": 数字記法（例: "1 1 / 1 2"）
 * - "numbers-compact": コンパクト数字記法（例: "11 12"）
 */
export type TapFormat = "dots" | "numbers" | "numbers-compact";

/**
 * テキストをタップコードでエンコードする
 * 英字以外の文字はそのまま保持する
 * @param text 変換するテキスト
 * @param format 出力形式
 * @returns タップコードに変換されたテキスト
 */
export function encodeTapCode(text: string, format: TapFormat = "dots"): string {
  const words = text.toUpperCase().split(/\s+/);

  const encodedWords = words.map((word) => {
    const chars = word.split("");
    const encodedChars = chars.map((ch) => {
      const pos = CHAR_TO_POS.get(ch);
      if (!pos) return ch;
      const [row, col] = pos;

      switch (format) {
        case "dots":
          return ".".repeat(row) + " " + ".".repeat(col);
        case "numbers":
          return `${row} ${col}`;
        case "numbers-compact":
          return `${row}${col}`;
        default:
          return ".".repeat(row) + " " + ".".repeat(col);
      }
    });

    if (format === "dots") {
      return encodedChars.join("  ");
    } else if (format === "numbers") {
      return encodedChars.join(" / ");
    } else {
      return encodedChars.join(" ");
    }
  });

  if (format === "dots") {
    return encodedWords.join("   ");
  } else if (format === "numbers") {
    return encodedWords.join(" // ");
  } else {
    return encodedWords.join("  ");
  }
}

/**
 * タップコードでエンコードされたテキストをデコードする
 * @param text デコードするテキスト
 * @param format 入力形式
 * @returns デコードされたテキスト
 */
export function decodeTapCode(text: string, format: TapFormat = "dots"): string {
  if (format === "dots") {
    return decodeDots(text);
  } else if (format === "numbers") {
    return decodeNumbers(text, " / ", " // ");
  } else {
    return decodeCompact(text);
  }
}

/**
 * ドット形式のタップコードをデコードする
 * 形式: ". .." で A-B を表す
 * 単語間は3スペース以上で区切る
 */
function decodeDots(text: string): string {
  const wordTokens = text.split(/   +/);
  const decodedWords = wordTokens.map((wordToken) => {
    const charTokens = wordToken.trim().split(/  +/);
    return charTokens
      .map((token) => {
        token = token.trim();
        if (!token) return "";
        const parts = token.split(" ");
        if (parts.length !== 2) return token;
        const [rowPart, colPart] = parts;
        if (!rowPart || !colPart) return token;
        const row = rowPart.replace(/[^.]/g, "").length;
        const col = colPart.replace(/[^.]/g, "").length;
        if (row < 1 || row > 5 || col < 1 || col > 5) return token;
        return TAP_GRID[row - 1]?.[col - 1] ?? token;
      })
      .join("");
  });
  return decodedWords.join(" ");
}

/**
 * 数字形式のタップコードをデコードする
 * 形式: "1 1 / 1 2" で A-B を表す
 * 単語間は " // " で区切る
 */
function decodeNumbers(text: string, charSep: string, wordSep: string): string {
  const wordTokens = text.split(wordSep);
  const decodedWords = wordTokens.map((wordToken) => {
    const charTokens = wordToken.trim().split(charSep);
    return charTokens
      .map((token) => {
        token = token.trim();
        if (!token) return "";
        const nums = token.split(/\s+/).map(Number);
        if (nums.length !== 2) return token;
        const [row, col] = nums;
        if (!row || !col || row < 1 || row > 5 || col < 1 || col > 5) return token;
        return TAP_GRID[row - 1]?.[col - 1] ?? token;
      })
      .join("");
  });
  return decodedWords.join(" ");
}

/**
 * コンパクト数字形式のタップコードをデコードする
 * 形式: "11 12  21" で A B（スペース）F を表す
 * 単語間は2スペース以上で区切る
 */
function decodeCompact(text: string): string {
  const wordTokens = text.split(/  +/);
  const decodedWords = wordTokens.map((wordToken) => {
    const charTokens = wordToken.trim().split(/\s+/);
    return charTokens
      .map((token) => {
        token = token.trim();
        if (!token || !/^\d{2}$/.test(token)) return token;
        const row = parseInt(token[0] ?? "0", 10);
        const col = parseInt(token[1] ?? "0", 10);
        if (row < 1 || row > 5 || col < 1 || col > 5) return token;
        return TAP_GRID[row - 1]?.[col - 1] ?? token;
      })
      .join("");
  });
  return decodedWords.join(" ");
}

/**
 * タップコードグリッドの2次元配列表現を返す（表示用）
 * @returns 5×5の文字配列（K はスラッシュ表記）
 */
export function getTapGrid(): string[][] {
  return TAP_GRID.map((row, r) =>
    row.map((ch, c) => {
      if (r === 0 && c === 2) return "C/K";
      return ch;
    }),
  );
}
