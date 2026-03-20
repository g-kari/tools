import { describe, it, expect } from "vitest";
import { FANCY_STYLES, type FancyStyle } from "../../app/routes/fancy-text";

/** スタイルを id で取得するヘルパー */
function getStyle(id: string): FancyStyle {
  const style = FANCY_STYLES.find((s) => s.id === id);
  if (!style) throw new Error(`Style "${id}" not found`);
  return style;
}

describe("FANCY_STYLES", () => {
  it("11 スタイルが定義されていること", () => {
    expect(FANCY_STYLES).toHaveLength(11);
  });

  it("各スタイルが必須フィールドを持つこと", () => {
    for (const style of FANCY_STYLES) {
      expect(style.id).toBeTruthy();
      expect(style.name).toBeTruthy();
      expect(style.description).toBeTruthy();
      expect(typeof style.convert).toBe("function");
    }
  });
});

describe("bold スタイル", () => {
  const { convert } = getStyle("bold");

  it("英大文字を太字に変換する", () => {
    expect(convert("ABC")).toBe("𝐀𝐁𝐂");
  });

  it("英小文字を太字に変換する", () => {
    expect(convert("abc")).toBe("𝐚𝐛𝐜");
  });

  it("空文字列を空文字列に変換する", () => {
    expect(convert("")).toBe("");
  });

  it("非英字文字はそのまま維持する", () => {
    expect(convert("A1!")).toBe("𝐀1!");
  });

  it("A-Z の 26 文字すべてを変換する", () => {
    const result = convert("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    const chars = Array.from(result);
    expect(chars).toHaveLength(26);
    // 各文字がサロゲートペアで表される補助文字であること
    for (const ch of chars) {
      expect(ch.codePointAt(0)).toBeGreaterThanOrEqual(0x1d400);
    }
  });
});

describe("bold-italic スタイル", () => {
  const { convert } = getStyle("bold-italic");

  it("英字を太字斜体に変換する", () => {
    const result = convert("Hi");
    expect(Array.from(result)).toHaveLength(2);
    // 変換後の各文字が補助文字領域にあること
    for (const ch of Array.from(result)) {
      const cp = ch.codePointAt(0)!;
      expect(cp).toBeGreaterThanOrEqual(0x1d468);
      expect(cp).toBeLessThanOrEqual(0x1d49b);
    }
  });

  it("非英字はそのまま維持する", () => {
    expect(convert("1 + 1")).toBe("1 + 1");
  });
});

describe("bold-script スタイル", () => {
  const { convert } = getStyle("bold-script");

  it("英字を筆記体に変換する", () => {
    const result = convert("AB");
    const chars = Array.from(result);
    expect(chars).toHaveLength(2);
    expect(chars[0].codePointAt(0)).toBe(0x1d4d0); // 𝓐
    expect(chars[1].codePointAt(0)).toBe(0x1d4d1); // 𝓑
  });
});

describe("monospace スタイル", () => {
  const { convert } = getStyle("monospace");

  it("英字を等幅に変換する", () => {
    const result = convert("Az");
    const chars = Array.from(result);
    expect(chars[0].codePointAt(0)).toBe(0x1d670); // 𝙰
    expect(chars[1].codePointAt(0)).toBe(0x1d6a3); // z = 0x1d68a + 25
  });
});

describe("double-struck スタイル", () => {
  const { convert } = getStyle("double-struck");

  it("大文字 A を ꭳ (𝔸) に変換する", () => {
    const result = convert("A");
    expect(Array.from(result)[0].codePointAt(0)).toBe(0x1d538);
  });

  it("例外文字 C を ℂ に変換する", () => {
    expect(convert("C")).toBe("ℂ");
  });

  it("例外文字 H を ℍ に変換する", () => {
    expect(convert("H")).toBe("ℍ");
  });

  it("例外文字 N を ℕ に変換する", () => {
    expect(convert("N")).toBe("ℕ");
  });

  it("例外文字 R を ℝ に変換する", () => {
    expect(convert("R")).toBe("ℝ");
  });

  it("例外文字 Z を ℤ に変換する", () => {
    expect(convert("Z")).toBe("ℤ");
  });

  it("小文字 a を 𝕒 に変換する", () => {
    const result = convert("a");
    expect(Array.from(result)[0].codePointAt(0)).toBe(0x1d552);
  });
});

describe("circled スタイル", () => {
  const { convert } = getStyle("circled");

  it("大文字 A を Ⓐ に変換する", () => {
    expect(convert("A")).toBe("Ⓐ");
  });

  it("小文字 a を ⓐ に変換する", () => {
    expect(convert("a")).toBe("ⓐ");
  });

  it("A-Z の 26 文字を変換する", () => {
    const result = convert("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    expect(result).toBe("ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ");
  });
});

describe("small-caps スタイル", () => {
  const { convert } = getStyle("small-caps");

  it("大文字 A を ᴀ に変換する", () => {
    expect(convert("A")).toBe("ᴀ");
  });

  it("小文字 b を ʙ に変換する", () => {
    expect(convert("b")).toBe("ʙ");
  });

  it("大文字と小文字は同じ結果になる", () => {
    expect(convert("Hello")).toBe(convert("HELLO"));
  });

  it("非英字はそのまま維持する", () => {
    expect(convert("A1B")).toBe("ᴀ1ʙ");
  });
});

describe("strikethrough スタイル", () => {
  const { convert } = getStyle("strikethrough");

  it("各文字に結合文字 U+0336 を付加する", () => {
    const result = convert("abc");
    // a + combining, b + combining, c + combining
    expect(result).toBe("a\u0336b\u0336c\u0336");
  });

  it("スペースはそのまま維持する", () => {
    const result = convert("a b");
    expect(result).toBe("a\u0336 b\u0336");
  });
});

describe("upside-down スタイル", () => {
  const { convert } = getStyle("upside-down");

  it("hello を逆さまにして逆順にする", () => {
    // h→ɥ, e→ə, l→l, l→l, o→o → 逆順 → ollǝɥ
    expect(convert("hello")).toBe("ollǝɥ");
  });

  it("感嘆符と疑問符を変換する", () => {
    const result = convert("!");
    expect(result).toBe("¡");
  });

  it("空文字列を空文字列に変換する", () => {
    expect(convert("")).toBe("");
  });

  it("単一文字は逆順でも同じ", () => {
    expect(convert("a")).toBe("ɐ");
  });

  it("テキストが逆順になっていること", () => {
    const result = convert("ab");
    // a→ɐ, b→q → reversed → [q, ɐ]
    expect(result).toBe("qɐ");
  });
});
