import { describe, it, expect } from "vite-plus/test";
import {
  hiraganaToKatakana,
  katakanaToHiragana,
  hiraganaToRomaji,
  kanaToRomaji,
  romajiToHiragana,
  romajiToKatakana,
  convertKana,
} from "../../app/utils/kana";

describe("hiraganaToKatakana", () => {
  it("基本的なひらがなをカタカナに変換できる", () => {
    expect(hiraganaToKatakana("あいうえお")).toBe("アイウエオ");
  });

  it("五十音すべてを変換できる", () => {
    expect(hiraganaToKatakana("かきくけこ")).toBe("カキクケコ");
    expect(hiraganaToKatakana("さしすせそ")).toBe("サシスセソ");
    expect(hiraganaToKatakana("たちつてと")).toBe("タチツテト");
    expect(hiraganaToKatakana("なにぬねの")).toBe("ナニヌネノ");
    expect(hiraganaToKatakana("はひふへほ")).toBe("ハヒフヘホ");
    expect(hiraganaToKatakana("まみむめも")).toBe("マミムメモ");
    expect(hiraganaToKatakana("やゆよ")).toBe("ヤユヨ");
    expect(hiraganaToKatakana("らりるれろ")).toBe("ラリルレロ");
    expect(hiraganaToKatakana("わをん")).toBe("ワヲン");
  });

  it("濁音・半濁音を変換できる", () => {
    expect(hiraganaToKatakana("がぎぐげご")).toBe("ガギグゲゴ");
    expect(hiraganaToKatakana("ぱぴぷぺぽ")).toBe("パピプペポ");
  });

  it("拗音を変換できる", () => {
    expect(hiraganaToKatakana("きゃきゅきょ")).toBe("キャキュキョ");
    expect(hiraganaToKatakana("しゃしゅしょ")).toBe("シャシュショ");
  });

  it("小文字ひらがなを変換できる", () => {
    expect(hiraganaToKatakana("ぁぃぅぇぉ")).toBe("ァィゥェォ");
    expect(hiraganaToKatakana("ゃゅょ")).toBe("ャュョ");
  });

  it("非ひらがな文字はそのまま保持する", () => {
    expect(hiraganaToKatakana("hello world")).toBe("hello world");
    expect(hiraganaToKatakana("123")).toBe("123");
    expect(hiraganaToKatakana("東京")).toBe("東京");
  });

  it("ひらがなと他の文字が混在する場合も正しく変換する", () => {
    expect(hiraganaToKatakana("にほんご")).toBe("ニホンゴ");
    expect(hiraganaToKatakana("hello にほんご")).toBe("hello ニホンゴ");
  });

  it("空文字列は空文字列を返す", () => {
    expect(hiraganaToKatakana("")).toBe("");
  });
});

describe("katakanaToHiragana", () => {
  it("基本的なカタカナをひらがなに変換できる", () => {
    expect(katakanaToHiragana("アイウエオ")).toBe("あいうえお");
  });

  it("五十音すべてを変換できる", () => {
    expect(katakanaToHiragana("カキクケコ")).toBe("かきくけこ");
    expect(katakanaToHiragana("サシスセソ")).toBe("さしすせそ");
    expect(katakanaToHiragana("タチツテト")).toBe("たちつてと");
    expect(katakanaToHiragana("ナニヌネノ")).toBe("なにぬねの");
  });

  it("濁音・半濁音を変換できる", () => {
    expect(katakanaToHiragana("ガギグゲゴ")).toBe("がぎぐげご");
    expect(katakanaToHiragana("パピプペポ")).toBe("ぱぴぷぺぽ");
  });

  it("小文字カタカナを変換できる", () => {
    expect(katakanaToHiragana("ァィゥェォ")).toBe("ぁぃぅぇぉ");
    expect(katakanaToHiragana("ャュョ")).toBe("ゃゅょ");
  });

  it("非カタカナ文字はそのまま保持する", () => {
    expect(katakanaToHiragana("hello")).toBe("hello");
    expect(katakanaToHiragana("東京")).toBe("東京");
  });

  it("空文字列は空文字列を返す", () => {
    expect(katakanaToHiragana("")).toBe("");
  });

  it("ひらがな→カタカナ→ひらがなで元に戻る（ラウンドトリップ）", () => {
    const original = "にほんご";
    expect(katakanaToHiragana(hiraganaToKatakana(original))).toBe(original);
  });
});

describe("hiraganaToRomaji", () => {
  it("基本母音を変換できる", () => {
    expect(hiraganaToRomaji("あいうえお")).toBe("aiueo");
  });

  it("か行を変換できる", () => {
    expect(hiraganaToRomaji("かきくけこ")).toBe("kakikukeko");
  });

  it("さ行を変換できる（ヘボン式）", () => {
    expect(hiraganaToRomaji("さしすせそ")).toBe("sashisuseso");
  });

  it("た行を変換できる（ヘボン式）", () => {
    expect(hiraganaToRomaji("たちつてと")).toBe("tachitsuteto");
  });

  it("な行を変換できる", () => {
    expect(hiraganaToRomaji("なにぬねの")).toBe("naninuneno");
  });

  it("は行を変換できる", () => {
    expect(hiraganaToRomaji("はひふへほ")).toBe("hahifuheho");
  });

  it("拗音を変換できる", () => {
    expect(hiraganaToRomaji("きゃ")).toBe("kya");
    expect(hiraganaToRomaji("しゃしゅしょ")).toBe("shashusho");
    expect(hiraganaToRomaji("ちゃちゅちょ")).toBe("chachucho");
  });

  it("促音（っ）を変換できる", () => {
    expect(hiraganaToRomaji("きって")).toBe("kitte");
    expect(hiraganaToRomaji("さっか")).toBe("sakka");
  });

  it("撥音（ん）を変換できる", () => {
    expect(hiraganaToRomaji("にほん")).toBe("nihon");
    // 母音の前では n'
    expect(hiraganaToRomaji("ほんや")).toBe("hon'ya");
    expect(hiraganaToRomaji("れんあい")).toBe("ren'ai");
  });

  it("じゃ行をヘボン式で変換できる", () => {
    expect(hiraganaToRomaji("じゃじゅじょ")).toBe("jajujo");
  });

  it("空文字列は空文字列を返す", () => {
    expect(hiraganaToRomaji("")).toBe("");
  });

  it("非ひらがな文字はそのまま保持する", () => {
    expect(hiraganaToRomaji("hello")).toBe("hello");
    expect(hiraganaToRomaji("123")).toBe("123");
  });
});

