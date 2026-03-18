import { describe, it, expect } from "vitest";
import {
  toHankaku,
  toZenkaku,
  convertText,
  analyzeText,
  DEFAULT_OPTIONS,
} from "../../app/utils/zenkaku";

describe("toHankaku", () => {
  it("全角英字を半角に変換する", () => {
    expect(toHankaku("ＡＢＣ")).toBe("ABC");
    expect(toHankaku("ａｂｃ")).toBe("abc");
  });

  it("全角数字を半角に変換する", () => {
    expect(toHankaku("１２３")).toBe("123");
    expect(toHankaku("０")).toBe("0");
  });

  it("全角記号を半角に変換する", () => {
    expect(toHankaku("！？＠")).toBe("!?@");
    expect(toHankaku("（）")).toBe("()");
  });

  it("全角スペースを半角スペースに変換する", () => {
    expect(toHankaku("　")).toBe(" ");
    expect(toHankaku("あ　い")).toBe("あ い");
  });

  it("全角カタカナを半角カタカナに変換する", () => {
    expect(toHankaku("アイウエオ")).toBe("ｱｲｳｴｵ");
    expect(toHankaku("カキクケコ")).toBe("ｶｷｸｹｺ");
  });

  it("有声音（濁点付き）カタカナを半角に変換する", () => {
    expect(toHankaku("ガギグゲゴ")).toBe("ｶﾞｷﾞｸﾞｹﾞｺﾞ");
    expect(toHankaku("ザジズゼゾ")).toBe("ｻﾞｼﾞｽﾞｾﾞｿﾞ");
  });

  it("半有声音（半濁点付き）カタカナを半角に変換する", () => {
    expect(toHankaku("パピプペポ")).toBe("ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ");
  });

  it("ヴを半角に変換する", () => {
    expect(toHankaku("ヴ")).toBe("ｳﾞ");
  });

  it("alphanumericオプションが false の場合は英数字を変換しない", () => {
    expect(toHankaku("ＡＢＣ１２３", { ...DEFAULT_OPTIONS, alphanumeric: false })).toBe("ＡＢＣ１２３");
  });

  it("symbolsオプションが false の場合は記号を変換しない", () => {
    expect(toHankaku("！？", { ...DEFAULT_OPTIONS, symbols: false })).toBe("！？");
  });

  it("katakanaオプションが false の場合はカタカナを変換しない", () => {
    expect(toHankaku("アイウ", { ...DEFAULT_OPTIONS, katakana: false })).toBe("アイウ");
  });

  it("spaceオプションが false の場合は全角スペースを変換しない", () => {
    expect(toHankaku("　", { ...DEFAULT_OPTIONS, space: false })).toBe("　");
  });

  it("変換対象外の文字はそのまま維持する", () => {
    expect(toHankaku("あいう")).toBe("あいう");
    expect(toHankaku("漢字")).toBe("漢字");
    expect(toHankaku("ひらがな")).toBe("ひらがな");
  });

  it("空文字を処理できる", () => {
    expect(toHankaku("")).toBe("");
  });
});

describe("toZenkaku", () => {
  it("半角英字を全角に変換する", () => {
    expect(toZenkaku("ABC")).toBe("ＡＢＣ");
    expect(toZenkaku("abc")).toBe("ａｂｃ");
  });

  it("半角数字を全角に変換する", () => {
    expect(toZenkaku("123")).toBe("１２３");
    expect(toZenkaku("0")).toBe("０");
  });

  it("半角記号を全角に変換する", () => {
    expect(toZenkaku("!?@")).toBe("！？＠");
    expect(toZenkaku("()")).toBe("（）");
  });

  it("半角スペースを全角スペースに変換する", () => {
    expect(toZenkaku(" ")).toBe("　");
    expect(toZenkaku("a b")).toBe("ａ　ｂ");
  });

  it("半角カタカナを全角カタカナに変換する", () => {
    expect(toZenkaku("ｱｲｳｴｵ")).toBe("アイウエオ");
    expect(toZenkaku("ｶｷｸｹｺ")).toBe("カキクケコ");
  });

  it("半角濁点付きカタカナを全角有声音に変換する", () => {
    expect(toZenkaku("ｶﾞｷﾞｸﾞｹﾞｺﾞ")).toBe("ガギグゲゴ");
    expect(toZenkaku("ｻﾞｼﾞｽﾞｾﾞｿﾞ")).toBe("ザジズゼゾ");
  });

  it("半角半濁点付きカタカナを全角半有声音に変換する", () => {
    expect(toZenkaku("ﾊﾟﾋﾟﾌﾟﾍﾟﾎﾟ")).toBe("パピプペポ");
  });

  it("ｳﾞを全角ヴに変換する", () => {
    expect(toZenkaku("ｳﾞ")).toBe("ヴ");
  });

  it("alphanumericオプションが false の場合は英数字を変換しない", () => {
    expect(toZenkaku("ABC123", { ...DEFAULT_OPTIONS, alphanumeric: false })).toBe("ABC123");
  });

  it("spaceオプションが false の場合は半角スペースを変換しない", () => {
    expect(toZenkaku(" ", { ...DEFAULT_OPTIONS, space: false })).toBe(" ");
  });

  it("変換対象外の文字はそのまま維持する", () => {
    expect(toZenkaku("あいう")).toBe("あいう");
    expect(toZenkaku("漢字")).toBe("漢字");
  });

  it("空文字を処理できる", () => {
    expect(toZenkaku("")).toBe("");
  });
});

describe("convertText", () => {
  it("toHankaku 方向で変換する", () => {
    expect(convertText("Ａ１", "toHankaku")).toBe("A1");
  });

  it("toZenkaku 方向で変換する", () => {
    expect(convertText("A1", "toZenkaku")).toBe("Ａ１");
  });
});

describe("analyzeText", () => {
  it("全角文字数を正しくカウントする", () => {
    const stats = analyzeText("ＡＢＣ");
    expect(stats.zenkakuCount).toBe(3);
  });

  it("半角文字数を正しくカウントする", () => {
    const stats = analyzeText("ABC");
    expect(stats.hankakuCount).toBe(3);
  });

  it("カタカナ文字数を正しくカウントする", () => {
    const stats = analyzeText("アイウｱｲｳ");
    expect(stats.katakanaCount).toBe(6);
  });

  it("合計文字数を返す", () => {
    const stats = analyzeText("ABC");
    expect(stats.total).toBe(3);
  });

  it("空文字を処理できる", () => {
    const stats = analyzeText("");
    expect(stats.total).toBe(0);
    expect(stats.zenkakuCount).toBe(0);
    expect(stats.hankakuCount).toBe(0);
  });
});
