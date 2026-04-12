/**
 * 全角/半角変換ユーティリティ
 *
 * 全角（Zenkaku）と半角（Hankaku）文字の相互変換を提供します。
 * - 英数字・記号（ASCII互換）の変換
 * - カタカナの変換（濁点・半濁点の合成・分解に対応）
 * - スペースの変換
 */

/** 変換オプション */
export interface ZenkakuOptions {
  /** 英数字（A-Za-z0-9）を変換するか */
  alphanumeric: boolean;
  /** 記号（!-~）を変換するか */
  symbols: boolean;
  /** カタカナを変換するか */
  katakana: boolean;
  /** スペースを変換するか */
  space: boolean;
}

/** デフォルト変換オプション */
export const DEFAULT_OPTIONS: ZenkakuOptions = {
  alphanumeric: true,
  symbols: true,
  katakana: true,
  space: true,
};

/** 変換方向 */
export type ConversionDirection = "toHankaku" | "toZenkaku";

/**
 * 半角カタカナ → 全角カタカナ 基本マッピング
 * （濁点・半濁点なし）
 */
const HANKAKU_KATA_TO_ZENKAKU: Record<string, string> = {
  ｦ: "ヲ",
  ｧ: "ァ",
  ｨ: "ィ",
  ｩ: "ゥ",
  ｪ: "ェ",
  ｫ: "ォ",
  ｬ: "ャ",
  ｭ: "ュ",
  ｮ: "ョ",
  ｯ: "ッ",
  ｰ: "ー",
  ｱ: "ア",
  ｲ: "イ",
  ｳ: "ウ",
  ｴ: "エ",
  ｵ: "オ",
  ｶ: "カ",
  ｷ: "キ",
  ｸ: "ク",
  ｹ: "ケ",
  ｺ: "コ",
  ｻ: "サ",
  ｼ: "シ",
  ｽ: "ス",
  ｾ: "セ",
  ｿ: "ソ",
  ﾀ: "タ",
  ﾁ: "チ",
  ﾂ: "ツ",
  ﾃ: "テ",
  ﾄ: "ト",
  ﾅ: "ナ",
  ﾆ: "ニ",
  ﾇ: "ヌ",
  ﾈ: "ネ",
  ﾉ: "ノ",
  ﾊ: "ハ",
  ﾋ: "ヒ",
  ﾌ: "フ",
  ﾍ: "ヘ",
  ﾎ: "ホ",
  ﾏ: "マ",
  ﾐ: "ミ",
  ﾑ: "ム",
  ﾒ: "メ",
  ﾓ: "モ",
  ﾔ: "ヤ",
  ﾕ: "ユ",
  ﾖ: "ヨ",
  ﾗ: "ラ",
  ﾘ: "リ",
  ﾙ: "ル",
  ﾚ: "レ",
  ﾛ: "ロ",
  ﾜ: "ワ",
  ﾝ: "ン",
  ﾞ: "゛",
  ﾟ: "゜",
};

/**
 * 半角カタカナ + 濁点（ﾞ）→ 全角カタカナ（有声音）
 */
const HANKAKU_DAKUTEN_MAP: Record<string, string> = {
  ｶ: "ガ",
  ｷ: "ギ",
  ｸ: "グ",
  ｹ: "ゲ",
  ｺ: "ゴ",
  ｻ: "ザ",
  ｼ: "ジ",
  ｽ: "ズ",
  ｾ: "ゼ",
  ｿ: "ゾ",
  ﾀ: "ダ",
  ﾁ: "ヂ",
  ﾂ: "ヅ",
  ﾃ: "デ",
  ﾄ: "ド",
  ﾊ: "バ",
  ﾋ: "ビ",
  ﾌ: "ブ",
  ﾍ: "ベ",
  ﾎ: "ボ",
  ｳ: "ヴ",
};

/**
 * 半角カタカナ + 半濁点（ﾟ）→ 全角カタカナ（半有声音）
 */
const HANKAKU_HANDAKUTEN_MAP: Record<string, string> = {
  ﾊ: "パ",
  ﾋ: "ピ",
  ﾌ: "プ",
  ﾍ: "ペ",
  ﾎ: "ポ",
};

