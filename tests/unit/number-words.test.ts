import { describe, it, expect } from "vite-plus/test";
import {
  toWordsEnglish,
  toWordsEnglishOrdinal,
  toWordsJapanese,
  toWordsJapaneseReading,
  NUMBER_WORDS_MAX,
} from "../../app/utils/number-words";

// ===== toWordsEnglish =====
describe("toWordsEnglish", () => {
  it("ゼロを変換できる", () => {
    expect(toWordsEnglish(0)).toBe("zero");
  });

  it("1〜19を変換できる", () => {
    expect(toWordsEnglish(1)).toBe("one");
    expect(toWordsEnglish(11)).toBe("eleven");
    expect(toWordsEnglish(12)).toBe("twelve");
    expect(toWordsEnglish(13)).toBe("thirteen");
    expect(toWordsEnglish(19)).toBe("nineteen");
  });

  it("20〜99を変換できる", () => {
    expect(toWordsEnglish(20)).toBe("twenty");
    expect(toWordsEnglish(21)).toBe("twenty-one");
    expect(toWordsEnglish(42)).toBe("forty-two");
    expect(toWordsEnglish(99)).toBe("ninety-nine");
  });

  it("100〜999を変換できる", () => {
    expect(toWordsEnglish(100)).toBe("one hundred");
    expect(toWordsEnglish(101)).toBe("one hundred one");
    expect(toWordsEnglish(123)).toBe("one hundred twenty-three");
    expect(toWordsEnglish(999)).toBe("nine hundred ninety-nine");
  });

  it("1000以上を変換できる", () => {
    expect(toWordsEnglish(1000)).toBe("one thousand");
    expect(toWordsEnglish(1001)).toBe("one thousand, one");
    expect(toWordsEnglish(12345)).toBe("twelve thousand, three hundred forty-five");
    expect(toWordsEnglish(1000000)).toBe("one million");
    expect(toWordsEnglish(1000000000)).toBe("one billion");
    expect(toWordsEnglish(1000000000000)).toBe("one trillion");
  });

  it("大きな数を変換できる", () => {
    expect(toWordsEnglish(999999)).toBe(
      "nine hundred ninety-nine thousand, nine hundred ninety-nine",
    );
    expect(toWordsEnglish(1234567890)).toBe(
      "one billion, two hundred thirty-four million, five hundred sixty-seven thousand, eight hundred ninety",
    );
  });

  it("負の数を変換できる", () => {
    expect(toWordsEnglish(-1)).toBe("negative one");
    expect(toWordsEnglish(-42)).toBe("negative forty-two");
    expect(toWordsEnglish(-1000)).toBe("negative one thousand");
  });

  it("範囲外はnullを返す", () => {
    expect(toWordsEnglish(NUMBER_WORDS_MAX + 1)).toBeNull();
    expect(toWordsEnglish(1.5)).toBeNull();
  });
});

// ===== toWordsEnglishOrdinal =====
describe("toWordsEnglishOrdinal", () => {
  it("1〜12の序数詞を変換できる", () => {
    expect(toWordsEnglishOrdinal(1)).toBe("first");
    expect(toWordsEnglishOrdinal(2)).toBe("second");
    expect(toWordsEnglishOrdinal(3)).toBe("third");
    expect(toWordsEnglishOrdinal(4)).toBe("fourth");
    expect(toWordsEnglishOrdinal(5)).toBe("fifth");
    expect(toWordsEnglishOrdinal(8)).toBe("eighth");
    expect(toWordsEnglishOrdinal(9)).toBe("ninth");
    expect(toWordsEnglishOrdinal(11)).toBe("eleventh");
    expect(toWordsEnglishOrdinal(12)).toBe("twelfth");
    expect(toWordsEnglishOrdinal(13)).toBe("thirteenth");
  });

  it("20台の序数詞を変換できる", () => {
    expect(toWordsEnglishOrdinal(20)).toBe("twentieth");
    expect(toWordsEnglishOrdinal(21)).toBe("twenty-first");
    expect(toWordsEnglishOrdinal(22)).toBe("twenty-second");
    expect(toWordsEnglishOrdinal(23)).toBe("twenty-third");
    expect(toWordsEnglishOrdinal(30)).toBe("thirtieth");
  });

  it("100台の序数詞を変換できる", () => {
    expect(toWordsEnglishOrdinal(100)).toBe("one hundredth");
    expect(toWordsEnglishOrdinal(101)).toBe("one hundred first");
    expect(toWordsEnglishOrdinal(112)).toBe("one hundred twelfth");
  });

  it("0や負の数はnullを返す", () => {
    expect(toWordsEnglishOrdinal(0)).toBeNull();
    expect(toWordsEnglishOrdinal(-1)).toBeNull();
  });
});

