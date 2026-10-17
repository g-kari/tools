import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { countGraphemes } from "../../app/utils/grapheme-count";
import { countChars, countBytes, countWords } from "../../app/routes/char-count";
import { analyzeText } from "../../app/utils/text-stats";

afterEach(() => vi.unstubAllGlobals());

describe("extended grapheme counts", () => {
  it.each([
    ["", 0, 0],
    ["Hello world", 11, 11],
    ["こんにちは", 5, 5],
    ["👍🎉🚀", 3, 3],
    ["👨‍👩‍👧‍👦", 1, 7],
    ["👍🏽", 1, 2],
    ["🇯🇵", 1, 2],
    ["か\u3099", 1, 2],
    ["が", 1, 1],
    ["e\u0301", 1, 2],
    ["é", 1, 1],
    ["1️⃣", 1, 3],
    ["✈️", 1, 2],
    [" a\tb\nc ", 7, 7],
    ["a\r\nb", 3, 4],
    ["👨‍👩‍👧‍👦 🇯🇵 か\u3099 e\u0301", 7, 16],
  ])("counts %j as %i graphemes, preserving %i code points", (text, graphemes, codePoints) => {
    expect(countGraphemes(text)).toBe(graphemes);
    expect(countChars(text)).toBe(codePoints);
    expect(analyzeText(text).charCount).toBe(codePoints);
  });

  it("does not normalize input, change bytes, or change whitespace word semantics", () => {
    const text = "か\u3099 e\u0301 👨‍👩‍👧‍👦";
    const original = text;
    const stats = analyzeText(text);
    const bytes = countBytes(text);
    expect(countGraphemes(text)).toBe(5);
    expect(text).toBe(original);
    expect(countBytes(text)).toBe(bytes);
    expect(countBytes("か\u3099")).toBe(6);
    expect(countBytes("が")).toBe(3);
    expect(analyzeText(text)).toEqual(stats);
    expect(countWords("こんにちは世界")).toBe(1);
  });

  it("counts a bounded sequence without materializing a segment array", () => {
    expect(countGraphemes("👍🏽".repeat(1000))).toBe(1000);
  });

  it("reports unsupported when Intl is missing, including empty input", () => {
    vi.stubGlobal("Intl", undefined);
    expect(countGraphemes("👨‍👩‍👧‍👦")).toBeNull();
    expect(countGraphemes("")).toBeNull();
  });

  it("reports unsupported when Segmenter is missing", () => {
    vi.stubGlobal("Intl", { Segmenter: undefined });
    expect(countGraphemes("👨‍👩‍👧‍👦")).toBeNull();
  });

  it("reports unavailable segmentation if the constructor property cannot be read", () => {
    vi.stubGlobal("Intl", {
      get Segmenter() {
        throw new Error("segmentation unavailable");
      },
    });
    expect(countGraphemes("e\u0301")).toBeNull();
  });

  it("reports unavailable segmentation rather than falling back after a constructor error", () => {
    vi.stubGlobal("Intl", {
      Segmenter: class {
        constructor() {
          throw new Error("segmentation unavailable");
        }
      },
    });
    expect(countGraphemes("e\u0301")).toBeNull();
  });

  it("does not publish a partial count after iteration fails", () => {
    vi.stubGlobal("Intl", {
      Segmenter: class {
        *segment() {
          yield { segment: "a" };
          throw new Error("segmentation interrupted");
        }
      },
    });
    expect(countGraphemes("abc")).toBeNull();
  });
});
