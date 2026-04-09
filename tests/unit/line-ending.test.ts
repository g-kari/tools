import { describe, it, expect } from "vite-plus/test";
import {
  detectLineEnding,
  convertLineEnding,
  LINE_ENDING_LABELS,
  LINE_ENDING_SHORT,
} from "../../app/utils/line-ending";

describe("detectLineEnding", () => {
  it("空文字列は None を返す", () => {
    const result = detectLineEnding("");
    expect(result.type).toBe("None");
    expect(result.crlfCount).toBe(0);
    expect(result.lfCount).toBe(0);
    expect(result.crCount).toBe(0);
    expect(result.lineCount).toBe(0);
  });

  it("改行なしテキストは None を返す", () => {
    const result = detectLineEnding("hello world");
    expect(result.type).toBe("None");
    expect(result.lineCount).toBe(1);
  });

  it("LF のみのテキストを検出できる", () => {
    const result = detectLineEnding("line1\nline2\nline3");
    expect(result.type).toBe("LF");
    expect(result.lfCount).toBe(2);
    expect(result.crlfCount).toBe(0);
    expect(result.crCount).toBe(0);
    expect(result.lineCount).toBe(3);
  });

  it("CRLF のみのテキストを検出できる", () => {
    const result = detectLineEnding("line1\r\nline2\r\nline3");
    expect(result.type).toBe("CRLF");
    expect(result.crlfCount).toBe(2);
    expect(result.lfCount).toBe(0);
    expect(result.crCount).toBe(0);
    expect(result.lineCount).toBe(3);
  });

  it("CR のみのテキストを検出できる", () => {
    const result = detectLineEnding("line1\rline2\rline3");
    expect(result.type).toBe("CR");
    expect(result.crCount).toBe(2);
    expect(result.crlfCount).toBe(0);
    expect(result.lfCount).toBe(0);
    expect(result.lineCount).toBe(3);
  });

  it("CRLF と LF が混在する場合は Mixed を返す", () => {
    const result = detectLineEnding("line1\r\nline2\nline3");
    expect(result.type).toBe("Mixed");
  });

  it("LF と CR が混在する場合は Mixed を返す", () => {
    const result = detectLineEnding("line1\nline2\rline3");
    expect(result.type).toBe("Mixed");
  });

  it("CRLF・LF・CR すべて混在する場合は Mixed を返す", () => {
    const result = detectLineEnding("a\r\nb\nc\rd");
    expect(result.type).toBe("Mixed");
    expect(result.crlfCount).toBe(1);
    expect(result.lfCount).toBe(1);
    expect(result.crCount).toBe(1);
  });

  it("CRLF の個数を正しく数える（LF 単独と混同しない）", () => {
    const result = detectLineEnding("a\r\nb\r\nc");
    expect(result.crlfCount).toBe(2);
    expect(result.lfCount).toBe(0);
    expect(result.crCount).toBe(0);
  });
});

describe("convertLineEnding", () => {
  it("LF → CRLF に変換できる", () => {
    const result = convertLineEnding("line1\nline2\nline3", "CRLF");
    expect(result).toBe("line1\r\nline2\r\nline3");
  });

  it("CRLF → LF に変換できる", () => {
    const result = convertLineEnding("line1\r\nline2\r\nline3", "LF");
    expect(result).toBe("line1\nline2\nline3");
  });

  it("CR → LF に変換できる", () => {
    const result = convertLineEnding("line1\rline2\rline3", "LF");
    expect(result).toBe("line1\nline2\nline3");
  });

  it("混在 → LF に統一できる", () => {
    const result = convertLineEnding("a\r\nb\nc\rd", "LF");
    expect(result).toBe("a\nb\nc\nd");
  });

  it("混在 → CRLF に統一できる", () => {
    const result = convertLineEnding("a\r\nb\nc", "CRLF");
    expect(result).toBe("a\r\nb\r\nc");
  });

  it("LF → CR に変換できる", () => {
    const result = convertLineEnding("a\nb\nc", "CR");
    expect(result).toBe("a\rb\rc");
  });

  it("空文字列はそのまま返す", () => {
    expect(convertLineEnding("", "LF")).toBe("");
    expect(convertLineEnding("", "CRLF")).toBe("");
    expect(convertLineEnding("", "CR")).toBe("");
  });

  it("改行なしテキストはそのまま返す", () => {
    expect(convertLineEnding("hello", "CRLF")).toBe("hello");
  });

  it("同一形式への変換でも正しく動作する", () => {
    const result = convertLineEnding("a\nb\nc", "LF");
    expect(result).toBe("a\nb\nc");
  });
});

describe("LINE_ENDING_LABELS", () => {
  it("すべての改行種別のラベルが定義されている", () => {
    expect(LINE_ENDING_LABELS.CRLF).toContain("CRLF");
    expect(LINE_ENDING_LABELS.LF).toContain("LF");
    expect(LINE_ENDING_LABELS.CR).toContain("CR");
  });
});

describe("LINE_ENDING_SHORT", () => {
  it("短縮表示名が正しく定義されている", () => {
    expect(LINE_ENDING_SHORT.CRLF).toBe("CRLF");
    expect(LINE_ENDING_SHORT.LF).toBe("LF");
    expect(LINE_ENDING_SHORT.CR).toBe("CR");
  });
});
