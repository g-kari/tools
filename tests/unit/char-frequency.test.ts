import { describe, it, expect } from "vite-plus/test";
import { analyzeCharFrequency, sortEntries, entriesToCsv } from "../../app/routes/char-frequency";
import type { CharFrequencyOptions } from "../../app/routes/char-frequency";

const defaultOptions: CharFrequencyOptions = {
  ignoreCase: false,
  ignoreSpaces: false,
  lettersAndNumbersOnly: false,
};

describe("analyzeCharFrequency", () => {
  describe("empty input", () => {
    it("should return empty result for empty string", () => {
      const result = analyzeCharFrequency("", defaultOptions);
      expect(result.entries).toHaveLength(0);
      expect(result.totalChars).toBe(0);
      expect(result.uniqueChars).toBe(0);
    });
  });

  describe("basic counting", () => {
    it("should count single character correctly", () => {
      const result = analyzeCharFrequency("a", defaultOptions);
      expect(result.totalChars).toBe(1);
      expect(result.uniqueChars).toBe(1);
      const entry = result.entries.find((e) => e.char === "a");
      expect(entry?.count).toBe(1);
      expect(entry?.percentage).toBeCloseTo(100);
    });

    it("should count repeated characters correctly", () => {
      const result = analyzeCharFrequency("aabbc", defaultOptions);
      expect(result.totalChars).toBe(5);
      expect(result.uniqueChars).toBe(3);
      const a = result.entries.find((e) => e.char === "a");
      expect(a?.count).toBe(2);
      expect(a?.percentage).toBeCloseTo(40);
      const c = result.entries.find((e) => e.char === "c");
      expect(c?.count).toBe(1);
      expect(c?.percentage).toBeCloseTo(20);
    });

    it("should count Japanese characters", () => {
      const result = analyzeCharFrequency("ああい", defaultOptions);
      expect(result.totalChars).toBe(3);
      expect(result.uniqueChars).toBe(2);
      const a = result.entries.find((e) => e.char === "あ");
      expect(a?.count).toBe(2);
    });

    it("should count spaces by default", () => {
      const result = analyzeCharFrequency("a b", defaultOptions);
      expect(result.totalChars).toBe(3);
      expect(result.uniqueChars).toBe(3);
      const space = result.entries.find((e) => e.char === " ");
      expect(space?.count).toBe(1);
    });
  });

  describe("ignoreCase option", () => {
    it("should treat A and a as the same character when ignoreCase is true", () => {
      const result = analyzeCharFrequency("AaBb", {
        ...defaultOptions,
        ignoreCase: true,
      });
      expect(result.uniqueChars).toBe(2);
      const a = result.entries.find((e) => e.char === "a");
      expect(a?.count).toBe(2);
      const b = result.entries.find((e) => e.char === "b");
      expect(b?.count).toBe(2);
    });

    it("should distinguish A and a when ignoreCase is false", () => {
      const result = analyzeCharFrequency("Aa", {
        ...defaultOptions,
        ignoreCase: false,
      });
      expect(result.uniqueChars).toBe(2);
    });
  });

  describe("ignoreSpaces option", () => {
    it("should exclude spaces when ignoreSpaces is true", () => {
      const result = analyzeCharFrequency("a b", {
        ...defaultOptions,
        ignoreSpaces: true,
      });
      expect(result.totalChars).toBe(2);
      const space = result.entries.find((e) => e.char === " ");
      expect(space).toBeUndefined();
    });

    it("should exclude tabs and newlines when ignoreSpaces is true", () => {
      const result = analyzeCharFrequency("a\t\nb", {
        ...defaultOptions,
        ignoreSpaces: true,
      });
      expect(result.totalChars).toBe(2);
    });
  });

  describe("lettersAndNumbersOnly option", () => {
    it("should exclude symbols when lettersAndNumbersOnly is true", () => {
      const result = analyzeCharFrequency("a!b@", {
        ...defaultOptions,
        lettersAndNumbersOnly: true,
      });
      expect(result.totalChars).toBe(2);
      const exclaim = result.entries.find((e) => e.char === "!");
      expect(exclaim).toBeUndefined();
    });

    it("should include numbers when lettersAndNumbersOnly is true", () => {
      const result = analyzeCharFrequency("a1b2", {
        ...defaultOptions,
        lettersAndNumbersOnly: true,
      });
      expect(result.totalChars).toBe(4);
    });
  });

  describe("percentage calculation", () => {
    it("should calculate percentage correctly", () => {
      const result = analyzeCharFrequency("ab", defaultOptions);
      const a = result.entries.find((e) => e.char === "a");
      expect(a?.percentage).toBeCloseTo(50);
    });

    it("should have percentages summing to 100", () => {
      const result = analyzeCharFrequency("aabb", defaultOptions);
      const total = result.entries.reduce((sum, e) => sum + e.percentage, 0);
      expect(total).toBeCloseTo(100);
    });
  });
});

describe("sortEntries", () => {
  const entries = [
    { char: "b", count: 3, percentage: 30 },
    { char: "a", count: 5, percentage: 50 },
    { char: "c", count: 2, percentage: 20 },
  ];

  it("should sort by frequency descending", () => {
    const sorted = sortEntries(entries, "frequency");
    expect(sorted[0].char).toBe("a");
    expect(sorted[1].char).toBe("b");
    expect(sorted[2].char).toBe("c");
  });

  it("should sort by character code ascending", () => {
    const sorted = sortEntries(entries, "char");
    expect(sorted[0].char).toBe("a");
    expect(sorted[1].char).toBe("b");
    expect(sorted[2].char).toBe("c");
  });

  it("should not mutate the original array", () => {
    const original = [...entries];
    sortEntries(entries, "frequency");
    expect(entries).toEqual(original);
  });

  it("should sort ties in frequency by character code", () => {
    const tied = [
      { char: "c", count: 2, percentage: 50 },
      { char: "a", count: 2, percentage: 50 },
    ];
    const sorted = sortEntries(tied, "frequency");
    expect(sorted[0].char).toBe("a");
    expect(sorted[1].char).toBe("c");
  });
});

describe("entriesToCsv", () => {
  it("should return BOM-prefixed CSV", () => {
    const entries = [{ char: "a", count: 3, percentage: 100 }];
    const csv = entriesToCsv(entries);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("should include header row", () => {
    const csv = entriesToCsv([]);
    expect(csv).toContain("文字,出現回数,割合(%)");
  });

  it("should include entry data", () => {
    const entries = [{ char: "a", count: 5, percentage: 50.0 }];
    const csv = entriesToCsv(entries);
    expect(csv).toContain('"a",5,50.00');
  });

  it("should escape double quotes in character", () => {
    const entries = [{ char: '"', count: 1, percentage: 100.0 }];
    const csv = entriesToCsv(entries);
    expect(csv).toContain('""');
  });

  it("should produce correct row count", () => {
    const entries = [
      { char: "a", count: 3, percentage: 60 },
      { char: "b", count: 2, percentage: 40 },
    ];
    const csv = entriesToCsv(entries);
    const lines = csv.split("\n");
    // BOM + header + 2 data rows = 3 lines
    expect(lines).toHaveLength(3);
  });
});
