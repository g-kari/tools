import { describe, it, expect } from "vite-plus/test";
import {
  parseJsonLines,
  formatJsonLines,
  minifyJsonLines,
  jsonLinesToJsonArray,
  jsonArrayToJsonLines,
} from "../../app/utils/json-lines";

describe("parseJsonLines", () => {
  it("有効な JSON Lines を正しく解析する", () => {
    const input = '{"id":1}\n{"id":2}\n{"id":3}';
    const result = parseJsonLines(input);

    expect(result.validCount).toBe(3);
    expect(result.errorCount).toBe(0);
    expect(result.emptyCount).toBe(0);
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0].isValid).toBe(true);
    expect(result.lines[0].parsed).toEqual({ id: 1 });
  });

  it("空行をスキップしてカウントする", () => {
    const input = '{"id":1}\n\n{"id":2}';
    const result = parseJsonLines(input);

    expect(result.validCount).toBe(2);
    expect(result.emptyCount).toBe(1);
    expect(result.lines).toHaveLength(2);
  });

  it("無効な行をエラーとして検出する", () => {
    const input = '{"id":1}\ninvalid json\n{"id":3}';
    const result = parseJsonLines(input);

    expect(result.validCount).toBe(2);
    expect(result.errorCount).toBe(1);
    const errorLine = result.lines.find((l) => !l.isValid);
    expect(errorLine).toBeDefined();
    expect(errorLine?.lineNumber).toBe(2);
    expect(errorLine?.error).toBeDefined();
  });

  it("行番号が正しく割り当てられる", () => {
    const input = '{"a":1}\n\n{"b":2}';
    const result = parseJsonLines(input);

    expect(result.lines[0].lineNumber).toBe(1);
    expect(result.lines[1].lineNumber).toBe(3); // 2行目は空行
  });

  it("空文字列を渡した場合は空の結果を返す", () => {
    const result = parseJsonLines("");

    expect(result.validCount).toBe(0);
    expect(result.errorCount).toBe(0);
    expect(result.emptyCount).toBe(1); // 空文字列は空行として1行カウント
    expect(result.lines).toHaveLength(0);
  });

  it("配列・プリミティブ値も有効な JSON 行として解析する", () => {
    const input = '[1,2,3]\n"hello"\n42\ntrue';
    const result = parseJsonLines(input);

    expect(result.validCount).toBe(4);
    expect(result.lines[0].parsed).toEqual([1, 2, 3]);
    expect(result.lines[1].parsed).toBe("hello");
    expect(result.lines[2].parsed).toBe(42);
    expect(result.lines[3].parsed).toBe(true);
  });

  it("前後の空白をトリムして解析する", () => {
    const input = '  {"id":1}  \n  {"id":2}  ';
    const result = parseJsonLines(input);

    expect(result.validCount).toBe(2);
    expect(result.errorCount).toBe(0);
  });
});

