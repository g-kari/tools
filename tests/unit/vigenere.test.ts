import { describe, expect, it } from "vite-plus/test";
import { encodeVigenere, decodeVigenere, normalizeKey, isValidKey } from "../../app/utils/vigenere";

describe("normalizeKey", () => {
  it("英字のみのキーをそのまま大文字に変換する", () => {
    expect(normalizeKey("key")).toBe("KEY");
    expect(normalizeKey("SECRET")).toBe("SECRET");
  });

  it("数字・記号を除去する", () => {
    expect(normalizeKey("key123")).toBe("KEY");
    expect(normalizeKey("s3cr3t!")).toBe("SCRT");
  });

  it("大文字・小文字混在を大文字に統一する", () => {
    expect(normalizeKey("aBcDeF")).toBe("ABCDEF");
  });

  it("空文字列は空文字列になる", () => {
    expect(normalizeKey("")).toBe("");
  });

  it("英字がない場合は空文字列になる", () => {
    expect(normalizeKey("123!@#")).toBe("");
  });
});

describe("isValidKey", () => {
  it("英字を含むキーは有効", () => {
    expect(isValidKey("KEY")).toBe(true);
    expect(isValidKey("a")).toBe(true);
    expect(isValidKey("key123")).toBe(true);
  });

  it("英字を含まないキーは無効", () => {
    expect(isValidKey("")).toBe(false);
    expect(isValidKey("123")).toBe(false);
    expect(isValidKey("!@#")).toBe(false);
  });
});

describe("encodeVigenere", () => {
  describe("基本的な英字変換", () => {
    it("キー'A'（シフト0）ではテキストが変化しない", () => {
      expect(encodeVigenere("ABC", "A")).toBe("ABC");
    });

    it("キー'B'（シフト1）で 'A' → 'B' になる", () => {
      expect(encodeVigenere("A", "B")).toBe("B");
    });

    it("クラシックな例: キー'KEY'で 'ABC' → 'KFA' になる", () => {
      // A(+10=K), B(+4=F), C(+24=26%26=0=A)
      expect(encodeVigenere("ABC", "KEY")).toBe("KFA");
    });

    it("小文字も正しく変換される（大文字・小文字を保持）", () => {
      expect(encodeVigenere("abc", "KEY")).toBe("kfa");
    });

    it("大文字・小文字混在でも大文字小文字を保持する", () => {
      expect(encodeVigenere("AbC", "KEY")).toBe("KfA");
    });
  });

  describe("キーワードの繰り返し", () => {
    it("テキストがキーより長い場合、キーが繰り返される", () => {
      // A+K=K, B+E=F, C+Y=A(26%26=0), D+K=N（キーが繰り返し）
      expect(encodeVigenere("ABCD", "KEY")).toBe("KFAN");
    });

    it("キーが1文字の場合はシーザー暗号と同様", () => {
      expect(encodeVigenere("HELLO", "D")).toBe("KHOOR");
    });
  });

  describe("英字以外の文字", () => {
    it("数字はそのまま保持される", () => {
      expect(encodeVigenere("A1B", "KEY")).toBe("K1F");
    });

    it("スペースはそのまま保持されてキーインデックスは進まない", () => {
      expect(encodeVigenere("A B", "KEY")).toBe("K F");
    });

    it("日本語はそのまま保持される", () => {
      expect(encodeVigenere("A日B", "KEY")).toBe("K日F");
    });

    it("記号はそのまま保持される", () => {
      // H+K=R, e+E=i, l+Y=j, l+K=v, o+E=s, (,space pass), W+Y=U, o+K=y, r+E=v, l+Y=j, d+K=n
      expect(encodeVigenere("Hello, World!", "KEY")).toBe("Rijvs, Uyvjn!");
    });
  });

  describe("ラップアラウンド", () => {
    it("アルファベット末尾でラップアラウンドする", () => {
      // Z(+25=Y) → (25+25=50, 50%26=24=Y)
      expect(encodeVigenere("Z", "Z")).toBe("Y");
    });
  });

  describe("キーの正規化", () => {
    it("小文字キーは大文字として扱われる", () => {
      expect(encodeVigenere("ABC", "key")).toBe("KFA");
    });

    it("キーに数字が含まれていても英字部分のみ使用される", () => {
      // "k3y" → 正規化すると "KY"（3は除去）、"KEY"とは異なる
      expect(encodeVigenere("ABC", "k3y")).toBe(encodeVigenere("ABC", "ky"));
    });
  });

  describe("空文字列", () => {
    it("空テキストは空テキストになる", () => {
      expect(encodeVigenere("", "KEY")).toBe("");
    });

    it("空キーはテキストをそのまま返す", () => {
      expect(encodeVigenere("ABC", "")).toBe("ABC");
    });

    it("数字のみのキーはテキストをそのまま返す", () => {
      expect(encodeVigenere("ABC", "123")).toBe("ABC");
    });
  });
});

describe("decodeVigenere", () => {
  it("エンコードの逆変換になる", () => {
    const original = "Hello World";
    const encoded = encodeVigenere(original, "SECRET");
    expect(decodeVigenere(encoded, "SECRET")).toBe(original);
  });

  it("キー'KEY'で 'KFA' → 'ABC' になる", () => {
    expect(decodeVigenere("KFA", "KEY")).toBe("ABC");
  });

  it("空テキストは空テキストになる", () => {
    expect(decodeVigenere("", "KEY")).toBe("");
  });

  it("空キーはテキストをそのまま返す", () => {
    expect(decodeVigenere("ABC", "")).toBe("ABC");
  });

  describe("往復変換", () => {
    it("ASCII テキストで往復変換が成功する", () => {
      const original = "The Quick Brown Fox";
      expect(decodeVigenere(encodeVigenere(original, "VIGENERE"), "VIGENERE")).toBe(original);
    });

    it("記号・数字混在で往復変換が成功する", () => {
      const original = "Hello, World! 123";
      expect(decodeVigenere(encodeVigenere(original, "CRYPTO"), "CRYPTO")).toBe(original);
    });

    it("日本語混在で往復変換が成功する", () => {
      const original = "Hello こんにちは World";
      expect(decodeVigenere(encodeVigenere(original, "TEST"), "TEST")).toBe(original);
    });

    it("長いテキストと短いキーで往復変換が成功する", () => {
      const original = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      expect(decodeVigenere(encodeVigenere(original, "AB"), "AB")).toBe(original);
    });
  });
});
