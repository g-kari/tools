import { describe, it, expect } from "vite-plus/test";
import {
  selectWord,
  isLetterInWord,
  getMaskedWord,
  getGameStatus,
} from "../../app/routes/hangman";

describe("ハングマンゲーム", () => {
  describe("selectWord", () => {
    it("ランダムカテゴリ（-1）で単語を選択できる", () => {
      const { word, catIndex } = selectWord(-1);
      expect(word).toBeTruthy();
      expect(word.length).toBeGreaterThan(0);
      expect(catIndex).toBeGreaterThanOrEqual(0);
      expect(catIndex).toBeLessThanOrEqual(3);
    });

    it("指定カテゴリ（0）で単語を選択できる", () => {
      const { word, catIndex } = selectWord(0);
      expect(word).toBeTruthy();
      expect(catIndex).toBe(0);
    });

    it("指定カテゴリ（1）で単語を選択できる", () => {
      const { word, catIndex } = selectWord(1);
      expect(word).toBeTruthy();
      expect(catIndex).toBe(1);
    });

    it("選択された単語はアルファベット大文字のみ", () => {
      for (let i = 0; i < 3; i++) {
        const { word } = selectWord(-1);
        expect(word).toMatch(/^[A-Z]+$/);
      }
    });
  });

  describe("isLetterInWord", () => {
    it("単語に含まれる文字を正しく判定する", () => {
      expect(isLetterInWord("ARRAY", "A")).toBe(true);
      expect(isLetterInWord("ARRAY", "R")).toBe(true);
      expect(isLetterInWord("ARRAY", "Y")).toBe(true);
    });

    it("単語に含まれない文字を正しく判定する", () => {
      expect(isLetterInWord("ARRAY", "B")).toBe(false);
      expect(isLetterInWord("ARRAY", "C")).toBe(false);
      expect(isLetterInWord("ARRAY", "Z")).toBe(false);
    });

    it("小文字入力でも大文字として判定する", () => {
      expect(isLetterInWord("ARRAY", "a")).toBe(true);
      expect(isLetterInWord("ARRAY", "b")).toBe(false);
    });

    it("空文字列の単語はfalseを返す", () => {
      expect(isLetterInWord("", "A")).toBe(false);
    });
  });

  describe("getMaskedWord", () => {
    it("推測なしではすべてアンダースコア", () => {
      const result = getMaskedWord("HELLO", new Set());
      expect(result).toEqual(["_", "_", "_", "_", "_"]);
    });

    it("一致する文字が表示される", () => {
      const result = getMaskedWord("HELLO", new Set(["H", "E"]));
      expect(result).toEqual(["H", "E", "_", "_", "_"]);
    });

    it("すべて推測済みなら単語が完全に表示される", () => {
      const result = getMaskedWord("CAT", new Set(["C", "A", "T"]));
      expect(result).toEqual(["C", "A", "T"]);
    });

    it("重複文字が正しく処理される", () => {
      const result = getMaskedWord("ARRAY", new Set(["A", "R"]));
      expect(result).toEqual(["A", "R", "R", "A", "Y"].map((l) =>
        ["A", "R"].includes(l) ? l : "_"
      ));
    });

    it("空の単語では空配列を返す", () => {
      const result = getMaskedWord("", new Set());
      expect(result).toEqual([]);
    });
  });

  describe("getGameStatus", () => {
    it("ゲーム中は playing を返す", () => {
      const status = getGameStatus("HELLO", new Set(["H"]), 2);
      expect(status).toBe("playing");
    });

    it("すべての文字を推測したら won を返す", () => {
      const status = getGameStatus("CAT", new Set(["C", "A", "T"]), 0);
      expect(status).toBe("won");
    });

    it("ミス6回で lost を返す", () => {
      const status = getGameStatus("HELLO", new Set(["Z", "X", "Q"]), 6);
      expect(status).toBe("lost");
    });

    it("ミス5回はまだ playing", () => {
      const status = getGameStatus("HELLO", new Set([]), 5);
      expect(status).toBe("playing");
    });

    it("ミス6回かつ単語完成で lost を返す（ミスが優先）", () => {
      const status = getGameStatus("CAT", new Set(["C", "A", "T"]), 6);
      expect(status).toBe("lost");
    });

    it("ミスなし・全文字推測で won を返す", () => {
      const status = getGameStatus("DOG", new Set(["D", "O", "G"]), 0);
      expect(status).toBe("won");
    });
  });
});
