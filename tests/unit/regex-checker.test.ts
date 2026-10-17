import { describe, it, expect, vi } from "vite-plus/test";
import { executeRegex } from "../../app/routes/regex-checker";

// A regression must fail instead of hanging the synchronous test worker.
function executeRegexBounded(pattern: string, flags: string, text: string) {
  const regex = new RegExp(pattern, flags);
  const source = regex.source;
  const canonicalFlags = regex.flags;
  const descriptor = Object.getOwnPropertyDescriptor(RegExp.prototype, "exec");
  if (!descriptor) throw new Error("Missing native RegExp exec");
  const nativeExec = descriptor.value as RegExp["exec"];
  let calls = 0;
  const spy = vi.spyOn(RegExp.prototype, "exec").mockImplementation(function (
    this: RegExp,
    input: string,
  ) {
    if (this.source === source && this.flags === canonicalFlags && input === text) {
      if (++calls > text.length + 4) throw new Error("Regex iteration did not make progress");
    }
    return nativeExec.call(this, input);
  });
  try {
    return executeRegex(pattern, flags, text);
  } finally {
    spy.mockRestore();
  }
}

describe("executeRegex", () => {
  it.each(["gu", "gv"])("terminates empty %s matches across a surrogate pair", (flags) => {
    expect(executeRegexBounded("(?:)", flags, "😀")).toEqual([
      { fullMatch: "", index: 0, groups: [] },
      { fullMatch: "", index: 2, groups: [] },
    ]);
  });

  for (const flags of ["gu", "gv", "guy", "gvy", "gdu", "gdv"]) {
    it.each([
      ["A😀B", [0, 1, 3, 4]],
      ["😀😀", [0, 2, 4]],
      ["", [0]],
      ["日本語", [0, 1, 2, 3]],
      ["\uD83D", [0, 1]],
      ["\uDE00", [0, 1]],
      ["\uD83DA\uDE00", [0, 1, 2, 3]],
      ["😀\uD83D😀\uDE00", [0, 2, 3, 5, 6]],
    ])(`advances ${flags} empty matches through %j`, (text, expected) => {
      const result = executeRegexBounded("(?:)", flags, text as string);
      expect(result.map((match) => match.index)).toEqual(expected);
      expect(result.every((match) => match.fullMatch === "" && match.groups.length === 0)).toBe(
        true,
      );
    });
  }

  it("keeps non-Unicode empty-match UTF-16 positions", () => {
    expect(executeRegexBounded("(?:)", "g", "😀").map((match) => match.index)).toEqual([0, 1, 2]);
  });

  it.each(["gu", "gv", "guy", "gvy"])("keeps %s lookahead and terminal matches", (flags) => {
    expect(executeRegexBounded("(?=.)", flags, "A😀B").map((match) => match.index)).toEqual([
      0, 1, 3,
    ]);
    // A sticky end anchor only matches when the starting position is the end.
    if (!flags.includes("y")) {
      expect(executeRegexBounded("$", flags, "😀")).toEqual([
        { fullMatch: "", index: 2, groups: [] },
      ]);
    }
    expect(executeRegexBounded("$", flags, "")).toEqual([{ fullMatch: "", index: 0, groups: [] }]);
  });

  it.each(["gu", "gv"])("preserves %s consuming/empty matches and optional captures", (flags) => {
    expect(executeRegexBounded("(😀)?()", flags, "😀")).toEqual([
      { fullMatch: "😀", index: 0, groups: ["😀", ""] },
      { fullMatch: "", index: 2, groups: [undefined, ""] },
    ]);
    expect(executeRegexBounded("😀|(?=B)", flags, "😀B")).toEqual([
      { fullMatch: "😀", index: 0, groups: [] },
      { fullMatch: "", index: 2, groups: [] },
    ]);
  });

  it("preserves sticky stop behavior and Unicode UTF-16 offsets", () => {
    expect(executeRegexBounded("a", "gy", "a a")).toEqual([
      { fullMatch: "a", index: 0, groups: [] },
    ]);
    expect(executeRegexBounded("a", "g", "a a").map((match) => match.index)).toEqual([0, 2]);
    expect(executeRegexBounded("a", "gu", "😀a")).toEqual([
      { fullMatch: "a", index: 2, groups: [] },
    ]);
    expect(executeRegex("a", "y", "ba")).toEqual([]);
  });

  it.each(["u", "v", "y", "uy", "vy"])("keeps non-global %s first-match behavior", (flags) => {
    expect(executeRegex("(?:)", flags, "😀")).toEqual([{ fullMatch: "", index: 0, groups: [] }]);
  });

  it("retains unrestricted match count and independent repeated calls", () => {
    const text = "😀".repeat(1200);
    const result = executeRegexBounded("(?:)", "gu", text);
    expect(result).toHaveLength(1201);
    expect(result.at(-1)?.index).toBe(2400);
    for (let repeat = 0; repeat < 3; repeat++) {
      expect(executeRegexBounded("(?:)", "gu", "😀").map((match) => match.index)).toEqual([0, 2]);
    }
  });

  it.each(["gg", "guv", "z"])("retains invalid %s flag errors", (flags) => {
    expect(() => executeRegex("(?:)", flags, "😀")).toThrow(SyntaxError);
  });
  describe("基本的なマッチング（フラグなし）", () => {
    it("シンプルな文字列にマッチする", () => {
      const result = executeRegex("hello", "", "hello world");
      expect(result).toHaveLength(1);
      expect(result[0].fullMatch).toBe("hello");
      expect(result[0].index).toBe(0);
      expect(result[0].groups).toEqual([]);
    });

    it("マッチしない場合は空配列を返す", () => {
      const result = executeRegex("xyz", "", "hello world");
      expect(result).toHaveLength(0);
    });

    it("フラグなしは最初のマッチのみ返す", () => {
      const result = executeRegex("a", "", "abcabc");
      expect(result).toHaveLength(1);
      expect(result[0].index).toBe(0);
    });

    it("空文字列に対してマッチしない", () => {
      const result = executeRegex("hello", "", "");
      expect(result).toHaveLength(0);
    });
  });

  describe("グローバルフラグ (g)", () => {
    it("すべてのマッチを返す", () => {
      const result = executeRegex("a", "g", "abcabc");
      expect(result).toHaveLength(2);
      expect(result[0].index).toBe(0);
      expect(result[1].index).toBe(3);
    });

    it("電話番号パターンを複数マッチ", () => {
      const result = executeRegex("\\d{3}-\\d{4}", "g", "012-3456 と 789-0123");
      expect(result).toHaveLength(2);
      expect(result[0].fullMatch).toBe("012-3456");
      expect(result[1].fullMatch).toBe("789-0123");
    });

    it("マッチなしの場合は空配列を返す", () => {
      const result = executeRegex("z", "g", "abcabc");
      expect(result).toHaveLength(0);
    });
  });

  describe("大文字小文字を区別しないフラグ (i)", () => {
    it("大文字小文字を区別せずマッチ", () => {
      const result = executeRegex("hello", "i", "Hello World");
      expect(result).toHaveLength(1);
      expect(result[0].fullMatch).toBe("Hello");
    });

    it("gi フラグで大文字小文字を無視してすべてマッチ", () => {
      const result = executeRegex("abc", "gi", "ABC abc Abc");
      expect(result).toHaveLength(3);
    });
  });

  describe("キャプチャグループ", () => {
    it("キャプチャグループを返す", () => {
      const result = executeRegex("(\\d+)-(\\d+)", "", "03-1234");
      expect(result).toHaveLength(1);
      expect(result[0].fullMatch).toBe("03-1234");
      expect(result[0].groups).toEqual(["03", "1234"]);
    });

    it("グループなしの場合は空配列", () => {
      const result = executeRegex("\\d+", "", "123");
      expect(result).toHaveLength(1);
      expect(result[0].groups).toEqual([]);
    });

    it("グローバルフラグと複数キャプチャグループ", () => {
      const result = executeRegex("(\\w+)@(\\w+)", "g", "a@b c@d");
      expect(result).toHaveLength(2);
      expect(result[0].groups).toEqual(["a", "b"]);
      expect(result[1].groups).toEqual(["c", "d"]);
    });
  });

  describe("特殊パターン", () => {
    it("数字パターンにマッチ", () => {
      const result = executeRegex("\\d+", "g", "abc123def456");
      expect(result).toHaveLength(2);
      expect(result[0].fullMatch).toBe("123");
      expect(result[1].fullMatch).toBe("456");
    });

    it("行頭・行末パターン（m フラグ）", () => {
      const result = executeRegex("^\\w+", "gm", "foo\nbar\nbaz");
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.fullMatch)).toEqual(["foo", "bar", "baz"]);
    });

    it("日本語文字にマッチ", () => {
      const result = executeRegex("[あ-ん]+", "", "hello こんにちは world");
      expect(result).toHaveLength(1);
      expect(result[0].fullMatch).toBe("こんにちは");
    });

    it("メールアドレスパターン", () => {
      const result = executeRegex(
        "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
        "g",
        "連絡先: test@example.com または info@test.co.jp",
      );
      expect(result).toHaveLength(2);
      expect(result[0].fullMatch).toBe("test@example.com");
      expect(result[1].fullMatch).toBe("info@test.co.jp");
    });
  });

  describe("エラーハンドリング", () => {
    it("無効な正規表現はエラーをスロー", () => {
      expect(() => executeRegex("[invalid", "", "test")).toThrow();
    });

    it("無効なフラグはエラーをスロー", () => {
      expect(() => executeRegex("abc", "z", "test")).toThrow();
    });
  });

  describe("index（マッチ位置）", () => {
    it("先頭以外でのマッチ位置を正しく返す", () => {
      const result = executeRegex("world", "", "hello world");
      expect(result[0].index).toBe(6);
    });

    it("グローバルマッチの各 index が正しい", () => {
      const result = executeRegex("ab", "g", "xabxabx");
      expect(result[0].index).toBe(1);
      expect(result[1].index).toBe(4);
    });
  });
});
