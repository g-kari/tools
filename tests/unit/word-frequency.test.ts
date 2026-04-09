import { describe, it, expect } from "vite-plus/test";
import {
  tokenizeText,
  analyzeWordFrequency,
  sortWordEntries,
  wordEntriesToCsv,
  type WordFrequencyOptions,
} from "../../app/routes/word-frequency";

const defaultOptions: WordFrequencyOptions = {
  ignoreCase: false,
  ignorePunctuation: false,
  filterStopWords: false,
  minLength: 1,
};

describe("tokenizeText", () => {
  it("should split simple space-separated text", () => {
    const result = tokenizeText("hello world foo", false);
    expect(result).toEqual(["hello", "world", "foo"]);
  });

  it("should split text with multiple spaces", () => {
    const result = tokenizeText("hello   world", false);
    expect(result).toEqual(["hello", "world"]);
  });

  it("should split text with newlines and tabs", () => {
    const result = tokenizeText("hello\nworld\tfoo", false);
    expect(result).toEqual(["hello", "world", "foo"]);
  });

  it("should return empty array for empty text", () => {
    const result = tokenizeText("", false);
    expect(result).toEqual([]);
  });

  it("should return empty array for whitespace-only text", () => {
    const result = tokenizeText("   ", false);
    expect(result).toEqual([]);
  });

  it("should remove punctuation when ignorePunctuation=true", () => {
    const result = tokenizeText("hello, world! foo.", true);
    expect(result).toEqual(["hello", "world", "foo"]);
  });

  it("should keep punctuation when ignorePunctuation=false", () => {
    const result = tokenizeText("hello, world!", false);
    expect(result).toEqual(["hello,", "world!"]);
  });

  it("should handle Japanese punctuation when ignorePunctuation=true", () => {
    const result = tokenizeText("こんにちは、世界！", true);
    expect(result).toEqual(["こんにちは", "世界"]);
  });

  it("should handle parentheses when ignorePunctuation=true", () => {
    const result = tokenizeText("(hello) [world]", true);
    expect(result).toEqual(["hello", "world"]);
  });
});

describe("analyzeWordFrequency", () => {
  it("should return empty result for empty text", () => {
    const result = analyzeWordFrequency("", defaultOptions);
    expect(result.entries).toEqual([]);
    expect(result.totalWords).toBe(0);
    expect(result.uniqueWords).toBe(0);
  });

  it("should count word frequency correctly", () => {
    const result = analyzeWordFrequency("apple banana apple cherry apple", defaultOptions);
    const appleEntry = result.entries.find((e) => e.word === "apple");
    expect(appleEntry).toBeDefined();
    expect(appleEntry!.count).toBe(3);
    expect(result.totalWords).toBe(5);
    expect(result.uniqueWords).toBe(3);
  });

  it("should treat Hello and hello as different words when ignoreCase=false", () => {
    const result = analyzeWordFrequency("Hello hello", { ...defaultOptions, ignoreCase: false });
    expect(result.uniqueWords).toBe(2);
  });

  it("should treat Hello and hello as same word when ignoreCase=true", () => {
    const result = analyzeWordFrequency("Hello hello", { ...defaultOptions, ignoreCase: true });
    expect(result.uniqueWords).toBe(1);
    expect(result.entries[0]!.count).toBe(2);
    expect(result.entries[0]!.word).toBe("hello");
  });

  it("should calculate correct percentage", () => {
    const result = analyzeWordFrequency("a a b", defaultOptions);
    const aEntry = result.entries.find((e) => e.word === "a")!;
    expect(aEntry.percentage).toBeCloseTo(66.67, 1);
  });

  it("should filter stop words when filterStopWords=true", () => {
    const result = analyzeWordFrequency("the cat sat on the mat", {
      ...defaultOptions,
      ignoreCase: true,
      filterStopWords: true,
    });
    const theEntry = result.entries.find((e) => e.word === "the");
    const onEntry = result.entries.find((e) => e.word === "on");
    expect(theEntry).toBeUndefined();
    expect(onEntry).toBeUndefined();
  });

  it("should not filter stop words when filterStopWords=false", () => {
    const result = analyzeWordFrequency("the cat sat", {
      ...defaultOptions,
      ignoreCase: true,
      filterStopWords: false,
    });
    const theEntry = result.entries.find((e) => e.word === "the");
    expect(theEntry).toBeDefined();
  });

  it("should filter words shorter than minLength", () => {
    const result = analyzeWordFrequency("I am cat", { ...defaultOptions, minLength: 3 });
    const iEntry = result.entries.find((e) => e.word === "I");
    const amEntry = result.entries.find((e) => e.word === "am");
    expect(iEntry).toBeUndefined();
    expect(amEntry).toBeUndefined();
    const catEntry = result.entries.find((e) => e.word === "cat");
    expect(catEntry).toBeDefined();
  });

  it("should handle punctuation removal with analyzeWordFrequency", () => {
    const result = analyzeWordFrequency("hello, hello.", {
      ...defaultOptions,
      ignorePunctuation: true,
    });
    const helloEntry = result.entries.find((e) => e.word === "hello");
    expect(helloEntry).toBeDefined();
    expect(helloEntry!.count).toBe(2);
  });

  it("should handle text with only whitespace", () => {
    const result = analyzeWordFrequency("   \n\t  ", defaultOptions);
    expect(result.entries).toEqual([]);
    expect(result.totalWords).toBe(0);
  });

  it("should handle single word", () => {
    const result = analyzeWordFrequency("hello", defaultOptions);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.word).toBe("hello");
    expect(result.entries[0]!.count).toBe(1);
    expect(result.entries[0]!.percentage).toBe(100);
  });
});

