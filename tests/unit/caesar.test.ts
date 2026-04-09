import { describe, expect, it } from "vite-plus/test";
import { encodeCaesar, decodeCaesar, rot13, bruteForce } from "../../app/utils/caesar";

describe("encodeCaesar", () => {
  describe("基本的な英字変換", () => {
    it("シフト1で 'A' → 'B' になる", () => {
      expect(encodeCaesar("A", 1)).toBe("B");
    });

    it("シフト3で 'ABC' → 'DEF' になる（Julius Caesar の標準シフト）", () => {
      expect(encodeCaesar("ABC", 3)).toBe("DEF");
    });

    it("アルファベット末尾でラップアラウンドする", () => {
      expect(encodeCaesar("XYZ", 3)).toBe("ABC");
    });

    it("小文字も正しく変換される", () => {
      expect(encodeCaesar("abc", 3)).toBe("def");
    });

    it("大文字・小文字を保持する", () => {
      expect(encodeCaesar("Hello", 1)).toBe("Ifmmp");
    });
  });

  describe("英字以外の文字", () => {
    it("数字はそのまま保持される", () => {
      expect(encodeCaesar("123", 5)).toBe("123");
    });

    it("記号はそのまま保持される", () => {
      expect(encodeCaesar("Hello, World!", 13)).toBe("Uryyb, Jbeyq!");
    });

    it("日本語はそのまま保持される", () => {
      expect(encodeCaesar("Hello世界", 3)).toBe("Khoor世界");
    });

    it("スペースはそのまま保持される", () => {
      expect(encodeCaesar("A B C", 1)).toBe("B C D");
    });
  });

  describe("シフト量の境界値", () => {
    it("シフト0では変換なし", () => {
      expect(encodeCaesar("Hello", 0)).toBe("Hello");
    });

    it("シフト25で 'A' → 'Z' になる", () => {
      expect(encodeCaesar("A", 25)).toBe("Z");
    });

    it("シフト26は0と同じ（フルラップアラウンド）", () => {
      expect(encodeCaesar("Hello", 26)).toBe("Hello");
    });

    it("シフト27はシフト1と同じ", () => {
      expect(encodeCaesar("A", 27)).toBe("B");
    });

    it("負のシフトも正しく処理される", () => {
      expect(encodeCaesar("D", -3)).toBe("A");
    });
  });

  describe("空文字列", () => {
    it("空文字列を変換すると空文字列になる", () => {
      expect(encodeCaesar("", 13)).toBe("");
    });
  });
});

describe("decodeCaesar", () => {
  it("エンコードの逆変換になる", () => {
    const original = "Hello World";
    const encoded = encodeCaesar(original, 7);
    expect(decodeCaesar(encoded, 7)).toBe(original);
  });

  it("シフト3でデコードできる", () => {
    expect(decodeCaesar("DEF", 3)).toBe("ABC");
  });

  it("アルファベット先頭でラップアラウンドする", () => {
    expect(decodeCaesar("ABC", 3)).toBe("XYZ");
  });

  it("空文字列はそのまま", () => {
    expect(decodeCaesar("", 13)).toBe("");
  });

  describe("往復変換", () => {
    it("ASCII テキストで往復変換が成功する", () => {
      const original = "The Quick Brown Fox";
      expect(decodeCaesar(encodeCaesar(original, 5), 5)).toBe(original);
    });

    it("記号・数字混在で往復変換が成功する", () => {
      const original = "Hello, World! 123";
      expect(decodeCaesar(encodeCaesar(original, 17), 17)).toBe(original);
    });

    it("日本語混在で往復変換が成功する", () => {
      const original = "Konnichiwa こんにちは";
      expect(decodeCaesar(encodeCaesar(original, 10), 10)).toBe(original);
    });
  });
});

describe("rot13", () => {
  it("'Hello' → 'Uryyb' になる", () => {
    expect(rot13("Hello")).toBe("Uryyb");
  });

  it("2回適用すると元のテキストに戻る（対称性）", () => {
    const text = "Hello, World!";
    expect(rot13(rot13(text))).toBe(text);
  });

  it("大文字・小文字を保持する", () => {
    expect(rot13("ABCxyz")).toBe("NOPklm");
  });

  it("数字・記号はそのまま", () => {
    expect(rot13("ROT13: 123!")).toBe("EBG13: 123!");
  });

  it("空文字列は空文字列のまま", () => {
    expect(rot13("")).toBe("");
  });
});

describe("bruteForce", () => {
  it("26パターンの結果を返す", () => {
    const results = bruteForce("Hello");
    expect(results).toHaveLength(26);
  });

  it("各結果にshiftとresultプロパティがある", () => {
    const results = bruteForce("ABC");
    expect(results[0]).toHaveProperty("shift", 0);
    expect(results[0]).toHaveProperty("result");
  });

  it("シフト0はそのまま（デコードなし）", () => {
    const results = bruteForce("DEF");
    expect(results[0]?.result).toBe("DEF");
  });

  it("シフト3でエンコードされたテキストのシフト3がABCになる", () => {
    const encoded = encodeCaesar("ABC", 3);
    const results = bruteForce(encoded);
    expect(results[3]?.result).toBe("ABC");
  });

  it("空文字列に対しても26パターンを返す", () => {
    const results = bruteForce("");
    expect(results).toHaveLength(26);
    expect(results[0]?.result).toBe("");
  });
});
