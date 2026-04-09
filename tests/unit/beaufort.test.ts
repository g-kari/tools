import { describe, expect, it } from "vite-plus/test";
import { beaufort, normalizeKey, isValidKey } from "../../app/utils/beaufort";

describe("beaufort", () => {
  describe("基本的な英字変換", () => {
    it("キー'A'で変換するとアトバシュ的な変換になる", () => {
      // K=0 なので C = (0 - P + 26) % 26 = (-P + 26) % 26 = 26 - P (mod 26)
      // A(0) → (0-0+26)%26 = 0 = A
      expect(beaufort("A", "A")).toBe("A");
    });

    it("キー'B'で 'A' → 'B' になる", () => {
      // K=1, P=0 → C=(1-0+26)%26=1=B
      expect(beaufort("A", "B")).toBe("B");
    });

    it("キー'KEY'で 'HELLO' が正しく変換される", () => {
      // H(7) + K(10): (10-7)=3=D
      // E(4) + E(4): (4-4)=0=A
      // L(11) + Y(24): (24-11)=13=N
      // L(11) + K(10): (10-11+26)=25=Z
      // O(14) + E(4): (4-14+26)=16=Q
      expect(beaufort("HELLO", "KEY")).toBe("DANZQ");
    });

    it("小文字も正しく変換される", () => {
      expect(beaufort("hello", "KEY")).toBe("danzq");
    });

    it("大文字・小文字が保持される", () => {
      expect(beaufort("Hello", "KEY")).toBe("Danzq");
    });
  });

  describe("自己逆関数（対称性）", () => {
    it("2回適用すると元のテキストに戻る", () => {
      const text = "HELLO";
      const key = "KEY";
      expect(beaufort(beaufort(text, key), key)).toBe(text);
    });

    it("小文字でも往復変換が成功する", () => {
      const text = "hello world";
      const key = "secret";
      expect(beaufort(beaufort(text, key), key)).toBe(text);
    });

    it("英数字混在でも往復変換が成功する", () => {
      const text = "The Quick Brown Fox 123";
      const key = "BEAUFORT";
      expect(beaufort(beaufort(text, key), key)).toBe(text);
    });

    it("日本語混在でも往復変換が成功する", () => {
      const text = "Hello世界";
      const key = "TEST";
      expect(beaufort(beaufort(text, key), key)).toBe(text);
    });
  });

  describe("非英字文字の処理", () => {
    it("数字はそのまま保持される", () => {
      const result = beaufort("ABC123", "KEY");
      expect(result.slice(3)).toBe("123");
    });

    it("記号はそのまま保持される", () => {
      const result = beaufort("Hello, World!", "KEY");
      expect(result[5]).toBe(",");
      expect(result[result.length - 1]).toBe("!");
    });

    it("日本語はそのまま保持される", () => {
      const result = beaufort("ABCあいう", "KEY");
      expect(result.slice(3)).toBe("あいう");
    });

    it("スペースはそのまま保持される", () => {
      const result = beaufort("A B C", "KEY");
      expect(result[1]).toBe(" ");
      expect(result[3]).toBe(" ");
    });
  });

  describe("キーが無効な場合", () => {
    it("空のキーの場合は元のテキストをそのまま返す", () => {
      expect(beaufort("HELLO", "")).toBe("HELLO");
    });

    it("英字を含まないキーの場合は元のテキストをそのまま返す", () => {
      expect(beaufort("HELLO", "123")).toBe("HELLO");
    });
  });

  describe("境界値テスト", () => {
    it("空文字列を変換すると空文字列になる", () => {
      expect(beaufort("", "KEY")).toBe("");
    });

    it("キーが1文字の場合も正しく動作する", () => {
      const text = "ABCDE";
      const key = "C";
      const result = beaufort(text, key);
      expect(beaufort(result, key)).toBe(text);
    });

    it("テキストよりキーが長い場合も正しく動作する", () => {
      const text = "AB";
      const key = "LONGKEY";
      const result = beaufort(text, key);
      expect(beaufort(result, key)).toBe(text);
    });

    it("キーが循環して正しく動作する", () => {
      const text = "AAABBB";
      const key = "AB";
      const result = beaufort(text, key);
      expect(beaufort(result, key)).toBe(text);
    });
  });
});

describe("normalizeKey", () => {
  it("英大文字のみ残す", () => {
    expect(normalizeKey("KEY")).toBe("KEY");
  });

  it("小文字を大文字に変換する", () => {
    expect(normalizeKey("key")).toBe("KEY");
  });

  it("数字・記号を除去する", () => {
    expect(normalizeKey("K3Y!")).toBe("KY");
  });

  it("空文字列を返す（キーが英字なし）", () => {
    expect(normalizeKey("123")).toBe("");
  });
});

describe("isValidKey", () => {
  it("英字を含むキーは有効", () => {
    expect(isValidKey("KEY")).toBe(true);
    expect(isValidKey("key")).toBe(true);
    expect(isValidKey("K3Y")).toBe(true);
  });

  it("英字を含まないキーは無効", () => {
    expect(isValidKey("")).toBe(false);
    expect(isValidKey("123")).toBe(false);
    expect(isValidKey("!@#")).toBe(false);
  });
});
