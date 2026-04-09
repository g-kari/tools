import { describe, it, expect } from "vite-plus/test";
import {
  factorial,
  permutation,
  combination,
  calculateCombinatorics,
  permutationSteps,
  combinationSteps,
  generatePascalTriangle,
  formatBigInt,
  validateInputs,
  MAX_N,
} from "../../app/utils/combinatorics";

describe("factorial", () => {
  it("0! = 1", () => {
    expect(factorial(0)).toBe(1n);
  });

  it("1! = 1", () => {
    expect(factorial(1)).toBe(1n);
  });

  it("5! = 120", () => {
    expect(factorial(5)).toBe(120n);
  });

  it("10! = 3628800", () => {
    expect(factorial(10)).toBe(3628800n);
  });

  it("20! の計算", () => {
    expect(factorial(20)).toBe(2432902008176640000n);
  });

  it("負の数はエラー", () => {
    expect(() => factorial(-1)).toThrow(RangeError);
  });

  it("MAX_N より大きい数はエラー", () => {
    expect(() => factorial(MAX_N + 1)).toThrow(RangeError);
  });
});

describe("permutation", () => {
  it("5P0 = 1", () => {
    expect(permutation(5, 0)).toBe(1n);
  });

  it("5P1 = 5", () => {
    expect(permutation(5, 1)).toBe(5n);
  });

  it("5P5 = 120", () => {
    expect(permutation(5, 5)).toBe(120n);
  });

  it("5P3 = 60", () => {
    expect(permutation(5, 3)).toBe(60n);
  });

  it("10P4 = 5040", () => {
    expect(permutation(10, 4)).toBe(5040n);
  });

  it("r > n のとき 0", () => {
    expect(permutation(3, 5)).toBe(0n);
  });

  it("0P0 = 1", () => {
    expect(permutation(0, 0)).toBe(1n);
  });
});

describe("combination", () => {
  it("5C0 = 1", () => {
    expect(combination(5, 0)).toBe(1n);
  });

  it("5C5 = 1", () => {
    expect(combination(5, 5)).toBe(1n);
  });

  it("5C1 = 5", () => {
    expect(combination(5, 1)).toBe(5n);
  });

  it("5C2 = 10", () => {
    expect(combination(5, 2)).toBe(10n);
  });

  it("10C3 = 120", () => {
    expect(combination(10, 3)).toBe(120n);
  });

  it("52C5 = 2598960 (ポーカーの手の数)", () => {
    expect(combination(52, 5)).toBe(2598960n);
  });

  it("対称性: nCr = nC(n-r)", () => {
    expect(combination(10, 3)).toBe(combination(10, 7));
    expect(combination(20, 5)).toBe(combination(20, 15));
  });

  it("r > n のとき 0", () => {
    expect(combination(3, 5)).toBe(0n);
  });

  it("0C0 = 1", () => {
    expect(combination(0, 0)).toBe(1n);
  });
});

describe("calculateCombinatorics", () => {
  it("10C3 の全フィールドを正しく計算する", () => {
    const result = calculateCombinatorics(10, 3);
    expect(result.n).toBe(10);
    expect(result.r).toBe(3);
    expect(result.combination).toBe(120n);
    expect(result.permutation).toBe(720n);
    expect(result.nFactorial).toBe(factorial(10));
    expect(result.rFactorial).toBe(factorial(3));
    expect(result.nMinusRFactorial).toBe(factorial(7));
  });

  it("nPr = nCr × r! の関係が成立する", () => {
    const result = calculateCombinatorics(8, 3);
    expect(result.permutation).toBe(result.combination * factorial(3));
  });
});

describe("generatePascalTriangle", () => {
  it("0 行のとき空配列", () => {
    expect(generatePascalTriangle(0)).toEqual([]);
  });

  it("最初の 5 行が正しい", () => {
    const rows = generatePascalTriangle(5);
    expect(rows[0].values).toEqual([1n]);
    expect(rows[1].values).toEqual([1n, 1n]);
    expect(rows[2].values).toEqual([1n, 2n, 1n]);
    expect(rows[3].values).toEqual([1n, 3n, 3n, 1n]);
    expect(rows[4].values).toEqual([1n, 4n, 6n, 4n, 1n]);
  });

  it("行番号が 0 始まりで正しく設定される", () => {
    const rows = generatePascalTriangle(3);
    expect(rows.map((r) => r.rowIndex)).toEqual([0, 1, 2]);
  });

  it("各行の要素数が行番号 + 1 である", () => {
    const rows = generatePascalTriangle(6);
    rows.forEach((row) => {
      expect(row.values.length).toBe(row.rowIndex + 1);
    });
  });

  it("隣接行間の関係（加算）が成立する", () => {
    const rows = generatePascalTriangle(8);
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1].values;
      const curr = rows[i].values;
      for (let j = 1; j < curr.length - 1; j++) {
        expect(curr[j]).toBe(prev[j - 1] + prev[j]);
      }
    }
  });
});

