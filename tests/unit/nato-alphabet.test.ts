import { describe, expect, it } from "vite-plus/test";
import { NATO_ALPHABET_MAP, textToNato, textToNatoString } from "../../app/utils/nato-alphabet";

describe("NATO_ALPHABET_MAP", () => {
  it("アルファベットのマッピングが存在する", () => {
    expect(NATO_ALPHABET_MAP["A"]).toBe("Alpha");
    expect(NATO_ALPHABET_MAP["B"]).toBe("Bravo");
    expect(NATO_ALPHABET_MAP["Z"]).toBe("Zulu");
  });

  it("数字のマッピングが存在する", () => {
    expect(NATO_ALPHABET_MAP["0"]).toBe("Zero");
    expect(NATO_ALPHABET_MAP["9"]).toBe("Nine");
  });

  it("全アルファベット26文字が定義されている", () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for (const letter of letters) {
      expect(NATO_ALPHABET_MAP[letter]).toBeDefined();
    }
  });

  it("全数字10種が定義されている", () => {
    const digits = "0123456789".split("");
    for (const digit of digits) {
      expect(NATO_ALPHABET_MAP[digit]).toBeDefined();
    }
  });
});

describe("textToNato", () => {
  it("アルファベット（大文字）を変換する", () => {
    const result = textToNato("A");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ char: "A", phonetic: "Alpha", isSpace: false });
  });

  it("アルファベット（小文字）を変換する", () => {
    const result = textToNato("a");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ char: "a", phonetic: "Alpha", isSpace: false });
  });

  it("数字を変換する", () => {
    const result = textToNato("0");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ char: "0", phonetic: "Zero", isSpace: false });
  });

  it("スペースを正しく扱う", () => {
    const result = textToNato(" ");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ char: " ", phonetic: null, isSpace: true });
  });

  it("複数文字を変換する", () => {
    const result = textToNato("AB");
    expect(result).toHaveLength(2);
    expect(result[0].phonetic).toBe("Alpha");
    expect(result[1].phonetic).toBe("Bravo");
  });

  it("スペースを含むテキストを変換する", () => {
    const result = textToNato("A B");
    expect(result).toHaveLength(3);
    expect(result[0].phonetic).toBe("Alpha");
    expect(result[1].isSpace).toBe(true);
    expect(result[2].phonetic).toBe("Bravo");
  });

  it("未対応文字のphoneticはnullになる", () => {
    const result = textToNato("!");
    expect(result).toHaveLength(1);
    expect(result[0].phonetic).toBeNull();
    expect(result[0].isSpace).toBe(false);
  });

  it("空文字列は空配列を返す", () => {
    expect(textToNato("")).toEqual([]);
  });

  it("HELLOを変換する", () => {
    const result = textToNato("HELLO");
    expect(result).toHaveLength(5);
    expect(result.map((r) => r.phonetic)).toEqual(["Hotel", "Echo", "Lima", "Lima", "Oscar"]);
  });
});

describe("textToNatoString", () => {
  it("単一文字を変換する", () => {
    expect(textToNatoString("A")).toBe("Alpha");
  });

  it("複数文字をデフォルト区切り文字で結合する", () => {
    expect(textToNatoString("AB")).toBe("Alpha - Bravo");
  });

  it("カスタム区切り文字が使える", () => {
    expect(textToNatoString("AB", " | ")).toBe("Alpha | Bravo");
  });

  it("スペースを (space) として出力する", () => {
    expect(textToNatoString("A B")).toBe("Alpha - (space) - Bravo");
  });

  it("未対応文字を [char] 形式で出力する", () => {
    expect(textToNatoString("!")).toBe("[!]");
  });

  it("空文字列は空文字列を返す", () => {
    expect(textToNatoString("")).toBe("");
  });

  it("小文字でも同じ結果になる", () => {
    expect(textToNatoString("hello")).toBe(textToNatoString("HELLO"));
  });

  it("数字を変換する", () => {
    expect(textToNatoString("123")).toBe("One - Two - Three");
  });
});

describe("大文字/小文字の正規化", () => {
  it("小文字入力が大文字と同じフォネティック結果になる", () => {
    const upper = textToNato("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    const lower = textToNato("abcdefghijklmnopqrstuvwxyz");
    expect(upper.map((r) => r.phonetic)).toEqual(lower.map((r) => r.phonetic));
  });
});
