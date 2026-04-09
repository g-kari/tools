import { describe, it, expect } from "vite-plus/test";
import {
  TAILWIND_COLORS,
  TAILWIND_SHADES,
  TAILWIND_COLOR_NAMES,
  hexToRgbTuple,
  colorDistance,
  findNearestTailwindColor,
  getAllColors,
} from "../../app/utils/tailwind-colors";

describe("Tailwind Colors ユーティリティ", () => {
  describe("TAILWIND_COLORS", () => {
    it("全22カラーファミリーが定義されていること", () => {
      const expectedColorFamilies = [
        "slate",
        "gray",
        "zinc",
        "neutral",
        "stone",
        "red",
        "orange",
        "amber",
        "yellow",
        "lime",
        "green",
        "emerald",
        "teal",
        "cyan",
        "sky",
        "blue",
        "indigo",
        "violet",
        "purple",
        "fuchsia",
        "pink",
        "rose",
      ];
      expectedColorFamilies.forEach((colorName) => {
        expect(TAILWIND_COLORS).toHaveProperty(colorName);
      });
      expect(Object.keys(TAILWIND_COLORS)).toHaveLength(22);
    });

    it("各カラーに11シェードが定義されていること", () => {
      const expectedShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
      for (const colorName of Object.keys(TAILWIND_COLORS)) {
        const shades = Object.keys(TAILWIND_COLORS[colorName]).map(Number);
        expectedShades.forEach((shade) => {
          expect(shades).toContain(shade);
        });
        expect(shades).toHaveLength(11);
      }
    });

    it("全シェードが有効なHEX形式であること", () => {
      const hexPattern = /^#[0-9a-f]{6}$/;
      for (const [colorName, shades] of Object.entries(TAILWIND_COLORS)) {
        for (const [shade, hex] of Object.entries(shades)) {
          expect(hex).toMatch(hexPattern);
          expect(typeof hex).toBe("string");
        }
      }
    });

    it("blue-500 が #3b82f6 であること", () => {
      expect(TAILWIND_COLORS["blue"][500]).toBe("#3b82f6");
    });

    it("red-500 が #ef4444 であること", () => {
      expect(TAILWIND_COLORS["red"][500]).toBe("#ef4444");
    });

    it("green-500 が #22c55e であること", () => {
      expect(TAILWIND_COLORS["green"][500]).toBe("#22c55e");
    });
  });

  describe("TAILWIND_SHADES", () => {
    it("11シェードが含まれていること", () => {
      expect(TAILWIND_SHADES).toHaveLength(11);
    });

    it("正しいシェード番号が含まれていること", () => {
      const expected = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
      expected.forEach((shade) => {
        expect(TAILWIND_SHADES).toContain(shade);
      });
    });
  });

  describe("TAILWIND_COLOR_NAMES", () => {
    it("22個のカラー名が含まれていること", () => {
      expect(TAILWIND_COLOR_NAMES).toHaveLength(22);
    });

    it("blueが含まれていること", () => {
      expect(TAILWIND_COLOR_NAMES).toContain("blue");
    });
  });

  describe("hexToRgbTuple", () => {
    it("#3b82f6 を正しくRGBに変換すること", () => {
      const result = hexToRgbTuple("#3b82f6");
      expect(result).toEqual([59, 130, 246]);
    });

    it("# なしの入力に対応すること", () => {
      const result = hexToRgbTuple("3b82f6");
      expect(result).toEqual([59, 130, 246]);
    });

    it("#000000 を [0, 0, 0] に変換すること", () => {
      const result = hexToRgbTuple("#000000");
      expect(result).toEqual([0, 0, 0]);
    });

    it("#ffffff を [255, 255, 255] に変換すること", () => {
      const result = hexToRgbTuple("#ffffff");
      expect(result).toEqual([255, 255, 255]);
    });

    it("#ff0000 を [255, 0, 0] に変換すること", () => {
      const result = hexToRgbTuple("#ff0000");
      expect(result).toEqual([255, 0, 0]);
    });

    it("大文字HEXに対応すること", () => {
      const result = hexToRgbTuple("#FF0000");
      expect(result).toEqual([255, 0, 0]);
    });

    it("無効な入力に対してnullを返すこと", () => {
      expect(hexToRgbTuple("invalid")).toBeNull();
      expect(hexToRgbTuple("#gggggg")).toBeNull();
      expect(hexToRgbTuple("#fff")).toBeNull();
      expect(hexToRgbTuple("")).toBeNull();
      expect(hexToRgbTuple("#1234567")).toBeNull();
    });
  });

  describe("colorDistance", () => {
    it("同じ色の距離が0であること", () => {
      const distance = colorDistance([255, 0, 0], [255, 0, 0]);
      expect(distance).toBe(0);
    });

    it("黒と白の距離が正しいこと（約441.67）", () => {
      const distance = colorDistance([0, 0, 0], [255, 255, 255]);
      expect(distance).toBeCloseTo(441.67, 1);
    });

    it("赤と青の距離が正しいこと（約360.62）", () => {
      const distance = colorDistance([255, 0, 0], [0, 0, 255]);
      expect(distance).toBeCloseTo(360.62, 1);
    });

    it("近い色の距離が小さいこと", () => {
      const near = colorDistance([100, 100, 100], [101, 100, 100]);
      const far = colorDistance([0, 0, 0], [255, 255, 255]);
      expect(near).toBeLessThan(far);
    });

    it("距離が対称であること", () => {
      const d1 = colorDistance([255, 0, 0], [0, 255, 0]);
      const d2 = colorDistance([0, 255, 0], [255, 0, 0]);
      expect(d1).toBeCloseTo(d2);
    });
  });

  describe("findNearestTailwindColor", () => {
    it("正確なTailwindカラーを入力したとき、そのカラーを返すこと（blue-500）", () => {
      const result = findNearestTailwindColor("#3b82f6");
      expect(result).not.toBeNull();
      expect(result?.colorName).toBe("blue");
      expect(result?.shade).toBe(500);
      expect(result?.hex).toBe("#3b82f6");
    });

    it("正確なTailwindカラーを入力したとき、そのカラーを返すこと（red-500）", () => {
      const result = findNearestTailwindColor("#ef4444");
      expect(result).not.toBeNull();
      expect(result?.colorName).toBe("red");
      expect(result?.shade).toBe(500);
    });

    it("正確なTailwindカラーを入力したとき、そのカラーを返すこと（green-500）", () => {
      const result = findNearestTailwindColor("#22c55e");
      expect(result).not.toBeNull();
      expect(result?.colorName).toBe("green");
      expect(result?.shade).toBe(500);
    });

    it("# なしの入力に対応すること", () => {
      const result = findNearestTailwindColor("3b82f6");
      expect(result).not.toBeNull();
      expect(result?.colorName).toBe("blue");
      expect(result?.shade).toBe(500);
    });

    it("無効なHEXコードに対してnullを返すこと", () => {
      expect(findNearestTailwindColor("invalid")).toBeNull();
      expect(findNearestTailwindColor("#gggggg")).toBeNull();
      expect(findNearestTailwindColor("")).toBeNull();
    });

    it("近似色の検索が機能すること", () => {
      // #4080ff は blue-500 (#3b82f6) に近いはず
      const result = findNearestTailwindColor("#4080ff");
      expect(result).not.toBeNull();
      // 何らかのblue系カラーが返ること
      expect(["blue", "indigo", "sky", "violet"]).toContain(result?.colorName);
    });

    it("白に最も近いTailwindカラーを返すこと", () => {
      const result = findNearestTailwindColor("#ffffff");
      expect(result).not.toBeNull();
      // 白に近いシェードは50など明るい色のはず
      expect(result?.shade).toBeLessThanOrEqual(100);
    });

    it("黒に最も近いTailwindカラーを返すこと", () => {
      const result = findNearestTailwindColor("#000000");
      expect(result).not.toBeNull();
      // 黒に近いシェードは950など暗い色のはず
      expect(result?.shade).toBeGreaterThanOrEqual(900);
    });

    it("結果に必要なプロパティが含まれていること", () => {
      const result = findNearestTailwindColor("#3b82f6");
      expect(result).toHaveProperty("colorName");
      expect(result).toHaveProperty("shade");
      expect(result).toHaveProperty("hex");
    });
  });

  describe("getAllColors", () => {
    it("242色が返ること（22カラー × 11シェード）", () => {
      const colors = getAllColors();
      expect(colors).toHaveLength(242);
    });

    it("各エントリに必要なプロパティが含まれていること", () => {
      const colors = getAllColors();
      colors.forEach((color) => {
        expect(color).toHaveProperty("colorName");
        expect(color).toHaveProperty("shade");
        expect(color).toHaveProperty("hex");
        expect(typeof color.colorName).toBe("string");
        expect(typeof color.shade).toBe("number");
        expect(typeof color.hex).toBe("string");
      });
    });

    it("全カラーファミリーが含まれていること", () => {
      const colors = getAllColors();
      const colorNames = new Set(colors.map((c) => c.colorName));
      expect(colorNames.size).toBe(22);
    });

    it("全シェードが含まれていること", () => {
      const colors = getAllColors();
      const shades = new Set(colors.map((c) => c.shade));
      const expectedShades = new Set([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
      expectedShades.forEach((shade) => {
        expect(shades).toContain(shade);
      });
    });

    it("blue-500 (#3b82f6) が含まれていること", () => {
      const colors = getAllColors();
      const blue500 = colors.find((c) => c.colorName === "blue" && c.shade === 500);
      expect(blue500).toBeDefined();
      expect(blue500?.hex).toBe("#3b82f6");
    });
  });
});
