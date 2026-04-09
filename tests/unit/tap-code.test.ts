import { describe, it, expect } from "vite-plus/test";
import { encodeTapCode, decodeTapCode, getTapGrid } from "../../app/utils/tap-code";

describe("encodeTapCode", () => {
  describe("dots format", () => {
    it("A を '. .' にエンコードする", () => {
      expect(encodeTapCode("A", "dots")).toBe(". .");
    });

    it("B を '. ..' にエンコードする", () => {
      expect(encodeTapCode("B", "dots")).toBe(". ..");
    });

    it("E を '. .....' にエンコードする", () => {
      expect(encodeTapCode("E", "dots")).toBe(". .....");
    });

    it("Z を '..... .....' にエンコードする", () => {
      expect(encodeTapCode("Z", "dots")).toBe("..... .....");
    });

    it("K は C と同じ '.' + '.' × 3 にエンコードする", () => {
      expect(encodeTapCode("K", "dots")).toBe(encodeTapCode("C", "dots"));
    });

    it("複数文字を2スペース区切りでエンコードする", () => {
      expect(encodeTapCode("AB", "dots")).toBe(". .  . ..");
    });

    it("スペースで区切られた単語を3スペース区切りでエンコードする", () => {
      const result = encodeTapCode("A B", "dots");
      expect(result).toBe(". .   . ..");
    });

    it("小文字も変換する", () => {
      expect(encodeTapCode("a", "dots")).toBe(encodeTapCode("A", "dots"));
    });

    it("英字以外はそのまま保持する", () => {
      const result = encodeTapCode("A1", "dots");
      expect(result).toContain("1");
    });

    it("空文字列は空を返す", () => {
      expect(encodeTapCode("", "dots")).toBe("");
    });
  });

  describe("numbers format", () => {
    it("A を '1 1' にエンコードする", () => {
      expect(encodeTapCode("A", "numbers")).toBe("1 1");
    });

    it("B を '1 2' にエンコードする", () => {
      expect(encodeTapCode("B", "numbers")).toBe("1 2");
    });

    it("F を '2 1' にエンコードする（2行目の最初）", () => {
      expect(encodeTapCode("F", "numbers")).toBe("2 1");
    });

    it("Z を '5 5' にエンコードする", () => {
      expect(encodeTapCode("Z", "numbers")).toBe("5 5");
    });

    it("複数文字を ' / ' で区切る", () => {
      expect(encodeTapCode("AB", "numbers")).toBe("1 1 / 1 2");
    });

    it("単語間を ' // ' で区切る", () => {
      expect(encodeTapCode("A B", "numbers")).toBe("1 1 // 1 2");
    });
  });

  describe("numbers-compact format", () => {
    it("A を '11' にエンコードする", () => {
      expect(encodeTapCode("A", "numbers-compact")).toBe("11");
    });

    it("B を '12' にエンコードする", () => {
      expect(encodeTapCode("B", "numbers-compact")).toBe("12");
    });

    it("Z を '55' にエンコードする", () => {
      expect(encodeTapCode("Z", "numbers-compact")).toBe("55");
    });

    it("複数文字をスペース区切りでエンコードする", () => {
      expect(encodeTapCode("AB", "numbers-compact")).toBe("11 12");
    });

    it("単語間を2スペースで区切る", () => {
      expect(encodeTapCode("A B", "numbers-compact")).toBe("11  12");
    });
  });

  describe("デフォルト形式", () => {
    it("デフォルトはドット記法", () => {
      expect(encodeTapCode("A")).toBe(encodeTapCode("A", "dots"));
    });
  });
});

