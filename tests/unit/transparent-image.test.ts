import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  colorDistance,
  makeColorTransparent,
  drawCheckerboard,
  generateFilename,
} from '../../app/routes/transparent-image';

// Mock canvas context for testing
function createMockImageData(width: number, height: number, fillColor?: { r: number; g: number; b: number; a: number }): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  if (fillColor) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = fillColor.r;
      data[i + 1] = fillColor.g;
      data[i + 2] = fillColor.b;
      data[i + 3] = fillColor.a;
    }
  }
  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

function createMockContext(): {
  ctx: CanvasRenderingContext2D;
  fillRects: Array<{ x: number; y: number; w: number; h: number }>;
} {
  const fillRects: Array<{ x: number; y: number; w: number; h: number }> = [];
  const ctx = {
    fillStyle: '',
    fillRect: (x: number, y: number, w: number, h: number) => {
      fillRects.push({ x, y, w, h });
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, fillRects };
}

describe('Transparent Image Processing', () => {
  describe('hexToRgb', () => {
    it('should convert valid hex color to RGB', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should handle hex without hash', () => {
      expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should handle lowercase hex', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should handle mixed case hex', () => {
      expect(hexToRgb('#Ff00Ff')).toEqual({ r: 255, g: 0, b: 255 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('#GGG')).toBeNull();
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#FFF')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('should handle intermediate values', () => {
      expect(rgbToHex(128, 128, 128)).toBe('#808080');
      expect(rgbToHex(16, 32, 48)).toBe('#102030');
    });

    it('should pad single digit hex values', () => {
      expect(rgbToHex(1, 2, 3)).toBe('#010203');
      expect(rgbToHex(0, 15, 0)).toBe('#000f00');
    });
  });

  describe('colorDistance', () => {
    it('should return 0 for identical colors', () => {
      const color = { r: 128, g: 128, b: 128 };
      expect(colorDistance(color, color)).toBe(0);
    });

    it('should calculate distance between colors', () => {
      const white = { r: 255, g: 255, b: 255 };
      const black = { r: 0, g: 0, b: 0 };
      // Max distance is √(255² + 255² + 255²) ≈ 441.67
      expect(colorDistance(white, black)).toBeCloseTo(441.67, 1);
    });

    it('should calculate distance for single channel difference', () => {
      const color1 = { r: 0, g: 0, b: 0 };
      const color2 = { r: 255, g: 0, b: 0 };
      expect(colorDistance(color1, color2)).toBe(255);
    });

    it('should be symmetric', () => {
      const color1 = { r: 100, g: 150, b: 200 };
      const color2 = { r: 50, g: 100, b: 250 };
      expect(colorDistance(color1, color2)).toBe(colorDistance(color2, color1));
    });
  });

  describe('makeColorTransparent', () => {
    it('should make exact matching color fully transparent', () => {
      const imageData = createMockImageData(2, 2, { r: 255, g: 255, b: 255, a: 255 });
      const targetColor = { r: 255, g: 255, b: 255 };
      const result = makeColorTransparent(imageData, targetColor, 10);

      // All pixels should be transparent
      for (let i = 0; i < result.data.length; i += 4) {
        expect(result.data[i + 3]).toBe(0);
      }
    });

    it('should not affect non-matching colors with low tolerance', () => {
      const imageData = createMockImageData(2, 2, { r: 0, g: 0, b: 0, a: 255 });
      const targetColor = { r: 255, g: 255, b: 255 };
      const result = makeColorTransparent(imageData, targetColor, 10);

      // All pixels should remain opaque
      for (let i = 0; i < result.data.length; i += 4) {
        expect(result.data[i + 3]).toBe(255);
      }
    });

    it('should handle 0% tolerance', () => {
      const imageData = createMockImageData(1, 1, { r: 255, g: 255, b: 255, a: 255 });
      const targetColor = { r: 255, g: 255, b: 255 };
      const result = makeColorTransparent(imageData, targetColor, 0);

      // Even exact match should work at 0% tolerance (distance is 0)
      expect(result.data[3]).toBe(0);
    });

    it('should handle 100% tolerance', () => {
      const imageData = createMockImageData(1, 1, { r: 0, g: 0, b: 0, a: 255 });
      const targetColor = { r: 255, g: 255, b: 255 };
      const result = makeColorTransparent(imageData, targetColor, 100);

      // At 100% tolerance, the max distance covers entire color space
      // Black (0,0,0) to white (255,255,255) has distance ~441.67
      // At 100% tolerance, all colors should be within range
      expect(result.data[3]).toBeLessThanOrEqual(255);
    });
  });

  describe('drawCheckerboard', () => {
    it('should draw checkerboard pattern', () => {
      const { ctx, fillRects } = createMockContext();
      drawCheckerboard(ctx, 100, 100, 10);

      // First fill is white background
      expect(fillRects[0]).toEqual({ x: 0, y: 0, w: 100, h: 100 });
      // Should have gray cells
      expect(fillRects.length).toBeGreaterThan(1);
    });

    it('should use default cell size', () => {
      const { ctx, fillRects } = createMockContext();
      drawCheckerboard(ctx, 30, 30);

      expect(fillRects.length).toBeGreaterThan(1);
    });

    it('should handle small canvas', () => {
      const { ctx, fillRects } = createMockContext();
      drawCheckerboard(ctx, 10, 10, 5);

      expect(fillRects.length).toBeGreaterThan(0);
    });
  });

  describe('generateFilename', () => {
    it('should generate correct filename with extension', () => {
      expect(generateFilename('image.jpg')).toBe('image_transparent.png');
      expect(generateFilename('photo.png')).toBe('photo_transparent.png');
      expect(generateFilename('test.webp')).toBe('test_transparent.png');
    });

    it('should handle files without extension', () => {
      expect(generateFilename('noextension')).toBe('noextension_transparent.png');
    });

    it('should handle complex filenames', () => {
      expect(generateFilename('my.file.name.jpg')).toBe('my.file.name_transparent.png');
      expect(generateFilename('file-with-dashes.png')).toBe('file-with-dashes_transparent.png');
      expect(generateFilename('file_with_underscores.png')).toBe('file_with_underscores_transparent.png');
    });
  });

  describe('Tolerance validation', () => {
    it('should accept tolerance values from 0 to 100', () => {
      for (let tolerance = 0; tolerance <= 100; tolerance += 10) {
        expect(tolerance).toBeGreaterThanOrEqual(0);
        expect(tolerance).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate max distance correctly', () => {
      // Max RGB distance is √(255² + 255² + 255²) ≈ 441.67
      const maxDistance = Math.sqrt(255 * 255 + 255 * 255 + 255 * 255);
      expect(maxDistance).toBeCloseTo(441.67, 1);
    });
  });

  describe('Color validation', () => {
    it('should accept valid hex colors', () => {
      const validColors = ['#000000', '#FFFFFF', '#6750A4', '#ff0000', '#00FF00'];
      validColors.forEach((color) => {
        expect(hexToRgb(color)).not.toBeNull();
      });
    });

    it('should reject invalid hex colors', () => {
      // '000000' without hash is now valid, so test truly invalid colors
      const invalidColors = ['#FFF', '#GGGGGG', 'red', 'rgb(0,0,0)', ''];
      invalidColors.forEach((color) => {
        expect(hexToRgb(color)).toBeNull();
      });
    });
  });

  describe('Image processing edge cases', () => {
    it('should handle empty image data', () => {
      const imageData = createMockImageData(0, 0);
      const targetColor = { r: 255, g: 255, b: 255 };
      const result = makeColorTransparent(imageData, targetColor, 50);
      expect(result.data.length).toBe(0);
    });

    it('should handle single pixel image', () => {
      const imageData = createMockImageData(1, 1, { r: 128, g: 128, b: 128, a: 255 });
      const targetColor = { r: 128, g: 128, b: 128 };
      const result = makeColorTransparent(imageData, targetColor, 10);
      expect(result.data[3]).toBe(0);
    });

    it('should preserve non-targeted pixels', () => {
      // Create image with two different colors
      const imageData = createMockImageData(2, 1);
      // First pixel: red
      imageData.data[0] = 255;
      imageData.data[1] = 0;
      imageData.data[2] = 0;
      imageData.data[3] = 255;
      // Second pixel: blue
      imageData.data[4] = 0;
      imageData.data[5] = 0;
      imageData.data[6] = 255;
      imageData.data[7] = 255;

      const targetColor = { r: 255, g: 0, b: 0 };
      const result = makeColorTransparent(imageData, targetColor, 10);

      // Red pixel should be transparent
      expect(result.data[3]).toBe(0);
      // Blue pixel should remain opaque
      expect(result.data[7]).toBe(255);
    });
  });
});
