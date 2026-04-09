import { describe, it, expect } from "vite-plus/test";
import {
  generateShortCode,
  generateShortCodes,
  calculateLuhnDigit,
  verifyLuhn,
  calculateEntropy,
  CHARSETS,
  FORMAT_PRESETS,
} from "../../app/utils/short-code";

describe("generateShortCode", () => {
  it("デフォルト設定でコードを生成できる", () => {
    const code = generateShortCode({
      segmentLength: 4,
      segmentCount: 2,
      separator: "-",
      alphabet: CHARSETS.nolookalike.value,
      addLuhn: false,
    });
    expect(code).toMatch(/^[ACDEFGHJKLMNPQRTUVWXY34679]{4}-[ACDEFGHJKLMNPQRTUVWXY34679]{4}$/);
  });

  it("セグメントが1つのコードを生成できる", () => {
    const code = generateShortCode({
      segmentLength: 6,
      segmentCount: 1,
      separator: "",
      alphabet: CHARSETS.numbers.value,
      addLuhn: false,
    });
    expect(code).toMatch(/^\d{6}$/);
  });

  it("セグメント数4のライセンスキー形式を生成できる", () => {
    const code = generateShortCode({
      segmentLength: 4,
      segmentCount: 4,
      separator: "-",
      alphabet: CHARSETS.nolookalike.value,
      addLuhn: false,
    });
    const parts = code.split("-");
    expect(parts).toHaveLength(4);
    parts.forEach((part) => {
      expect(part).toHaveLength(4);
    });
  });

  it("16進数文字セットでコードを生成できる", () => {
    const code = generateShortCode({
      segmentLength: 4,
      segmentCount: 2,
      separator: ":",
      alphabet: CHARSETS.hex.value,
      addLuhn: false,
    });
    expect(code).toMatch(/^[0-9A-F]{4}:[0-9A-F]{4}$/);
  });

  it("セグメント長が0以下の場合エラーを投げる", () => {
    expect(() =>
      generateShortCode({
        segmentLength: 0,
        segmentCount: 2,
        separator: "-",
        alphabet: CHARSETS.nolookalike.value,
        addLuhn: false,
      }),
    ).toThrow("セグメント長は 1 〜 20 の範囲で指定してください");
  });

  it("セグメント数が0以下の場合エラーを投げる", () => {
    expect(() =>
      generateShortCode({
        segmentLength: 4,
        segmentCount: 0,
        separator: "-",
        alphabet: CHARSETS.nolookalike.value,
        addLuhn: false,
      }),
    ).toThrow("セグメント数は 1 〜 8 の範囲で指定してください");
  });

  it("空の文字セットでエラーを投げる", () => {
    expect(() =>
      generateShortCode({
        segmentLength: 4,
        segmentCount: 2,
        separator: "-",
        alphabet: "",
        addLuhn: false,
      }),
    ).toThrow("文字セットを 1 文字以上指定してください");
  });

  it("区切り文字なしのコードを生成できる", () => {
    const code = generateShortCode({
      segmentLength: 3,
      segmentCount: 2,
      separator: "",
      alphabet: "ABC",
      addLuhn: false,
    });
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABC]{6}$/);
  });
});