/**
 * 全角カタカナ → 半角カタカナ（有声音・半有声音含む）
 */
const ZENKAKU_KATA_TO_HANKAKU: Record<string, string> = {
  // 有声音（2文字に分解）
  ガ: "ｶﾞ",
  ギ: "ｷﾞ",
  グ: "ｸﾞ",
  ゲ: "ｹﾞ",
  ゴ: "ｺﾞ",
  ザ: "ｻﾞ",
  ジ: "ｼﾞ",
  ズ: "ｽﾞ",
  ゼ: "ｾﾞ",
  ゾ: "ｿﾞ",
  ダ: "ﾀﾞ",
  ヂ: "ﾁﾞ",
  ヅ: "ﾂﾞ",
  デ: "ﾃﾞ",
  ド: "ﾄﾞ",
  バ: "ﾊﾞ",
  ビ: "ﾋﾞ",
  ブ: "ﾌﾞ",
  ベ: "ﾍﾞ",
  ボ: "ﾎﾞ",
  ヴ: "ｳﾞ",
  // 半有声音（2文字に分解）
  パ: "ﾊﾟ",
  ピ: "ﾋﾟ",
  プ: "ﾌﾟ",
  ペ: "ﾍﾟ",
  ポ: "ﾎﾟ",
  // 通常（1:1変換）
  ヲ: "ｦ",
  ァ: "ｧ",
  ィ: "ｨ",
  ゥ: "ｩ",
  ェ: "ｪ",
  ォ: "ｫ",
  ャ: "ｬ",
  ュ: "ｭ",
  ョ: "ｮ",
  ッ: "ｯ",
  ー: "ｰ",
  ア: "ｱ",
  イ: "ｲ",
  ウ: "ｳ",
  エ: "ｴ",
  オ: "ｵ",
  カ: "ｶ",
  キ: "ｷ",
  ク: "ｸ",
  ケ: "ｹ",
  コ: "ｺ",
  サ: "ｻ",
  シ: "ｼ",
  ス: "ｽ",
  セ: "ｾ",
  ソ: "ｿ",
  タ: "ﾀ",
  チ: "ﾁ",
  ツ: "ﾂ",
  テ: "ﾃ",
  ト: "ﾄ",
  ナ: "ﾅ",
  ニ: "ﾆ",
  ヌ: "ﾇ",
  ネ: "ﾈ",
  ノ: "ﾉ",
  ハ: "ﾊ",
  ヒ: "ﾋ",
  フ: "ﾌ",
  ヘ: "ﾍ",
  ホ: "ﾎ",
  マ: "ﾏ",
  ミ: "ﾐ",
  ム: "ﾑ",
  メ: "ﾒ",
  モ: "ﾓ",
  ヤ: "ﾔ",
  ユ: "ﾕ",
  ヨ: "ﾖ",
  ラ: "ﾗ",
  リ: "ﾘ",
  ル: "ﾙ",
  レ: "ﾚ",
  ロ: "ﾛ",
  ワ: "ﾜ",
  ン: "ﾝ",
  ゛: "ﾞ",
  ゜: "ﾟ",
};

/**
 * テキストを全角 → 半角に変換する
 * @param text - 入力テキスト
 * @param options - 変換オプション
 * @returns 変換後のテキスト
 */
export function toHankaku(text: string, options: ZenkakuOptions = DEFAULT_OPTIONS): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);

    // 全角スペース（U+3000）→ 半角スペース
    if (options.space && code === 0x3000) {
      result += " ";
      continue;
    }

    // 全角ASCII（U+FF01–U+FF5E）→ 半角ASCII（U+0021–U+007E）
    if (code >= 0xff01 && code <= 0xff5e) {
      const half = code - 0xfee0;
      const halfChar = String.fromCharCode(half);
      const isAlpha = (half >= 0x41 && half <= 0x5a) || (half >= 0x61 && half <= 0x7a);
      const isDigit = half >= 0x30 && half <= 0x39;
      if (options.alphanumeric && (isAlpha || isDigit)) {
        result += halfChar;
        continue;
      }
      if (options.symbols && !isAlpha && !isDigit) {
        result += halfChar;
        continue;
      }
      result += char;
      continue;
    }

    // 全角カタカナ → 半角カタカナ
    if (options.katakana && ZENKAKU_KATA_TO_HANKAKU[char] !== undefined) {
      result += ZENKAKU_KATA_TO_HANKAKU[char];
      continue;
    }

    result += char;
  }
  return result;
}

