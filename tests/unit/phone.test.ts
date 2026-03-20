import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  classifyPhone,
  formatHyphenated,
  parsePhone,
  SAMPLE_PHONE_NUMBERS,
} from "../../app/utils/phone";

describe("normalizePhone", () => {
  it("全角数字を半角に変換する", () => {
    expect(normalizePhone("０９０１２３４５６７８")).toBe("09012345678");
  });

  it("ハイフンを除去する", () => {
    expect(normalizePhone("090-1234-5678")).toBe("09012345678");
  });

  it("スペースを除去する", () => {
    expect(normalizePhone("090 1234 5678")).toBe("09012345678");
  });

  it("混在入力を正規化する", () => {
    expect(normalizePhone("０９０－1234－5678")).toBe("09012345678");
  });

  it("空文字列は空文字列を返す", () => {
    expect(normalizePhone("")).toBe("");
  });
});

describe("classifyPhone", () => {
  it("090で始まる番号を携帯電話と判定する", () => {
    expect(classifyPhone("09012345678")).toBe("mobile");
  });

  it("080で始まる番号を携帯電話と判定する", () => {
    expect(classifyPhone("08012345678")).toBe("mobile");
  });

  it("070で始まる番号を携帯電話と判定する", () => {
    expect(classifyPhone("07012345678")).toBe("mobile");
  });

  it("050で始まる番号をIP電話と判定する", () => {
    expect(classifyPhone("05012345678")).toBe("ip_phone");
  });

  it("0120で始まる番号をフリーダイヤルと判定する", () => {
    expect(classifyPhone("0120123456")).toBe("freephone");
  });

  it("0800で始まる番号をフリーダイヤルと判定する", () => {
    expect(classifyPhone("08001234567")).toBe("freephone");
  });

  it("0570で始まる番号をナビダイヤルと判定する", () => {
    expect(classifyPhone("0570123456")).toBe("navi_dial");
  });

  it("110を緊急電話と判定する", () => {
    expect(classifyPhone("110")).toBe("emergency");
  });

  it("119を緊急電話と判定する", () => {
    expect(classifyPhone("119")).toBe("emergency");
  });

  it("118を緊急電話と判定する", () => {
    expect(classifyPhone("118")).toBe("emergency");
  });

  it("03で始まる番号を固定電話と判定する", () => {
    expect(classifyPhone("0312345678")).toBe("landline");
  });

  it("0で始まらない番号をunknownと判定する", () => {
    expect(classifyPhone("1234567890")).toBe("unknown");
  });
});

describe("formatHyphenated", () => {
  it("携帯電話11桁をハイフン区切りにフォーマットする", () => {
    expect(formatHyphenated("09012345678", "mobile")).toBe("090-1234-5678");
  });

  it("IP電話11桁をハイフン区切りにフォーマットする", () => {
    expect(formatHyphenated("05012345678", "ip_phone")).toBe("050-1234-5678");
  });

  it("0120フリーダイヤル10桁をフォーマットする", () => {
    expect(formatHyphenated("0120123456", "freephone")).toBe("0120-123-456");
  });

  it("0800フリーダイヤル11桁をフォーマットする", () => {
    expect(formatHyphenated("08001234567", "freephone")).toBe("0800-123-4567");
  });

  it("ナビダイヤル10桁をフォーマットする", () => {
    expect(formatHyphenated("0570123456", "navi_dial")).toBe("0570-123-456");
  });

  it("東京(03)固定電話をフォーマットする", () => {
    expect(formatHyphenated("0312345678", "landline")).toBe("03-1234-5678");
  });

  it("大阪(06)固定電話をフォーマットする", () => {
    expect(formatHyphenated("0612345678", "landline")).toBe("06-1234-5678");
  });

  it("横浜(045)固定電話をフォーマットする", () => {
    expect(formatHyphenated("0451234567", "landline")).toBe("045-1234-567");
  });

  it("緊急電話をそのまま返す", () => {
    expect(formatHyphenated("110", "emergency")).toBe("110");
  });

  it("桁数が合わない場合はnullを返す", () => {
    expect(formatHyphenated("090123", "mobile")).toBeNull();
  });
});

describe("parsePhone", () => {
  describe("有効な番号", () => {
    it("携帯電話番号を正しく解析する", () => {
      const result = parsePhone("09012345678");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("mobile");
      expect(result.hyphenated).toBe("090-1234-5678");
      expect(result.international).toBe("+81 90-1234-5678");
      expect(result.e164).toBe("+819012345678");
    });

    it("東京固定電話を正しく解析する", () => {
      const result = parsePhone("0312345678");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("landline");
      expect(result.hyphenated).toBe("03-1234-5678");
      expect(result.international).toBe("+81 3-1234-5678");
      expect(result.e164).toBe("+81312345678");
    });

    it("フリーダイヤルを正しく解析する", () => {
      const result = parsePhone("0120123456");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("freephone");
      expect(result.hyphenated).toBe("0120-123-456");
    });

    it("緊急電話を正しく解析する", () => {
      const result = parsePhone("110");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("emergency");
      expect(result.e164).toBeNull();
    });
  });

  describe("全角・区切り文字の正規化", () => {
    it("全角入力を正規化して解析する", () => {
      const result = parsePhone("０９０１２３４５６７８");
      expect(result.isValid).toBe(true);
      expect(result.type).toBe("mobile");
      expect(result.normalized).toBe("09012345678");
    });

    it("ハイフン区切り入力を正規化して解析する", () => {
      const result = parsePhone("090-1234-5678");
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe("09012345678");
    });
  });

  describe("無効な番号", () => {
    it("空入力はisValid=falseを返す", () => {
      const result = parsePhone("");
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).not.toBeNull();
    });

    it("0から始まらない番号はisValid=falseを返す", () => {
      const result = parsePhone("1234567890");
      expect(result.isValid).toBe(false);
      expect(result.type).toBe("unknown");
    });

    it("桁数が不正な携帯電話番号はisValid=falseを返す", () => {
      const result = parsePhone("0901234567");
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).not.toBeNull();
    });
  });

  describe("サンプル番号の検証", () => {
    it("SAMPLE_PHONE_NUMBERSの全番号が正しく解析される", () => {
      for (const item of SAMPLE_PHONE_NUMBERS) {
        const result = parsePhone(item.number);
        expect(result.isValid).toBe(true);
      }
    });
  });
});

describe("SAMPLE_PHONE_NUMBERS", () => {
  it("少なくとも8件以上のサンプルが定義されている", () => {
    expect(SAMPLE_PHONE_NUMBERS.length).toBeGreaterThanOrEqual(8);
  });

  it("各サンプルはlabel・number・noteを持つ", () => {
    for (const item of SAMPLE_PHONE_NUMBERS) {
      expect(item.label).toBeTruthy();
      expect(item.number).toBeTruthy();
      expect(item.note).toBeTruthy();
    }
  });
});
