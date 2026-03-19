import { describe, it, expect } from "vitest";
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
  it("基本的なひらがなをカタカナに変換する", () => {
    expect(hiraganaToKatakana("あいうえお")).toBe("アイウエオ");
    expect(hiraganaToKatakana("かきくけこ")).toBe("カキクケコ");
    expect(hiraganaToKatakana("さしすせそ")).toBe("サシスセソ");
  });

  it("ひらがな以外の文字はそのまま保持する", () => {
    expect(hiraganaToKatakana("にほんご123")).toBe("ニホンゴ123");
    expect(hiraganaToKatakana("hello あいう")).toBe("hello アイウ");
  });

  it("空文字列を返す", () => {
    expect(hiraganaToKatakana("")).toBe("");
  });

  it("カタカナはそのまま保持する", () => {
    expect(hiraganaToKatakana("アイウ")).toBe("アイウ");
  });
});

describe("katakanaToHiragana", () => {
  it("基本的なカタカナをひらがなに変換する", () => {
    expect(katakanaToHiragana("アイウエオ")).toBe("あいうえお");
    expect(katakanaToHiragana("カキクケコ")).toBe("かきくけこ");
    expect(katakanaToHiragana("サシスセソ")).toBe("さしすせそ");
  });

  it("カタカナ以外の文字はそのまま保持する", () => {
    expect(katakanaToHiragana("ニホンゴ123")).toBe("にほんご123");
  });

  it("空文字列を返す", () => {
    expect(katakanaToHiragana("")).toBe("");
  });

  it("ひらがなはそのまま保持する", () => {
    expect(katakanaToHiragana("あいう")).toBe("あいう");
  });

  it("相互変換が可能", () => {
    const original = "あいうえおかきくけこ";
    expect(katakanaToHiragana(hiraganaToKatakana(original))).toBe(original);
  });
});

describe("hiraganaToRomaji", () => {
  it("基本的な母音を変換する", () => {
    expect(hiraganaToRomaji("あいうえお")).toBe("aiueo");
  });

  it("か行を変換する", () => {
    expect(hiraganaToRomaji("かきくけこ")).toBe("kakikukeko");
  });

  it("さ行を変換する（し = shi）", () => {
    expect(hiraganaToRomaji("さしすせそ")).toBe("sashisusesu".replace("susesu", "suseso"));
    expect(hiraganaToRomaji("し")).toBe("shi");
    expect(hiraganaToRomaji("す")).toBe("su");
  });

  it("た行を変換する（ち = chi, つ = tsu）", () => {
    expect(hiraganaToRomaji("ち")).toBe("chi");
    expect(hiraganaToRomaji("つ")).toBe("tsu");
    expect(hiraganaToRomaji("て")).toBe("te");
  });

  it("ん を変換する", () => {
    expect(hiraganaToRomaji("にほんご")).toBe("nihongo");
    expect(hiraganaToRomaji("ほんや")).toBe("hon'ya");
  });

  it("拗音を変換する", () => {
    expect(hiraganaToRomaji("きゃ")).toBe("kya");
    expect(hiraganaToRomaji("しゃ")).toBe("sha");
    expect(hiraganaToRomaji("ちゃ")).toBe("cha");
    expect(hiraganaToRomaji("じゃ")).toBe("ja");
  });

  it("促音（っ）を変換する", () => {
    expect(hiraganaToRomaji("きって")).toBe("kitte");
    expect(hiraganaToRomaji("がっこう")).toBe("gakkou");
  });

  it("実際の単語を変換する", () => {
    expect(hiraganaToRomaji("にほんご")).toBe("nihongo");
    expect(hiraganaToRomaji("とうきょう")).toBe("toukyou");
    expect(hiraganaToRomaji("すし")).toBe("sushi");
  });
});

describe("kanaToRomaji", () => {
  it("ひらがなとカタカナを混在して変換する", () => {
    expect(kanaToRomaji("にほんご")).toBe("nihongo");
    expect(kanaToRomaji("ニホンゴ")).toBe("nihongo");
  });

  it("混在テキストを変換する", () => {
    expect(kanaToRomaji("すし")).toBe("sushi");
    expect(kanaToRomaji("スシ")).toBe("sushi");
  });
});

describe("romajiToHiragana", () => {
  it("基本的なローマ字をひらがなに変換する", () => {
    expect(romajiToHiragana("aiueo")).toBe("あいうえお");
    expect(romajiToHiragana("kakikukeko")).toBe("かきくけこ");
  });

  it("shi/chi/tsu を変換する", () => {
    expect(romajiToHiragana("shi")).toBe("し");
    expect(romajiToHiragana("chi")).toBe("ち");
    expect(romajiToHiragana("tsu")).toBe("つ");
  });

  it("n をひらがなに変換する", () => {
    expect(romajiToHiragana("nihongo")).toBe("にほんご");
    expect(romajiToHiragana("nn")).toBe("ん");
  });

  it("促音（っ）に変換する", () => {
    expect(romajiToHiragana("kitte")).toBe("きって");
    expect(romajiToHiragana("gakkou")).toBe("がっこう");
  });

  it("拗音を変換する", () => {
    expect(romajiToHiragana("kya")).toBe("きゃ");
    expect(romajiToHiragana("sha")).toBe("しゃ");
    expect(romajiToHiragana("cha")).toBe("ちゃ");
    expect(romajiToHiragana("ja")).toBe("じゃ");
  });

  it("実際の単語を変換する", () => {
    expect(romajiToHiragana("nihongo")).toBe("にほんご");
    expect(romajiToHiragana("sushi")).toBe("すし");
    // tokyo → ときょ（toukyou → とうきょう）
    expect(romajiToHiragana("tokyo")).toBe("ときょ");
    expect(romajiToHiragana("toukyou")).toBe("とうきょう");
  });

  it("大文字小文字を区別しない", () => {
    expect(romajiToHiragana("SUSHI")).toBe("すし");
    expect(romajiToHiragana("Nihongo")).toBe("にほんご");
  });
});

describe("romajiToKatakana", () => {
  it("ローマ字をカタカナに変換する", () => {
    expect(romajiToKatakana("sushi")).toBe("スシ");
    expect(romajiToKatakana("nihongo")).toBe("ニホンゴ");
  });
});

describe("convertKana", () => {
  it("hiraganaToKatakana モードで動作する", () => {
    expect(convertKana("あいう", "hiraganaToKatakana")).toBe("アイウ");
  });

  it("katakanaToHiragana モードで動作する", () => {
    expect(convertKana("アイウ", "katakanaToHiragana")).toBe("あいう");
  });

  it("kanaToRomaji モードで動作する", () => {
    expect(convertKana("すし", "kanaToRomaji")).toBe("sushi");
  });

  it("romajiToHiragana モードで動作する", () => {
    expect(convertKana("sushi", "romajiToHiragana")).toBe("すし");
  });

  it("romajiToKatakana モードで動作する", () => {
    expect(convertKana("sushi", "romajiToKatakana")).toBe("スシ");
  });
});
