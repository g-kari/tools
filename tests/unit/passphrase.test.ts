import { describe, it, expect } from "vite-plus/test";
import {
  generatePassphrase,
  calculatePassphraseEntropy,
  getEntropyStrength,
  estimateCrackTime,
  WORD_LIST,
  SEPARATOR_OPTIONS,
  type PassphraseOptions,
} from "../../app/utils/passphrase";

describe("WORD_LIST", () => {
  it("should contain at least 100 words", () => {
    expect(WORD_LIST.length).toBeGreaterThanOrEqual(100);
  });

  it("should contain unique words only", () => {
    const unique = new Set(WORD_LIST);
    expect(unique.size).toBe(WORD_LIST.length);
  });

  it("should contain only lowercase words by default", () => {
    for (const word of WORD_LIST) {
      expect(word).toBe(word.toLowerCase());
    }
  });
});

describe("SEPARATOR_OPTIONS", () => {
  it("should contain at least 3 options", () => {
    expect(SEPARATOR_OPTIONS.length).toBeGreaterThanOrEqual(3);
  });
});

describe("generatePassphrase", () => {
  const baseOptions: PassphraseOptions = {
    wordCount: 4,
    separator: "-",
    capitalize: false,
    addNumber: false,
    addSymbol: false,
  };

  it("should generate a passphrase with the correct word count", () => {
    const result = generatePassphrase(baseOptions);
    const parts = result.split("-");
    expect(parts).toHaveLength(4);
  });

  it("should use words from the WORD_LIST", () => {
    const result = generatePassphrase(baseOptions);
    const parts = result.split("-");
    for (const word of parts) {
      expect(WORD_LIST).toContain(word);
    }
  });

  it("should respect different word counts", () => {
    for (const count of [3, 4, 5, 6, 7, 8]) {
      const result = generatePassphrase({ ...baseOptions, wordCount: count });
      expect(result.split("-")).toHaveLength(count);
    }
  });

  it("should use the specified separator", () => {
    for (const sep of ["-", " ", "_", "."]) {
      const result = generatePassphrase({ ...baseOptions, separator: sep });
      const parts = result.split(sep);
      expect(parts).toHaveLength(4);
    }
  });

  it("should join words without separator when separator is empty string", () => {
    const result = generatePassphrase({ ...baseOptions, separator: "" });
    // No separator means each word should be present, but no dashes
    expect(result).not.toContain("-");
  });

  it("should capitalize first letter of each word when capitalize is true", () => {
    const result = generatePassphrase({ ...baseOptions, capitalize: true });
    const parts = result.split("-");
    for (const part of parts) {
      expect(part.charAt(0)).toBe(part.charAt(0).toUpperCase());
    }
  });

  it("should append a 2-digit number when addNumber is true", () => {
    const result = generatePassphrase({ ...baseOptions, addNumber: true });
    // Last 2 chars should be digits
    const last2 = result.slice(-2);
    expect(/^\d{2}$/.test(last2)).toBe(true);
  });

  it("should append a symbol when addSymbol is true", () => {
    const result = generatePassphrase({ ...baseOptions, addSymbol: true });
    const lastChar = result.slice(-1);
    expect("!@#$%^&*").toContain(lastChar);
  });

  it("should generate different results on repeated calls", () => {
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(generatePassphrase(baseOptions));
    }
    // With 4 words from hundreds, should almost certainly get at least 2 unique results
    expect(results.size).toBeGreaterThan(1);
  });
});

describe("calculatePassphraseEntropy", () => {
  it("should return positive entropy", () => {
    const entropy = calculatePassphraseEntropy({
      wordCount: 5,
      separator: "-",
      capitalize: false,
      addNumber: false,
      addSymbol: false,
    });
    expect(entropy).toBeGreaterThan(0);
  });

  it("should increase entropy with more words", () => {
    const base: PassphraseOptions = {
      wordCount: 4,
      separator: "-",
      capitalize: false,
      addNumber: false,
      addSymbol: false,
    };
    const e4 = calculatePassphraseEntropy(base);
    const e5 = calculatePassphraseEntropy({ ...base, wordCount: 5 });
    expect(e5).toBeGreaterThan(e4);
  });

  it("should add entropy for number option", () => {
    const base: PassphraseOptions = {
      wordCount: 5,
      separator: "-",
      capitalize: false,
      addNumber: false,
      addSymbol: false,
    };
    const withoutNum = calculatePassphraseEntropy(base);
    const withNum = calculatePassphraseEntropy({ ...base, addNumber: true });
    expect(withNum).toBeGreaterThan(withoutNum);
  });

  it("should add entropy for symbol option", () => {
    const base: PassphraseOptions = {
      wordCount: 5,
      separator: "-",
      capitalize: false,
      addNumber: false,
      addSymbol: false,
    };
    const withoutSym = calculatePassphraseEntropy(base);
    const withSym = calculatePassphraseEntropy({ ...base, addSymbol: true });
    expect(withSym).toBeGreaterThan(withoutSym);
  });
});

describe("getEntropyStrength", () => {
  it("should return score 1 for very low entropy", () => {
    expect(getEntropyStrength(10).score).toBe(1);
  });

  it("should return score 5 for very high entropy", () => {
    expect(getEntropyStrength(100).score).toBe(5);
  });

  it("should return increasing scores for increasing entropy", () => {
    const scores = [10, 30, 45, 65, 80].map((e) => getEntropyStrength(e).score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
  });
});

describe("estimateCrackTime", () => {
  it("should return a non-empty string", () => {
    expect(estimateCrackTime(40)).toBeTruthy();
  });

  it("should return short time for low entropy", () => {
    const result = estimateCrackTime(0);
    expect(result).toBe("1秒未満");
  });

  it("should return very long time for high entropy", () => {
    const result = estimateCrackTime(200);
    expect(result).toContain("年");
  });
});
