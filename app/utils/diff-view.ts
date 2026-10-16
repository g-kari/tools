/** A compared line; the comparison algorithm supplies its original, unmodified value. */
export interface DiffViewLine {
  type: "added" | "removed" | "unchanged";
  value: string;
}

/** A result line with one-based positions in the corresponding original inputs. */
export interface NumberedDiffLine extends DiffViewLine {
  index: number;
  oldLine: number | null;
  newLine: number | null;
}

/** Contiguous visible lines or a separately expandable unchanged block. */
export interface DiffViewBlock {
  type: "lines" | "gap";
  lines: NumberedDiffLine[];
}

/**
 * Add input line numbers and optionally omit unchanged runs outside three context
 * lines on either side of a change. Numbering always uses the complete result.
 * Nearby contexts are combined; an all-unchanged result is never folded.
 * This only changes the presentation and does not mutate the input or its values.
 */
export function createDiffView(
  result: readonly DiffViewLine[],
  contextOnly: boolean,
): DiffViewBlock[] {
  let oldLine = 0;
  let newLine = 0;
  const lines = result.map((line, index) => ({
    ...line,
    index,
    oldLine: line.type === "added" ? null : ++oldLine,
    newLine: line.type === "removed" ? null : ++newLine,
  }));
  if (lines.length === 0) return [];
  if (!contextOnly || lines.every((line) => line.type === "unchanged")) {
    return [{ type: "lines", lines }];
  }

  const blocks: DiffViewBlock[] = [];
  function appendVisible(visible: NumberedDiffLine[]) {
    if (visible.length === 0) return;
    const last = blocks[blocks.length - 1];
    if (last?.type === "lines") last.lines.push(...visible);
    else blocks.push({ type: "lines", lines: visible });
  }

  for (let start = 0; start < lines.length; ) {
    if (lines[start].type !== "unchanged") {
      appendVisible([lines[start]]);
      start++;
      continue;
    }
    let end = start;
    while (end < lines.length && lines[end].type === "unchanged") end++;
    const before = start > 0 ? Math.min(3, end - start) : 0;
    const after = end < lines.length ? Math.min(3, end - start) : 0;
    if (before + after >= end - start) {
      appendVisible(lines.slice(start, end));
    } else {
      appendVisible(lines.slice(start, start + before));
      blocks.push({ type: "gap", lines: lines.slice(start + before, end - after) });
      appendVisible(lines.slice(end - after, end));
    }
    start = end;
  }
  return blocks;
}
