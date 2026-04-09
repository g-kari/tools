import { describe, it, expect } from "vite-plus/test";
import {
  optimizeSvg,
  getSampleSvg,
  getDefaultOptions,
  formatBytes,
} from "../../app/utils/svg-optimizer";
import type { SvgOptimizerOptions } from "../../app/utils/svg-optimizer";

const defaultOptions: SvgOptimizerOptions = getDefaultOptions();

const minimalSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';

describe("SVGオプティマイザー", () => {
  describe("optimizeSvg", () => {
    it("有効なSVGを最適化できる", () => {
      const result = optimizeSvg(minimalSvg, defaultOptions);
      expect(result.output).toContain("<svg");
      expect(result.output).toContain("</svg>");
    });

    it("元サイズと最適化後サイズを返す", () => {
      const result = optimizeSvg(minimalSvg, defaultOptions);
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.optimizedSize).toBeGreaterThan(0);
    });

    it("削減率を計算する", () => {
      const result = optimizeSvg(getSampleSvg(), defaultOptions);
      expect(result.reductionPercent).toBeGreaterThanOrEqual(0);
      expect(typeof result.reductionPercent).toBe("number");
    });

    it("XML宣言を削除する", () => {
      const svg = '<?xml version="1.0" encoding="UTF-8"?>' + minimalSvg;
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        removeXmlDeclaration: true,
      });
      expect(result.output).not.toContain("<?xml");
    });

    it("XML宣言を保持する（オプション無効時）", () => {
      const svg = '<?xml version="1.0" encoding="UTF-8"?>' + minimalSvg;
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        removeXmlDeclaration: false,
      });
      expect(result.output).toContain("<?xml");
    });

    it("コメントを削除する", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><!-- comment --><circle cx="50" cy="50" r="40" /></svg>';
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        removeMetadata: true,
      });
      expect(result.output).not.toContain("<!-- comment -->");
    });

    it("コメントを保持する（メタデータ削除無効時）", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><!-- comment --><circle cx="50" cy="50" r="40" /></svg>';
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        removeMetadata: false,
      });
      expect(result.output).toContain("<!-- comment -->");
    });

    it("metadata要素を削除する", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><metadata><title>Test</title></metadata><circle cx="50" cy="50" r="40" /></svg>';
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        removeMetadata: true,
      });
      expect(result.output).not.toContain("<metadata");
    });

    it("inkscape名前空間属性を削除する", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="100" height="100"><g inkscape:label="Layer 1"><circle cx="50" cy="50" r="40" /></g></svg>';
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        removeMetadata: true,
      });
      expect(result.output).not.toContain("inkscape");
    });

    it("デフォルト属性を削除する", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" opacity="1" display="inline" /></svg>';
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        removeUnusedAttrs: true,
      });
      expect(result.output).not.toContain('opacity="1"');
      expect(result.output).not.toContain('display="inline"');
    });

    it("デフォルト属性を保持する（オプション無効時）", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" opacity="1" /></svg>';
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        removeUnusedAttrs: false,
      });
      expect(result.output).toContain('opacity="1"');
    });

    it("空のグループ要素を削除する", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><g></g><circle cx="50" cy="50" r="40" /></svg>';
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        removeEmptyGroups: true,
      });
      expect(result.output).not.toMatch(/<g[^>]*>\s*<\/g>/);
    });

    it("数値の精度を調整する", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50.12345" cy="50.98765" r="40.111" /></svg>';
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        precision: 1,
      });
      expect(result.output).not.toContain("50.12345");
      expect(result.output).toContain("50.1");
    });

    it("prettify=trueで整形出力する", () => {
      const result = optimizeSvg(minimalSvg, {
        ...defaultOptions,
        prettify: true,
      });
      expect(result.output).toContain("\n");
      expect(result.output).toContain("  ");
    });

    it("prettify=falseで圧縮出力する", () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\n  <circle cx="50" cy="50" r="40" />\n</svg>';
      const result = optimizeSvg(svg, {
        ...defaultOptions,
        prettify: false,
      });
      expect(result.output).not.toContain("\n");
    });

    it("DOCTYPE宣言を削除する", () => {
      const svg = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + minimalSvg;
      const result = optimizeSvg(svg, defaultOptions);
      expect(result.output).not.toContain("DOCTYPE");
    });

    it("空文字列でエラーをスローする", () => {
      expect(() => optimizeSvg("", defaultOptions)).toThrow(
        "SVGコードを入力してください"
      );
    });

    it("空白のみの入力でエラーをスローする", () => {
      expect(() => optimizeSvg("   ", defaultOptions)).toThrow(
        "SVGコードを入力してください"
      );
    });

    it("無効なSVGでエラーをスローする", () => {
      expect(() => optimizeSvg("<div>not svg</div>", defaultOptions)).toThrow(
        "有効なSVGコードではありません"
      );
    });

    it("サンプルSVGを正常に最適化できる", () => {
      const sample = getSampleSvg();
      const result = optimizeSvg(sample, defaultOptions);
      expect(result.output).toContain("<svg");
      expect(result.reductionPercent).toBeGreaterThan(0);
    });

    it("最適化でサイズが削減される（サンプル）", () => {
      const result = optimizeSvg(getSampleSvg(), defaultOptions);
      expect(result.optimizedSize).toBeLessThan(result.originalSize);
    });
  });

  describe("getSampleSvg", () => {
    it("SVG文字列を返す", () => {
      const result = getSampleSvg();
      expect(typeof result).toBe("string");
      expect(result).toContain("<svg");
      expect(result).toContain("</svg>");
    });

    it("メタデータを含む（最適化テスト用）", () => {
      const result = getSampleSvg();
      expect(result).toContain("<metadata");
    });

    it("コメントを含む（最適化テスト用）", () => {
      const result = getSampleSvg();
      expect(result).toContain("<!--");
    });
  });

  describe("getDefaultOptions", () => {
    it("デフォルトオプションを返す", () => {
      const opts = getDefaultOptions();
      expect(opts.removeMetadata).toBe(true);
      expect(opts.removeUnusedAttrs).toBe(true);
      expect(opts.precision).toBe(2);
      expect(opts.prettify).toBe(false);
      expect(opts.removeXmlDeclaration).toBe(true);
      expect(opts.removeEmptyGroups).toBe(true);
    });
  });

  describe("formatBytes", () => {
    it("0バイトを正しく表示する", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    it("バイト単位を正しく表示する", () => {
      expect(formatBytes(500)).toBe("500 B");
    });

    it("KB単位を正しく表示する", () => {
      expect(formatBytes(1536)).toBe("1.5 KB");
    });

    it("MB単位を正しく表示する", () => {
      expect(formatBytes(1572864)).toBe("1.5 MB");
    });
  });
});
