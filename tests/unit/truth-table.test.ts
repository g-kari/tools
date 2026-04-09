import { describe, it, expect } from "vite-plus/test";
import {
  tokenize,
  collectVariables,
  generateTruthTable,
  exportTruthTableCSV,
} from "../../app/utils/truth-table";

// ---------------------------------------------------------------------------
// tokenize
// ---------------------------------------------------------------------------
describe("tokenize", () => {
  it("変数をVARトークンに変換する", () => {
    const tokens = tokenize("A");
    expect(tokens[0]).toEqual({ kind: "VAR", value: "A" });
  });

  it("ANDキーワードを認識する", () => {
    const tokens = tokenize("AND");
    expect(tokens[0].kind).toBe("AND");
  });

  it("ORキーワードを認識する", () => {
    const tokens = tokenize("OR");
    expect(tokens[0].kind).toBe("OR");
  });

  it("NOTキーワードを認識する", () => {
    const tokens = tokenize("NOT");
    expect(tokens[0].kind).toBe("NOT");
  });

  it("XORキーワードを認識する", () => {
    const tokens = tokenize("XOR");
    expect(tokens[0].kind).toBe("XOR");
  });

  it("NANDキーワードを認識する", () => {
    const tokens = tokenize("NAND");
    expect(tokens[0].kind).toBe("NAND");
  });

  it("NORキーワードを認識する", () => {
    const tokens = tokenize("NOR");
    expect(tokens[0].kind).toBe("NOR");
  });

  it("XNORキーワードを認識する", () => {
    const tokens = tokenize("XNOR");
    expect(tokens[0].kind).toBe("XNOR");
  });

  it("&& を ANDとして認識する", () => {
    const tokens = tokenize("&&");
    expect(tokens[0].kind).toBe("AND");
  });

  it("|| を ORとして認識する", () => {
    const tokens = tokenize("||");
    expect(tokens[0].kind).toBe("OR");
  });

  it("! を NOTとして認識する", () => {
    const tokens = tokenize("!");
    expect(tokens[0].kind).toBe("NOT");
  });

  it("^ を XORとして認識する", () => {
    const tokens = tokenize("^");
    expect(tokens[0].kind).toBe("XOR");
  });

  it("括弧を認識する", () => {
    const tokens = tokenize("()");
    expect(tokens[0].kind).toBe("LPAREN");
    expect(tokens[1].kind).toBe("RPAREN");
  });

  it("末尾にEOFトークンが付く", () => {
    const tokens = tokenize("A");
    expect(tokens[tokens.length - 1].kind).toBe("EOF");
  });

  it("不明な文字で例外をスローする", () => {
    expect(() => tokenize("A @ B")).toThrow("不明な文字");
  });

  it("小文字の変数を大文字に変換する", () => {
    const tokens = tokenize("a");
    expect(tokens[0]).toEqual({ kind: "VAR", value: "A" });
  });
});

