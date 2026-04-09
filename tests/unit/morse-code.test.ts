import { describe, expect, it } from "vite-plus/test";
import {
  MORSE_CODE_MAP,
  REVERSE_MORSE_MAP,
  textToMorse,
  morseToText,
  isMorseCode,
} from "../../app/utils/morse-code";

describe("MORSE_CODE_MAP", () => {
  it("アルファベットのマッピングが存在する", () => {
    expect(MORSE_CODE_MAP["A"]).toBe(".-");
    expect(MORSE_CODE_MAP["Z"]).toBe("--..");
  });

  it("数字のマッピングが存在する", () => {
    expect(MORSE_CODE_MAP["0"]).toBe("-----");
    expect(MORSE_CODE_MAP["9"]).toBe("----.");
  });

  it("スペースは / にマッピングされる", () => {
    expect(MORSE_CODE_MAP[" "]).toBe("/");
  });
});

describe("REVERSE_MORSE_MAP", () => {
  it("MORSE_CODE_MAPの逆マッピングが正しい", () => {
    expect(REVERSE_MORSE_MAP[".-"]).toBe("A");
    expect(REVERSE_MORSE_MAP["-----"]).toBe("0");
  });

  it("/ はスペースにマッピングされる", () => {
    expect(REVERSE_MORSE_MAP["/"]).toBe(" ");
  });
});

describe("textToMorse", () => {
  it("アルファベット（大文字）を変換する", () => {
    expect(textToMorse("A")).toBe(".-");
    expect(textToMorse("B")).toBe("-...");
    expect(textToMorse("E")).toBe(".");
    expect(textToMorse("T")).toBe("-");
  });

  it("アルファベット（小文字）を大文字として変換する", () => {
    expect(textToMorse("a")).toBe(".-");
    expect(textToMorse("z")).toBe("--..");
  });

  it("数字を変換する", () => {
    expect(textToMorse("0")).toBe("-----");
    expect(textToMorse("1")).toBe(".----");
    expect(textToMorse("5")).toBe(".....");
    expect(textToMorse("9")).toBe("----.");
  });

  it("複数文字を文字間スペースで区切る", () => {
    expect(textToMorse("HI")).toBe(".... ..");
  });

  it('単語間を " / " で区切る', () => {
    expect(textToMorse("HI HO")).toBe(".... .. / .... ---");
  });

  it("HELLO WORLDを変換する", () => {
    expect(textToMorse("HELLO WORLD")).toBe(".... . .-.. .-.. --- / .-- --- .-. .-.. -..");
  });

  it("小文字でも同じ結果になる", () => {
    expect(textToMorse("hello")).toBe(textToMorse("HELLO"));
  });

  it("空文字列は空文字列を返す", () => {
    expect(textToMorse("")).toBe("");
  });

  it("変換できない文字は ? で表す", () => {
    expect(textToMorse("あ")).toBe("?");
  });

  it("SOSを変換する", () => {
    expect(textToMorse("SOS")).toBe("... --- ...");
  });
});

describe("morseToText", () => {
  it("単一文字を変換する", () => {
    expect(morseToText(".-")).toBe("A");
    expect(morseToText("-...")).toBe("B");
  });

  it("複数文字を変換する（スペース区切り）", () => {
    expect(morseToText(".... ..")).toBe("HI");
  });

  it("単語区切り / を正しく処理する", () => {
    expect(morseToText(".... .. / .... ---")).toBe("HI HO");
  });

  it("HELLO WORLDを変換する", () => {
    expect(morseToText(".... . .-.. .-.. --- / .-- --- .-. .-.. -..")).toBe("HELLO WORLD");
  });

  it("空文字列は空文字列を返す", () => {
    expect(morseToText("")).toBe("");
    expect(morseToText("   ")).toBe("");
  });

  it("変換できないモールス符号は ? で表す", () => {
    expect(morseToText("...---...")).toBe("?");
  });

  it("SOSを変換する", () => {
    expect(morseToText("... --- ...")).toBe("SOS");
  });

  it("数字のMorse Codeを変換する", () => {
    expect(morseToText("----. .----")).toBe("91");
  });
});

describe("往復変換", () => {
  it("テキスト→Morse→テキストで元に戻る", () => {
    const original = "HELLO";
    const morse = textToMorse(original);
    const restored = morseToText(morse);
    expect(restored).toBe(original);
  });

  it("HELLO WORLDで往復変換が成功する", () => {
    const original = "HELLO WORLD";
    const morse = textToMorse(original);
    const restored = morseToText(morse);
    expect(restored).toBe(original);
  });

  it("数字で往復変換が成功する", () => {
    const original = "12345";
    const morse = textToMorse(original);
    const restored = morseToText(morse);
    expect(restored).toBe(original);
  });

  it("SOSで往復変換が成功する", () => {
    const original = "SOS";
    const morse = textToMorse(original);
    const restored = morseToText(morse);
    expect(restored).toBe(original);
  });

  it("アルファベット全文字で往復変換が成功する", () => {
    const original = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const morse = textToMorse(original);
    const restored = morseToText(morse);
    expect(restored).toBe(original);
  });
});

describe("isMorseCode", () => {
  it("有効なMorse Codeを正しく判定する", () => {
    expect(isMorseCode(".-")).toBe(true);
    expect(isMorseCode("... --- ...")).toBe(true);
    expect(isMorseCode(".... . .-.. .-.. --- / .-- --- .-. .-.. -..")).toBe(true);
  });

  it("無効なMorse Codeを正しく判定する", () => {
    expect(isMorseCode("HELLO")).toBe(false);
    expect(isMorseCode("abc")).toBe(false);
    expect(isMorseCode("123")).toBe(false);
  });

  it("空文字列はfalseを返す", () => {
    expect(isMorseCode("")).toBe(false);
    expect(isMorseCode("   ")).toBe(false);
  });

  it("/ を含むMorse Codeは有効と判定される", () => {
    expect(isMorseCode(".- / -...")).toBe(true);
  });
});

describe("大文字/小文字の正規化", () => {
  it("小文字入力が大文字と同じ結果になる", () => {
    const cases = ["a", "b", "z", "hello", "world"];
    for (const input of cases) {
      expect(textToMorse(input)).toBe(textToMorse(input.toUpperCase()));
    }
  });
});

describe("スペースの変換", () => {
  it("単語間のスペースが正しく処理される", () => {
    const result = textToMorse("A B");
    expect(result).toBe(".- / -...");
  });

  it("複数単語が正しく変換される", () => {
    const result = textToMorse("A B C");
    expect(result).toBe(".- / -... / -.-.");
  });
});
