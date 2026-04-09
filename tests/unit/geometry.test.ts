import { describe, it, expect } from "vite-plus/test";
import {
  calcCircleArea,
  calcRectangleArea,
  calcTriangleArea,
  calcTrapezoidArea,
  calcParallelogramArea,
  calcEllipseArea,
  calcRegularHexagonArea,
  calcSphere,
  calcCube,
  calcRectangularPrism,
  calcCylinder,
  calcCone,
} from "../../app/utils/geometry";

describe("幾何計算ユーティリティ", () => {
  describe("calcCircleArea（円の面積）", () => {
    it("半径5の円の面積を計算できる", () => {
      // π × 5² = 78.539...
      expect(calcCircleArea(5)).toBeCloseTo(78.5398, 3);
    });

    it("半径1の円の面積はπに等しい", () => {
      expect(calcCircleArea(1)).toBeCloseTo(Math.PI, 10);
    });

    it("半径0のとき NaN を返す", () => {
      expect(calcCircleArea(0)).toBeNaN();
    });

    it("負の半径のとき NaN を返す", () => {
      expect(calcCircleArea(-3)).toBeNaN();
    });
  });

  describe("calcRectangleArea（長方形の面積）", () => {
    it("幅4・高さ6の長方形の面積を計算できる", () => {
      expect(calcRectangleArea(4, 6)).toBe(24);
    });

    it("正方形の面積を計算できる", () => {
      expect(calcRectangleArea(5, 5)).toBe(25);
    });

    it("幅0のとき NaN を返す", () => {
      expect(calcRectangleArea(0, 6)).toBeNaN();
    });

    it("高さ0のとき NaN を返す", () => {
      expect(calcRectangleArea(4, 0)).toBeNaN();
    });

    it("負の幅のとき NaN を返す", () => {
      expect(calcRectangleArea(-4, 6)).toBeNaN();
    });
  });

  describe("calcTriangleArea（三角形の面積）", () => {
    it("底辺8・高さ6の三角形の面積を計算できる", () => {
      // 8 × 6 / 2 = 24
      expect(calcTriangleArea(8, 6)).toBe(24);
    });

    it("底辺10・高さ5の三角形の面積を計算できる", () => {
      expect(calcTriangleArea(10, 5)).toBe(25);
    });

    it("底辺0のとき NaN を返す", () => {
      expect(calcTriangleArea(0, 6)).toBeNaN();
    });

    it("高さ0のとき NaN を返す", () => {
      expect(calcTriangleArea(8, 0)).toBeNaN();
    });

    it("負の底辺のとき NaN を返す", () => {
      expect(calcTriangleArea(-8, 6)).toBeNaN();
    });
  });

  describe("calcTrapezoidArea（台形の面積）", () => {
    it("上底4・下底8・高さ5の台形の面積を計算できる", () => {
      // (4 + 8) × 5 / 2 = 30
      expect(calcTrapezoidArea(4, 8, 5)).toBe(30);
    });

    it("上底と下底が等しい（長方形と同じ）", () => {
      // (5 + 5) × 4 / 2 = 20
      expect(calcTrapezoidArea(5, 5, 4)).toBe(20);
    });

    it("上底0のとき NaN を返す", () => {
      expect(calcTrapezoidArea(0, 8, 5)).toBeNaN();
    });

    it("高さ0のとき NaN を返す", () => {
      expect(calcTrapezoidArea(4, 8, 0)).toBeNaN();
    });

    it("負の下底のとき NaN を返す", () => {
      expect(calcTrapezoidArea(4, -8, 5)).toBeNaN();
    });
  });

  describe("calcParallelogramArea（平行四辺形の面積）", () => {
    it("底辺8・高さ5の平行四辺形の面積を計算できる", () => {
      expect(calcParallelogramArea(8, 5)).toBe(40);
    });

    it("底辺0のとき NaN を返す", () => {
      expect(calcParallelogramArea(0, 5)).toBeNaN();
    });

    it("高さ0のとき NaN を返す", () => {
      expect(calcParallelogramArea(8, 0)).toBeNaN();
    });

    it("負の高さのとき NaN を返す", () => {
      expect(calcParallelogramArea(8, -5)).toBeNaN();
    });
  });

  describe("calcEllipseArea（楕円の面積）", () => {
    it("長半径6・短半径4の楕円の面積を計算できる", () => {
      // π × 6 × 4 = 75.398...
      expect(calcEllipseArea(6, 4)).toBeCloseTo(75.3982, 3);
    });

    it("長半径と短半径が等しい（円と同じ）", () => {
      // π × 5 × 5 = π × 5²
      expect(calcEllipseArea(5, 5)).toBeCloseTo(calcCircleArea(5), 10);
    });

    it("長半径0のとき NaN を返す", () => {
      expect(calcEllipseArea(0, 4)).toBeNaN();
    });

    it("短半径0のとき NaN を返す", () => {
      expect(calcEllipseArea(6, 0)).toBeNaN();
    });

    it("負の長半径のとき NaN を返す", () => {
      expect(calcEllipseArea(-6, 4)).toBeNaN();
    });
  });

  describe("calcRegularHexagonArea（正六角形の面積）", () => {
    it("一辺5の正六角形の面積を計算できる", () => {
      // (3√3 / 2) × 5² = (3 × 1.732... / 2) × 25 = 64.951...
      expect(calcRegularHexagonArea(5)).toBeCloseTo(64.9519, 3);
    });

    it("一辺1の正六角形の面積を計算できる", () => {
      // (3√3 / 2) × 1 = 2.598...
      expect(calcRegularHexagonArea(1)).toBeCloseTo((3 * Math.sqrt(3)) / 2, 10);
    });

    it("一辺0のとき NaN を返す", () => {
      expect(calcRegularHexagonArea(0)).toBeNaN();
    });

    it("負の一辺のとき NaN を返す", () => {
      expect(calcRegularHexagonArea(-5)).toBeNaN();
    });
  });

  describe("calcSphere（球）", () => {
    it("半径5の球の体積と表面積を計算できる", () => {
      const { volume, surfaceArea } = calcSphere(5);
      // 体積: (4/3) × π × 5³ = 523.598...
      expect(volume).toBeCloseTo(523.5988, 3);
      // 表面積: 4 × π × 5² = 314.159...
      expect(surfaceArea).toBeCloseTo(314.1593, 3);
    });

    it("半径1の球の体積と表面積を計算できる", () => {
      const { volume, surfaceArea } = calcSphere(1);
      expect(volume).toBeCloseTo((4 / 3) * Math.PI, 10);
      expect(surfaceArea).toBeCloseTo(4 * Math.PI, 10);
    });

    it("半径0のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcSphere(0);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });

    it("負の半径のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcSphere(-5);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });
  });

  describe("calcCube（立方体）", () => {
    it("一辺4の立方体の体積と表面積を計算できる", () => {
      const { volume, surfaceArea } = calcCube(4);
      // 体積: 4³ = 64
      expect(volume).toBe(64);
      // 表面積: 6 × 4² = 96
      expect(surfaceArea).toBe(96);
    });

    it("一辺3の立方体の体積と表面積を計算できる", () => {
      const { volume, surfaceArea } = calcCube(3);
      expect(volume).toBe(27);
      expect(surfaceArea).toBe(54);
    });

    it("一辺0のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcCube(0);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });

    it("負の一辺のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcCube(-4);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });
  });

  describe("calcRectangularPrism（直方体）", () => {
    it("6×4×3の直方体の体積と表面積を計算できる", () => {
      const { volume, surfaceArea } = calcRectangularPrism(6, 4, 3);
      // 体積: 6 × 4 × 3 = 72
      expect(volume).toBe(72);
      // 表面積: 2 × (6×4 + 6×3 + 4×3) = 2 × (24 + 18 + 12) = 108
      expect(surfaceArea).toBe(108);
    });

    it("正方形底面の直方体を計算できる", () => {
      const { volume, surfaceArea } = calcRectangularPrism(5, 5, 3);
      expect(volume).toBe(75);
      // 2 × (25 + 15 + 15) = 2 × 55 = 110
      expect(surfaceArea).toBe(110);
    });

    it("長さ0のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcRectangularPrism(0, 4, 3);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });

    it("負の幅のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcRectangularPrism(6, -4, 3);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });
  });

  describe("calcCylinder（円柱）", () => {
    it("半径3・高さ10の円柱の体積と表面積を計算できる", () => {
      const { volume, surfaceArea } = calcCylinder(3, 10);
      // 体積: π × 9 × 10 = 282.743...
      expect(volume).toBeCloseTo(282.7433, 3);
      // 表面積: 2 × π × 3 × (3 + 10) = 2 × π × 39 = 245.044...
      expect(surfaceArea).toBeCloseTo(245.0442, 3);
    });

    it("半径0のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcCylinder(0, 10);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });

    it("高さ0のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcCylinder(3, 0);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });

    it("負の半径のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcCylinder(-3, 10);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });
  });

  describe("calcCone（円錐）", () => {
    it("半径3・高さ4の円錐の体積と表面積を計算できる", () => {
      const { volume, surfaceArea } = calcCone(3, 4);
      // 体積: (1/3) × π × 9 × 4 = 37.699...
      expect(volume).toBeCloseTo(37.6991, 3);
      // 母線 = √(9 + 16) = √25 = 5
      // 表面積: π × 3 × (3 + 5) = π × 24 = 75.398...
      expect(surfaceArea).toBeCloseTo(75.3982, 3);
    });

    it("半径5・高さ12の円錐の母線が13になる", () => {
      const { surfaceArea } = calcCone(5, 12);
      // 母線 = √(25 + 144) = √169 = 13
      // 表面積: π × 5 × (5 + 13) = π × 90 = 282.743...
      expect(surfaceArea).toBeCloseTo(Math.PI * 5 * (5 + 13), 5);
    });

    it("半径0のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcCone(0, 4);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });

    it("高さ0のとき NaN を返す", () => {
      const { volume, surfaceArea } = calcCone(3, 0);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });

    it("負の高さのとき NaN を返す", () => {
      const { volume, surfaceArea } = calcCone(3, -4);
      expect(volume).toBeNaN();
      expect(surfaceArea).toBeNaN();
    });
  });
});