// ===== toWordsJapanese =====
describe("toWordsJapanese", () => {
  it("ゼロを変換できる", () => {
    expect(toWordsJapanese(0)).toBe("零");
  });

  it("1〜9を変換できる", () => {
    expect(toWordsJapanese(1)).toBe("一");
    expect(toWordsJapanese(5)).toBe("五");
    expect(toWordsJapanese(9)).toBe("九");
  });

  it("10〜99を変換できる", () => {
    expect(toWordsJapanese(10)).toBe("十");
    expect(toWordsJapanese(11)).toBe("十一");
    expect(toWordsJapanese(21)).toBe("二十一");
    expect(toWordsJapanese(99)).toBe("九十九");
  });

  it("100〜999を変換できる", () => {
    expect(toWordsJapanese(100)).toBe("百");
    expect(toWordsJapanese(101)).toBe("百一");
    expect(toWordsJapanese(123)).toBe("百二十三");
    expect(toWordsJapanese(300)).toBe("三百");
    expect(toWordsJapanese(999)).toBe("九百九十九");
  });

  it("1000〜9999を変換できる", () => {
    expect(toWordsJapanese(1000)).toBe("千");
    expect(toWordsJapanese(1001)).toBe("千一");
    expect(toWordsJapanese(2000)).toBe("二千");
    expect(toWordsJapanese(12345)).toBe("一万二千三百四十五");
  });

  it("万以上を変換できる", () => {
    expect(toWordsJapanese(10000)).toBe("一万");
    expect(toWordsJapanese(100000000)).toBe("一億");
    expect(toWordsJapanese(1000000000000)).toBe("一兆");
    expect(toWordsJapanese(1234567890)).toBe("十二億三千四百五十六万七千八百九十");
  });

  it("負の数はnullを返す", () => {
    expect(toWordsJapanese(-1)).toBeNull();
  });
});

// ===== toWordsJapaneseReading =====
describe("toWordsJapaneseReading", () => {
  it("ゼロを変換できる", () => {
    expect(toWordsJapaneseReading(0)).toBe("れい");
  });

  it("基本的な数値を変換できる", () => {
    expect(toWordsJapaneseReading(1)).toBe("いち");
    expect(toWordsJapaneseReading(10)).toBe("じゅう");
    expect(toWordsJapaneseReading(11)).toBe("じゅういち");
    expect(toWordsJapaneseReading(21)).toBe("にじゅういち");
  });

  it("百の音便変化を正しく変換できる", () => {
    expect(toWordsJapaneseReading(100)).toBe("ひゃく");
    expect(toWordsJapaneseReading(300)).toBe("さんびゃく");
    expect(toWordsJapaneseReading(600)).toBe("ろっぴゃく");
    expect(toWordsJapaneseReading(800)).toBe("はっぴゃく");
  });

  it("千の音便変化を正しく変換できる", () => {
    expect(toWordsJapaneseReading(1000)).toBe("せん");
    expect(toWordsJapaneseReading(3000)).toBe("さんぜん");
    expect(toWordsJapaneseReading(8000)).toBe("はっせん");
  });

  it("万以上を変換できる", () => {
    expect(toWordsJapaneseReading(10000)).toBe("いちまん");
    expect(toWordsJapaneseReading(12345)).toBe("いちまんにせんさんびゃくよんじゅうご");
    expect(toWordsJapaneseReading(100000000)).toBe("いちおく");
  });

  it("複合的な変換を正しく処理できる", () => {
    expect(toWordsJapaneseReading(123)).toBe("ひゃくにじゅうさん");
    expect(toWordsJapaneseReading(3800)).toBe("さんぜんはっぴゃく");
  });

  it("負の数はnullを返す", () => {
    expect(toWordsJapaneseReading(-1)).toBeNull();
  });
});