describe("generateShortCodes", () => {
  const options = {
    segmentLength: 4,
    segmentCount: 1,
    separator: "",
    alphabet: CHARSETS.nolookalike.value,
    addLuhn: false,
  };

  it("指定した件数のコードを生成できる", () => {
    const codes = generateShortCodes(options, 10);
    expect(codes).toHaveLength(10);
  });

  it("上限100件を超えた場合100件に制限される", () => {
    const codes = generateShortCodes(options, 150);
    expect(codes).toHaveLength(100);
  });

  it("0件以下の場合1件に制限される", () => {
    const codes = generateShortCodes(options, 0);
    expect(codes).toHaveLength(1);
  });

  it("生成されるコードは互いに異なる（確率的）", () => {
    const codes = generateShortCodes(options, 20);
    const unique = new Set(codes);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe("calculateLuhnDigit", () => {
  it("既知の入力に対して正しいチェックディジットを返す", () => {
    // 79927398713 の最後の桁 3 は正しい Luhn チェックディジット
    expect(calculateLuhnDigit("7992739871")).toBe("3");
  });

  it("単純なケースを検証できる", () => {
    const base = "123456789";
    const digit = calculateLuhnDigit(base);
    expect(digit).toMatch(/^\d$/);
    expect(verifyLuhn(base + digit)).toBe(true);
  });
});

describe("verifyLuhn", () => {
  it("有効な Luhn コードを正しく検証する", () => {
    expect(verifyLuhn("79927398713")).toBe(true);
  });

  it("無効な Luhn コードを正しく拒否する", () => {
    expect(verifyLuhn("79927398710")).toBe(false);
  });

  it("数字以外を含む文字列は無効と判定する", () => {
    expect(verifyLuhn("1234ABC")).toBe(false);
  });

  it("generateShortCode で生成したコードのラウンドトリップを検証", () => {
    const base = "4539578763";
    const digit = calculateLuhnDigit(base);
    expect(verifyLuhn(base + digit)).toBe(true);
  });
});

describe("calculateEntropy", () => {
  it("エントロピーを正しく計算する", () => {
    // 26文字アルファベット, 4文字 × 1セグメント: log2(26) * 4 ≈ 18.8 bits
    const entropy = calculateEntropy(4, 1, 26);
    expect(entropy).toBeCloseTo(Math.log2(26) * 4, 5);
  });

  it("セグメント数が増えるとエントロピーも増加する", () => {
    const e1 = calculateEntropy(4, 1, 26);
    const e2 = calculateEntropy(4, 2, 26);
    expect(e2).toBeCloseTo(e1 * 2, 5);
  });

  it("数字のみ（10文字）のエントロピーを計算できる", () => {
    const entropy = calculateEntropy(6, 1, 10);
    expect(entropy).toBeCloseTo(Math.log2(10) * 6, 5);
  });
});

describe("CHARSETS", () => {
  it("すべてのプリセット文字セットが定義されている", () => {
    expect(CHARSETS.alphanumeric.value.length).toBeGreaterThan(0);
    expect(CHARSETS.nolookalike.value.length).toBeGreaterThan(0);
    expect(CHARSETS.uppercase.value.length).toBe(26);
    expect(CHARSETS.lowercase.value.length).toBe(26);
    expect(CHARSETS.numbers.value.length).toBe(10);
    expect(CHARSETS.hex.value.length).toBe(16);
  });

  it("nolookalike には視覚的に紛らわしい文字が含まれていない", () => {
    const confusable = ["0", "O", "I", "l", "1", "B", "8"];
    confusable.forEach((char) => {
      expect(CHARSETS.nolookalike.value).not.toContain(char);
    });
  });
});

describe("FORMAT_PRESETS", () => {
  it("ticket プリセットで 2 セグメントコードを生成できる", () => {
    const preset = FORMAT_PRESETS.ticket;
    const code = generateShortCode({
      segmentLength: preset.segmentLength,
      segmentCount: preset.segmentCount,
      separator: preset.separator,
      alphabet: CHARSETS[preset.charsetKey].value,
      addLuhn: false,
    });
    expect(code.split(preset.separator)).toHaveLength(2);
  });

  it("license プリセットで 4 セグメントコードを生成できる", () => {
    const preset = FORMAT_PRESETS.license;
    const code = generateShortCode({
      segmentLength: preset.segmentLength,
      segmentCount: preset.segmentCount,
      separator: preset.separator,
      alphabet: CHARSETS[preset.charsetKey].value,
      addLuhn: false,
    });
    expect(code.split("-")).toHaveLength(4);
  });

  it("pin プリセットで 6 桁の数字コードを生成できる", () => {
    const preset = FORMAT_PRESETS.pin;
    const code = generateShortCode({
      segmentLength: preset.segmentLength,
      segmentCount: preset.segmentCount,
      separator: preset.separator,
      alphabet: CHARSETS[preset.charsetKey].value,
      addLuhn: false,
    });
    expect(code).toMatch(/^\d{6}$/);
  });
});
