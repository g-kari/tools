// Common HTML utility functions

// Named HTML entities mapping
const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": "\u00A0",
  "&copy;": "\u00A9",
  "&reg;": "\u00AE",
  "&trade;": "\u2122",
  "&mdash;": "\u2014",
  "&ndash;": "\u2013",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&ldquo;": "\u201C",
  "&rdquo;": "\u201D",
  "&hellip;": "\u2026",
  "&bull;": "\u2022",
  "&middot;": "\u00B7",
  "&cent;": "\u00A2",
  "&pound;": "\u00A3",
  "&yen;": "\u00A5",
  "&euro;": "\u20AC",
  "&sect;": "\u00A7",
  "&deg;": "\u00B0",
  "&plusmn;": "\u00B1",
  "&times;": "\u00D7",
  "&divide;": "\u00F7",
  "&frac12;": "\u00BD",
  "&frac14;": "\u00BC",
  "&frac34;": "\u00BE",
};

/**
 * Decode HTML entities in a string
 * Supports named entities, decimal numeric references, and hexadecimal numeric references
 */
export function decodeHtmlEntities(text: string): string {
  // First, replace named entities
  let result = text;
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    result = result.replace(new RegExp(entity, "gi"), char);
  }

  // Replace legacy numeric entities
  result = result
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/");

  // Replace decimal numeric references (&#123;)
  result = result.replace(/&#(\d+);/g, (_, num) =>
    String.fromCharCode(parseInt(num, 10))
  );

  // Replace hexadecimal numeric references (&#x1A;)
  result = result.replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  return result;
}
