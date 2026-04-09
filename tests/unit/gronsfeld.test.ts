import { describe, expect, it } from "vite-plus/test";
import {
  gronsfeldEncrypt,
  gronsfeldDecrypt,
  normalizeKey,
  isValidKey,
} from "../../app/utils/gronsfeld";

describe("gronsfeldEncrypt", () => {
  describe("基本的な英字暗号化", () => {
    it("キー'0'ではシフトなし（元の文字のまま）", () => {
      expect(gronsfeldEncrypt("HELLO", "0")).toBe("HELLO");
    });

    it("キー'1'で 'A' → 'B' になる", () => {
      expect(gronsfeldEncrypt("A", "1")).toBe("B");
    });

    it("キー'3'で 'A' → 'D' になる", () => {
      expect(gronsfeldEncrypt("A", "3")).toBe("D");
    });

    it("キー'1234'で 'HELLO' が正しく暗号化される", () => {
      // H(7)+1=8=I, E(4)+2=6=G, L(11)+3=14=O, L(11)+4=15=P, O(14)+1=15=P
      expect(gronsfeldEncrypt("HELLO", "1234")).toBe("IGOPP");
    });

    it("小文字も正しく暗号化される", () => {
      expect(gronsfeldEncrypt("hello", "1234")).toBe("igopp");
    });

    it("大文字・小文字が保持される", () => {
      expect(gronsfeldEncrypt("Hello", "1234")).toBe("Igopp");
    });

    it("アルファベット末尾でラップアラウンドする", () => {
      // Z(25)+1=26→0=A
      expect(gronsfeldEncrypt("Z", "1")).toBe("A");
      // z(25)+1=26→0=a
      expect(gronsfeldEncrypt("z", "1")).toBe("a");
    });
  });

  describe("往復変換（暗号化→復号化）", () => {
    it("暗号化して復号化すると元のテキストに戻る", () => {
      const text = "HELLO";
      const key = "1234";
      expect(gronsfeldDecrypt(gronsfeldEncrypt(text, key), key)).toBe(text);
    });

    it("小文字でも往復変換が成功する", () => {
      const text = "hello world";
      const key = "9876";
      expect(gronsfeldDecrypt(gronsfeldEncrypt(text, key), key)).toBe(text);
    });

    it("英数字混在でも往復変換が成功する", () => {
      const text = "The Quick Brown Fox 123";
      const key = "31415";
      expect(gronsfeldDecrypt(gronsfeldEncrypt(text, key), key)).toBe(text);
    });

    it("日本語混在でも往復変換が成功する", () => {
      const text = "Hello世界";
      const key = "007";
      expect(gronsfeldDecrypt(gronsfeldEncrypt(text, key), key)).toBe(text);
    });
  });

  describe("非英字文字の処理", () => {
    it("数字はそのまま保持される", () => {
      const result = gronsfeldEncrypt("ABC123", "5");
      expect(result.slice(3)).toBe("123");
    });

    it("記号はそのまま保持される", () => {
      const result = gronsfeldEncrypt("Hello, World!", "1");
      expect(result[5]).toBe(",");
      expect(result[result.length - 1]).toBe("!");
    });

    it("日本語はそのまま保持される", () => {
      const result = gronsfeldEncrypt("ABCあいう", "3");
      expect(result.slice(3)).toBe("あいう");
    });

    it("スペースはそのまま保持される", () => {
      const result = gronsfeldEncrypt("A B C", "2");
      expect(result[1]).toBe(" ");
      expect(result[3]).toBe(" ");
    });
  });

  describe("キーが無効な場合", () => {
    it("空のキーの場合は元のテキストをそのまま返す", () => {
      expect(gronsfeldEncrypt("HELLO", "")).toBe("HELLO");
    });

    it("数字を含まないキーの場合は元のテキストをそのまま返す", () => {
      expect(gronsfeldEncrypt("HELLO", "ABC")).toBe("HELLO");
    });
  });

  describe("境界値テスト", () => {
    it("空文字列を暗号化すると空文字列になる", () => {
      expect(gronsfeldEncrypt("", "123")).toBe("");
    });

    it("キーが1桁の場合も正しく動作する", () => {
      const text = "ABCDE";
      const key = "3";
      const encrypted = gronsfeldEncrypt(text, key);
      expect(gronsfeldDecrypt(encrypted, key)).toBe(text);
    });

    it("テキストよりキーが長い場合も正しく動作する", () => {
      const text = "AB";
      const key = "12345678";
      const encrypted = gronsfeldEncrypt(text, key);
      expect(gronsfeldDecrypt(encrypted, key)).toBe(text);
    });

    it("キーが循環して正しく動作する", () => {
      const text = "AAABBB";
      const key = "12";
      const encrypted = gronsfeldEncrypt(text, key);
      expect(gronsfeldDecrypt(encrypted, key)).toBe(text);
    });

    it("キー'9'でラップアラウンドが正しく動作する", () => {
      // S(18)+9=27→1=B
      expect(gronsfeldEncrypt("S", "9")).toBe("B");
    });
  });
});

describe("gronsfeldDecrypt", () => {
  it("キー'1234'で 'IGOPP' が正しく復号化される", () => {
    expect(gronsfeldDecrypt("IGOPP", "1234")).toBe("HELLO");
  });

  it("キー'0'ではシフトなし（元の文字のまま）", () => {
    expect(gronsfeldDecrypt("HELLO", "0")).toBe("HELLO");
  });

  it("アルファベット先頭でラップアラウンドする", () => {
    // A(0)-1+26=25=Z
    expect(gronsfeldDecrypt("A", "1")).toBe("Z");
  });
});

describe("normalizeKey", () => {
  it("数字のみ残す", () => {
    expect(normalizeKey("1234")).toBe("1234");
  });

  it("英字・記号を除去する", () => {
    expect(normalizeKey("12A3!")).toBe("123");
  });

  it("空文字列を返す（キーが数字なし）", () => {
    expect(normalizeKey("ABC")).toBe("");
  });

  it("全桁が0でも有効", () => {
    expect(normalizeKey("0000")).toBe("0000");
  });
});

describe("isValidKey", () => {
  it("数字を含むキーは有効", () => {
    expect(isValidKey("1234")).toBe(true);
    expect(isValidKey("0")).toBe(true);
    expect(isValidKey("9A9")).toBe(true);
  });

  it("数字を含まないキーは無効", () => {
    expect(isValidKey("")).toBe(false);
    expect(isValidKey("ABC")).toBe(false);
    expect(isValidKey("!@#")).toBe(false);
  });
});