describe("kanaToRomaji", () => {
  it("ひらがなをローマ字に変換できる", () => {
    expect(kanaToRomaji("にほんご")).toBe("nihongo");
  });

  it("カタカナをローマ字に変換できる", () => {
    expect(kanaToRomaji("ニホンゴ")).toBe("nihongo");
  });

  it("ひらがなとカタカナの混在を変換できる", () => {
    expect(kanaToRomaji("にほんゴ")).toBe("nihongo");
  });

  it("空文字列は空文字列を返す", () => {
    expect(kanaToRomaji("")).toBe("");
  });
});

describe("romajiToHiragana", () => {
  it("基本母音を変換できる", () => {
    expect(romajiToHiragana("aiueo")).toBe("あいうえお");
  });

  it("か行を変換できる", () => {
    expect(romajiToHiragana("kakikukeko")).toBe("かきくけこ");
  });

  it("ヘボン式 shi/chi/tsu を変換できる", () => {
    expect(romajiToHiragana("shi")).toBe("し");
    expect(romajiToHiragana("chi")).toBe("ち");
    expect(romajiToHiragana("tsu")).toBe("つ");
  });

  it("拗音を変換できる", () => {
    expect(romajiToHiragana("kya")).toBe("きゃ");
    expect(romajiToHiragana("sha")).toBe("しゃ");
    expect(romajiToHiragana("cha")).toBe("ちゃ");
  });

  it("促音（kk, ss など）を変換できる", () => {
    expect(romajiToHiragana("kitte")).toBe("きって");
    expect(romajiToHiragana("sakka")).toBe("さっか");
    expect(romajiToHiragana("kippu")).toBe("きっぷ");
  });

  it("撥音（n/nn）を変換できる", () => {
    expect(romajiToHiragana("nihon")).toBe("にほん");
    expect(romajiToHiragana("nn")).toBe("ん");
  });

  it("大文字小文字を区別しない", () => {
    expect(romajiToHiragana("NIHONGO")).toBe("にほんご");
    expect(romajiToHiragana("Nihongo")).toBe("にほんご");
  });

  it("空文字列は空文字列を返す", () => {
    expect(romajiToHiragana("")).toBe("");
  });

  it("実用的な単語を変換できる", () => {
    expect(romajiToHiragana("nihongo")).toBe("にほんご");
    // tokyo = to + kyo = と + きょ（ローマ字としての直訳）
    expect(romajiToHiragana("tokyo")).toBe("ときょ");
  });
});

describe("romajiToKatakana", () => {
  it("基本母音をカタカナに変換できる", () => {
    expect(romajiToKatakana("aiueo")).toBe("アイウエオ");
  });

  it("か行をカタカナに変換できる", () => {
    expect(romajiToKatakana("kakikukeko")).toBe("カキクケコ");
  });

  it("拗音をカタカナに変換できる", () => {
    expect(romajiToKatakana("kya")).toBe("キャ");
    expect(romajiToKatakana("sha")).toBe("シャ");
  });

  it("促音をカタカナに変換できる", () => {
    expect(romajiToKatakana("kitte")).toBe("キッテ");
  });

  it("空文字列は空文字列を返す", () => {
    expect(romajiToKatakana("")).toBe("");
  });
});

describe("convertKana", () => {
  it("hiraganaToKatakana モードで変換できる", () => {
    expect(convertKana("あいうえお", "hiraganaToKatakana")).toBe("アイウエオ");
  });

  it("katakanaToHiragana モードで変換できる", () => {
    expect(convertKana("アイウエオ", "katakanaToHiragana")).toBe("あいうえお");
  });

  it("kanaToRomaji モードで変換できる", () => {
    expect(convertKana("にほんご", "kanaToRomaji")).toBe("nihongo");
  });

  it("romajiToHiragana モードで変換できる", () => {
    expect(convertKana("nihongo", "romajiToHiragana")).toBe("にほんご");
  });

  it("romajiToKatakana モードで変換できる", () => {
    expect(convertKana("nihongo", "romajiToKatakana")).toBe("ニホンゴ");
  });

  it("空文字列はすべてのモードで空文字列を返す", () => {
    expect(convertKana("", "hiraganaToKatakana")).toBe("");
    expect(convertKana("", "katakanaToHiragana")).toBe("");
    expect(convertKana("", "kanaToRomaji")).toBe("");
    expect(convertKana("", "romajiToHiragana")).toBe("");
    expect(convertKana("", "romajiToKatakana")).toBe("");
  });
});