describe("formatBigInt", () => {
  it("小さい数はそのまま表示", () => {
    // 123 -> "123" (toLocaleString は環境依存なので正規表現でチェック)
    const result = formatBigInt(123n);
    expect(result).toMatch(/123/);
  });

  it("大きな数は指数表記", () => {
    // 21 桁以上の数
    const bigNum = 10n ** 21n;
    const result = formatBigInt(bigNum);
    expect(result).toMatch(/10\^21/);
  });

  it("0 は '0'", () => {
    expect(formatBigInt(0n)).toBe("0");
  });
});

describe("validateInputs", () => {
  it("正常な入力は null を返す", () => {
    expect(validateInputs(10, 3)).toBeNull();
    expect(validateInputs(0, 0)).toBeNull();
    expect(validateInputs(5, 5)).toBeNull();
  });

  it("負の n はエラー", () => {
    expect(validateInputs(-1, 0)).not.toBeNull();
  });

  it("負の r はエラー", () => {
    expect(validateInputs(5, -1)).not.toBeNull();
  });

  it("r > n はエラー", () => {
    expect(validateInputs(3, 5)).not.toBeNull();
  });

  it("n > MAX_N はエラー", () => {
    expect(validateInputs(MAX_N + 1, 0)).not.toBeNull();
  });

  it("n = MAX_N は許容", () => {
    expect(validateInputs(MAX_N, 0)).toBeNull();
  });

  it("小数の n はエラー", () => {
    expect(validateInputs(5.5, 2)).not.toBeNull();
  });

  it("小数の r はエラー", () => {
    expect(validateInputs(5, 2.5)).not.toBeNull();
  });
});

describe("permutationSteps", () => {
  it("5P3 のステップ配列を返す", () => {
    const steps = permutationSteps(5, 3);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("最初のステップに公式が含まれる", () => {
    const steps = permutationSteps(5, 3);
    expect(steps[0].label).toBe("公式");
    expect(steps[0].formula).toContain("ₙPᵣ");
  });

  it("n! を展開するステップが含まれる", () => {
    const steps = permutationSteps(5, 3);
    const nFactStep = steps.find((s) => s.label === "n! を展開");
    expect(nFactStep).toBeDefined();
  });

  it("r === n のとき (n-r)! のステップがない", () => {
    const steps = permutationSteps(5, 5);
    const nMinusRStep = steps.find((s) => s.label === "(n − r)! を展開");
    expect(nMinusRStep).toBeUndefined();
  });

  it("r < n のとき (n-r)! のステップがある", () => {
    const steps = permutationSteps(5, 3);
    const nMinusRStep = steps.find((s) => s.label === "(n − r)! を展開");
    expect(nMinusRStep).toBeDefined();
  });

  it("除算ステップが最後に含まれる", () => {
    const steps = permutationSteps(5, 3);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.label).toBe("除算");
  });

  it("10P4 の結果が 5040 を含む", () => {
    const steps = permutationSteps(10, 4);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.result).toContain("5,040");
  });
});

describe("combinationSteps", () => {
  it("5C3 のステップ配列を返す", () => {
    const steps = combinationSteps(5, 3);
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("最初のステップに公式が含まれる", () => {
    const steps = combinationSteps(5, 3);
    expect(steps[0].label).toBe("公式");
    expect(steps[0].formula).toContain("ₙCᵣ");
  });

  it("n! を計算するステップが含まれる", () => {
    const steps = combinationSteps(5, 3);
    const nFactStep = steps.find((s) => s.label === "n! を計算");
    expect(nFactStep).toBeDefined();
  });

  it("r! を計算するステップが含まれる", () => {
    const steps = combinationSteps(5, 3);
    const rFactStep = steps.find((s) => s.label === "r! を計算");
    expect(rFactStep).toBeDefined();
  });

  it("(n-r)! を計算するステップが含まれる", () => {
    const steps = combinationSteps(5, 3);
    const nMinusRStep = steps.find((s) => s.label === "(n − r)! を計算");
    expect(nMinusRStep).toBeDefined();
  });

  it("分母を計算するステップが含まれる", () => {
    const steps = combinationSteps(5, 3);
    const denomStep = steps.find((s) => s.label === "分母を計算");
    expect(denomStep).toBeDefined();
  });

  it("除算ステップが最後に含まれる", () => {
    const steps = combinationSteps(5, 3);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.label).toBe("除算");
  });

  it("10C3 の結果が 120 を含む", () => {
    const steps = combinationSteps(10, 3);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.result).toContain("120");
  });
});
