import { describe, expect, it } from "vite-plus/test";
import { atbash, getAtbashTable } from "../../app/utils/atbash";

describe("atbash", () => {
  describe("基本的な英字変換", () => {
    it("'A' → 'Z' になる", () => {
      expect(atbash("A")).toBe("Z");
    });

    it("'Z' → 'A' になる", () => {
      expect(atbash("Z")).toBe("A");
    });

    it("'HELLO' → 'SVOOL' になる", () => {
      expect(atbash("HELLO")).toBe("SVOOL");
    });

    it("小文字も正しく変換される", () => {
      expect(atbash("a")).toBe("z");
      expect(atbash("hello")).toBe("svool");
    });

    it("大文字・小文字を保持する", () => {
      expect(atbash("Hello")).toBe("Svool");
    });
  });

  describe("非英字文字の処理", () => {
    it("数字はそのまま保持される", () => {
      expect(atbash("ABC123")).toBe("ZYX123");
    });

    it("記号はそのまま保持される", () => {
      expect(atbash("Hello, World!")).toBe("Svool, Dliow!");
    });

    it("日本語はそのまま保持される", () => {
      expect(atbash("ABCあいう")).toBe("ZYXあいう");
    });

    it("スペースはそのまま保持される", () => {
      expect(atbash("A B C")).toBe("Z Y X");
    });
  });

  describe("自己逆関数（対称性）", () => {
    it("2回適用すると元のテキストに戻る", () => {
      const text = "Hello, World!";
      expect(atbash(atbash(text))).toBe(text);
    });

    it("英数字混在でも往復変換が成功する", () => {
      const text = "The Quick Brown Fox 123";
      expect(atbash(atbash(text))).toBe(text);
    });

    it("日本語混在でも往復変換が成功する", () => {
      const text = "Hello世界";
      expect(atbash(atbash(text))).toBe(text);
    });
  });

  describe("境界値テスト", () => {
    it("空文字列を変換すると空文字列になる", () => {
      expect(atbash("")).toBe("");
    });

    it("英字のみのアルファベット全文字を変換する", () => {
      expect(atbash("ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toBe("ZYXWVUTSRQPONMLKJIHGFEDCBA");
    });

    it("中間文字 M → N, N → M", () => {
      expect(atbash("MN")).toBe("NM");
    });
  });
});

describe("getAtbashTable", () => {
  it("26文字分のマッピングを返す", () => {
    const table = getAtbashTable();
    expect(table).toHaveLength(26);
  });

  it("最初のエントリが A → Z", () => {
    const table = getAtbashTable();
    expect(table[0]).toEqual({ original: "A", mapped: "Z" });
  });

  it("最後のエントリが Z → A", () => {
    const table = getAtbashTable();
    expect(table[25]).toEqual({ original: "Z", mapped: "A" });
  });

  it("各エントリが original と mapped プロパティを持つ", () => {
    const table = getAtbashTable();
    for (const entry of table) {
      expect(entry).toHaveProperty("original");
      expect(entry).toHaveProperty("mapped");
    }
  });

  it("マッピングがアトバシュ変換と一致する", () => {
    const table = getAtbashTable();
    for (const { original, mapped } of table) {
      expect(atbash(original)).toBe(mapped);
    }
  });
});
