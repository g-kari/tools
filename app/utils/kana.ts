/**
 * ひらがな・カタカナ・ローマ字変換ユーティリティ
 *
 * ヘボン式ローマ字を基準とした仮名とローマ字の相互変換を提供します。
 */

/** 変換モード */
export type KanaConvertMode =
  | "hiraganaToKatakana"
  | "katakanaToHiragana"
  | "kanaToRomaji"
  | "romajiToHiragana"
  | "romajiToKatakana";

/** ひらがな → ローマ字 変換テーブル（長いものを先に定義） */
const HIRAGANA_TO_ROMAJI: [string, string][] = [
  // 拗音（きゃ行など）
  ["きゃ", "kya"],
  ["きゅ", "kyu"],
  ["きょ", "kyo"],
  ["しゃ", "sha"],
  ["しゅ", "shu"],
  ["しょ", "sho"],
  ["ちゃ", "cha"],
  ["ちゅ", "chu"],
  ["ちょ", "cho"],
  ["にゃ", "nya"],
  ["にゅ", "nyu"],
  ["にょ", "nyo"],
  ["ひゃ", "hya"],
  ["ひゅ", "hyu"],
  ["ひょ", "hyo"],
  ["みゃ", "mya"],
  ["みゅ", "myu"],
  ["みょ", "myo"],
  ["りゃ", "rya"],
  ["りゅ", "ryu"],
  ["りょ", "ryo"],
  ["ぎゃ", "gya"],
  ["ぎゅ", "gyu"],
  ["ぎょ", "gyo"],
  ["じゃ", "ja"],
  ["じゅ", "ju"],
  ["じょ", "jo"],
  ["ぢゃ", "ja"],
  ["ぢゅ", "ju"],
  ["ぢょ", "jo"],
  ["びゃ", "bya"],
  ["びゅ", "byu"],
  ["びょ", "byo"],
  ["ぴゃ", "pya"],
  ["ぴゅ", "pyu"],
  ["ぴょ", "pyo"],
  // 基本音
  ["あ", "a"],
  ["い", "i"],
  ["う", "u"],
  ["え", "e"],
  ["お", "o"],
  ["か", "ka"],
  ["き", "ki"],
  ["く", "ku"],
  ["け", "ke"],
  ["こ", "ko"],
  ["さ", "sa"],
  ["し", "shi"],
  ["す", "su"],
  ["せ", "se"],
  ["そ", "so"],
  ["た", "ta"],
  ["ち", "chi"],
  ["つ", "tsu"],
  ["て", "te"],
  ["と", "to"],
  ["な", "na"],
  ["に", "ni"],
  ["ぬ", "nu"],
  ["ね", "ne"],
  ["の", "no"],
  ["は", "ha"],
  ["ひ", "hi"],
  ["ふ", "fu"],
  ["へ", "he"],
  ["ほ", "ho"],
  ["ま", "ma"],
  ["み", "mi"],
  ["む", "mu"],
  ["め", "me"],
  ["も", "mo"],
  ["や", "ya"],
  ["ゆ", "yu"],
  ["よ", "yo"],
  ["ら", "ra"],
  ["り", "ri"],
  ["る", "ru"],
  ["れ", "re"],
  ["ろ", "ro"],
  ["わ", "wa"],
  ["ゐ", "i"],
  ["ゑ", "e"],
  ["を", "wo"],
  ["が", "ga"],
  ["ぎ", "gi"],
  ["ぐ", "gu"],
  ["げ", "ge"],
  ["ご", "go"],
  ["ざ", "za"],
  ["じ", "ji"],
  ["ず", "zu"],
  ["ぜ", "ze"],
  ["ぞ", "zo"],
  ["だ", "da"],
  ["ぢ", "ji"],
  ["づ", "zu"],
  ["で", "de"],
  ["ど", "do"],
  ["ば", "ba"],
  ["び", "bi"],
  ["ぶ", "bu"],
  ["べ", "be"],
  ["ぼ", "bo"],
  ["ぱ", "pa"],
  ["ぴ", "pi"],
  ["ぷ", "pu"],
  ["ぺ", "pe"],
  ["ぽ", "po"],
  // 小文字（単独）
  ["ぁ", "a"],
  ["ぃ", "i"],
  ["ぅ", "u"],
  ["ぇ", "e"],
  ["ぉ", "o"],
  ["っ", ""], // 促音は後続子音の重複で対応（別処理）
  ["ゃ", "ya"],
  ["ゅ", "yu"],
  ["ょ", "yo"],
  ["ん", "n"],
  // 記号
  ["ー", "-"],
];

