import { describe, it, expect } from "vitest";
import {
  evaluateExpression,
  formatResult,
  addToHistory,
  getSampleExpressions,
  getSupportedFunctions,
  getSupportedConstants,
} from "../../app/utils/math-eval";

describe("evaluateExpression", () => {
  describe("四則演算", () => {
    it("加算が正しく計算される", () => {
      const result = evaluateExpression("1 + 2");
      expect(result.value).toBe(3);
      expect(result.error).toBeNull();
    });

    it("減算が正しく計算される", () => {
      const result = evaluateExpression("10 - 4");
      expect(result.value).toBe(6);
      expect(result.error).toBeNull();
    });

    it("乗算が正しく計算される", () => {
      const result = evaluateExpression("3 * 7");
      expect(result.value).toBe(21);
      expect(result.error).toBeNull();
    });

    it("除算が正しく計算される", () => {
      const result = evaluateExpression("15 / 3");
      expect(result.value).toBe(5);
      expect(result.error).toBeNull();
    });
  });

  describe("べき乗と剰余", () => {
    it("べき乗（^）が正しく計算される", () => {
      const result = evaluateExpression("2 ^ 10");
      expect(result.value).toBe(1024);
      expect(result.error).toBeNull();
    });

    it("剰余（%）が正しく計算される", () => {
      const result = evaluateExpression("17 % 5");
      expect(result.value).toBe(2);
      expect(result.error).toBeNull();
    });

    it("べき乗が右結合で評価される（2^3^2 = 2^9 = 512）", () => {
      const result = evaluateExpression("2 ^ 3 ^ 2");
      expect(result.value).toBe(512);
      expect(result.error).toBeNull();
    });
  });

  describe("三角関数", () => {
    it("sin関数が正しく計算される", () => {
      const result = evaluateExpression("sin(0)");
      expect(result.value).toBeCloseTo(0);
      expect(result.error).toBeNull();
    });

    it("cos関数が正しく計算される", () => {
      const result = evaluateExpression("cos(0)");
      expect(result.value).toBeCloseTo(1);
      expect(result.error).toBeNull();
    });

    it("tan関数が正しく計算される", () => {
      const result = evaluateExpression("tan(0)");
      expect(result.value).toBeCloseTo(0);
      expect(result.error).toBeNull();
    });

    it("sin(PI / 6) が 0.5 に近い", () => {
      const result = evaluateExpression("sin(PI / 6)");
      expect(result.value).toBeCloseTo(0.5);
      expect(result.error).toBeNull();
    });
  });

  describe("対数", () => {
    it("自然対数 log(E) が 1 になる", () => {
      const result = evaluateExpression("log(E)");
      expect(result.value).toBeCloseTo(1);
      expect(result.error).toBeNull();
    });

    it("log10(1000) が 3 になる", () => {
      const result = evaluateExpression("log10(1000)");
      expect(result.value).toBeCloseTo(3);
      expect(result.error).toBeNull();
    });

    it("log2(8) が 3 になる", () => {
      const result = evaluateExpression("log2(8)");
      expect(result.value).toBeCloseTo(3);
      expect(result.error).toBeNull();
    });
  });

  describe("平方根", () => {
    it("sqrt(4) が 2 になる", () => {
      const result = evaluateExpression("sqrt(4)");
      expect(result.value).toBeCloseTo(2);
      expect(result.error).toBeNull();
    });

    it("sqrt(2) が正しく計算される", () => {
      const result = evaluateExpression("sqrt(2)");
      expect(result.value).toBeCloseTo(Math.SQRT2);
      expect(result.error).toBeNull();
    });
  });

  describe("定数", () => {
    it("PI が Math.PI と一致する", () => {
      const result = evaluateExpression("PI");
      expect(result.value).toBeCloseTo(Math.PI);
      expect(result.error).toBeNull();
    });

    it("E が Math.E と一致する", () => {
      const result = evaluateExpression("E");
      expect(result.value).toBeCloseTo(Math.E);
      expect(result.error).toBeNull();
    });
  });

  describe("複合式", () => {
    it("3-4-5の直角三角形の斜辺が5になる", () => {
      const result = evaluateExpression("sqrt(3^2 + 4^2)");
      expect(result.value).toBeCloseTo(5);
      expect(result.error).toBeNull();
    });

    it("円の面積（r=5）が正しく計算される", () => {
      const result = evaluateExpression("PI * 5^2");
      expect(result.value).toBeCloseTo(Math.PI * 25);
      expect(result.error).toBeNull();
    });

    it("複利計算が正しく計算される", () => {
      const result = evaluateExpression("1000 * (1 + 0.05) ^ 10");
      expect(result.value).toBeCloseTo(1000 * Math.pow(1.05, 10));
      expect(result.error).toBeNull();
    });
  });

  describe("負数と小数", () => {
    it("負数が正しく扱われる", () => {
      const result = evaluateExpression("-5 + 3");
      expect(result.value).toBe(-2);
      expect(result.error).toBeNull();
    });

    it("小数の計算が正しく行われる", () => {
      const result = evaluateExpression("0.1 + 0.2");
      expect(result.value).toBeCloseTo(0.3);
      expect(result.error).toBeNull();
    });

    it("単項マイナスが連続して使える", () => {
      const result = evaluateExpression("--5");
      expect(result.value).toBe(5);
      expect(result.error).toBeNull();
    });
  });

  describe("エラーケース", () => {
    it("空文字列はエラーになる", () => {
      const result = evaluateExpression("");
      expect(result.value).toBeNull();
      expect(result.error).toBe("数式を入力してください");
    });

    it("空白のみの文字列はエラーになる", () => {
      const result = evaluateExpression("   ");
      expect(result.value).toBeNull();
      expect(result.error).toBe("数式を入力してください");
    });

    it("不明な関数名はエラーになる", () => {
      const result = evaluateExpression("unknownFunc(1)");
      expect(result.value).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error).toContain("不明な関数または定数");
    });

    it("括弧の不一致（閉じ括弧不足）はエラーになる", () => {
      const result = evaluateExpression("(1 + 2");
      expect(result.value).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it("ゼロ除算はエラーになる", () => {
      const result = evaluateExpression("1 / 0");
      expect(result.value).toBeNull();
      expect(result.error).toBe("ゼロ除算エラー");
    });

    it("500文字を超える数式はエラーになる", () => {
      const longExpr = "1 + " + "1 + ".repeat(200) + "1";
      const result = evaluateExpression(longExpr);
      expect(result.value).toBeNull();
      expect(result.error).toBe("数式が長すぎます（500文字以内）");
    });
  });
});

describe("formatResult", () => {
  it("整数はロケール形式でフォーマットされる", () => {
    const result = formatResult(1000);
    // ja-JP ロケールでは 1,000 のようになる
    expect(result).toBe((1000).toLocaleString("ja-JP"));
  });

  it("0はロケール形式でフォーマットされる", () => {
    const result = formatResult(0);
    expect(result).toBe((0).toLocaleString("ja-JP"));
  });

  it("小数は適切にフォーマットされる", () => {
    const result = formatResult(3.14159);
    expect(result).toContain("3.14159");
  });

  it("非常に大きな数は指数表記になる", () => {
    const result = formatResult(1e16);
    expect(result).toContain("e");
  });

  it("非常に小さな数は指数表記になる", () => {
    const result = formatResult(1e-7);
    expect(result).toContain("e");
  });

  it("負の整数はロケール形式でフォーマットされる", () => {
    const result = formatResult(-42);
    expect(result).toBe((-42).toLocaleString("ja-JP"));
  });
});

describe("addToHistory", () => {
  it("空の履歴にエントリを追加できる", () => {
    const history = addToHistory([], "1 + 1", "2");
    expect(history).toHaveLength(1);
    expect(history[0].expression).toBe("1 + 1");
    expect(history[0].result).toBe("2");
    expect(history[0].timestamp).toBeTypeOf("number");
  });

  it("新しいエントリが先頭に追加される", () => {
    const initial = addToHistory([], "1 + 1", "2");
    const updated = addToHistory(initial, "2 * 3", "6");
    expect(updated[0].expression).toBe("2 * 3");
    expect(updated[1].expression).toBe("1 + 1");
  });

  it("デフォルトの最大件数（10件）を超えると古いエントリが削除される", () => {
    let history = [];
    for (let i = 1; i <= 11; i++) {
      history = addToHistory(history, `${i} + 1`, `${i + 1}`);
    }
    expect(history).toHaveLength(10);
    expect(history[0].expression).toBe("11 + 1");
  });

  it("カスタム最大件数が適用される", () => {
    let history = [];
    for (let i = 1; i <= 5; i++) {
      history = addToHistory(history, `${i}`, `${i}`, 3);
    }
    expect(history).toHaveLength(3);
    expect(history[0].expression).toBe("5");
  });

  it("タイムスタンプは現在時刻の近傍になる", () => {
    const before = Date.now();
    const history = addToHistory([], "1", "1");
    const after = Date.now();
    expect(history[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(history[0].timestamp).toBeLessThanOrEqual(after);
  });
});

describe("getSampleExpressions", () => {
  it("配列が返される", () => {
    const samples = getSampleExpressions();
    expect(Array.isArray(samples)).toBe(true);
  });

  it("少なくとも1件以上のサンプルが含まれる", () => {
    const samples = getSampleExpressions();
    expect(samples.length).toBeGreaterThan(0);
  });

  it("各エントリが label と expression プロパティを持つ", () => {
    const samples = getSampleExpressions();
    for (const sample of samples) {
      expect(sample).toHaveProperty("label");
      expect(sample).toHaveProperty("expression");
      expect(typeof sample.label).toBe("string");
      expect(typeof sample.expression).toBe("string");
    }
  });

  it("サンプル式が実際に評価可能である", () => {
    const samples = getSampleExpressions();
    for (const sample of samples) {
      const result = evaluateExpression(sample.expression);
      expect(result.error).toBeNull();
    }
  });
});

describe("getSupportedFunctions", () => {
  it("配列が返される", () => {
    const funcs = getSupportedFunctions();
    expect(Array.isArray(funcs)).toBe(true);
  });

  it("主要な関数が含まれている", () => {
    const funcs = getSupportedFunctions();
    expect(funcs).toContain("sin");
    expect(funcs).toContain("cos");
    expect(funcs).toContain("tan");
    expect(funcs).toContain("sqrt");
    expect(funcs).toContain("log");
    expect(funcs).toContain("log2");
    expect(funcs).toContain("log10");
    expect(funcs).toContain("abs");
    expect(funcs).toContain("floor");
    expect(funcs).toContain("ceil");
    expect(funcs).toContain("round");
  });

  it("文字列の配列である", () => {
    const funcs = getSupportedFunctions();
    for (const f of funcs) {
      expect(typeof f).toBe("string");
    }
  });
});

describe("getSupportedConstants", () => {
  it("オブジェクトが返される", () => {
    const constants = getSupportedConstants();
    expect(typeof constants).toBe("object");
    expect(constants).not.toBeNull();
  });

  it("PI が Math.PI と一致する", () => {
    const constants = getSupportedConstants();
    expect(constants.PI).toBeCloseTo(Math.PI);
  });

  it("E が Math.E と一致する", () => {
    const constants = getSupportedConstants();
    expect(constants.E).toBeCloseTo(Math.E);
  });

  it("返されるオブジェクトを変更しても内部定数に影響しない（コピーであること）", () => {
    const constants1 = getSupportedConstants();
    constants1.PI = 99999;
    const constants2 = getSupportedConstants();
    expect(constants2.PI).toBeCloseTo(Math.PI);
  });
});
