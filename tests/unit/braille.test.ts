import { describe, expect, it } from "vitest";
import {
  LETTER_TO_BRAILLE,
  DIGIT_TO_BRAILLE,
  NUMBER_INDICATOR,
  CAPITAL_INDICATOR,
  textToBraille,
  getBrailleDotPattern,
} from "../../app/utils/braille";

describe("LETTER_TO_BRAILLE", () => {
  it("26文字全てのマッピングが存在する", () => {
    const letters = "abcdefghijklmnopqrstuvwxyz".split("");
    for (const letter of letters) {
      expect(LETTER_TO_BRAILLE[letter]).toBeDefined();
    }
  });

  it("A（小文字a）が正しい点字にマッピングされる", () => {
    expect(LETTER_TO_BRAILLE["a"]).toBe("\u2801");
  });

  it("Z（小文字z）が正しい点字にマッピングされる", () => {
    expect(LETTER_TO_BRAILLE["z"]).toBe("\u2835");
  });
});

describe("DIGIT_TO_BRAILLE", () => {
  it("0〜9全てのマッピングが存在する", () => {
    for (let i = 0; i <= 9; i++) {
      expect(DIGIT_TO_BRAILLE[String(i)]).toBeDefined();
    }
  });

  it("1がA（⠁）と同じ点字にマッピングされる", () => {
    expect(DIGIT_TO_BRAILLE["1"]).toBe(LETTER_TO_BRAILLE["a"]);
  });

  it("0がJ（⠚）と同じ点字にマッピングされる", () => {
    expect(DIGIT_TO_BRAILLE["0"]).toBe(LETTER_TO_BRAILLE["j"]);
  });
});

describe("textToBraille", () => {
  it("空文字列は空文字列を返す", () => {
    expect(textToBraille("")).toBe("");
  });

  it("小文字aを変換する", () => {
    expect(textToBraille("a")).toBe("\u2801");
  });

  it("小文字複数文字を変換する", () => {
    expect(textToBraille("hi")).toBe("\u2813\u280A");
  });

  it("大文字に大文字インジケーターが付加される", () => {
    expect(textToBraille("A")).toBe(CAPITAL_INDICATOR + "\u2801");
  });

  it("大文字HELLOを変換する", () => {
    const result = textToBraille("HELLO");
    // 各文字の前に大文字インジケーターが付く
    expect(result).toContain(CAPITAL_INDICATOR);
    expect(result).toContain("\u2813"); // H
    expect(result).toContain("\u2811"); // E
    expect(result).toContain("\u2807"); // L
    expect(result).toContain("\u2815"); // O
  });

  it("数字に数字インジケーターが付加される", () => {
    expect(textToBraille("1")).toBe(NUMBER_INDICATOR + "\u2801");
  });

  it("連続する数字には数字インジケーターが1つだけ付加される", () => {
    const result = textToBraille("123");
    const indicators = result.split(NUMBER_INDICATOR).length - 1;
    expect(indicators).toBe(1);
  });

  it("スペースは点字空白（⠀）に変換される", () => {
    expect(textToBraille(" ")).toBe("\u2800");
  });

  it("hello worldを変換できる", () => {
    const result = textToBraille("hello world");
    expect(result).toContain("\u2813"); // h
    expect(result).toContain("\u2811"); // e
    expect(result).toContain("\u2800"); // space
  });

  it("変換できない文字は?で表す", () => {
    expect(textToBraille("あ")).toBe("?");
  });

  it("ピリオドを変換する", () => {
    expect(textToBraille(".")).toBe("\u2832");
  });

  it("疑問符を変換する", () => {
    expect(textToBraille("?")).toBe("\u2826");
  });

  it("数字とアルファベットが混在する場合", () => {
    const result = textToBraille("a1");
    // 'a' の後に 数字インジケーター、その後 '1' に対応する点字
    expect(result).toBe("\u2801" + NUMBER_INDICATOR + "\u2801");
  });

  it("スペースの後に数字が来る場合は再度インジケーターが付加される", () => {
    const result = textToBraille("1 2");
    const indicators = result.split(NUMBER_INDICATOR).length - 1;
    expect(indicators).toBe(2);
  });
});

describe("getBrailleDotPattern", () => {
  it("空白点字（⠀）は「空白」を返す", () => {
    expect(getBrailleDotPattern("\u2800")).toBe("空白");
  });

  it("dot1のみ（⠁）は「点 1」を返す", () => {
    expect(getBrailleDotPattern("\u2801")).toBe("点 1");
  });

  it("dots 1,2（⠃）は「点 1,2」を返す", () => {
    expect(getBrailleDotPattern("\u2803")).toBe("点 1,2");
  });

  it("点字以外の文字は空文字列を返す", () => {
    expect(getBrailleDotPattern("a")).toBe("");
    expect(getBrailleDotPattern("1")).toBe("");
  });
});