describe("formatJsonLines", () => {
  it("各レコードを1行のまま読みやすく整形する", () => {
    const input = '{"id":1,"name":"田中"}\n{"id":2,"name":"花子"}';
    const result = formatJsonLines(input);

    expect(result).toContain('"id": 1');
    expect(result).toContain('"name": "田中"');
    expect(result.split("\n")).toHaveLength(2);
    expect(parseJsonLines(result).errorCount).toBe(0);
    expect(JSON.parse(jsonLinesToJsonArray(result))).toEqual([
      { id: 1, name: "田中" },
      { id: 2, name: "花子" },
    ]);
  });

  it("無効な行はそのまま保持する", () => {
    const input = '{"id":1}\n  invalid  \n{"id":2}';
    const result = formatJsonLines(input);

    expect(result.split("\n")[1]).toBe("  invalid  ");
    expect(parseJsonLines(result).validCount).toBe(2);
  });

  it("空行を保持する", () => {
    const input = '{"id":1}\n\n{"id":2}';
    const result = formatJsonLines(input);

    // 空行が含まれている
    expect(result).toContain("\n\n");
  });

  it("ネストしたオブジェクトや配列にもレコード内改行を追加しない", () => {
    expect(formatJsonLines('{"a":{"b":[1,2]}}')).toBe('{"a": {"b": [1, 2]}}');
  });

  it("文字列内の句読点・引用符・バックスラッシュ・改行エスケープを保持する", () => {
    const value = { text: 'a,b:c\\\"d\ne', nested: ["x:y", "a,b"] };
    const input = JSON.stringify(value);
    const result = formatJsonLines(input);
    expect(result.split("\n")).toHaveLength(1);
    expect(JSON.parse(result)).toEqual(value);
    expect(result).toContain('"x:y"');
    expect(result).toContain('"a,b"');
  });

  it("配列・プリミティブ値・CRLFを含む入力でも値を保ち、繰り返し整形できる", () => {
    const input = '[1,{"a":2}]\r\n"x,y:z"\r\nnull\r\ntrue\r\n42';
    const result = formatJsonLines(input);
    expect(parseJsonLines(result).validCount).toBe(5);
    expect(parseJsonLines(result).errorCount).toBe(0);
    expect(formatJsonLines(result)).toBe(result);
    expect(JSON.parse(jsonLinesToJsonArray(result))).toEqual([
      [1, { a: 2 }],
      "x,y:z",
      null,
      true,
      42,
    ]);
  });
});

describe("minifyJsonLines", () => {
  it("各行の JSON を1行に圧縮する", () => {
    const input = '{"id": 1, "name": "田中"}\n{"id": 2, "name": "花子"}';
    const result = minifyJsonLines(input);
    const lines = result.split("\n").filter((l) => l.trim());

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('{"id":1,"name":"田中"}');
    expect(lines[1]).toBe('{"id":2,"name":"花子"}');
  });

  it("無効なレコードと後続の有効なレコードを結合しない", () => {
    const input = '{"id": 1}\n  invalid  \n{"id": 2}\n{"id": 3}';
    expect(minifyJsonLines(input)).toBe('{"id":1}\n  invalid  \n{"id":2}\n{"id":3}');
    expect(parseJsonLines(minifyJsonLines(input)).validCount).toBe(3);
  });

  it("複数行JSONを隣接レコードと混同せず、無効な行を保持する", () => {
    const input = '{\n  "id": 1\n}\n{"id": 2}';
    expect(minifyJsonLines(input)).toBe('{\n  "id": 1\n}\n{"id":2}');
  });

  it("整形と圧縮を繰り返してもレコードの値と件数を保つ", () => {
    const input = '{"id":1,"v":["a,b:c",null]}\nfalse\n"前\\n後"';
    const formatted = formatJsonLines(input);
    expect(minifyJsonLines(formatted)).toBe(input);
    expect(minifyJsonLines(minifyJsonLines(formatted))).toBe(input);
  });

  it("空行を除去する", () => {
    const input = '{"id":1}\n\n{"id":2}';
    const result = minifyJsonLines(input);
    const lines = result.split("\n").filter((l) => l.trim());

    expect(lines).toHaveLength(2);
  });
});

describe("jsonLinesToJsonArray", () => {
  it("JSON Lines を JSON 配列に変換する", () => {
    const input = '{"id":1}\n{"id":2}\n{"id":3}';
    const result = jsonLinesToJsonArray(input);
    const parsed = JSON.parse(result);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toEqual({ id: 1 });
    expect(parsed[2]).toEqual({ id: 3 });
  });

  it("空行をスキップして変換する", () => {
    const input = '{"id":1}\n\n{"id":2}';
    const result = jsonLinesToJsonArray(input);
    const parsed = JSON.parse(result);

    expect(parsed).toHaveLength(2);
  });

  it("無効な行がある場合はエラーをスローする", () => {
    const input = '{"id":1}\ninvalid';
    expect(() => jsonLinesToJsonArray(input)).toThrow("行 2 の JSON が無効です");
  });

  it("インデントを指定できる", () => {
    const input = '{"id":1}';
    const result = jsonLinesToJsonArray(input, 4);

    expect(result).toContain('    "id": 1');
  });

  it("空の入力（空行のみ）は空配列を返す", () => {
    const result = jsonLinesToJsonArray("\n\n");
    const parsed = JSON.parse(result);

    expect(parsed).toEqual([]);
  });
});

