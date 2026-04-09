import { describe, expect, it } from "vite-plus/test";
import {
  adfgvxEncrypt,
  adfgvxDecrypt,
  createPolybiusAlphabet,
  createPolybiusSquare,
  isValidTranspositionKey,
} from "../../app/utils/adfgvx";

describe("createPolybiusAlphabet", () => {
  it("キーなしの場合デフォルト順（A-Z0-9）になる", () => {
    const alpha = createPolybiusAlphabet("");
    expect(alpha).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
    expect(alpha.length).toBe(36);
  });

  it("キーの文字が先頭に来る", () => {
    const alpha = createPolybiusAlphabet("KEY");
    expect(alpha.startsWith("KEY")).toBe(true);
    expect(alpha.length).toBe(36);
  });

  it("キーの重複文字は除去される", () => {
    const alpha = createPolybiusAlphabet("AABBCC");
    expect(alpha.startsWith("ABC")).toBe(true);
    expect(alpha.length).toBe(36);
  });

  it("36文字すべてが含まれる", () => {
    const alpha = createPolybiusAlphabet("KEYWORD");
    const chars = new Set(alpha.split(""));
    for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
      expect(chars.has(c)).toBe(true);
    }
  });

  it("小文字は大文字に変換される", () => {
    const alpha = createPolybiusAlphabet("key");
    expect(alpha.startsWith("KEY")).toBe(true);
  });
});

describe("createPolybiusSquare", () => {
  it("6×6の配列を返す", () => {
    const square = createPolybiusSquare("KEYWORD");
    expect(square.length).toBe(6);
    for (const row of square) {
      expect(row.length).toBe(6);
    }
  });

  it("全36文字が1回ずつ含まれる", () => {
    const square = createPolybiusSquare("KEYWORD");
    const flat = square.flat();
    expect(flat.length).toBe(36);
    const unique = new Set(flat);
    expect(unique.size).toBe(36);
  });
});

describe("adfgvxEncrypt", () => {
  it("ADFGVXの6文字のみの出力になる", () => {
    const result = adfgvxEncrypt("HELLO", "KEY", "SECRET");
    expect(result).toMatch(/^[ADFGVX]+$/);
  });

  it("出力は入力英字数の2倍の長さになる", () => {
    const result = adfgvxEncrypt("HELLO", "KEY", "SECRET");
    // HELLO = 5文字 → 換字で10文字 → 転置しても10文字
    expect(result.length).toBe(10);
  });

  it("英数字のみ処理され、スペースは除去される", () => {
    const withSpace = adfgvxEncrypt("HE LL O", "KEY", "SECRET");
    const withoutSpace = adfgvxEncrypt("HELLO", "KEY", "SECRET");
    expect(withSpace).toBe(withoutSpace);
  });

  it("記号は除去される", () => {
    const withSymbol = adfgvxEncrypt("HELLO!", "KEY", "SECRET");
    const withoutSymbol = adfgvxEncrypt("HELLO", "KEY", "SECRET");
    expect(withSymbol).toBe(withoutSymbol);
  });

  it("数字も暗号化される", () => {
    const result = adfgvxEncrypt("ABC123", "KEY", "SECRET");
    expect(result).toMatch(/^[ADFGVX]+$/);
    expect(result.length).toBe(12); // 6文字 × 2
  });

  it("空文字列は空文字列を返す", () => {
    expect(adfgvxEncrypt("", "KEY", "SECRET")).toBe("");
  });

  it("スペースのみは空文字列を返す", () => {
    expect(adfgvxEncrypt("   ", "KEY", "SECRET")).toBe("");
  });

  it("転置キーが無効な場合は空文字列を返す", () => {
    expect(adfgvxEncrypt("HELLO", "KEY", "")).toBe("");
    expect(adfgvxEncrypt("HELLO", "KEY", "123")).toBe("");
  });
});

describe("adfgvxDecrypt", () => {
  it("偶数文字数でない場合は空文字列を返す", () => {
    expect(adfgvxDecrypt("ADF", "KEY", "SECRET")).toBe("");
  });

  it("ADFGVX以外の文字は無視される", () => {
    const encrypted = adfgvxEncrypt("HELLO", "KEY", "SECRET");
    const withSpaces = encrypted.split("").join(" ");
    const decrypted = adfgvxDecrypt(withSpaces, "KEY", "SECRET");
    expect(decrypted).toBe("HELLO");
  });
});

