import { describe, expect, it } from "vite-plus/test";
import { createDiffView, type DiffViewLine } from "../../app/utils/diff-view";

const line = (value: string, type: DiffViewLine["type"] = "unchanged"): DiffViewLine => ({
  type,
  value,
});
const unchanged = (count: number, prefix = "same") =>
  Array.from({ length: count }, (_, i) => line(`${prefix}-${i}`));

describe("createDiffView", () => {
  it("numbers both original inputs independently and preserves whitespace", () => {
    const result = [
      line("", "added"),
      line("old", "removed"),
      line("  日本語\t"),
      line("", "removed"),
    ];
    expect(createDiffView(result, false)).toEqual([
      {
        type: "lines",
        lines: [
          { ...result[0], index: 0, oldLine: null, newLine: 1 },
          { ...result[1], index: 1, oldLine: 1, newLine: null },
          { ...result[2], index: 2, oldLine: 2, newLine: 2 },
          { ...result[3], index: 3, oldLine: 3, newLine: null },
        ],
      },
    ]);
  });

  it("returns no blocks for an empty result and never folds unchanged-only text", () => {
    expect(createDiffView([], true)).toEqual([]);
    expect(createDiffView(unchanged(40), true)).toEqual(createDiffView(unchanged(40), false));
  });

  it.each([0, 1, 2, 3, 4, 5, 6])(
    "combines overlapping or touching contexts across %i unchanged lines",
    (count) => {
      const result = [line("start", "removed"), ...unchanged(count), line("end", "added")];
      expect(createDiffView(result, true)).toEqual(createDiffView(result, false));
    },
  );

  it("omits the middle between two contexts only once", () => {
    const result = [line("start", "removed"), ...unchanged(12), line("end", "added")];
    const blocks = createDiffView(result, true);
    expect(blocks.map((b) => [b.type, b.lines.map((l) => l.index)])).toEqual([
      ["lines", [0, 1, 2, 3]],
      ["gap", [4, 5, 6, 7, 8, 9]],
      ["lines", [10, 11, 12, 13]],
    ]);
  });

  it("keeps exactly three context lines at the beginning and end boundaries", () => {
    const result = [...unchanged(8, "before"), line("change", "added"), ...unchanged(9, "after")];
    expect(createDiffView(result, true).map((b) => [b.type, b.lines.length])).toEqual([
      ["gap", 5],
      ["lines", 7],
      ["gap", 6],
    ]);
  });

  it("never folds additions or deletions, including one empty input side", () => {
    for (const type of ["added", "removed"] as const) {
      const result = unchanged(20).map((l) => ({ ...l, type }));
      expect(createDiffView(result, true)).toEqual(createDiffView(result, false));
    }
  });

  it("does not mutate frozen comparison results", () => {
    const result = Object.freeze(
      [...unchanged(15), line("change", "added")].map((entry) => Object.freeze(entry)),
    );
    const before = JSON.stringify(result);
    createDiffView(result, true);
    createDiffView(result, false);
    expect(JSON.stringify(result)).toBe(before);
  });

  it("partitions each synthetic result exactly once and folds only distant unchanged lines", () => {
    let seed = 123456789;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed;
    };
    for (let n = 0; n < 500; n++) {
      const result = Array.from({ length: random() % 160 }, (_, i) =>
        line(`line-${i}`, random() % 10 < 8 ? "unchanged" : random() % 2 ? "added" : "removed"),
      );
      const blocks = createDiffView(result, true);
      const numbered = createDiffView(result, false).flatMap((b) => b.lines);
      expect(blocks.flatMap((b) => b.lines)).toEqual(numbered);
      for (const block of blocks) {
        if (block.type === "gap") {
          expect(block.lines.length).toBeGreaterThan(0);
          for (const entry of block.lines) {
            expect(entry.type).toBe("unchanged");
            const nearestChange = numbered
              .filter((l) => l.type !== "unchanged")
              .some((l) => Math.abs(l.index - entry.index) <= 3);
            expect(nearestChange).toBe(false);
          }
        }
      }
    }
  });
});