describe("jsonArrayToJsonLines", () => {
  it("JSON 配列を JSON Lines に変換する", () => {
    const input = '[{"id":1},{"id":2},{"id":3}]';
    const result = jsonArrayToJsonLines(input);
    const lines = result.split("\n").filter((l) => l.trim());

    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0])).toEqual({ id: 1 });
    expect(JSON.parse(lines[2])).toEqual({ id: 3 });
  });

  it("配列でない JSON を渡した場合はエラーをスローする", () => {
    const input = '{"id":1}';
    expect(() => jsonArrayToJsonLines(input)).toThrow("JSON配列");
  });

  it("無効な JSON を渡した場合はエラーをスローする", () => {
    expect(() => jsonArrayToJsonLines("invalid")).toThrow("JSON の解析に失敗しました");
  });

  it("空の配列を渡した場合は空文字列を返す", () => {
    const result = jsonArrayToJsonLines("[]");
    expect(result).toBe("");
  });

  it("整形済み JSON 配列も正しく変換する", () => {
    const input = `[
  {"id": 1, "name": "田中"},
  {"id": 2, "name": "花子"}
]`;
    const result = jsonArrayToJsonLines(input);
    const lines = result.split("\n").filter((l) => l.trim());

    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toEqual({ id: 1, name: "田中" });
  });
});

describe("検証と整形・圧縮の空白処理の一致", () => {
  it.each(["\uFEFF", "\u00A0", " \t\uFEFF\u00A0"])(
    "前後に %j がある有効なレコードを検証と同じ基準で処理する",
    (whitespace) => {
      const input = `${whitespace}{"id":1,"name":"田中"}${whitespace}\n${whitespace}[1,2]${whitespace}`;
      expect(parseJsonLines(input).validCount).toBe(2);
      expect(parseJsonLines(input).errorCount).toBe(0);
      expect(formatJsonLines(input)).toBe('{"id": 1, "name": "田中"}\n[1, 2]');
      expect(minifyJsonLines(input)).toBe('{"id":1,"name":"田中"}\n[1,2]');
    },
  );

  it("BOM・NBSPを含む無効な行は前後も含めて元のまま保持する", () => {
    const invalid = "\uFEFF\u00A0invalid\u00A0";
    const input = `{ "id": 1 }\n${invalid}\n{ "id": 2 }`;
    for (const transform of [formatJsonLines, minifyJsonLines]) {
      const lines = transform(input).split("\n");
      expect(lines).toHaveLength(3);
      expect(lines[1]).toBe(invalid);
      expect(JSON.parse(lines[2])).toEqual({ id: 2 });
    }
  });
});

describe("JSONL ↔ JSON配列 ラウンドトリップ", () => {
  it("JSONL → JSON配列 → JSONL が元データと一致する", () => {
    const original = '{"id":1,"name":"田中"}\n{"id":2,"name":"花子"}';
    const asArray = jsonLinesToJsonArray(original);
    const restored = jsonArrayToJsonLines(asArray);

    const originalLines = original.split("\n").map((l) => JSON.parse(l));
    const restoredLines = restored.split("\n").map((l) => JSON.parse(l));

    expect(restoredLines).toEqual(originalLines);
  });

  it("JSON配列 → JSONL → JSON配列 が元データと一致する", () => {
    const original = '[{"id":1},{"id":2},{"id":3}]';
    const asLines = jsonArrayToJsonLines(original);
    const restored = jsonLinesToJsonArray(asLines);

    expect(JSON.parse(restored)).toEqual(JSON.parse(original));
  });
});