describe("往復変換（暗号化→復号化）", () => {
  it("英字の往復変換が成功する", () => {
    const text = "HELLO";
    const pKey = "KEY";
    const tKey = "SECRET";
    const encrypted = adfgvxEncrypt(text, pKey, tKey);
    const decrypted = adfgvxDecrypt(encrypted, pKey, tKey);
    expect(decrypted).toBe(text);
  });

  it("数字を含むテキストの往復変換が成功する", () => {
    const text = "ATTACK1918";
    const pKey = "CRYPTO";
    const tKey = "GERMAN";
    const encrypted = adfgvxEncrypt(text, pKey, tKey);
    const decrypted = adfgvxDecrypt(encrypted, pKey, tKey);
    expect(decrypted).toBe(text);
  });

  it("長いテキストの往復変換が成功する", () => {
    const text = "THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG";
    const pKey = "POLYBIUS";
    const tKey = "ADFGVX";
    const encrypted = adfgvxEncrypt(text, pKey, tKey);
    const decrypted = adfgvxDecrypt(encrypted, pKey, tKey);
    expect(decrypted).toBe(text);
  });

  it("1文字テキストの往復変換が成功する", () => {
    const text = "A";
    const pKey = "KEY";
    const tKey = "AB";
    const encrypted = adfgvxEncrypt(text, pKey, tKey);
    const decrypted = adfgvxDecrypt(encrypted, pKey, tKey);
    expect(decrypted).toBe(text);
  });

  it("転置キーの長さより短いテキストの往復変換が成功する", () => {
    const text = "HI";
    const pKey = "KEY";
    const tKey = "LONGKEY";
    const encrypted = adfgvxEncrypt(text, pKey, tKey);
    const decrypted = adfgvxDecrypt(encrypted, pKey, tKey);
    expect(decrypted).toBe(text);
  });

  it("転置キーと同じ長さの文字列の往復変換が成功する", () => {
    const text = "ABCDE";
    const pKey = "TEST";
    const tKey = "ABCDE"; // 5文字キー
    const encrypted = adfgvxEncrypt(text, pKey, tKey);
    // 5文字×2=10文字の換字テキスト、5文字キー → 2行の転置
    const decrypted = adfgvxDecrypt(encrypted, pKey, tKey);
    expect(decrypted).toBe(text);
  });

  it("転置キーの長さの倍数テキストの往復変換が成功する", () => {
    const text = "ABCDEFGH"; // 8文字
    const pKey = "KEYWORD";
    const tKey = "ABCD"; // 4文字キー → 換字後16文字、4列×4行
    const encrypted = adfgvxEncrypt(text, pKey, tKey);
    const decrypted = adfgvxDecrypt(encrypted, pKey, tKey);
    expect(decrypted).toBe(text);
  });

  it("異なるポリビウスキーで復号化すると異なる結果になる", () => {
    const text = "HELLO";
    const pKey = "KEY";
    const tKey = "SECRET";
    const encrypted = adfgvxEncrypt(text, pKey, tKey);
    const wrongDecrypted = adfgvxDecrypt(encrypted, "WRONG", tKey);
    expect(wrongDecrypted).not.toBe(text);
  });

  it("異なる転置キーで復号化すると異なる結果になる", () => {
    const text = "HELLO";
    const pKey = "KEY";
    const tKey = "SECRET";
    const encrypted = adfgvxEncrypt(text, pKey, tKey);
    const wrongDecrypted = adfgvxDecrypt(encrypted, pKey, "WRONG");
    expect(wrongDecrypted).not.toBe(text);
  });

  it("小文字入力は大文字で復号化される", () => {
    const text = "hello";
    const pKey = "KEY";
    const tKey = "SECRET";
    const encrypted = adfgvxEncrypt(text, pKey, tKey);
    const decrypted = adfgvxDecrypt(encrypted, pKey, tKey);
    expect(decrypted).toBe("HELLO"); // 復号化は常に大文字
  });
});

describe("isValidTranspositionKey", () => {
  it("英字を含むキーは有効", () => {
    expect(isValidTranspositionKey("SECRET")).toBe(true);
    expect(isValidTranspositionKey("A")).toBe(true);
    expect(isValidTranspositionKey("key123")).toBe(true);
  });

  it("英字を含まないキーは無効", () => {
    expect(isValidTranspositionKey("")).toBe(false);
    expect(isValidTranspositionKey("123")).toBe(false);
    expect(isValidTranspositionKey("!@#")).toBe(false);
  });
});
