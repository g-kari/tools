import { describe, it, expect } from "vite-plus/test";
import { applyLineOp, LINE_OPS } from "../../app/utils/text-line";

const SAMPLE = "apple\nbanana\ncherry\n  grape  \n\nfig";

describe("applyLineOp - trim", () => {
  it("各行の先頭・末尾の空白を除去する", () => {
    const { result } = applyLineOp("  hello  \n  world  ", "trim");
    expect(result).toBe("hello\nworld");
  });

  it("行数は変わらない", () => {
    const { lineCount } = applyLineOp(SAMPLE, "trim");
    expect(lineCount.before).toBe(lineCount.after);
  });
});

describe("applyLineOp - remove-empty", () => {
  it("空行を削除する", () => {
    const { result } = applyLineOp("a\n\nb\n\nc", "remove-empty");
    expect(result).toBe("a\nb\nc");
  });

  it("空白のみの行も削除する", () => {
    const { result } = applyLineOp("a\n   \nb", "remove-empty");
    expect(result).toBe("a\nb");
  });

  it("削除後の行数が減る", () => {
    const { lineCount } = applyLineOp("a\n\nb", "remove-empty");
    expect(lineCount.after).toBe(2);
    expect(lineCount.before).toBe(3);
  });
});

describe("applyLineOp - add-numbers", () => {
  it("行番号を付加する", () => {
    const { result } = applyLineOp("foo\nbar\nbaz", "add-numbers");
    expect(result).toBe("1. foo\n2. bar\n3. baz");
  });

  it("行数は変わらない", () => {
    const { lineCount } = applyLineOp(SAMPLE, "add-numbers");
    expect(lineCount.before).toBe(lineCount.after);
  });
});

describe("applyLineOp - add-prefix", () => {
  it("各行の先頭にプレフィックスを付加する", () => {
    const { result } = applyLineOp("foo\nbar", "add-prefix", "- ");
    expect(result).toBe("- foo\n- bar");
  });

  it("空のプレフィックスでは変化しない", () => {
    const input = "foo\nbar";
    const { result } = applyLineOp(input, "add-prefix", "");
    expect(result).toBe(input);
  });
});

describe("applyLineOp - add-suffix", () => {
  it("各行の末尾にサフィックスを付加する", () => {
    const { result } = applyLineOp("foo\nbar", "add-suffix", ",");
    expect(result).toBe("foo,\nbar,");
  });

  it("空のサフィックスでは変化しない", () => {
    const input = "foo\nbar";
    const { result } = applyLineOp(input, "add-suffix", "");
    expect(result).toBe(input);
  });
});

describe("applyLineOp - reverse", () => {
  it("行の順序を逆転する", () => {
    const { result } = applyLineOp("a\nb\nc", "reverse");
    expect(result).toBe("c\nb\na");
  });

  it("1行の場合は変化しない", () => {
    const { result } = applyLineOp("single", "reverse");
    expect(result).toBe("single");
  });

  it("行数は変わらない", () => {
    const { lineCount } = applyLineOp(SAMPLE, "reverse");
    expect(lineCount.before).toBe(lineCount.after);
  });
});

describe("applyLineOp - shuffle", () => {
  it("同じ行が含まれる（順序は変わる可能性あり）", () => {
    const input = "a\nb\nc\nd\ne";
    const { result } = applyLineOp(input, "shuffle");
    const inputLines = input.split("\n").sort();
    const resultLines = result.split("\n").sort();
    expect(resultLines).toEqual(inputLines);
  });

  it("行数は変わらない", () => {
    const { lineCount } = applyLineOp(SAMPLE, "shuffle");
    expect(lineCount.before).toBe(lineCount.after);
  });
});

describe("applyLineOp - filter-keep", () => {
  it("キーワードを含む行のみ残す", () => {
    const { result } = applyLineOp("apple\nbanana\napricot\ncherry", "filter-keep", "ap");
    expect(result).toBe("apple\napricot");
  });

  it("キーワードが空の場合は全行を残す", () => {
    const input = "a\nb\nc";
    const { result } = applyLineOp(input, "filter-keep", "");
    expect(result).toBe(input);
  });

  it("一致しない場合は行数が減る", () => {
    const { lineCount } = applyLineOp("foo\nbar\nbaz", "filter-keep", "foo");
    expect(lineCount.after).toBe(1);
  });
});

describe("applyLineOp - filter-remove", () => {
  it("キーワードを含む行を削除する", () => {
    const { result } = applyLineOp("error: a\ninfo: b\nerror: c", "filter-remove", "error");
    expect(result).toBe("info: b");
  });

  it("キーワードが空の場合は全行を残す", () => {
    const input = "a\nb\nc";
    const { result } = applyLineOp(input, "filter-remove", "");
    expect(result).toBe(input);
  });

  it("全行一致で行数が 0 になる", () => {
    const { lineCount } = applyLineOp("err\nerr\nerr", "filter-remove", "err");
    expect(lineCount.after).toBe(0);
  });
});

describe("LINE_OPS 定義", () => {
  it("9 種類の操作が定義されている", () => {
    expect(LINE_OPS).toHaveLength(9);
  });

  it("hasInput の操作には inputLabel が定義されている", () => {
    for (const op of LINE_OPS) {
      if (op.hasInput) {
        expect(op.inputLabel).toBeDefined();
        expect(op.inputPlaceholder).toBeDefined();
      }
    }
  });
});
