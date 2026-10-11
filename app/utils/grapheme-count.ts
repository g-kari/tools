/**
 * Count extended grapheme clusters without normalizing or changing the input.
 * Spaces and line breaks are included; CRLF is one grapheme cluster.
 * Returns null when native segmentation is unavailable or fails, rather than
 * substituting a code-point count that would mislabel compound emoji.
 */
export function countGraphemes(text: string): number | null {
  try {
    if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") return null;
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    let count = 0;
    for (const _segment of segmenter.segment(text)) count++;
    return count;
  } catch {
    return null;
  }
}
