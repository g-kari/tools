/**
 * Validate with the native JSON grammar, then keep the original lexical tokens.
 * Never serialize the parsed value: doing so rounds numbers, drops duplicate
 * members, reorders integer-like keys, and changes string escapes.
 */
function jsonTokens(text: string): string[] {
  JSON.parse(text);
  return text.match(/"(?:[^"\\]|\\.)*"|[^\s{}[\],:]+|[{}[\],:]/g) ?? [];
}

/**
 * Format JSON by changing whitespace outside strings only.
 * @param text - Strict JSON text; all original tokens are preserved
 * @param indent - Spaces per level, truncated and clamped to 0–10 (default: 2)
 * @throws {SyntaxError} If the input is not valid JSON
 */
export function formatJson(text: string, indent: number = 2): string {
  const tokens = jsonTokens(text);
  // Match native spacing (including engine-specific fractional behavior),
  // serializing only a constant sample, never the parsed user data.
  const spacing = JSON.stringify([0], null, indent).split("\n");
  if (spacing.length === 1) return tokens.join("");
  const unit = spacing[1].slice(0, -1);

  const output: string[] = [];
  let depth = 0;
  const newline = () => output.push("\n", unit.repeat(depth));

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "{" || token === "[") {
      output.push(token);
      const closing = token === "{" ? "}" : "]";
      if (tokens[i + 1] !== closing) {
        depth++;
        newline();
      }
    } else if (token === "}" || token === "]") {
      const opening = token === "}" ? "{" : "[";
      if (tokens[i - 1] !== opening) {
        depth--;
        newline();
      }
      output.push(token);
    } else if (token === ",") {
      output.push(token);
      newline();
    } else if (token === ":") {
      output.push(": ");
    } else {
      output.push(token);
    }
  }

  return output.join("");
}

/**
 * Remove JSON whitespace outside strings without changing original tokens.
 * @throws {SyntaxError} If the input is not valid JSON
 */
export function minifyJson(text: string): string {
  return jsonTokens(text).join("");
}