/** ローマ字 → ひらがな 変換テーブル（長いものを先に定義） */
const ROMAJI_TO_HIRAGANA: [string, string][] = [
  // 拗音
  ["kya", "きゃ"],
  ["kyi", "きぃ"],
  ["kyu", "きゅ"],
  ["kye", "きぇ"],
  ["kyo", "きょ"],
  ["sha", "しゃ"],
  ["shi", "し"],
  ["shu", "しゅ"],
  ["she", "しぇ"],
  ["sho", "しょ"],
  ["chi", "ち"],
  ["cha", "ちゃ"],
  ["chu", "ちゅ"],
  ["che", "ちぇ"],
  ["cho", "ちょ"],
  ["tsu", "つ"],
  ["nya", "にゃ"],
  ["nyu", "にゅ"],
  ["nyo", "にょ"],
  ["hya", "ひゃ"],
  ["hyu", "ひゅ"],
  ["hyo", "ひょ"],
  ["mya", "みゃ"],
  ["myu", "みゅ"],
  ["myo", "みょ"],
  ["rya", "りゃ"],
  ["ryu", "りゅ"],
  ["ryo", "りょ"],
  ["gya", "ぎゃ"],
  ["gyu", "ぎゅ"],
  ["gyo", "ぎょ"],
  ["ja", "じゃ"],
  ["ju", "じゅ"],
  ["jo", "じょ"],
  ["bya", "びゃ"],
  ["byu", "びゅ"],
  ["byo", "びょ"],
  ["pya", "ぴゃ"],
  ["pyu", "ぴゅ"],
  ["pyo", "ぴょ"],
  ["dzu", "づ"],
  // 基本音（a/i/u/e/o 順）
  ["ka", "か"],
  ["ki", "き"],
  ["ku", "く"],
  ["ke", "け"],
  ["ko", "こ"],
  ["sa", "さ"],
  ["si", "し"],
  ["su", "す"],
  ["se", "せ"],
  ["so", "そ"],
  ["ta", "た"],
  ["ti", "ち"],
  ["tu", "つ"],
  ["te", "て"],
  ["to", "と"],
  ["na", "な"],
  ["ni", "に"],
  ["nu", "ぬ"],
  ["ne", "ね"],
  ["no", "の"],
  ["ha", "は"],
  ["hi", "ひ"],
  ["fu", "ふ"],
  ["hu", "ふ"],
  ["he", "へ"],
  ["ho", "ほ"],
  ["ma", "ま"],
  ["mi", "み"],
  ["mu", "む"],
  ["me", "め"],
  ["mo", "も"],
  ["ya", "や"],
  ["yu", "ゆ"],
  ["yo", "よ"],
  ["ra", "ら"],
  ["ri", "り"],
  ["ru", "る"],
  ["re", "れ"],
  ["ro", "ろ"],
  ["wa", "わ"],
  ["wi", "ゐ"],
  ["we", "ゑ"],
  ["wo", "を"],
  ["ga", "が"],
  ["gi", "ぎ"],
  ["gu", "ぐ"],
  ["ge", "げ"],
  ["go", "ご"],
  ["za", "ざ"],
  ["zi", "じ"],
  ["ji", "じ"],
  ["zu", "ず"],
  ["ze", "ぜ"],
  ["zo", "ぞ"],
  ["da", "だ"],
  ["di", "ぢ"],
  ["du", "づ"],
  ["de", "で"],
  ["do", "ど"],
  ["ba", "ば"],
  ["bi", "び"],
  ["bu", "ぶ"],
  ["be", "べ"],
  ["bo", "ぼ"],
  ["pa", "ぱ"],
  ["pi", "ぴ"],
  ["pu", "ぷ"],
  ["pe", "ぺ"],
  ["po", "ぽ"],
  ["a", "あ"],
  ["i", "い"],
  ["u", "う"],
  ["e", "え"],
  ["o", "お"],
  // n の処理
  ["nn", "ん"],
  ["n'", "ん"],
];

