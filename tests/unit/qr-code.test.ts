import { describe, it, expect } from "vite-plus/test";
import {
  validateQrInput,
  getQrSizeLabel,
  isValidErrorCorrectionLevel,
  isValidHexColor,
  QR_MAX_LENGTH,
} from "../../app/utils/qr-code";

describe("QRコード入力検証 (validateQrInput)", () => {
  it("空文字列はinvalidと判定する", () => {
    expect(validateQrInput("")).toBe(false);
  });

  it("通常のURLはvalidと判定する", () => {
    expect(validateQrInput("https://example.com")).toBe(true);
  });

  it("1文字の文字列はvalidと判定する", () => {
    expect(validateQrInput("a")).toBe(true);
  });

  it("4296文字以下はvalidと判定する", () => {
    expect(validateQrInput("a".repeat(QR_MAX_LENGTH))).toBe(true);
  });

  it("4297文字以上はinvalidと判定する", () => {
    expect(validateQrInput("a".repeat(QR_MAX_LENGTH + 1))).toBe(false);
  });

  it("日本語文字列はvalidと判定する", () => {
    expect(validateQrInput("こんにちは")).toBe(true);
  });

  it("スペースのみの文字列はvalidと判定する", () => {
    expect(validateQrInput("   ")).toBe(true);
  });

  it("改行を含む文字列はvalidと判定する", () => {
    expect(validateQrInput("line1\nline2")).toBe(true);
  });

  it("ちょうど4296文字はvalidと判定する", () => {
    expect(validateQrInput("x".repeat(4296))).toBe(true);
  });

  it("ちょうど4297文字はinvalidと判定する", () => {
    expect(validateQrInput("x".repeat(4297))).toBe(false);
  });

  it("非常に長い文字列はinvalidと判定する", () => {
    expect(validateQrInput("z".repeat(10000))).toBe(false);
  });
});

describe("QRコードサイズラベル取得 (getQrSizeLabel)", () => {
  it("128px は '小 (128px)' を返す", () => {
    expect(getQrSizeLabel(128)).toBe("小 (128px)");
  });

  it("256px は '中 (256px)' を返す", () => {
    expect(getQrSizeLabel(256)).toBe("中 (256px)");
  });

  it("512px は '大 (512px)' を返す", () => {
    expect(getQrSizeLabel(512)).toBe("大 (512px)");
  });

  it("未定義のサイズは空文字列を返す", () => {
    expect(getQrSizeLabel(64)).toBe("");
  });

  it("0 は空文字列を返す", () => {
    expect(getQrSizeLabel(0)).toBe("");
  });

  it("負の値は空文字列を返す", () => {
    expect(getQrSizeLabel(-1)).toBe("");
  });

  it("1024 は空文字列を返す（定義外のサイズ）", () => {
    expect(getQrSizeLabel(1024)).toBe("");
  });
});

describe("エラー訂正レベル検証 (isValidErrorCorrectionLevel)", () => {
  it('"L" はtrue を返す', () => {
    expect(isValidErrorCorrectionLevel("L")).toBe(true);
  });

  it('"M" はtrue を返す', () => {
    expect(isValidErrorCorrectionLevel("M")).toBe(true);
  });

  it('"Q" はtrue を返す', () => {
    expect(isValidErrorCorrectionLevel("Q")).toBe(true);
  });

  it('"H" はtrue を返す', () => {
    expect(isValidErrorCorrectionLevel("H")).toBe(true);
  });

  it("空文字列はfalseを返す", () => {
    expect(isValidErrorCorrectionLevel("")).toBe(false);
  });

  it('"l"（小文字）はfalseを返す', () => {
    expect(isValidErrorCorrectionLevel("l")).toBe(false);
  });

  it('"m"（小文字）はfalseを返す', () => {
    expect(isValidErrorCorrectionLevel("m")).toBe(false);
  });

  it('"q"（小文字）はfalseを返す', () => {
    expect(isValidErrorCorrectionLevel("q")).toBe(false);
  });

  it('"h"（小文字）はfalseを返す', () => {
    expect(isValidErrorCorrectionLevel("h")).toBe(false);
  });

  it("数字文字列はfalseを返す", () => {
    expect(isValidErrorCorrectionLevel("1")).toBe(false);
  });

  it('"A" はfalseを返す（未定義のレベル）', () => {
    expect(isValidErrorCorrectionLevel("A")).toBe(false);
  });

  it("複数文字の文字列はfalseを返す", () => {
    expect(isValidErrorCorrectionLevel("LM")).toBe(false);
  });
});

describe("QR_MAX_LENGTH 定数", () => {
  it("最大文字数は4296である", () => {
    expect(QR_MAX_LENGTH).toBe(4296);
  });
});

describe("HEXカラーコード検証 (isValidHexColor)", () => {
  it("6桁HEXカラーコードはtrueを返す", () => {
    expect(isValidHexColor("#ff0000")).toBe(true);
  });

  it("3桁HEXカラーコードはtrueを返す", () => {
    expect(isValidHexColor("#f00")).toBe(true);
  });

  it("大文字6桁HEXはtrueを返す", () => {
    expect(isValidHexColor("#FF0000")).toBe(true);
  });

  it("大文字3桁HEXはtrueを返す", () => {
    expect(isValidHexColor("#FFF")).toBe(true);
  });

  it("黒(#000000)はtrueを返す", () => {
    expect(isValidHexColor("#000000")).toBe(true);
  });

  it("白(#ffffff)はtrueを返す", () => {
    expect(isValidHexColor("#ffffff")).toBe(true);
  });

  it("#なしはfalseを返す", () => {
    expect(isValidHexColor("ff0000")).toBe(false);
  });

  it("空文字列はfalseを返す", () => {
    expect(isValidHexColor("")).toBe(false);
  });

  it("7桁HEXはfalseを返す", () => {
    expect(isValidHexColor("#ff00000")).toBe(false);
  });

  it("4桁HEXはfalseを返す", () => {
    expect(isValidHexColor("#f000")).toBe(false);
  });

  it("無効な文字が含まれる場合はfalseを返す", () => {
    expect(isValidHexColor("#zz0000")).toBe(false);
  });
});
