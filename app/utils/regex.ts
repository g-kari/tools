/**
 * Regular expression testing utilities
 */

export interface RegexTestResult {
  matches: number;
  error: string | null;
}

/**
 * Test a regex pattern against a string
 * @param pattern - The regex pattern
 * @param flags - Regex flags (g, i, m, etc.)
 * @param testString - The string to test against
 * @returns Object containing match count and any error
 */
export function testRegexPattern(
  pattern: string,
  flags: string,
  testString: string
): RegexTestResult {
  try {
    const regex = new RegExp(pattern, flags);
    let matchCount = 0;

    if (flags.includes("g")) {
      let match;
      while ((match = regex.exec(testString)) !== null) {
        matchCount++;
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
      }
    } else {
      const match = regex.exec(testString);
      if (match) matchCount = 1;
    }

    return { matches: matchCount, error: null };
  } catch (err) {
    return {
      matches: 0,
      error: err instanceof Error ? err.message : "Invalid regex",
    };
  }
}
