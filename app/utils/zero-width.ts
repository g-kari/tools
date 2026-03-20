/**
 * ゼロ幅文字・不可視文字の検出・除去ユーティリティ
 */

/** ゼロ幅文字・不可視文字の定義 */
export interface ZeroWidthCharDef {
  /** Unicode コードポイント (例: 0x200B) */
  codePoint: number;
  /** 文字名 */
  name: string;
  /** Unicode 名称 */
  unicodeName: string;
  /** 説明 */
  description: string;
}

/** 検出された文字の情報 */
export interface DetectedChar {
  /** キャラクター定義 */
  def: ZeroWidthCharDef;
  /** テキスト内の位置 (文字インデックス) */
  positions: number[];
  /** 出現回数 */
  count: number;
}

/** 検出結果 */
export interface DetectionResult {
  /** 入力テキスト */
  input: string;
  /** 検出された文字ごとの情報 */
  detected: DetectedChar[];
  /** ゼロ幅文字の総数 */
  totalCount: number;
  /** ゼロ幅文字が存在するか */
  hasZeroWidthChars: boolean;
}

/** 対象となるゼロ幅文字・不可視文字の定義リスト */
export const ZERO_WIDTH_CHARS: ZeroWidthCharDef[] = [
  {
    codePoint: 0x200b,
    name: "ゼロ幅スペース",
    unicodeName: "ZERO WIDTH SPACE",
    description: "テキストの折り返し点を示す幅ゼロのスペース",
  },
  {
    codePoint: 0x200c,
    name: "ゼロ幅非接合子",
    unicodeName: "ZERO WIDTH NON-JOINER",
    description: "隣接する文字の結合を防ぐ制御文字",
  },
  {
    codePoint: 0x200d,
    name: "ゼロ幅接合子",
    unicodeName: "ZERO WIDTH JOINER",
    description: "絵文字の結合などに使用される制御文字",
  },
  {
    codePoint: 0xfeff,
    name: "BOM / ゼロ幅ノーブレークスペース",
    unicodeName: "ZERO WIDTH NO-BREAK SPACE (BOM)",
    description: "バイトオーダーマーク。テキスト先頭以外での使用は不可視文字として残ることがある",
  },
  {
    codePoint: 0x2060,
    name: "ワードジョイナー",
    unicodeName: "WORD JOINER",
    description: "改行を抑制するが幅を持たない文字",
  },
  {
    codePoint: 0x00ad,
    name: "ソフトハイフン",
    unicodeName: "SOFT HYPHEN",
    description: "折り返し時のみ表示されるハイフン",
  },
  {
    codePoint: 0x180e,
    name: "モンゴル語母音区切り",
    unicodeName: "MONGOLIAN VOWEL SEPARATOR",
    description: "モンゴル文字の母音区切りに使用（現在は幅ゼロ）",
  },
  {
    codePoint: 0x200e,
    name: "左から右へのマーク",
    unicodeName: "LEFT-TO-RIGHT MARK",
    description: "テキスト方向を左から右に設定する不可視制御文字",
  },
  {
    codePoint: 0x200f,
    name: "右から左へのマーク",
    unicodeName: "RIGHT-TO-LEFT MARK",
    description: "テキスト方向を右から左に設定する不可視制御文字",
  },
  {
    codePoint: 0x202a,
    name: "左右方向埋め込み開始",
    unicodeName: "LEFT-TO-RIGHT EMBEDDING",
    description: "左から右へのテキスト埋め込みを開始する制御文字",
  },
  {
    codePoint: 0x202b,
    name: "右左方向埋め込み開始",
    unicodeName: "RIGHT-TO-LEFT EMBEDDING",
    description: "右から左へのテキスト埋め込みを開始する制御文字",
  },
  {
    codePoint: 0x202c,
    name: "方向フォーマット終了",
    unicodeName: "POP DIRECTIONAL FORMATTING",
    description: "方向制御フォーマットを終了する制御文字",
  },
  {
    codePoint: 0x202d,
    name: "左右方向上書き",
    unicodeName: "LEFT-TO-RIGHT OVERRIDE",
    description: "テキスト方向を強制的に左から右に上書きする制御文字",
  },
  {
    codePoint: 0x202e,
    name: "右左方向上書き",
    unicodeName: "RIGHT-TO-LEFT OVERRIDE",
    description: "テキスト方向を強制的に右から左に上書きする制御文字",
  },
  {
    codePoint: 0x2061,
    name: "関数適用",
    unicodeName: "FUNCTION APPLICATION",
    description: "数式で関数適用を示す不可視文字",
  },
  {
    codePoint: 0x2062,
    name: "不可視の乗算記号",
    unicodeName: "INVISIBLE TIMES",
    description: "数式で乗算を示す不可視文字",
  },
  {
    codePoint: 0x2063,
    name: "不可視の区切り文字",
    unicodeName: "INVISIBLE SEPARATOR",
    description: "数式で区切りを示す不可視文字",
  },
  {
    codePoint: 0x2064,
    name: "不可視のプラス記号",
    unicodeName: "INVISIBLE PLUS",
    description: "数式でプラスを示す不可視文字",
  },
];

/** コードポイントから定義を検索するマップ */
const ZERO_WIDTH_MAP = new Map<number, ZeroWidthCharDef>(
  ZERO_WIDTH_CHARS.map((def) => [def.codePoint, def])
);

/**
 * テキスト内のゼロ幅文字・不可視文字を検出する
 * @param text 検出対象のテキスト
 * @returns 検出結果
 */
export function detectZeroWidthChars(text: string): DetectionResult {
  const countMap = new Map<number, number[]>();

  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i);
    if (cp === undefined) continue;
    if (ZERO_WIDTH_MAP.has(cp)) {
      const positions = countMap.get(cp) ?? [];
      positions.push(i);
      countMap.set(cp, positions);
      // サロゲートペアのスキップ
      if (cp > 0xffff) i++;
    }
  }

  const detected: DetectedChar[] = [];
  let totalCount = 0;

  for (const [cp, positions] of countMap) {
    const def = ZERO_WIDTH_MAP.get(cp)!;
    detected.push({ def, positions, count: positions.length });
    totalCount += positions.length;
  }

  // コードポイント順にソート
  detected.sort((a, b) => a.def.codePoint - b.def.codePoint);

  return {
    input: text,
    detected,
    totalCount,
    hasZeroWidthChars: totalCount > 0,
  };
}

/**
 * テキストからゼロ幅文字・不可視文字を除去する
 * @param text 処理対象のテキスト
 * @returns 除去後のテキスト
 */
export function removeZeroWidthChars(text: string): string {
  const codePoints = [...ZERO_WIDTH_CHARS.map((d) => String.fromCodePoint(d.codePoint))];
  const pattern = new RegExp(`[${codePoints.join("")}]`, "g");
  return text.replace(pattern, "");
}

/**
 * コードポイントを U+XXXX 形式の文字列に変換する
 * @param codePoint Unicode コードポイント
 * @returns U+XXXX 形式の文字列
 */
export function formatCodePoint(codePoint: number): string {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}
