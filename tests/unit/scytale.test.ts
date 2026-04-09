import { describe, it, expect } from "vite-plus/test";
import {
  encodeScytale,
  decodeScytale,
  visualizeScytale,
  getScytaleDiameterRange,
} from "../../app/utils/scytale";

describe("encodeScytale", () => {
  it("diameter=4でエンコードする", () => {
    // HELLOSPARTAN, diameter=4
    // グリッド:
    //   H E L L
    //   O S P A
    //   R T A N
    // 列方向: HOR EST LPA LAN
    expect(encodeScytale("HELLOSPARTAN", 4)).toBe("HORESTLPALAN");
  });

  it("テキスト長が列数の倍数でない場合にパディングする", () => {
    // "HELLO", diameter=3
    // グリッド:
    //   H E L
    //   L O  (スペースパディング)
    // 列方向: H,L -> HL / E,O -> EO / L,(space) -> L(space)
    // cols=3, rows=2, total=6
    expect(encodeScytale("HELLO", 3)).toBe("HLEOL ");
  });

  it("空文字列を返す", () => {
    expect(encodeScytale("", 4)).toBe("");
  });

  it("diameter=2でエンコードする", () => {
    // "ABCD", diameter=2
    // グリッド:
    //   A B
    //   C D
    // 列方向: AC BD
    expect(encodeScytale("ABCD", 2)).toBe("ACBD");
  });

  it("diameter=1は2として扱う", () => {
    // diameter < 2 は 2 にクランプ
    expect(encodeScytale("ABCD", 1)).toBe(encodeScytale("ABCD", 2));
  });

  it("テキスト長がdiameterと同じ場合", () => {
    // "ABC", diameter=3 -> グリッドは1行
    // 列方向: A B C
    expect(encodeScytale("ABC", 3)).toBe("ABC");
  });

  it("テキスト長がdiameterより短い場合", () => {
    // "AB", diameter=5
    // グリッドは1行: A B _ _ _
    // 列方向: A B _ _ _ -> "AB   "
    const result = encodeScytale("AB", 5);
    expect(result.startsWith("AB")).toBe(true);
  });
});

describe("decodeScytale", () => {
  it("エンコードとデコードが往復できる（diameter=4）", () => {
    const original = "HELLOSPARTAN";
    const encoded = encodeScytale(original, 4);
    expect(decodeScytale(encoded, 4)).toBe(original);
  });

  it("エンコードとデコードが往復できる（diameter=3）", () => {
    const original = "HELLOWORLD";
    const encoded = encodeScytale(original, 3);
    expect(decodeScytale(encoded, 3)).toBe(original);
  });

  it("エンコードとデコードが往復できる（diameter=2）", () => {
    const original = "ABCDEFGH";
    const encoded = encodeScytale(original, 2);
    expect(decodeScytale(encoded, 2)).toBe(original);
  });

  it("パディングありの往復テスト（diameter=4）", () => {
    const original = "HELLO";
    const encoded = encodeScytale(original, 4);
    // デコード後は末尾空白が除去されて元のテキストに戻る
    expect(decodeScytale(encoded, 4)).toBe(original);
  });

  it("空文字列を返す", () => {
    expect(decodeScytale("", 4)).toBe("");
  });

  it("diameter=5で往復テスト", () => {
    const original = "THEQUICKBROWNFOX";
    const encoded = encodeScytale(original, 5);
    expect(decodeScytale(encoded, 5)).toBe(original);
  });
});

describe("visualizeScytale", () => {
  it("plainモードで正しいグリッドを返す", () => {
    // "ABCDEF", diameter=3
    // 行0: A B C
    // 行1: D E F
    const grid = visualizeScytale("ABCDEF", 3, "plain");
    expect(grid).toHaveLength(2);
    expect(grid[0]).toEqual(["A", "B", "C"]);
    expect(grid[1]).toEqual(["D", "E", "F"]);
  });

  it("plainモードでパディングが·になる", () => {
    // "ABCDE", diameter=3
    // 行0: A B C
    // 行1: D E ·
    const grid = visualizeScytale("ABCDE", 3, "plain");
    expect(grid[1][2]).toBe("·");
  });

  it("空文字列で空配列を返す", () => {
    expect(visualizeScytale("", 4, "plain")).toEqual([]);
    expect(visualizeScytale("", 4, "cipher")).toEqual([]);
  });

  it("cipherモードでグリッドの行数がplainと同じ", () => {
    const text = "HELLOSPARTAN";
    const diameter = 4;
    const plain = visualizeScytale(text, diameter, "plain");
    const cipher = visualizeScytale(text, diameter, "cipher");
    expect(cipher.length).toBe(plain.length);
  });

  it("各行の列数がdiameterと同じ", () => {
    const grid = visualizeScytale("HELLO", 4, "plain");
    for (const row of grid) {
      expect(row).toHaveLength(4);
    }
  });
});

describe("getScytaleDiameterRange", () => {
  it("min=2, max=20を返す", () => {
    const range = getScytaleDiameterRange();
    expect(range.min).toBe(2);
    expect(range.max).toBe(20);
  });
});
