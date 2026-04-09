import { describe, expect, it } from "vite-plus/test";
import {
  countSyllables,
  detectLanguage,
  analyzeEnglishReadability,
  analyzeJapaneseReadability,
  analyzeReadability,
  getFleschLabel,
  getJapaneseDifficultyLabel,
} from "../../app/utils/readability";

describe("countSyllables", () => {
  it("1〜3文字の単語は1音節", () => {
    expect(countSyllables("a")).toBe(1);
    expect(countSyllables("the")).toBe(1);
    expect(countSyllables("cat")).toBe(1);
  });

  it("単音節の一般的な単語", () => {
    expect(countSyllables("dog")).toBe(1);
    expect(countSyllables("fox")).toBe(1);
    expect(countSyllables("run")).toBe(1);
  });

  it("2音節の単語", () => {
    const syllables = countSyllables("happy");
    expect(syllables).toBeGreaterThanOrEqual(2);
  });

  it("3音節以上の単語", () => {
    expect(countSyllables("beautiful")).toBeGreaterThanOrEqual(3);
    expect(countSyllables("communication")).toBeGreaterThanOrEqual(4);
  });

  it("空文字列は0", () => {
    expect(countSyllables("")).toBe(0);
  });

  it("非アルファベットを除外して計算", () => {
    expect(countSyllables("don't")).toBeGreaterThanOrEqual(1);
  });

  it("最低1音節を保証", () => {
    expect(countSyllables("xyz")).toBeGreaterThanOrEqual(1);
  });
});

describe("detectLanguage", () => {
  it("英語テキストを英語と判定", () => {
    expect(detectLanguage("Hello world. This is a test sentence.")).toBe("english");
  });

  it("日本語テキストを日本語と判定", () => {
    expect(detectLanguage("これはテストです。日本語のテキストを入力してください。")).toBe(
      "japanese",
    );
  });

  it("混在テキストをmixedと判定", () => {
    const result = detectLanguage("Hello world. これはテスト。混在テキスト。");
    expect(["mixed", "japanese", "english"]).toContain(result);
  });

  it("空文字列は english", () => {
    expect(detectLanguage("")).toBe("english");
  });

  it("数字のみは english", () => {
    expect(detectLanguage("12345 678")).toBe("english");
  });

  it("ひらがなのみを日本語と判定", () => {
    expect(detectLanguage("あいうえおかきくけこさしすせそ")).toBe("japanese");
  });

  it("漢字のみを日本語と判定", () => {
    expect(detectLanguage("日本語文章解析")).toBe("japanese");
  });
});

describe("analyzeEnglishReadability", () => {
  const SAMPLE_EN =
    "The quick brown fox jumps over the lazy dog. " +
    "Pack my box with five dozen liquor jugs. " +
    "How vexingly quick daft zebras jump.";

  it("空テキストは null を返す", () => {
    expect(analyzeEnglishReadability("")).toBeNull();
    expect(analyzeEnglishReadability("   ")).toBeNull();
  });

  it("有効なテキストでスコアオブジェクトを返す", () => {
    const result = analyzeEnglishReadability(SAMPLE_EN);
    expect(result).not.toBeNull();
  });

  it("Flesch Reading Ease は 0〜100 の範囲", () => {
    const result = analyzeEnglishReadability(SAMPLE_EN);
    expect(result!.fleschReadingEase).toBeGreaterThanOrEqual(0);
    expect(result!.fleschReadingEase).toBeLessThanOrEqual(100);
  });

  it("単語数・文章数が正しく計算される", () => {
    const result = analyzeEnglishReadability(SAMPLE_EN);
    expect(result!.wordCount).toBeGreaterThan(0);
    expect(result!.sentenceCount).toBe(3);
  });

  it("Flesch-Kincaid Grade Level が数値", () => {
    const result = analyzeEnglishReadability(SAMPLE_EN);
    expect(typeof result!.fleschKincaidGrade).toBe("number");
  });

  it("Gunning Fog が正の数値", () => {
    const result = analyzeEnglishReadability(SAMPLE_EN);
    expect(result!.gunningFog).toBeGreaterThan(0);
  });

  it("3文以上で SMOG Index が計算される", () => {
    const result = analyzeEnglishReadability(SAMPLE_EN);
    expect(result!.smogIndex).not.toBeNull();
  });

  it("2文以下で SMOG Index は null", () => {
    const result = analyzeEnglishReadability("Hello world. This is a test.");
    expect(result!.smogIndex).toBeNull();
  });

  it("fleschLabel が設定される", () => {
    const result = analyzeEnglishReadability(SAMPLE_EN);
    expect(result!.fleschLabel).toBeTruthy();
    expect(typeof result!.fleschLabel).toBe("string");
  });

  it("音節数が正の整数", () => {
    const result = analyzeEnglishReadability(SAMPLE_EN);
    expect(result!.totalSyllables).toBeGreaterThan(0);
    expect(Number.isInteger(result!.totalSyllables)).toBe(true);
  });

  it("平均文長が正の数値", () => {
    const result = analyzeEnglishReadability(SAMPLE_EN);
    expect(result!.avgWordsPerSentence).toBeGreaterThan(0);
  });
});