/**
 * テキストを半角 → 全角に変換する
 * @param text - 入力テキスト
 * @param options - 変換オプション
 * @returns 変換後のテキスト
 */
export function toZenkaku(text: string, options: ZenkakuOptions = DEFAULT_OPTIONS): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    const nextChar = text[i + 1];

    // 半角スペース → 全角スペース
    if (options.space && code === 0x20) {
      result += "\u3000";
      continue;
    }

    // 半角ASCII（U+0021–U+007E）→ 全角ASCII（U+FF01–U+FF5E）
    if (code >= 0x21 && code <= 0x7e) {
      const isAlpha = (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a);
      const isDigit = code >= 0x30 && code <= 0x39;
      if (options.alphanumeric && (isAlpha || isDigit)) {
        result += String.fromCharCode(code + 0xfee0);
        continue;
      }
      if (options.symbols && !isAlpha && !isDigit) {
        result += String.fromCharCode(code + 0xfee0);
        continue;
      }
      result += char;
      continue;
    }

    // 半角カタカナ処理（濁点・半濁点の合成）
    if (options.katakana) {
      // 濁点（ﾞ, U+FF9E）との合成
      if (nextChar === "ﾞ" && HANKAKU_DAKUTEN_MAP[char] !== undefined) {
        result += HANKAKU_DAKUTEN_MAP[char];
        i++; // 次の文字（ﾞ）をスキップ
        continue;
      }
      // 半濁点（ﾟ, U+FF9F）との合成
      if (nextChar === "ﾟ" && HANKAKU_HANDAKUTEN_MAP[char] !== undefined) {
        result += HANKAKU_HANDAKUTEN_MAP[char];
        i++; // 次の文字（ﾟ）をスキップ
        continue;
      }
      // 単純変換
      if (HANKAKU_KATA_TO_ZENKAKU[char] !== undefined) {
        result += HANKAKU_KATA_TO_ZENKAKU[char];
        continue;
      }
    }

    result += char;
  }
  return result;
}

/**
 * テキストの変換を実行する
 * @param text - 入力テキスト
 * @param direction - 変換方向
 * @param options - 変換オプション
 * @returns 変換後のテキスト
 */
export function convertText(
  text: string,
  direction: ConversionDirection,
  options: ZenkakuOptions = DEFAULT_OPTIONS,
): string {
  if (direction === "toHankaku") {
    return toHankaku(text, options);
  }
  return toZenkaku(text, options);
}

/**
 * テキストに含まれる全角・半角文字の統計を返す
 * @param text - 入力テキスト
 * @returns 統計情報
 */
export function analyzeText(text: string): {
  zenkakuCount: number;
  hankakuCount: number;
  katakanaCount: number;
  total: number;
} {
  let zenkakuCount = 0;
  let hankakuCount = 0;
  let katakanaCount = 0;

  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code === 0x3000 || (code >= 0xff01 && code <= 0xff5e)) {
      zenkakuCount++;
    } else if (code === 0x20 || (code >= 0x21 && code <= 0x7e)) {
      hankakuCount++;
    }
    // 全角カタカナ（U+30A0–U+30FF）
    if (code >= 0x30a0 && code <= 0x30ff) {
      katakanaCount++;
    }
    // 半角カタカナ（U+FF65–U+FF9F）
    if (code >= 0xff65 && code <= 0xff9f) {
      katakanaCount++;
    }
  }

  return {
    zenkakuCount,
    hankakuCount,
    katakanaCount,
    total: Array.from(text).length,
  };
}