/** 子音リスト（促音判定用） */
const CONSONANTS = new Set([
  "b",
  "c",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "m",
  "n",
  "p",
  "q",
  "r",
  "s",
  "t",
  "v",
  "w",
  "x",
  "y",
  "z",
]);

/**
 * ひらがな → カタカナ変換
 * Unicode オフセット 0x60 を利用
 */
export function hiraganaToKatakana(text: string): string {
  return text.replace(/[\u3041-\u3096]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60));
}

/**
 * カタカナ → ひらがな変換
 * Unicode オフセット 0x60 を利用
 */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

/**
 * ひらがな → ローマ字変換（ヘボン式）
 */
export function hiraganaToRomaji(text: string): string {
  let result = "";
  let i = 0;
  while (i < text.length) {
    // 促音（っ）→ 後続子音の重複
    if (text[i] === "っ") {
      // 次の文字のローマ字の最初の子音を重複
      const next = hiraganaToRomaji(text[i + 1] || "");
      if (next && CONSONANTS.has(next[0])) {
        result += next[0];
      } else {
        result += "っ";
      }
      i++;
      continue;
    }
    // ん の特殊処理：母音・y の前では n'
    if (text[i] === "ん") {
      const nextChar = text[i + 1];
      if (
        nextChar &&
        /[あいうえおぁぃぅぇぉやゆよゃゅょアイウエオァィゥェォヤユヨャュョ]/.test(nextChar)
      ) {
        result += "n'";
      } else {
        result += "n";
      }
      i++;
      continue;
    }
    // 2文字の拗音マッチ
    let matched = false;
    if (i + 1 < text.length) {
      const twoChar = text[i] + text[i + 1];
      const entry = HIRAGANA_TO_ROMAJI.find(([k]) => k === twoChar);
      if (entry) {
        result += entry[1];
        i += 2;
        matched = true;
      }
    }
    if (!matched) {
      // 1文字マッチ
      const entry = HIRAGANA_TO_ROMAJI.find(([k]) => k === text[i]);
      if (entry) {
        result += entry[1];
      } else {
        result += text[i];
      }
      i++;
    }
  }
  return result;
}

/**
 * 仮名（ひらがな・カタカナ混在可）→ ローマ字変換
 */
export function kanaToRomaji(text: string): string {
  // カタカナをひらがなに変換してからローマ字変換
  return hiraganaToRomaji(katakanaToHiragana(text));
}

/**
 * ローマ字 → ひらがな変換（ヘボン式・訓令式混在対応）
 * 最長一致アルゴリズムを使用
 */
export function romajiToHiragana(text: string): string {
  const lower = text.toLowerCase();
  let result = "";
  let i = 0;
  while (i < lower.length) {
    // 促音処理: 同じ子音が2つ続く場合（nn を除く）
    if (
      i + 1 < lower.length &&
      lower[i] === lower[i + 1] &&
      CONSONANTS.has(lower[i]) &&
      lower[i] !== "n"
    ) {
      result += "っ";
      i++;
      continue;
    }
    // 最長一致（最大4文字）
    let matched = false;
    for (let len = 4; len >= 1; len--) {
      const chunk = lower.slice(i, i + len);
      const entry = ROMAJI_TO_HIRAGANA.find(([k]) => k === chunk);
      if (entry) {
        result += entry[1];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // n の単独処理（子音の前・文末）
      if (lower[i] === "n") {
        const next = lower[i + 1];
        if (!next || (CONSONANTS.has(next) && next !== "n" && next !== "y") || next === "'") {
          result += "ん";
          i++;
          if (next === "'") i++;
          continue;
        }
      }
      result += text[i];
      i++;
    }
  }
  return result;
}

/**
 * ローマ字 → カタカナ変換
 */
export function romajiToKatakana(text: string): string {
  return hiraganaToKatakana(romajiToHiragana(text));
}

/**
 * 変換モードに基づいてテキストを変換する
 */
export function convertKana(text: string, mode: KanaConvertMode): string {
  switch (mode) {
    case "hiraganaToKatakana":
      return hiraganaToKatakana(text);
    case "katakanaToHiragana":
      return katakanaToHiragana(text);
    case "kanaToRomaji":
      return kanaToRomaji(text);
    case "romajiToHiragana":
      return romajiToHiragana(text);
    case "romajiToKatakana":
      return romajiToKatakana(text);
  }
}