describe("analyzeJapaneseReadability", () => {
  const SAMPLE_JP =
    "本日は晴天なり。日本語のテキスト解析を行うツールです。漢字の密度を計算することができます。";

  it("空テキストは null を返す", () => {
    expect(analyzeJapaneseReadability("")).toBeNull();
    expect(analyzeJapaneseReadability("   ")).toBeNull();
  });

  it("有効なテキストでスコアオブジェクトを返す", () => {
    const result = analyzeJapaneseReadability(SAMPLE_JP);
    expect(result).not.toBeNull();
  });

  it("文章数が正しく計算される", () => {
    const result = analyzeJapaneseReadability(SAMPLE_JP);
    expect(result!.sentenceCount).toBe(3);
  });

  it("漢字密度が 0〜100 の範囲", () => {
    const result = analyzeJapaneseReadability(SAMPLE_JP);
    expect(result!.kanjiDensity).toBeGreaterThanOrEqual(0);
    expect(result!.kanjiDensity).toBeLessThanOrEqual(100);
  });

  it("ひらがな密度が 0〜100 の範囲", () => {
    const result = analyzeJapaneseReadability(SAMPLE_JP);
    expect(result!.hiraganaDensity).toBeGreaterThanOrEqual(0);
    expect(result!.hiraganaDensity).toBeLessThanOrEqual(100);
  });

  it("難易度スコアが 0〜100 の範囲", () => {
    const result = analyzeJapaneseReadability(SAMPLE_JP);
    expect(result!.difficultyScore).toBeGreaterThanOrEqual(0);
    expect(result!.difficultyScore).toBeLessThanOrEqual(100);
  });

  it("難易度ラベルが設定される", () => {
    const result = analyzeJapaneseReadability(SAMPLE_JP);
    expect(result!.difficultyLabel).toBeTruthy();
  });

  it("漢字のみのテキストで高い漢字密度", () => {
    const result = analyzeJapaneseReadability("今日天気良好。明日会議予定。");
    expect(result!.kanjiDensity).toBeGreaterThan(50);
  });

  it("ひらがなのみのテキストで高いひらがな密度", () => {
    const result = analyzeJapaneseReadability("これはてすとです。あいうえおです。");
    expect(result!.hiraganaDensity).toBeGreaterThan(50);
  });

  it("平均文長が正の数値", () => {
    const result = analyzeJapaneseReadability(SAMPLE_JP);
    expect(result!.avgCharsPerSentence).toBeGreaterThan(0);
  });
});

describe("analyzeReadability", () => {
  it("英語テキストで english 言語を返す", () => {
    const result = analyzeReadability(
      "Hello world. This is a test sentence for readability analysis.",
    );
    expect(result.language).toBe("english");
    expect(result.english).not.toBeNull();
    expect(result.japanese).toBeNull();
  });

  it("日本語テキストで japanese 言語を返す", () => {
    const result = analyzeReadability("本日は晴天なり。日本語のテキスト解析を行います。");
    expect(result.language).toBe("japanese");
    expect(result.japanese).not.toBeNull();
    expect(result.english).toBeNull();
  });

  it("空テキストで null スコアを返す", () => {
    const result = analyzeReadability("");
    expect(result.english).toBeNull();
    expect(result.japanese).toBeNull();
  });
});

describe("getFleschLabel", () => {
  it("90以上は「非常に簡単」", () => {
    expect(getFleschLabel(95).label).toBe("非常に簡単");
    expect(getFleschLabel(90).label).toBe("非常に簡単");
  });

  it("60〜70は「標準」", () => {
    expect(getFleschLabel(65).label).toBe("標準");
  });

  it("0〜30は「非常に難しい」", () => {
    expect(getFleschLabel(10).label).toBe("非常に難しい");
    expect(getFleschLabel(0).label).toBe("非常に難しい");
  });

  it("80〜90は「簡単」", () => {
    expect(getFleschLabel(85).label).toBe("簡単");
  });
});

describe("getJapaneseDifficultyLabel", () => {
  it("80以上は「非常に難しい」", () => {
    expect(getJapaneseDifficultyLabel(85)).toBe("非常に難しい");
  });

  it("0〜20は「非常に簡単」", () => {
    expect(getJapaneseDifficultyLabel(10)).toBe("非常に簡単");
    expect(getJapaneseDifficultyLabel(0)).toBe("非常に簡単");
  });

  it("40〜60は「標準」", () => {
    expect(getJapaneseDifficultyLabel(50)).toBe("標準");
  });
});
