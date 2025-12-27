/**
 * Unicode escape conversion utilities
 */

/**
 * Convert text to Unicode escape sequences
 * @param text - The text to convert
 * @returns Unicode escaped string
 */
export function toUnicodeEscape(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i);
    if (cp === undefined) break;

    if (cp > 0xffff) {
      const high = ((cp - 0x10000) >> 10) + 0xd800;
      const low = ((cp - 0x10000) & 0x3ff) + 0xdc00;
      result += "\\u" + high.toString(16).padStart(4, "0");
      result += "\\u" + low.toString(16).padStart(4, "0");
      i += 2;
    } else if (cp > 127) {
      result += "\\u" + cp.toString(16).padStart(4, "0");
      i += 1;
    } else {
      result += text[i];
      i += 1;
    }
  }
  return result;
}

/**
 * Convert Unicode escape sequences back to text
 * @param text - The text containing Unicode escapes
 * @returns Decoded string
 */
export function fromUnicodeEscape(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );
}
