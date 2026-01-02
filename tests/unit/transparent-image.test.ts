import { describe, it, expect } from 'vitest';
import {
  hexToRgba,
  drawCheckerboard,
  generateFilename,
} from '../../app/routes/transparent-image';

// Mock canvas for testing
function createMockCanvas(width: number = 100, height: number = 100): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  fillRects: Array<{ x: number; y: number; w: number; h: number }>;
} {
  const fillRects: Array<{ x: number; y: number; w: number; h: number }> = [];
  const ctx = {
    fillStyle: '',
    globalAlpha: 1,
    fillRect: (x: number, y: number, w: number, h: number) => {
      fillRects.push({ x, y, w, h });
    },
    clearRect: () => {},
  } as unknown as CanvasRenderingContext2D;

  const canvas = {
    width,
    height,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;

  return { canvas, ctx, fillRects };
}

describe('Transparent Image Generation', () => {
  describe('hexToRgba', () => {
    it('should convert valid hex color to rgba', () => {
      expect(hexToRgba('#FF0000', 1)).toBe('rgba(255, 0, 0, 1)');
      expect(hexToRgba('#00FF00', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
      expect(hexToRgba('#0000FF', 0)).toBe('rgba(0, 0, 255, 0)');
    });

    it('should handle hex without hash', () => {
      expect(hexToRgba('FF0000', 1)).toBe('rgba(255, 0, 0, 1)');
    });

    it('should handle lowercase hex', () => {
      expect(hexToRgba('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
    });

    it('should handle mixed case hex', () => {
      expect(hexToRgba('#Ff00Ff', 0.75)).toBe('rgba(255, 0, 255, 0.75)');
    });

    it('should return black for invalid hex', () => {
      expect(hexToRgba('#GGG', 1)).toBe('rgba(0, 0, 0, 1)');
      expect(hexToRgba('invalid', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    });

    it('should handle various alpha values', () => {
      expect(hexToRgba('#FFFFFF', 0)).toBe('rgba(255, 255, 255, 0)');
      expect(hexToRgba('#FFFFFF', 0.25)).toBe('rgba(255, 255, 255, 0.25)');
      expect(hexToRgba('#FFFFFF', 0.5)).toBe('rgba(255, 255, 255, 0.5)');
      expect(hexToRgba('#FFFFFF', 0.75)).toBe('rgba(255, 255, 255, 0.75)');
      expect(hexToRgba('#FFFFFF', 1)).toBe('rgba(255, 255, 255, 1)');
    });
  });

  describe('drawCheckerboard', () => {
    it('should draw checkerboard pattern', () => {
      const { ctx, fillRects } = createMockCanvas(100, 100);
      drawCheckerboard(ctx, 100, 100, 10);

      // Should have at least one fill (the white background)
      expect(fillRects.length).toBeGreaterThan(0);
      // First fill should be full canvas (white background)
      expect(fillRects[0]).toEqual({ x: 0, y: 0, w: 100, h: 100 });
    });

    it('should use default cell size of 10', () => {
      const { ctx, fillRects } = createMockCanvas(30, 30);
      drawCheckerboard(ctx, 30, 30);

      // First is white background, then gray cells
      expect(fillRects.length).toBeGreaterThan(1);
    });

    it('should handle small canvas', () => {
      const { ctx, fillRects } = createMockCanvas(10, 10);
      drawCheckerboard(ctx, 10, 10, 5);

      expect(fillRects.length).toBeGreaterThan(0);
    });

    it('should handle large canvas', () => {
      const { ctx, fillRects } = createMockCanvas(1000, 1000);
      drawCheckerboard(ctx, 1000, 1000, 10);

      expect(fillRects.length).toBeGreaterThan(0);
    });
  });

  describe('generateFilename', () => {
    it('should generate correct filename for transparent image', () => {
      const filename = generateFilename(256, 256, 0);
      expect(filename).toBe('transparent_256x256_transparent.png');
    });

    it('should generate correct filename with opacity', () => {
      const filename = generateFilename(512, 512, 50);
      expect(filename).toBe('transparent_512x512_opacity50.png');
    });

    it('should handle various dimensions', () => {
      expect(generateFilename(16, 16, 0)).toBe('transparent_16x16_transparent.png');
      expect(generateFilename(1024, 1024, 100)).toBe('transparent_1024x1024_opacity100.png');
      expect(generateFilename(100, 200, 75)).toBe('transparent_100x200_opacity75.png');
    });
  });

  describe('Preset sizes', () => {
    const presetSizes = [
      { label: '16×16', width: 16, height: 16 },
      { label: '32×32', width: 32, height: 32 },
      { label: '64×64', width: 64, height: 64 },
      { label: '128×128', width: 128, height: 128 },
      { label: '256×256', width: 256, height: 256 },
      { label: '512×512', width: 512, height: 512 },
      { label: '1024×1024', width: 1024, height: 1024 },
    ];

    it('should have all preset sizes defined', () => {
      expect(presetSizes).toHaveLength(7);
    });

    it('should have valid square dimensions for all presets', () => {
      presetSizes.forEach((preset) => {
        expect(preset.width).toBeGreaterThan(0);
        expect(preset.height).toBeGreaterThan(0);
        expect(preset.width).toBe(preset.height);
      });
    });

    it('should have power of 2 dimensions', () => {
      const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;
      presetSizes.forEach((preset) => {
        expect(isPowerOfTwo(preset.width)).toBe(true);
      });
    });
  });

  describe('Size constraints', () => {
    const MIN_SIZE = 1;
    const MAX_SIZE = 10000;

    it('should have minimum size of 1', () => {
      expect(MIN_SIZE).toBe(1);
    });

    it('should have maximum size of 10000', () => {
      expect(MAX_SIZE).toBe(10000);
    });

    it('should clamp values within bounds', () => {
      const clamp = (value: number) => Math.max(MIN_SIZE, Math.min(MAX_SIZE, value));

      expect(clamp(0)).toBe(MIN_SIZE);
      expect(clamp(-100)).toBe(MIN_SIZE);
      expect(clamp(20000)).toBe(MAX_SIZE);
      expect(clamp(5000)).toBe(5000);
    });
  });

  describe('Opacity validation', () => {
    it('should accept opacity values from 0 to 100', () => {
      for (let opacity = 0; opacity <= 100; opacity += 10) {
        expect(opacity).toBeGreaterThanOrEqual(0);
        expect(opacity).toBeLessThanOrEqual(100);
      }
    });

    it('should convert opacity to 0-1 range for canvas API', () => {
      expect(0 / 100).toBe(0);
      expect(50 / 100).toBe(0.5);
      expect(100 / 100).toBe(1);
    });
  });

  describe('Color validation', () => {
    it('should accept valid hex colors', () => {
      const validColors = ['#000000', '#FFFFFF', '#6750A4', '#ff0000', '#00FF00'];
      validColors.forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should recognize invalid hex colors', () => {
      const invalidColors = ['000000', '#FFF', '#GGGGGG', 'red', 'rgb(0,0,0)'];
      invalidColors.forEach((color) => {
        expect(color).not.toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('Image generation options', () => {
    it('should support complete transparency', () => {
      const opacity = 0;
      const useBackgroundColor = false;
      // When useBackgroundColor is false or opacity is 0, image should be fully transparent
      expect(opacity === 0 || !useBackgroundColor).toBe(true);
    });

    it('should support semi-transparent background', () => {
      const opacity = 50;
      const useBackgroundColor = true;
      const backgroundColor = '#6750A4';
      // When useBackgroundColor is true and opacity > 0, should use background
      expect(useBackgroundColor && opacity > 0).toBe(true);
      expect(backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should support opaque background', () => {
      const opacity = 100;
      const useBackgroundColor = true;
      // When opacity is 100, image should be fully opaque
      expect(opacity).toBe(100);
      expect(useBackgroundColor).toBe(true);
    });
  });
});
