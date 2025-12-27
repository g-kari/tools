/**
 * Formats JSON string with indentation for readability.
 * @param text - The JSON string to format
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 * @throws {SyntaxError} If the input is not valid JSON
 */
export function formatJson(text: string, indent: number = 2): string {
  const parsed = JSON.parse(text);
  return JSON.stringify(parsed, null, indent);
}

/**
 * Minifies JSON string by removing all whitespace.
 * @param text - The JSON string to minify
 * @returns Minified JSON string
 * @throws {SyntaxError} If the input is not valid JSON
 */
export function minifyJson(text: string): string {
  const parsed = JSON.parse(text);
  return JSON.stringify(parsed);
}
