import { describe, it, expect } from "vite-plus/test";
import {
  countChars,
  countCharsNoSpaces,
  countWords,
  countSentences,
  countParagraphs,
  countLines,
  estimateReadingTimeSeconds,
  countUniqueWords,
  getAverageWordLength,
  getAverageSentenceLength,
  getTopWords,
  analyzeText,
  formatReadingTime,
  tokenizeWords,
} from "../../app/utils/text-stats";

describe("countChars", () => {
  it("空文字列は0を返す", () => {
    expect(countChars("")).toBe(0);
  });

  it("ASCII文字を正確にカウントする", () => {
    expect(countChars("hello")).toBe(5);
  });

  it("スペースを含む文字列をカウントする", () => {
    expect(countChars("hello world")).toBe(11);
  });

  it("日本語文字をカウントする", () => {
    expect(countChars("こんにちは")).toBe(5);
  });

  it("絵文字を1文字としてカウントする", () => {
    expect(countChars("😀")).toBe(1);
  });

  it("混在テキストをカウントする", () => {
    expect(countChars("Hello 世界")).toBe(8);
  });
});

describe("countCharsNoSpaces", () => {
  it("空文字列は0を返す", () => {
    expect(countCharsNoSpaces("")).toBe(0);
  });

  it("スペースを除いた文字数を返す", () => {
    expect(countCharsNoSpaces("hello world")).toBe(10);
  });

  it("タブや改行も除外する", () => {
    expect(countCharsNoSpaces("a\tb\nc")).toBe(3);
  });

  it("スペースのみは0を返す", () => {
    expect(countCharsNoSpaces("   ")).toBe(0);
  });
});

describe("tokenizeWords", () => {
  it("空文字列は空配列を返す", () => {
    expect(tokenizeWords("")).toEqual([]);
  });

  it("空白のみは空配列を返す", () => {
    expect(tokenizeWords("   ")).toEqual([]);
  });

  it("単語を分割する", () => {
    expect(tokenizeWords("hello world")).toEqual(["hello", "world"]);
  });

  it("複数スペースを1つとして扱う", () => {
    expect(tokenizeWords("hello  world")).toEqual(["hello", "world"]);
  });

  it("句読点を除去する", () => {
    const result = tokenizeWords("hello, world.");
    expect(result).toContain("hello");
    expect(result).toContain("world");
  });
});

describe("countWords", () => {
  it("空文字列は0を返す", () => {
    expect(countWords("")).toBe(0);
  });

  it("空白のみは0を返す", () => {
    expect(countWords("   ")).toBe(0);
  });

  it("単語数を正確にカウントする", () => {
    expect(countWords("hello world")).toBe(2);
  });

  it("単一単語を1として返す", () => {
    expect(countWords("hello")).toBe(1);
  });

  it("複数スペースを正しく処理する", () => {
    expect(countWords("a  b  c")).toBe(3);
  });
});

describe("countSentences", () => {
  it("空文字列は0を返す", () => {
    expect(countSentences("")).toBe(0);
  });

  it("ピリオドで区切られた文章をカウントする", () => {
    expect(countSentences("Hello world. How are you?")).toBe(2);
  });

  it("感嘆符で終わる文章をカウントする", () => {
    expect(countSentences("Hello! World!")).toBe(2);
  });

  it("日本語の句点で区切る", () => {
    expect(countSentences("こんにちは。元気ですか？")).toBe(2);
  });

  it("文章のない段落は1を返す", () => {
    expect(countSentences("hello world")).toBe(1);
  });

  it("連続する区切り文字を正しく処理する", () => {
    const result = countSentences("Really?! Amazing.");
    expect(result).toBe(2);
  });
});

describe("countParagraphs", () => {
  it("空文字列は0を返す", () => {
    expect(countParagraphs("")).toBe(0);
  });

  it("空白のみは0を返す", () => {
    expect(countParagraphs("   ")).toBe(0);
  });

  it("単一段落は1を返す", () => {
    expect(countParagraphs("Hello world.")).toBe(1);
  });

  it("空行で区切られた段落をカウントする", () => {
    expect(countParagraphs("Para one.\n\nPara two.")).toBe(2);
  });

  it("連続する空行は1区切りとして扱う", () => {
    expect(countParagraphs("Para one.\n\n\nPara two.")).toBe(2);
  });

  it("3段落をカウントする", () => {
    expect(countParagraphs("A\n\nB\n\nC")).toBe(3);
  });
});

describe("countLines", () => {
  it("空文字列は0を返す", () => {
    expect(countLines("")).toBe(0);
  });

  it("単一行は1を返す", () => {
    expect(countLines("hello")).toBe(1);
  });

  it("改行で区切られた行数をカウントする", () => {
    expect(countLines("line1\nline2\nline3")).toBe(3);
  });

  it("CRLFに対応する", () => {
    expect(countLines("line1\r\nline2")).toBe(2);
  });

  it("CRに対応する", () => {
    expect(countLines("line1\rline2")).toBe(2);
  });
});

describe("estimateReadingTimeSeconds", () => {
  it("0単語は0秒を返す", () => {
    expect(estimateReadingTimeSeconds(0)).toBe(0);
  });

  it("200単語は60秒を返す", () => {
    expect(estimateReadingTimeSeconds(200)).toBe(60);
  });

  it("100単語は30秒を返す", () => {
    expect(estimateReadingTimeSeconds(100)).toBe(30);
  });

  it("1単語は1秒（切り上げ）を返す", () => {
    expect(estimateReadingTimeSeconds(1)).toBe(1);
  });

  it("400単語は120秒を返す", () => {
    expect(estimateReadingTimeSeconds(400)).toBe(120);
  });
});

