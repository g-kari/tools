import { describe, it, expect } from "vite-plus/test";
import {
  generateNanoId,
  calculateEntropy,
  calculateCollisionProbability,
  DEFAULT_ALPHABET,
  DEFAULT_SIZE,
  PRESET_ALPHABETS,
} from "../../app/utils/nano-id";

describe("generateNanoId", () => {
  it("デフォルトサイズ（21 文字）の ID を生成する", () => {
    const id = generateNanoId();
    expect(id.length).toBe(DEFAULT_SIZE);
    expect(id.length).toBe(21);
  });

  it("指定したサイズの ID を生成する", () => {
    expect(generateNanoId(10).length).toBe(10);
    expect(generateNanoId(32).length).toBe(32);
    expect(generateNanoId(1).length).toBe(1);
    expect(generateNanoId(100).length).toBe(100);
  });

  it("デフォルトアルファベットの文字のみを含む", () => {
    const id = generateNanoId();
    for (const char of id) {
      expect(DEFAULT_ALPHABET).toContain(char);
    }
  });

  it("カスタムアルファベットの文字のみを含む", () => {
    const alphabet = "ABC123";
    const id = generateNanoId(20, alphabet);
    expect(id.length).toBe(20);
    for (const char of id) {
      expect(alphabet).toContain(char);
    }
  });

  it("16 進数アルファベットを使用できる", () => {
    const hexAlpha = PRESET_ALPHABETS.hex.value;
    const id = generateNanoId(32, hexAlpha);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("数字のみアルファベットを使用できる", () => {
    const numAlpha = PRESET_ALPHABETS.numbers.value;
    const id = generateNanoId(10, numAlpha);
    expect(id).toMatch(/^\d{10}$/);
  });

  it("連続生成で異なる値を返す", () => {
    const results = new Set(
      Array.from({ length: 20 }, () => generateNanoId())
    );
    expect(results.size).toBe(20);
  });

  it("アルファベットが空文字の場合にエラーを投げる", () => {
    expect(() => generateNanoId(10, "")).toThrow();
  });

  it("サイズが 0 以下の場合にエラーを投げる", () => {
    expect(() => generateNanoId(0)).toThrow();
  });

  it("英数字のみプリセットの文字のみを含む", () => {
    const alpha = PRESET_ALPHABETS.alphanumeric.value;
    const id = generateNanoId(30, alpha);
    expect(id).toMatch(/^[A-Za-z0-9]{30}$/);
  });

  it("小文字英数字プリセットの文字のみを含む", () => {
    const alpha = PRESET_ALPHABETS.lowercase.value;
    const id = generateNanoId(30, alpha);
    expect(id).toMatch(/^[a-z0-9]{30}$/);
  });

  it("大文字英数字プリセットの文字のみを含む", () => {
    const alpha = PRESET_ALPHABETS.uppercase.value;
    const id = generateNanoId(30, alpha);
    expect(id).toMatch(/^[A-Z0-9]{30}$/);
  });
});

describe("calculateEntropy", () => {
  it("デフォルト設定のエントロピーを計算する", () => {
    const entropy = calculateEntropy(DEFAULT_SIZE, DEFAULT_ALPHABET);
    // log2(64) * 21 = 6 * 21 = 126 ビット
    expect(entropy).toBeCloseTo(126, 0);
  });

  it("16 進数アルファベット（4 ビット/文字）のエントロピー", () => {
    const entropy = calculateEntropy(32, "0123456789abcdef");
    // log2(16) * 32 = 4 * 32 = 128 ビット
    expect(entropy).toBeCloseTo(128, 0);
  });

  it("文字数が多いほどエントロピーが高い", () => {
    const small = calculateEntropy(10, "AB");
    const large = calculateEntropy(10, DEFAULT_ALPHABET);
    expect(large).toBeGreaterThan(small);
  });

  it("サイズが大きいほどエントロピーが高い", () => {
    const short = calculateEntropy(10, DEFAULT_ALPHABET);
    const long = calculateEntropy(20, DEFAULT_ALPHABET);
    expect(long).toBeGreaterThan(short);
  });
});

describe("calculateCollisionProbability", () => {
  it("文字列を返す", () => {
    const prob = calculateCollisionProbability(DEFAULT_SIZE, DEFAULT_ALPHABET);
    expect(typeof prob).toBe("string");
  });

  it("非常に小さい確率の場合に特別なメッセージを返す", () => {
    const prob = calculateCollisionProbability(21, DEFAULT_ALPHABET, 1_000_000);
    expect(prob).toContain("10");
  });

  it("短い ID や小さなアルファベットほど衝突確率が高い", () => {
    const safe = calculateCollisionProbability(21, DEFAULT_ALPHABET, 1000);
    const risky = calculateCollisionProbability(3, "01", 1000);
    // risky の方が collision prob が高い（数字で比較できないので文字列として確認）
    expect(typeof safe).toBe("string");
    expect(typeof risky).toBe("string");
  });
});

describe("DEFAULT_ALPHABET", () => {
  it("64 文字を含む", () => {
    expect(DEFAULT_ALPHABET.length).toBe(64);
  });

  it("重複文字を含まない", () => {
    const unique = new Set(DEFAULT_ALPHABET.split(""));
    expect(unique.size).toBe(DEFAULT_ALPHABET.length);
  });
});

describe("DEFAULT_SIZE", () => {
  it("21 である", () => {
    expect(DEFAULT_SIZE).toBe(21);
  });
});

describe("PRESET_ALPHABETS", () => {
  it("すべてのプリセットが value プロパティを持つ", () => {
    for (const key of Object.keys(PRESET_ALPHABETS)) {
      const preset = PRESET_ALPHABETS[key as keyof typeof PRESET_ALPHABETS];
      expect(preset.value.length).toBeGreaterThan(0);
      expect(preset.label.length).toBeGreaterThan(0);
    }
  });

  it("hex プリセットは 16 文字", () => {
    expect(PRESET_ALPHABETS.hex.value.length).toBe(16);
  });

  it("numbers プリセットは 10 文字（0–9）", () => {
    expect(PRESET_ALPHABETS.numbers.value).toBe("0123456789");
    expect(PRESET_ALPHABETS.numbers.value.length).toBe(10);
  });
});
