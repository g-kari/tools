import { describe, expect, it } from "vite-plus/test";
import {
  buildSquare,
  encodePolybius,
  decodePolybius,
  getSquareGrid,
} from "../../app/utils/polybius";

describe("buildSquare", () => {
  describe("デフォルト（キーなし）", () => {
    it("25文字の方陣を返す", () => {
      expect(buildSquare()).toHaveLength(25);
    });

    it("ABCDEFGHIKLMNOPQRSTUVWXYZ の順になる（J は含まない）", () => {
      expect(buildSquare()).toBe("ABCDEFGHIKLMNOPQRSTUVWXYZ");
    });

    it("J を含まない", () => {
      expect(buildSquare()).not.toContain("J");
    });
  });

  describe("キーワード付き", () => {
    it("キーワードの文字が先頭に並ぶ", () => {
      const square = buildSquare("ZEBRA");
      expect(square.startsWith("ZEBRA")).toBe(true);
    });

    it("重複文字を除去する", () => {
      const square = buildSquare("AAAA");
      const countA = square.split("").filter((c) => c === "A").length;
      expect(countA).toBe(1);
    });

    it("キーワードを含めても25文字になる", () => {
      expect(buildSquare("SECRET")).toHaveLength(25);
    });

    it("J をキーワードに含めると I に変換される", () => {
      const square = buildSquare("J");
      expect(square[0]).toBe("I");
    });

    it("キーワードは大文字に正規化される", () => {
      const square = buildSquare("zebra");
      expect(square.startsWith("ZEBRA")).toBe(true);
    });
  });
});

describe("encodePolybius", () => {
  describe("基本的な変換", () => {
    it("A → 11 になる", () => {
      expect(encodePolybius("A")).toBe("11");
    });

    it("B → 12 になる", () => {
      expect(encodePolybius("B")).toBe("12");
    });

    it("Z → 55 になる", () => {
      expect(encodePolybius("Z")).toBe("55");
    });

    it("複数文字を変換できる", () => {
      expect(encodePolybius("ABC")).toBe("111213");
    });

    it("大文字・小文字どちらも変換できる", () => {
      expect(encodePolybius("abc")).toBe("111213");
    });
  });

  describe("特殊文字の扱い", () => {
    it("J は I と同じ座標（24）に変換される", () => {
      expect(encodePolybius("J")).toBe(encodePolybius("I"));
    });

    it("スペースはそのまま保持される", () => {
      expect(encodePolybius("A B")).toBe("11 12");
    });

    it("数字はそのまま保持される", () => {
      expect(encodePolybius("A1B")).toBe("11112");
    });

    it("記号はそのまま保持される", () => {
      expect(encodePolybius("A!B")).toBe("11!12");
    });

    it("日本語はそのまま保持される", () => {
      expect(encodePolybius("Aあ")).toBe("11あ");
    });
  });

  describe("空文字列", () => {
    it("空文字列は空文字列になる", () => {
      expect(encodePolybius("")).toBe("");
    });
  });

  describe("カスタムキーワード", () => {
    it("キーワード設定で A の位置が変わる", () => {
      const encoded = encodePolybius("Z", "Z");
      expect(encoded).toBe("11");
    });

    it("同じキーワードで往復変換できる", () => {
      const original = "HELLO";
      const encoded = encodePolybius(original, "KEY");
      const decoded = decodePolybius(encoded, "KEY");
      expect(decoded).toBe(original);
    });
  });
});

describe("decodePolybius", () => {
  describe("基本的な変換", () => {
    it("11 → A になる", () => {
      expect(decodePolybius("11")).toBe("A");
    });

    it("12 → B になる", () => {
      expect(decodePolybius("12")).toBe("B");
    });

    it("55 → Z になる", () => {
      expect(decodePolybius("55")).toBe("Z");
    });

    it("複数ペアを変換できる", () => {
      expect(decodePolybius("111213")).toBe("ABC");
    });
  });

  describe("特殊文字の扱い", () => {
    it("スペースはそのまま保持される", () => {
      expect(decodePolybius("11 12")).toBe("A B");
    });

    it("英字はそのまま保持される（数字でない文字）", () => {
      expect(decodePolybius("11X12")).toBe("AXB");
    });

    it("6以上の数字はそのまま保持される", () => {
      expect(decodePolybius("11612")).toBe("A6B");
    });
  });

  describe("空文字列", () => {
    it("空文字列は空文字列になる", () => {
      expect(decodePolybius("")).toBe("");
    });
  });

  describe("往復変換", () => {
    it("HELLO で往復変換が成功する", () => {
      const original = "HELLO";
      expect(decodePolybius(encodePolybius(original))).toBe(original);
    });

    it("WORLD で往復変換が成功する", () => {
      const original = "WORLD";
      expect(decodePolybius(encodePolybius(original))).toBe(original);
    });

    it("記号・スペース混在で往復変換が成功する", () => {
      const original = "HELLO WORLD!";
      expect(decodePolybius(encodePolybius(original))).toBe(original);
    });
  });
});

describe("getSquareGrid", () => {
  it("5×5の配列を返す", () => {
    const grid = getSquareGrid();
    expect(grid).toHaveLength(5);
    grid.forEach((row) => expect(row).toHaveLength(5));
  });

  it("デフォルトで A が [0][0] に入る", () => {
    expect(getSquareGrid()[0]?.[0]).toBe("A");
  });

  it("デフォルトで Z が [4][4] に入る", () => {
    expect(getSquareGrid()[4]?.[4]).toBe("Z");
  });

  it("キーワード設定で最初のセルが変わる", () => {
    expect(getSquareGrid("Z")[0]?.[0]).toBe("Z");
  });
});