describe("sortWordEntries", () => {
  const entries = [
    { word: "banana", count: 3, percentage: 30 },
    { word: "apple", count: 5, percentage: 50 },
    { word: "cherry", count: 2, percentage: 20 },
  ];

  it("should sort by frequency descending", () => {
    const sorted = sortWordEntries(entries, "frequency");
    expect(sorted[0]!.word).toBe("apple");
    expect(sorted[1]!.word).toBe("banana");
    expect(sorted[2]!.word).toBe("cherry");
  });

  it("should sort by word alphabetically", () => {
    const sorted = sortWordEntries(entries, "word");
    expect(sorted[0]!.word).toBe("apple");
    expect(sorted[1]!.word).toBe("banana");
    expect(sorted[2]!.word).toBe("cherry");
  });

  it("should not mutate the original array", () => {
    const original = [...entries];
    sortWordEntries(entries, "frequency");
    expect(entries).toEqual(original);
  });

  it("should handle empty array", () => {
    expect(sortWordEntries([], "frequency")).toEqual([]);
    expect(sortWordEntries([], "word")).toEqual([]);
  });

  it("should sort ties in frequency by word alphabetically", () => {
    const tied = [
      { word: "zebra", count: 3, percentage: 50 },
      { word: "apple", count: 3, percentage: 50 },
    ];
    const sorted = sortWordEntries(tied, "frequency");
    expect(sorted[0]!.word).toBe("apple");
    expect(sorted[1]!.word).toBe("zebra");
  });
});

describe("wordEntriesToCsv", () => {
  it("should generate CSV with BOM and header", () => {
    const entries = [{ word: "hello", count: 5, percentage: 50 }];
    const csv = wordEntriesToCsv(entries);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("単語,出現回数,割合(%)");
    expect(csv).toContain('"hello",5,50.00');
  });

  it("should escape double quotes in words", () => {
    const entries = [{ word: 'say "hello"', count: 1, percentage: 100 }];
    const csv = wordEntriesToCsv(entries);
    expect(csv).toContain('"say ""hello"""');
  });

  it("should handle empty entries", () => {
    const csv = wordEntriesToCsv([]);
    expect(csv).toContain("単語,出現回数,割合(%)");
    const lines = csv.replace("\uFEFF", "").split("\n");
    expect(lines).toHaveLength(1);
  });

  it("should format percentage to 2 decimal places", () => {
    const entries = [{ word: "test", count: 1, percentage: 33.3333 }];
    const csv = wordEntriesToCsv(entries);
    expect(csv).toContain("33.33");
  });
});