describe("decodeTapCode", () => {
  describe("dots format", () => {
    it("'. .' を A にデコードする", () => {
      expect(decodeTapCode(". .", "dots")).toBe("A");
    });

    it("'. ..' を B にデコードする", () => {
      expect(decodeTapCode(". ..", "dots")).toBe("B");
    });

    it("'..... .....' を Z にデコードする", () => {
      expect(decodeTapCode("..... .....", "dots")).toBe("Z");
    });

    it("2スペース区切りの複数文字をデコードする", () => {
      expect(decodeTapCode(". .  . ..", "dots")).toBe("AB");
    });

    it("3スペース区切りの単語をデコードする（スペース区切り）", () => {
      expect(decodeTapCode(". .   . ..", "dots")).toBe("A B");
    });
  });

  describe("numbers format", () => {
    it("'1 1' を A にデコードする", () => {
      expect(decodeTapCode("1 1", "numbers")).toBe("A");
    });

    it("'1 2' を B にデコードする", () => {
      expect(decodeTapCode("1 2", "numbers")).toBe("B");
    });

    it("'5 5' を Z にデコードする", () => {
      expect(decodeTapCode("5 5", "numbers")).toBe("Z");
    });

    it("' / ' 区切りの複数文字をデコードする", () => {
      expect(decodeTapCode("1 1 / 1 2", "numbers")).toBe("AB");
    });

    it("' // ' 区切りの単語をデコードする", () => {
      expect(decodeTapCode("1 1 // 1 2", "numbers")).toBe("A B");
    });
  });

  describe("numbers-compact format", () => {
    it("'11' を A にデコードする", () => {
      expect(decodeTapCode("11", "numbers-compact")).toBe("A");
    });

    it("'12' を B にデコードする", () => {
      expect(decodeTapCode("12", "numbers-compact")).toBe("B");
    });

    it("'55' を Z にデコードする", () => {
      expect(decodeTapCode("55", "numbers-compact")).toBe("Z");
    });

    it("スペース区切りの複数文字をデコードする", () => {
      expect(decodeTapCode("11 12", "numbers-compact")).toBe("AB");
    });

    it("2スペース区切りの単語をデコードする", () => {
      expect(decodeTapCode("11  12", "numbers-compact")).toBe("A B");
    });
  });

  describe("エンコード・デコードの往復変換", () => {
    const testCases = ["HELLO", "WORLD", "TAPCODE", "ATTACK AT DAWN"];

    for (const text of testCases) {
      it(`'${text}' をドット記法でエンコードしてデコードすると元に戻る`, () => {
        const encoded = encodeTapCode(text, "dots");
        const decoded = decodeTapCode(encoded, "dots");
        // C/K は C に正規化されるため K → C の変換を考慮
        const expected = text.replace(/K/g, "C");
        expect(decoded).toBe(expected);
      });

      it(`'${text}' を数字記法でエンコードしてデコードすると元に戻る`, () => {
        const encoded = encodeTapCode(text, "numbers");
        const decoded = decodeTapCode(encoded, "numbers");
        const expected = text.replace(/K/g, "C");
        expect(decoded).toBe(expected);
      });

      it(`'${text}' をコンパクト記法でエンコードしてデコードすると元に戻る`, () => {
        const encoded = encodeTapCode(text, "numbers-compact");
        const decoded = decodeTapCode(encoded, "numbers-compact");
        const expected = text.replace(/K/g, "C");
        expect(decoded).toBe(expected);
      });
    }
  });
});

describe("getTapGrid", () => {
  it("5×5グリッドを返す", () => {
    const grid = getTapGrid();
    expect(grid).toHaveLength(5);
    for (const row of grid) {
      expect(row).toHaveLength(5);
    }
  });

  it("最初のセルは A", () => {
    const grid = getTapGrid();
    expect(grid[0]?.[0]).toBe("A");
  });

  it("最後のセルは Z", () => {
    const grid = getTapGrid();
    expect(grid[4]?.[4]).toBe("Z");
  });

  it("C/K セルは 'C/K' と表示される", () => {
    const grid = getTapGrid();
    expect(grid[0]?.[2]).toBe("C/K");
  });

  it("A-E が1行目に並ぶ（C/Kは除く）", () => {
    const grid = getTapGrid();
    expect(grid[0]?.[0]).toBe("A");
    expect(grid[0]?.[1]).toBe("B");
    expect(grid[0]?.[3]).toBe("D");
    expect(grid[0]?.[4]).toBe("E");
  });

  it("F-J が2行目に並ぶ", () => {
    const grid = getTapGrid();
    expect(grid[1]?.[0]).toBe("F");
    expect(grid[1]?.[4]).toBe("J");
  });

  it("V-Z が5行目に並ぶ", () => {
    const grid = getTapGrid();
    expect(grid[4]?.[0]).toBe("V");
    expect(grid[4]?.[4]).toBe("Z");
  });
});