describe("countUniqueWords", () => {
  it("空文字列は0を返す", () => {
    expect(countUniqueWords("")).toBe(0);
  });

  it("重複なしの単語数を返す", () => {
    expect(countUniqueWords("hello world")).toBe(2);
  });

  it("重複した単語を1としてカウントする", () => {
    expect(countUniqueWords("hello hello world")).toBe(2);
  });

  it("大文字小文字を区別しない", () => {
    expect(countUniqueWords("Hello hello")).toBe(1);
  });

  it("3種類のユニーク単語をカウントする", () => {
    expect(countUniqueWords("a b c a b")).toBe(3);
  });
});

describe("getAverageWordLength", () => {
  it("空文字列は0を返す", () => {
    expect(getAverageWordLength("")).toBe(0);
  });

  it("単一単語の長さを返す", () => {
    expect(getAverageWordLength("hello")).toBe(5);
  });

  it("平均単語長を小数第1位で返す", () => {
    // 'hi' (2) + 'hello' (5) = 7 / 2 = 3.5
    expect(getAverageWordLength("hi hello")).toBe(3.5);
  });

  it("整数値も正しく返す", () => {
    // 'ab' (2) + 'cd' (2) = 4 / 2 = 2.0
    expect(getAverageWordLength("ab cd")).toBe(2);
  });
});

describe("getAverageSentenceLength", () => {
  it("空文字列は0を返す", () => {
    expect(getAverageSentenceLength("")).toBe(0);
  });

  it("1文の平均文長を返す", () => {
    expect(getAverageSentenceLength("hello world.")).toBe(2);
  });

  it("2文の平均文長を計算する", () => {
    // 'hello world' (2) + 'how are you' (3) = 5/2 = 2.5
    expect(getAverageSentenceLength("hello world. how are you.")).toBe(2.5);
  });
});

describe("getTopWords", () => {
  it("空文字列は空配列を返す", () => {
    expect(getTopWords("")).toEqual([]);
  });

  it("頻度降順でソートされる", () => {
    const result = getTopWords("apple banana apple cherry apple banana");
    expect(result[0].word).toBe("apple");
    expect(result[0].count).toBe(3);
    expect(result[1].word).toBe("banana");
    expect(result[1].count).toBe(2);
  });

  it("英語ストップワードを除外する", () => {
    const result = getTopWords("the cat sat on the mat");
    const words = result.map((r) => r.word);
    expect(words).not.toContain("the");
    expect(words).not.toContain("on");
  });

  it("1文字の単語を除外する", () => {
    const result = getTopWords("a b c apple apple");
    const words = result.map((r) => r.word);
    expect(words).not.toContain("a");
    expect(words).not.toContain("b");
    expect(words).not.toContain("c");
  });

  it("limit件数を超えない", () => {
    const text = Array.from({ length: 20 }, (_, i) => `word${i} word${i}`).join(" ");
    const result = getTopWords(text, 5);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("デフォルトlimitは10", () => {
    const text = Array.from({ length: 20 }, (_, i) => `word${i} word${i}`).join(" ");
    const result = getTopWords(text);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it("大文字小文字を区別しない", () => {
    const result = getTopWords("Apple apple APPLE");
    expect(result[0].word).toBe("apple");
    expect(result[0].count).toBe(3);
  });
});

describe("analyzeText", () => {
  it("空文字列で全て0を返す", () => {
    const stats = analyzeText("");
    expect(stats.charCount).toBe(0);
    expect(stats.charCountNoSpaces).toBe(0);
    expect(stats.wordCount).toBe(0);
    expect(stats.sentenceCount).toBe(0);
    expect(stats.paragraphCount).toBe(0);
    expect(stats.lineCount).toBe(0);
    expect(stats.readingTimeSeconds).toBe(0);
    expect(stats.uniqueWordCount).toBe(0);
    expect(stats.averageWordLength).toBe(0);
    expect(stats.averageSentenceLength).toBe(0);
    expect(stats.topWords).toEqual([]);
  });

  it("テキストを正しく分析する", () => {
    const stats = analyzeText("Hello world. Hello again.");
    expect(stats.charCount).toBeGreaterThan(0);
    expect(stats.wordCount).toBe(4);
    expect(stats.sentenceCount).toBe(2);
    expect(stats.uniqueWordCount).toBe(3); // hello, world, again
  });

  it("全フィールドが存在する", () => {
    const stats = analyzeText("test");
    expect(stats).toHaveProperty("charCount");
    expect(stats).toHaveProperty("charCountNoSpaces");
    expect(stats).toHaveProperty("wordCount");
    expect(stats).toHaveProperty("sentenceCount");
    expect(stats).toHaveProperty("paragraphCount");
    expect(stats).toHaveProperty("lineCount");
    expect(stats).toHaveProperty("readingTimeSeconds");
    expect(stats).toHaveProperty("uniqueWordCount");
    expect(stats).toHaveProperty("averageWordLength");
    expect(stats).toHaveProperty("averageSentenceLength");
    expect(stats).toHaveProperty("topWords");
  });
});

describe("formatReadingTime", () => {
  it('0秒は "0秒" を返す', () => {
    expect(formatReadingTime(0)).toBe("0秒");
  });

  it('30秒は "30秒" を返す', () => {
    expect(formatReadingTime(30)).toBe("30秒");
  });

  it('60秒は "1分" を返す', () => {
    expect(formatReadingTime(60)).toBe("1分");
  });

  it('90秒は "1分30秒" を返す', () => {
    expect(formatReadingTime(90)).toBe("1分30秒");
  });

  it('120秒は "2分" を返す', () => {
    expect(formatReadingTime(120)).toBe("2分");
  });

  it('3661秒は "61分1秒" を返す', () => {
    expect(formatReadingTime(3661)).toBe("61分1秒");
  });
});
