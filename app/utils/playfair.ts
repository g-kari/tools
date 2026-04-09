/**
 * プレイフェア暗号ユーティリティ
 * ヴィクトリア朝時代に考案された換字式暗号。
 * 5×5のキー方陣を使い、2文字（ダイグラフ）単位で暗号化する。
 */

/** プレイフェア方陣の行列型 */
export type PlayfairSquare = string[][];

/**
 * プレイフェア方陣を生成する
 * J は I として扱う（アルファベット25文字使用）
 * @param keyword キーワード（英字のみ使用）
 * @returns 5×5の文字グリッド
 */
export function buildPlayfairSquare(keyword: string): PlayfairSquare {
  const seen = new Set<string>();
  const chars: string[] = [];

  // キーワードの文字を先頭に配置（J→I に正規化）
  const normalizeChar = (c: string): string => (c === "J" ? "I" : c);

  for (const ch of keyword.toUpperCase()) {
    if (!/[A-Z]/.test(ch)) continue;
    const c = normalizeChar(ch);
    if (!seen.has(c)) {
      seen.add(c);
      chars.push(c);
    }
  }

  // 残りのアルファベットを追加（J を除く）
  for (let i = 0; i < 26; i++) {
    if (i === 9) continue; // J をスキップ
    const c = String.fromCharCode(65 + i);
    if (!seen.has(c)) {
      seen.add(c);
      chars.push(c);
    }
  }

  // 5×5 グリッドに変換
  const square: PlayfairSquare = [];
  for (let row = 0; row < 5; row++) {
    square.push(chars.slice(row * 5, row * 5 + 5));
  }
  return square;
}

/**
 * 方陣内での文字の座標を取得する
 * @param square プレイフェア方陣
 * @param ch 検索する文字
 * @returns [行, 列] の座標
 */
function findPosition(square: PlayfairSquare, ch: string): [number, number] {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (square[r]![c] === ch) return [r, c];
    }
  }
  return [-1, -1];
}

/**
 * テキストをダイグラフ（2文字ペア）に分割する
 * - 同じ文字が連続する場合は X（または Q）を挿入
 * - 奇数文字の場合は末尾に X を追加
 * @param text 平文テキスト
 * @returns ダイグラフ配列
 */
export function prepareDigraphs(text: string): string[][] {
  // アルファベット以外を除去、大文字化、J→I 正規化
  const cleaned = text
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/J/g, "I");

  const chars: string[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const a = cleaned[i]!;
    if (i + 1 >= cleaned.length) {
      // 末尾の1文字: X を補充
      chars.push(a, "X");
      i++;
    } else {
      const b = cleaned[i + 1]!;
      if (a === b) {
        // 同じ文字が連続: 間に X（または Q）を挿入
        chars.push(a, a === "X" ? "Q" : "X");
        i++;
      } else {
        chars.push(a, b);
        i += 2;
      }
    }
  }

  // 2文字ずつのペアに分割
  const digraphs: string[][] = [];
  for (let j = 0; j < chars.length; j += 2) {
    digraphs.push([chars[j]!, chars[j + 1]!]);
  }
  return digraphs;
}

/**
 * ダイグラフに対してプレイフェアルールを適用する
 * @param a 1文字目
 * @param b 2文字目
 * @param square プレイフェア方陣
 * @param encrypt true=暗号化, false=復号化
 * @returns 変換後の2文字
 */
function transformDigraph(
  a: string,
  b: string,
  square: PlayfairSquare,
  encrypt: boolean,
): [string, string] {
  const [r1, c1] = findPosition(square, a);
  const [r2, c2] = findPosition(square, b);
  const shift = encrypt ? 1 : 4; // 暗号化: +1, 復号化: -1 (mod 5 = +4)

  if (r1 === r2) {
    // 同じ行: 列を右（暗号化）または左（復号化）にシフト
    return [square[r1]![(c1 + shift) % 5]!, square[r2]![(c2 + shift) % 5]!];
  } else if (c1 === c2) {
    // 同じ列: 行を下（暗号化）または上（復号化）にシフト
    return [square[(r1 + shift) % 5]![c1]!, square[(r2 + shift) % 5]![c2]!];
  } else {
    // 矩形: 同じ行の相手の列に移動（方向は暗号化・復号化で同じ）
    return [square[r1]![c2]!, square[r2]![c1]!];
  }
}

/**
 * プレイフェア暗号でテキストを暗号化する
 * @param text 平文テキスト
 * @param keyword キーワード
 * @returns 暗号化されたテキスト（2文字ずつスペース区切り）
 */
export function playfairEncrypt(text: string, keyword: string): string {
  if (!text.trim() || !keyword.trim()) return "";
  const square = buildPlayfairSquare(keyword);
  const digraphs = prepareDigraphs(text);
  return digraphs
    .map(([a, b]) => {
      const [ea, eb] = transformDigraph(a!, b!, square, true);
      return ea + eb;
    })
    .join(" ");
}

/**
 * プレイフェア暗号でテキストを復号化する
 * @param text 暗号文テキスト（2文字ペア、スペース区切り可）
 * @param keyword キーワード
 * @returns 復号化されたテキスト
 */
export function playfairDecrypt(text: string, keyword: string): string {
  if (!text.trim() || !keyword.trim()) return "";
  const square = buildPlayfairSquare(keyword);

  // スペースを無視してアルファベットのみ抽出し、2文字ペアに分割
  const cleaned = text
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .replace(/J/g, "I");

  if (cleaned.length % 2 !== 0) return "";

  const result: string[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    const [da, db] = transformDigraph(cleaned[i]!, cleaned[i + 1]!, square, false);
    result.push(da, db);
  }
  return result.join("");
}