// ---------------------------------------------------------------------------
// generateTruthTable - 基本
// ---------------------------------------------------------------------------
describe("generateTruthTable", () => {
  it("空文字列でエラーをスローする", () => {
    expect(() => generateTruthTable("")).toThrow("式を入力してください");
  });

  it("変数なしの式でエラーをスローする", () => {
    expect(() => generateTruthTable("()")).toThrow();
  });

  it("6変数以上でエラーをスローする", () => {
    expect(() => generateTruthTable("A AND B AND C AND D AND E AND F")).toThrow("変数が多すぎます");
  });

  // NOT
  it("NOT A — 2行の真理値表を生成する", () => {
    const result = generateTruthTable("NOT A");
    expect(result.variables).toEqual(["A"]);
    expect(result.rows).toHaveLength(2);
    // A=0 → output=1
    expect(result.rows[0].inputs["A"]).toBe(false);
    expect(result.rows[0].output).toBe(true);
    // A=1 → output=0
    expect(result.rows[1].inputs["A"]).toBe(true);
    expect(result.rows[1].output).toBe(false);
  });

  // AND
  it("A AND B — 4行生成、(1,1)のみtrue", () => {
    const result = generateTruthTable("A AND B");
    expect(result.variables).toEqual(["A", "B"]);
    expect(result.rows).toHaveLength(4);
    const trueRows = result.rows.filter((r) => r.output);
    expect(trueRows).toHaveLength(1);
    expect(trueRows[0].inputs).toEqual({ A: true, B: true });
  });

  // OR
  it("A OR B — 3行がtrue", () => {
    const result = generateTruthTable("A OR B");
    const trueRows = result.rows.filter((r) => r.output);
    expect(trueRows).toHaveLength(3);
  });

  // XOR
  it("A XOR B — 入力が異なるときtrue", () => {
    const result = generateTruthTable("A XOR B");
    const trueRows = result.rows.filter((r) => r.output);
    expect(trueRows).toHaveLength(2);
    for (const row of trueRows) {
      expect(row.inputs["A"]).not.toBe(row.inputs["B"]);
    }
  });

  // NAND
  it("A NAND B — (1,1)のみfalse", () => {
    const result = generateTruthTable("A NAND B");
    const falseRows = result.rows.filter((r) => !r.output);
    expect(falseRows).toHaveLength(1);
    expect(falseRows[0].inputs).toEqual({ A: true, B: true });
  });

  // NOR
  it("A NOR B — (0,0)のみtrue", () => {
    const result = generateTruthTable("A NOR B");
    const trueRows = result.rows.filter((r) => r.output);
    expect(trueRows).toHaveLength(1);
    expect(trueRows[0].inputs).toEqual({ A: false, B: false });
  });

  // XNOR
  it("A XNOR B — 入力が同じときtrue", () => {
    const result = generateTruthTable("A XNOR B");
    const trueRows = result.rows.filter((r) => r.output);
    expect(trueRows).toHaveLength(2);
    for (const row of trueRows) {
      expect(row.inputs["A"]).toBe(row.inputs["B"]);
    }
  });

  // 括弧
  it("(A OR B) AND C — 正しく評価する", () => {
    const result = generateTruthTable("(A OR B) AND C");
    expect(result.variables).toEqual(["A", "B", "C"]);
    expect(result.rows).toHaveLength(8);
    // A=1, B=0, C=1 → true
    const target = result.rows.find((r) => r.inputs["A"] && !r.inputs["B"] && r.inputs["C"]);
    expect(target?.output).toBe(true);
    // A=0, B=0, C=1 → false
    const target2 = result.rows.find((r) => !r.inputs["A"] && !r.inputs["B"] && r.inputs["C"]);
    expect(target2?.output).toBe(false);
  });

  // ド・モルガン
  it("NOT (A AND B) === (NOT A) OR (NOT B) — ド・モルガンの法則", () => {
    const r1 = generateTruthTable("NOT (A AND B)");
    const r2 = generateTruthTable("(NOT A) OR (NOT B)");
    for (let i = 0; i < 4; i++) {
      expect(r1.rows[i].output).toBe(r2.rows[i].output);
    }
  });

  // 記号演算子
  it("A && B — AND と同等", () => {
    const r1 = generateTruthTable("A AND B");
    const r2 = generateTruthTable("A && B");
    expect(r1.rows.map((r) => r.output)).toEqual(r2.rows.map((r) => r.output));
  });

  it("A || B — OR と同等", () => {
    const r1 = generateTruthTable("A OR B");
    const r2 = generateTruthTable("A || B");
    expect(r1.rows.map((r) => r.output)).toEqual(r2.rows.map((r) => r.output));
  });

  it("!A — NOT A と同等", () => {
    const r1 = generateTruthTable("NOT A");
    const r2 = generateTruthTable("!A");
    expect(r1.rows.map((r) => r.output)).toEqual(r2.rows.map((r) => r.output));
  });

  // 5変数
  it("5変数の式 — 32行を生成する", () => {
    const result = generateTruthTable("A AND B AND C AND D AND E");
    expect(result.rows).toHaveLength(32);
  });

  // 正規化された式
  it("expression フィールドに正規化された式が入る", () => {
    const result = generateTruthTable("A AND B");
    expect(result.expression).toContain("∧");
  });

  it("NOT A の expression が ¬A になる", () => {
    const result = generateTruthTable("NOT A");
    expect(result.expression).toBe("¬A");
  });
});

// ---------------------------------------------------------------------------
// exportTruthTableCSV
// ---------------------------------------------------------------------------
describe("exportTruthTableCSV", () => {
  it("ヘッダー行に変数名と式を含む", () => {
    const result = generateTruthTable("A AND B");
    const csv = exportTruthTableCSV(result);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("A");
    expect(lines[0]).toContain("B");
  });

  it("4行（ヘッダー含め5行）生成する", () => {
    const result = generateTruthTable("A AND B");
    const csv = exportTruthTableCSV(result);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(5); // header + 4 rows
  });

  it("値が 0 または 1 のみ", () => {
    const result = generateTruthTable("A OR B");
    const csv = exportTruthTableCSV(result);
    const dataLines = csv.split("\n").slice(1);
    for (const line of dataLines) {
      expect(line).toMatch(/^[01,]+$/);
    }
  });
});
