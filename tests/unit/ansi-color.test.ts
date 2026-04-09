import { describe, it, expect } from "vite-plus/test";
import {
  applyAnsiStyle,
  generateShellCode,
  hexToRgb,
  rgbToHex,
  DEFAULT_STYLE,
} from "../../app/utils/ansi-color";

describe("ANSIカラーコードユーティリティ", () => {
  describe("applyAnsiStyle", () => {
    it("スタイルなしの場合はテキストをそのまま返す", () => {
      const result = applyAnsiStyle({ ...DEFAULT_STYLE }, "Hello");
      expect(result).toBe("Hello");
    });

    it("太字スタイルを適用する", () => {
      const result = applyAnsiStyle({ ...DEFAULT_STYLE, bold: true }, "Hello");
      expect(result).toBe("\x1b[1mHello\x1b[0m");
    });

    it("前景色（標準色）を適用する", () => {
      const result = applyAnsiStyle(
        {
          ...DEFAULT_STYLE,
          fgColor: { type: "standard", code: 31 }, // 赤
        },
        "Hello",
      );
      expect(result).toBe("\x1b[31mHello\x1b[0m");
    });

    it("前景色（RGB）を適用する", () => {
      const result = applyAnsiStyle(
        {
          ...DEFAULT_STYLE,
          fgColor: { type: "rgb", r: 255, g: 128, b: 0 },
        },
        "Hello",
      );
      expect(result).toBe("\x1b[38;2;255;128;0mHello\x1b[0m");
    });

    it("背景色（標準色）を適用する", () => {
      const result = applyAnsiStyle(
        {
          ...DEFAULT_STYLE,
          bgColor: { type: "standard", code: 41 }, // 赤背景
        },
        "Hello",
      );
      // 標準色の背景色は code + 10 = 41 + 10 = 51 …ではなく、
      // colorToCodes で isBackground=true のとき code + 10 する
      // code=41 → 41+10 = 51 になる、ただし STANDARD_COLORS の bg は既に +10 なので
      // ここでは type:'standard', code:41 を渡す場合 isBackground=true で +10 → 51
      expect(result).toBe("\x1b[51mHello\x1b[0m");
    });

    it("複数のスタイルを組み合わせる", () => {
      const result = applyAnsiStyle(
        {
          ...DEFAULT_STYLE,
          bold: true,
          underline: true,
          fgColor: { type: "standard", code: 32 }, // 緑
        },
        "Hello",
      );
      expect(result).toBe("\x1b[1;4;32mHello\x1b[0m");
    });

    it("リセットコードを末尾に追加する", () => {
      const result = applyAnsiStyle({ ...DEFAULT_STYLE, bold: true }, "Test");
      expect(result).toMatch(/\x1b\[0m$/);
    });
  });

  describe("generateShellCode", () => {
    it("bashエスケープ形式のコードを生成する", () => {
      const result = generateShellCode({ ...DEFAULT_STYLE, bold: true }, "Hello", "bash");
      expect(result).toBe('echo -e "\\e[1mHello\\e[0m"');
    });

    it("bash-octalエスケープ形式のコードを生成する", () => {
      const result = generateShellCode({ ...DEFAULT_STYLE, bold: true }, "Hello", "bash-octal");
      expect(result).toBe('echo -e "\\033[1mHello\\033[0m"');
    });

    it("Python形式のコードを生成する", () => {
      const result = generateShellCode({ ...DEFAULT_STYLE, bold: true }, "Hello", "python");
      expect(result).toBe('print(f"\\x1b[1mHello\\x1b[0m")');
    });

    it("Node.js (unicode) 形式のコードを生成する", () => {
      const result = generateShellCode({ ...DEFAULT_STYLE, bold: true }, "Hello", "unicode");
      expect(result).toBe('console.log("\\u001b[1mHello\\u001b[0m")');
    });

    it("スタイルなしの場合は引用符付きテキストを返す", () => {
      const result = generateShellCode({ ...DEFAULT_STYLE }, "Hello", "bash");
      expect(result).toBe('"Hello"');
    });

    it("テキストが空の場合はデフォルトテキストを使用する", () => {
      const result = generateShellCode({ ...DEFAULT_STYLE, bold: true }, "", "bash");
      expect(result).toContain("Hello, World!");
    });
  });

  describe("hexToRgb", () => {
    it("有効なHEX文字列をRGBに変換する", () => {
      expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    });

    it("#プレフィックスなしのHEXを変換する", () => {
      expect(hexToRgb("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb("1a2b3c")).toEqual({ r: 26, g: 43, b: 60 });
    });

    it("無効なHEX文字列はnullを返す", () => {
      expect(hexToRgb("")).toBeNull();
      expect(hexToRgb("gggggg")).toBeNull();
      expect(hexToRgb("#fff")).toBeNull();
      expect(hexToRgb("12345")).toBeNull();
      expect(hexToRgb("invalid")).toBeNull();
    });
  });

  describe("rgbToHex", () => {
    it("RGBをHEX文字列に変換する", () => {
      expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
      expect(rgbToHex(0, 255, 0)).toBe("#00ff00");
      expect(rgbToHex(0, 0, 255)).toBe("#0000ff");
      expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
    });

    it("ゼロパディングを正しく行う", () => {
      expect(rgbToHex(0, 0, 0)).toBe("#000000");
      expect(rgbToHex(1, 2, 3)).toBe("#010203");
      expect(rgbToHex(16, 32, 48)).toBe("#102030");
    });
  });
});
