import { describe, it, expect } from "vite-plus/test";
import { analyzePassword } from "../../app/utils/password-strength";

describe("analyzePassword", () => {
  describe("空文字・初期値", () => {
    it("空文字はスコア 0 を返す", () => {
      const result = analyzePassword("");
      expect(result.score).toBe(0);
      expect(result.label).toBe("とても弱い");
      expect(result.entropy).toBe(0);
      expect(result.length).toBe(0);
    });

    it("空文字のクラック時間はダッシュを返す", () => {
      const result = analyzePassword("");
      expect(result.crackTimes.onlineThrottled).toBe("-");
      expect(result.crackTimes.offlineFast).toBe("-");
    });
  });

  describe("よく使われるパスワードの検出", () => {
    it("password はスコア 0 を返す", () => {
      expect(analyzePassword("password").score).toBe(0);
      expect(analyzePassword("password").isCommonPassword).toBe(true);
    });

    it("123456 はスコア 0 を返す", () => {
      expect(analyzePassword("123456").score).toBe(0);
      expect(analyzePassword("123456").isCommonPassword).toBe(true);
    });

    it("大文字混在でも検出できる", () => {
      expect(analyzePassword("PASSWORD").isCommonPassword).toBe(true);
      expect(analyzePassword("Admin").isCommonPassword).toBe(true);
    });

    it("ランダムな文字列は一致しない", () => {
      expect(analyzePassword("Xk9#mL2@pQ7!").isCommonPassword).toBe(false);
    });
  });

  describe("文字クラスの検出", () => {
    it("小文字のみ", () => {
      const r = analyzePassword("abcdef");
      expect(r.characterClasses.lowercase).toBe(true);
      expect(r.characterClasses.uppercase).toBe(false);
      expect(r.characterClasses.digits).toBe(false);
      expect(r.characterClasses.symbols).toBe(false);
    });

    it("大文字小文字混在", () => {
      const r = analyzePassword("AbCdEf");
      expect(r.characterClasses.lowercase).toBe(true);
      expect(r.characterClasses.uppercase).toBe(true);
    });

    it("数字を含む", () => {
      const r = analyzePassword("abc123");
      expect(r.characterClasses.digits).toBe(true);
    });

    it("記号を含む", () => {
      const r = analyzePassword("abc!@#");
      expect(r.characterClasses.symbols).toBe(true);
    });

    it("全クラス含む", () => {
      const r = analyzePassword("Abc1!xyz");
      expect(r.characterClasses.lowercase).toBe(true);
      expect(r.characterClasses.uppercase).toBe(true);
      expect(r.characterClasses.digits).toBe(true);
      expect(r.characterClasses.symbols).toBe(true);
    });
  });

  describe("文字セットサイズ", () => {
    it("小文字のみ: 26", () => {
      expect(analyzePassword("abcdef").charsetSize).toBe(26);
    });

    it("大文字小文字: 52", () => {
      expect(analyzePassword("AbCdEf").charsetSize).toBe(52);
    });

    it("英数字: 62", () => {
      expect(analyzePassword("Abc123").charsetSize).toBe(62);
    });

    it("全クラス: 94", () => {
      expect(analyzePassword("Abc1!").charsetSize).toBe(94);
    });
  });

  describe("パターン検知 - 繰り返し", () => {
    it("3文字以上の同一文字繰り返しを検出する", () => {
      expect(analyzePassword("aaabbb").hasRepeats).toBe(true);
      expect(analyzePassword("111abc").hasRepeats).toBe(true);
    });

    it("2文字繰り返しは検出しない", () => {
      expect(analyzePassword("aabbc").hasRepeats).toBe(false);
    });
  });

  describe("パターン検知 - 連続文字", () => {
    it("アルファベット順の連続を検出する", () => {
      expect(analyzePassword("xyzabc123").hasSequence).toBe(true);
    });

    it("数字の連続を検出する", () => {
      expect(analyzePassword("pass123abc").hasSequence).toBe(true);
    });

    it("qwerty の連続を検出する", () => {
      expect(analyzePassword("myqwerty").hasSequence).toBe(true);
    });

    it("ランダムな文字列は連続なし", () => {
      expect(analyzePassword("Xk9#mLp").hasSequence).toBe(false);
    });
  });

  describe("長さ", () => {
    it("length プロパティが正しい", () => {
      expect(analyzePassword("hello").length).toBe(5);
      expect(analyzePassword("HelloWorld123!").length).toBe(14);
    });
  });

  describe("スコアリング", () => {
    it("短いパスワードはスコアが低い", () => {
      expect(analyzePassword("abc").score).toBe(0);
    });

    it("強いパスワードはスコア 3 以上", () => {
      const result = analyzePassword("Tr0ub4dor&3XyZk9m!");
      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    it("とても強いパスワードはスコア 4", () => {
      const result = analyzePassword("Xk9#mL2@pQ7!rT5$nJ3^wB");
      expect(result.score).toBe(4);
      expect(result.label).toBe("とても強い");
    });
  });

  describe("エントロピー", () => {
    it("エントロピーは正の数", () => {
      const r = analyzePassword("Hello123");
      expect(r.entropy).toBeGreaterThan(0);
    });

    it("長いパスワードはエントロピーが高い", () => {
      const short = analyzePassword("Abc1!");
      const long = analyzePassword("Abc1!Abc1!Abc1!Abc1!Abc1!");
      expect(long.entropy).toBeGreaterThan(short.entropy);
    });

    it("エントロピーは小数点1桁に丸められている", () => {
      const r = analyzePassword("Hello123");
      expect(r.entropy).toBe(Math.round(r.entropy * 10) / 10);
    });
  });

  describe("改善アドバイス", () => {
    it("全クラス使用・十分な長さ・パターンなし → 安全メッセージ", () => {
      const r = analyzePassword("Xk9#mL2@pQ7!rT5$nJ3");
      expect(r.suggestions).toContain("このパスワードは十分に安全です！");
    });

    it("よく使われるパスワード → 警告アドバイス", () => {
      const r = analyzePassword("password");
      expect(r.suggestions.some((s) => s.includes("よく使われる"))).toBe(true);
    });

    it("短すぎる → 長さアドバイス", () => {
      const r = analyzePassword("abcD1");
      expect(r.suggestions.some((s) => s.includes("文字"))).toBe(true);
    });

    it("記号なし → 記号追加アドバイス", () => {
      const r = analyzePassword("HelloWorld123");
      expect(r.suggestions.some((s) => s.includes("記号"))).toBe(true);
    });
  });

  describe("クラック時間", () => {
    it("強いパスワードのオフラインFastは長い時間を返す", () => {
      const r = analyzePassword("Xk9#mL2@pQ7!rT5$nJ3^wB");
      expect(r.crackTimes.offlineFast).not.toBe("1秒未満");
      expect(r.crackTimes.offlineFast).not.toBe("-");
    });

    it("クラック時間がダッシュでない", () => {
      const r = analyzePassword("Hello123!");
      expect(r.crackTimes.onlineThrottled).not.toBe("-");
      expect(r.crackTimes.onlineUnthrottled).not.toBe("-");
      expect(r.crackTimes.offlineSlow).not.toBe("-");
      expect(r.crackTimes.offlineFast).not.toBe("-");
    });
  });
});
