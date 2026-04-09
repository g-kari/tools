import { describe, it, expect } from "vite-plus/test";
import {
  REGEX_LIBRARY,
  filterRegexEntries,
  getCategoryLabel,
  getCategoryClass,
  safeCreateRegex,
  testRegex,
  type RegexCategory,
} from "../../app/utils/regex-library";

describe("REGEX_LIBRARY", () => {
  it("should be a non-empty array", () => {
    expect(REGEX_LIBRARY.length).toBeGreaterThan(0);
  });

  it("should have unique IDs", () => {
    const ids = REGEX_LIBRARY.map((e) => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("should have valid regex patterns", () => {
    for (const entry of REGEX_LIBRARY) {
      expect(() => new RegExp(entry.pattern, entry.flags)).not.toThrow();
    }
  });

  it("should have required fields", () => {
    for (const entry of REGEX_LIBRARY) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.pattern).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(Array.isArray(entry.examples.match)).toBe(true);
      expect(Array.isArray(entry.examples.noMatch)).toBe(true);
      expect(entry.examples.match.length).toBeGreaterThan(0);
      expect(entry.examples.noMatch.length).toBeGreaterThan(0);
    }
  });

  it("match examples should actually match the pattern", () => {
    for (const entry of REGEX_LIBRARY) {
      // gフラグは除外してテスト（全体マッチが目的のため）
      const flags = entry.flags.replace("g", "");
      const re = new RegExp(entry.pattern, flags);
      for (const ex of entry.examples.match) {
        expect(
          re.test(ex),
          `entry ${entry.id}: "${ex}" should match /${entry.pattern}/${flags}`,
        ).toBe(true);
      }
    }
  });

  it("noMatch examples should not match the pattern", () => {
    for (const entry of REGEX_LIBRARY) {
      const flags = entry.flags.replace("g", "");
      const re = new RegExp(entry.pattern, flags);
      for (const ex of entry.examples.noMatch) {
        expect(
          re.test(ex),
          `entry ${entry.id}: "${ex}" should NOT match /${entry.pattern}/${flags}`,
        ).toBe(false);
      }
    }
  });
});

describe("getCategoryLabel", () => {
  it('should return "すべて" for "all"', () => {
    expect(getCategoryLabel("all")).toBe("すべて");
  });

  it("should return Japanese labels for each category", () => {
    const categories: Array<RegexCategory | "all"> = [
      "all",
      "email",
      "url",
      "network",
      "datetime",
      "phone",
      "password",
      "code",
      "japanese",
      "text",
      "finance",
    ];
    for (const cat of categories) {
      const label = getCategoryLabel(cat);
      expect(label).toBeTruthy();
      expect(typeof label).toBe("string");
    }
  });
});

describe("getCategoryClass", () => {
  it("should return a string starting with regex-lib-cat-", () => {
    const categories: RegexCategory[] = [
      "email",
      "url",
      "network",
      "datetime",
      "phone",
      "password",
      "code",
      "japanese",
      "text",
      "finance",
    ];
    for (const cat of categories) {
      expect(getCategoryClass(cat)).toBe(`regex-lib-cat-${cat}`);
    }
  });
});

describe("filterRegexEntries", () => {
  it('should return all entries when query is empty and category is "all"', () => {
    const result = filterRegexEntries(REGEX_LIBRARY, "", "all");
    expect(result.length).toBe(REGEX_LIBRARY.length);
  });

  it("should filter by category", () => {
    const result = filterRegexEntries(REGEX_LIBRARY, "", "email");
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      expect(entry.category).toBe("email");
    }
  });

  it("should filter by query (name)", () => {
    const result = filterRegexEntries(REGEX_LIBRARY, "メール", "all");
    expect(result.length).toBeGreaterThan(0);
    for (const entry of result) {
      const lq = "メール".toLowerCase();
      const nameMatch = entry.name.toLowerCase().includes(lq);
      const descMatch = entry.description.toLowerCase().includes(lq);
      const patternMatch = entry.pattern.toLowerCase().includes(lq);
      const idMatch = entry.id.toLowerCase().includes(lq);
      expect(nameMatch || descMatch || patternMatch || idMatch).toBe(true);
    }
  });

  it("should filter by query (pattern)", () => {
    const result = filterRegexEntries(REGEX_LIBRARY, "uuid", "all");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return empty array when no match", () => {
    const result = filterRegexEntries(REGEX_LIBRARY, "xxxxxxxxnonexistent", "all");
    expect(result.length).toBe(0);
  });

  it("should be case-insensitive in query matching", () => {
    const lower = filterRegexEntries(REGEX_LIBRARY, "email", "all");
    const upper = filterRegexEntries(REGEX_LIBRARY, "EMAIL", "all");
    expect(lower.length).toBe(upper.length);
  });
});

describe("safeCreateRegex", () => {
  it("should create a valid RegExp", () => {
    const re = safeCreateRegex("^\\d+$", "");
    expect(re).toBeInstanceOf(RegExp);
  });

  it("should return null for invalid pattern", () => {
    const re = safeCreateRegex("[invalid", "");
    expect(re).toBeNull();
  });

  it("should apply flags correctly", () => {
    const re = safeCreateRegex("hello", "i");
    expect(re).not.toBeNull();
    expect(re!.test("HELLO")).toBe(true);
  });
});

describe("testRegex", () => {
  it("should return true when pattern matches", () => {
    expect(testRegex("^\\d+$", "", "12345")).toBe(true);
  });

  it("should return false when pattern does not match", () => {
    expect(testRegex("^\\d+$", "", "abc")).toBe(false);
  });

  it("should return null for invalid pattern", () => {
    expect(testRegex("[invalid", "", "test")).toBeNull();
  });

  it("should be case-insensitive with i flag", () => {
    expect(testRegex("^hello$", "i", "HELLO")).toBe(true);
  });

  it("should handle email pattern", () => {
    const emailPattern = "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}";
    expect(testRegex(emailPattern, "i", "user@example.com")).toBe(true);
    expect(testRegex(emailPattern, "i", "invalid-email")).toBe(false);
  });

  it("should handle IPv4 pattern", () => {
    const ipv4Pattern =
      "^(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$";
    expect(testRegex(ipv4Pattern, "", "192.168.1.1")).toBe(true);
    expect(testRegex(ipv4Pattern, "", "256.0.0.1")).toBe(false);
  });
});
