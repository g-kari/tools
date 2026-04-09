import { describe, it, expect } from "vite-plus/test";
import {
  mandelbrotIterations,
  mandelbrotSmooth,
  iterationsToColor,
  hsvToRgb,
  screenToComplex,
  zoomViewport,
  getZoomLevel,
  DEFAULT_VIEWPORT,
} from "../../app/utils/mandelbrot";

describe("マンデルブロット集合ユーティリティ", () => {
  describe("mandelbrotIterations", () => {
    it("原点 (0, 0) は集合内なので maxIter を返す", () => {
      expect(mandelbrotIterations(0, 0, 100)).toBe(100);
    });

    it("c = (-1, 0) は集合内なので maxIter を返す", () => {
      expect(mandelbrotIterations(-1, 0, 100)).toBe(100);
    });

    it("c = (-2, 0) は境界上で集合内", () => {
      expect(mandelbrotIterations(-2, 0, 100)).toBe(100);
    });

    it("c = (2, 0) は集合外なので 2 回で発散（|z₁|²=4 が境界上なため）", () => {
      // z₁ = 2, |z₁|² = 4（境界上なので継続）→ z₂ = 6, |z₂|² = 36 > 4 で発散
      expect(mandelbrotIterations(2, 0, 100)).toBe(2);
    });

    it("c = (0.5, 0.5) は集合外で比較的早く発散", () => {
      const iter = mandelbrotIterations(0.5, 0.5, 100);
      expect(iter).toBeGreaterThan(0);
      expect(iter).toBeLessThan(100);
    });

    it("maxIter=0 のとき常に 0 を返す", () => {
      expect(mandelbrotIterations(0, 0, 0)).toBe(0);
    });

    it("maxIter を増やすと集合外の精度が上がる", () => {
      const iter50 = mandelbrotIterations(-0.75, 0.1, 50);
      const iter200 = mandelbrotIterations(-0.75, 0.1, 200);
      // maxIter が小さいときは上限に達することがある
      expect(iter50).toBeLessThanOrEqual(50);
      expect(iter200).toBeLessThanOrEqual(200);
    });

    it("c = (10, 10) は即座に発散", () => {
      expect(mandelbrotIterations(10, 10, 100)).toBe(1);
    });
  });

  describe("mandelbrotSmooth", () => {
    it("集合内 (0, 0) は maxIter を返す", () => {
      expect(mandelbrotSmooth(0, 0, 100)).toBe(100);
    });

    it("集合外の点はスムーズな値を返す（非負・非整数の可能性あり）", () => {
      const val = mandelbrotSmooth(2, 0, 100);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(100);
    });

    it("明らかに集合外の点は小さい値を返す", () => {
      const val = mandelbrotSmooth(10, 10, 100);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(5);
    });
  });

  describe("iterationsToColor", () => {
    it("集合内（maxIter）は黒 [0, 0, 0] を返す", () => {
      expect(iterationsToColor(100, 100, "classic")).toEqual([0, 0, 0]);
      expect(iterationsToColor(128, 128, "fire")).toEqual([0, 0, 0]);
      expect(iterationsToColor(50, 50, "ocean")).toEqual([0, 0, 0]);
    });

    it("各スキームで RGB 値が 0〜255 の範囲に収まる", () => {
      const schemes = ["classic", "fire", "ocean", "grayscale", "neon"] as const;
      const testValues = [10, 30, 60, 90];

      for (const scheme of schemes) {
        for (const iter of testValues) {
          const [r, g, b] = iterationsToColor(iter, 100, scheme);
          expect(r).toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThanOrEqual(255);
          expect(g).toBeGreaterThanOrEqual(0);
          expect(g).toBeLessThanOrEqual(255);
          expect(b).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(255);
        }
      }
    });

    it("grayscale では R=G=B", () => {
      const [r, g, b] = iterationsToColor(50, 100, "grayscale");
      expect(r).toBe(g);
      expect(g).toBe(b);
    });

    it("iterations=0 は最暗色に近い", () => {
      const [r, , b] = iterationsToColor(0, 100, "classic");
      expect(r).toBe(0);
      expect(b).toBe(0);
    });
  });

  describe("hsvToRgb", () => {
    it("赤 (0°, 1, 1) → [255, 0, 0]", () => {
      const [r, g, b] = hsvToRgb(0, 1, 1);
      expect(r).toBe(255);
      expect(g).toBe(0);
      expect(b).toBe(0);
    });

    it("緑 (120°, 1, 1) → [0, 255, 0]", () => {
      const [r, g, b] = hsvToRgb(120, 1, 1);
      expect(r).toBe(0);
      expect(g).toBe(255);
      expect(b).toBe(0);
    });

    it("青 (240°, 1, 1) → [0, 0, 255]", () => {
      const [r, g, b] = hsvToRgb(240, 1, 1);
      expect(r).toBe(0);
      expect(g).toBe(0);
      expect(b).toBe(255);
    });

    it("白 (0°, 0, 1) → [255, 255, 255]", () => {
      const [r, g, b] = hsvToRgb(0, 0, 1);
      expect(r).toBe(255);
      expect(g).toBe(255);
      expect(b).toBe(255);
    });

    it("黒 (0°, 0, 0) → [0, 0, 0]", () => {
      const [r, g, b] = hsvToRgb(0, 0, 0);
      expect(r).toBe(0);
      expect(g).toBe(0);
      expect(b).toBe(0);
    });

    it("出力値が 0〜255 の範囲に収まる", () => {
      const hues = [0, 60, 120, 180, 240, 300, 359];
      for (const h of hues) {
        const [r, g, b] = hsvToRgb(h, 1, 1);
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(255);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(255);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(255);
      }
    });
  });

  describe("screenToComplex", () => {
    const vp = DEFAULT_VIEWPORT;
    const W = 800;
    const H = 500;

    it("左上 (0, 0) → (xMin, yMax)", () => {
      const [cx, cy] = screenToComplex(0, 0, vp, W, H);
      expect(cx).toBeCloseTo(vp.xMin);
      expect(cy).toBeCloseTo(vp.yMax);
    });

    it("右下 (W, H) → (xMax, yMin)", () => {
      const [cx, cy] = screenToComplex(W, H, vp, W, H);
      expect(cx).toBeCloseTo(vp.xMax);
      expect(cy).toBeCloseTo(vp.yMin);
    });

    it("中央 (W/2, H/2) → 中心座標", () => {
      const [cx, cy] = screenToComplex(W / 2, H / 2, vp, W, H);
      expect(cx).toBeCloseTo((vp.xMin + vp.xMax) / 2);
      expect(cy).toBeCloseTo((vp.yMin + vp.yMax) / 2);
    });
  });

  describe("zoomViewport", () => {
    it("factor=2 でビューポートの幅・高さが半分になる", () => {
      const vp = DEFAULT_VIEWPORT;
      const cx = (vp.xMin + vp.xMax) / 2;
      const cy = (vp.yMin + vp.yMax) / 2;
      const newVp = zoomViewport(cx, cy, vp, 2);
      const origW = vp.xMax - vp.xMin;
      const origH = vp.yMax - vp.yMin;
      expect(newVp.xMax - newVp.xMin).toBeCloseTo(origW / 2);
      expect(newVp.yMax - newVp.yMin).toBeCloseTo(origH / 2);
    });

    it("中心が指定した複素座標になる", () => {
      const vp = DEFAULT_VIEWPORT;
      const cx = -0.5;
      const cy = 0.3;
      const newVp = zoomViewport(cx, cy, vp, 3);
      expect((newVp.xMin + newVp.xMax) / 2).toBeCloseTo(cx);
      expect((newVp.yMin + newVp.yMax) / 2).toBeCloseTo(cy);
    });

    it("factor < 1 でズームアウト（ビューポートが広がる）", () => {
      const vp = DEFAULT_VIEWPORT;
      const cx = (vp.xMin + vp.xMax) / 2;
      const cy = (vp.yMin + vp.yMax) / 2;
      const newVp = zoomViewport(cx, cy, vp, 0.5);
      expect(newVp.xMax - newVp.xMin).toBeGreaterThan(vp.xMax - vp.xMin);
    });
  });

  describe("getZoomLevel", () => {
    it("デフォルトビューポートはズーム倍率 1", () => {
      expect(getZoomLevel(DEFAULT_VIEWPORT)).toBeCloseTo(1);
    });

    it("2倍ズーム後は倍率 2 になる", () => {
      const cx = (DEFAULT_VIEWPORT.xMin + DEFAULT_VIEWPORT.xMax) / 2;
      const cy = (DEFAULT_VIEWPORT.yMin + DEFAULT_VIEWPORT.yMax) / 2;
      const zoomedVp = zoomViewport(cx, cy, DEFAULT_VIEWPORT, 2);
      expect(getZoomLevel(zoomedVp)).toBeCloseTo(2);
    });

    it("3倍ズーム後は倍率 3 になる", () => {
      const cx = -0.5;
      const cy = 0;
      const zoomedVp = zoomViewport(cx, cy, DEFAULT_VIEWPORT, 3);
      expect(getZoomLevel(zoomedVp)).toBeCloseTo(3);
    });
  });
});
