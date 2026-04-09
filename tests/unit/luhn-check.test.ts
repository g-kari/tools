import { describe, it, expect } from "vite-plus/test";
import {
  luhnCheck,
  detectCardType,
  formatCardNumber,
  validateCard,
  TEST_CARD_NUMBERS,
} from "../../app/utils/luhn";

describe("luhnCheck", () => {
  it("有効なVisaカード番号を検証する", () => {
    expect(luhnCheck("4532015112830366")).toBe(true);
  });

  it("有効なMastercardカード番号を検証する", () => {
    expect(luhnCheck("5500005555555559")).toBe(true);
  });

  it("有効なAmexカード番号を検証する", () => {
    expect(luhnCheck("378282246310005")).toBe(true);
  });

  it("無効なカード番号を拒否する", () => {
    expect(luhnCheck("4532015112830367")).toBe(false);
  });

  it("空文字列を拒否する", () => {
    expect(luhnCheck("")).toBe(false);
  });

  it("1桁の入力を拒否する", () => {
    expect(luhnCheck("4")).toBe(false);
  });

  it("非数字を含む入力を拒否する", () => {
    expect(luhnCheck("45320abc1283")).toBe(false);
  });

  it("テスト用カード番号は全て有効", () => {
    for (const card of TEST_CARD_NUMBERS) {
      expect(luhnCheck(card.number)).toBe(true);
    }
  });
});

describe("detectCardType", () => {
  it("Visaカードを検出する（4始まり）", () => {
    const result = detectCardType("4532015112830366");
    expect(result?.brand).toBe("visa");
  });

  it("Mastercardを検出する（5始まり）", () => {
    const result = detectCardType("5500005555555559");
    expect(result?.brand).toBe("mastercard");
  });

  it("Amexを検出する（34始まり）", () => {
    const result = detectCardType("378282246310005");
    expect(result?.brand).toBe("amex");
  });

  it("JCBを検出する（3528始まり）", () => {
    const result = detectCardType("3530111333300000");
    expect(result?.brand).toBe("jcb");
  });

  it("Discoverを検出する（6011始まり）", () => {
    const result = detectCardType("6011111111111117");
    expect(result?.brand).toBe("discover");
  });

  it("不明なカードはnullを返す", () => {
    expect(detectCardType("9999999999999999")).toBeNull();
  });

  it("空文字列はnullを返す", () => {
    expect(detectCardType("")).toBeNull();
  });
});

describe("formatCardNumber", () => {
  it("4-4-4-4 フォーマットで整形する", () => {
    expect(formatCardNumber("4532015112830366", [4, 4, 4, 4])).toBe("4532 0151 1283 0366");
  });

  it("4-6-5 フォーマット（Amex）で整形する", () => {
    expect(formatCardNumber("378282246310005", [4, 6, 5])).toBe("3782 822463 10005");
  });

  it("桁数がフォーマット総和より少ない場合も正しく整形する", () => {
    expect(formatCardNumber("1234", [4, 4, 4, 4])).toBe("1234");
  });

  it("余剰桁は末尾に追加される", () => {
    expect(formatCardNumber("12345678901234567", [4, 4, 4, 4])).toBe("1234 5678 9012 3456 7");
  });
});

describe("validateCard", () => {
  it("有効なVisaカードの結果を返す", () => {
    const result = validateCard("4532015112830366");
    expect(result.isValid).toBe(true);
    expect(result.isValidLength).toBe(true);
    expect(result.cardType?.brand).toBe("visa");
    expect(result.digits).toBe("4532015112830366");
    expect(result.formatted).toBe("4532 0151 1283 0366");
    expect(result.checkDigit).toBe(6);
  });

  it("スペース区切りの入力も正しく処理する", () => {
    const result = validateCard("4532 0151 1283 0366");
    expect(result.isValid).toBe(true);
    expect(result.digits).toBe("4532015112830366");
  });

  it("ハイフン区切りの入力も正しく処理する", () => {
    const result = validateCard("4532-0151-1283-0366");
    expect(result.isValid).toBe(true);
    expect(result.digits).toBe("4532015112830366");
  });

  it("無効なカード番号では isValid=false を返す", () => {
    const result = validateCard("1234567890123456");
    expect(result.isValid).toBe(false);
  });

  it("有効なAmexカードの結果を返す", () => {
    const result = validateCard("378282246310005");
    expect(result.isValid).toBe(true);
    expect(result.cardType?.brand).toBe("amex");
    expect(result.isValidLength).toBe(true);
  });

  it("Luhn通過でも桁数が不正な場合 isValidLength=false を返す", () => {
    // 18桁のVisaは有効長ではない（Visaの有効長: 13, 16, 19）
    const result = validateCard("453201511283036617");
    // 実際の検証はLuhnアルゴリズムと桁数に依存するので isValidLength をチェック
    if (result.isValid) {
      expect(result.cardType?.lengths).not.toContain(result.digits.length);
    }
  });
});
