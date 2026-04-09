/**
 * Rail Fence暗号（柵暗号）ユーティリティ
 * テキストをジグザグパターンで複数のレールに配置して暗号化する
 */

/**
 * 各位置がどのレールに属するかのパターンを生成する
 * @param length テキスト長
 * @param rails レール数（2以上）
 * @returns 各インデックスのレール番号配列
 */
function buildRailPattern(length: number, rails: number): number[] {
  const pattern: number[] = new Array(length);
  let rail = 0;
  let direction = 1;

  for (let i = 0; i < length; i++) {
    pattern[i] = rail;
    if (rail === 0) direction = 1;
    else if (rail === rails - 1) direction = -1;
    rail += direction;
  }

  return pattern;
}

/**
 * テキストをRail Fence暗号でエンコードする
 * @param text 変換するテキスト
 * @param rails レール数（2以上）
 * @returns エンコードされたテキスト
 */
export function encodeRailFence(text: string, rails: number): string {
  if (rails <= 1 || text.length === 0) return text;

  const fence: string[] = Array.from({ length: rails }, () => "");
  const pattern = buildRailPattern(text.length, rails);

  for (let i = 0; i < text.length; i++) {
    fence[pattern[i]] += text[i];
  }

  return fence.join("");
}

/**
 * Rail Fence暗号でデコードする
 * @param text 変換するテキスト
 * @param rails レール数（2以上）
 * @returns デコードされたテキスト
 */
export function decodeRailFence(text: string, rails: number): string {
  if (rails <= 1 || text.length === 0) return text;

  const len = text.length;
  const pattern = buildRailPattern(len, rails);

  // 各レールの文字数を集計
  const railLengths: number[] = new Array(rails).fill(0);
  for (const r of pattern) {
    railLengths[r]++;
  }

  // 暗号文を各レールに分割
  const railStrings: string[] = [];
  let offset = 0;
  for (let r = 0; r < rails; r++) {
    railStrings.push(text.slice(offset, offset + railLengths[r]));
    offset += railLengths[r];
  }

  // ジグザグ順に読み取り
  const railIndices: number[] = new Array(rails).fill(0);
  let result = "";
  for (let i = 0; i < len; i++) {
    const r = pattern[i];
    result += railStrings[r][railIndices[r]];
    railIndices[r]++;
  }

  return result;
}

/**
 * Rail Fence暗号のジグザグパターンを可視化する
 * @param text 変換するテキスト
 * @param rails レール数（2以上）
 * @returns 各レールを文字列で表した配列（空位置は "." で埋める）
 */
export function visualizeRailFence(text: string, rails: number): string[] {
  if (rails <= 1 || text.length === 0) {
    return [text];
  }

  const fence: (string | null)[][] = Array.from({ length: rails }, () =>
    new Array(text.length).fill(null),
  );
  const pattern = buildRailPattern(text.length, rails);

  for (let i = 0; i < text.length; i++) {
    fence[pattern[i]][i] = text[i];
  }

  return fence.map((row) => row.map((c) => (c !== null ? c : "·")).join(""));
}
