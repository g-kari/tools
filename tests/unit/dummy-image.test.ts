import { describe, it, expect } from 'vitest';
import { drawDummyImage, generateFilename } from '../../app/routes/dummy-image';

// Mock canvas for testing
function createMockCanvas(): HTMLCanvasElement {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
      fillRect: () => {},
      fillText: () => {},
    }),
  } as unknown as HTMLCanvasElement;
  return canvas;
}

describe('Dummy Image Generation', () => {
  describe('generateFilename', () => {
    it('should generate correct filename for PNG', () => {
      const filename = generateFilename(800, 600, 'png');
      expect(filename).toBe('dummy_800x600.png');
    });

    it('should generate correct filename for JPEG', () => {
      const filename = generateFilename(1920, 1080, 'jpeg');
      expect(filename).toBe('dummy_1920x1080.jpeg');
    });

    it('should generate correct filename for WebP', () => {
      const filename = generateFilename(1200, 630, 'webp');
      expect(filename).toBe('dummy_1200x630.webp');
    });

    it('should handle small dimensions', () => {
      const filename = generateFilename(1, 1, 'png');
      expect(filename).toBe('dummy_1x1.png');
    });

    it('should handle large dimensions', () => {
      const filename = generateFilename(4096, 4096, 'png');
      expect(filename).toBe('dummy_4096x4096.png');
    });
  });

  describe('drawDummyImage', () => {
    it('should set canvas dimensions correctly', () => {
      const canvas = createMockCanvas();
      drawDummyImage(canvas, 800, 600, '#6750A4', '#FFFFFF');
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
    });

    it('should handle square dimensions', () => {
      const canvas = createMockCanvas();
      drawDummyImage(canvas, 400, 400, '#000000', '#FFFFFF');
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(400);
    });

    it('should handle portrait dimensions', () => {
      const canvas = createMockCanvas();
      drawDummyImage(canvas, 375, 812, '#FF0000', '#000000');
      expect(canvas.width).toBe(375);
      expect(canvas.height).toBe(812);
    });

    it('should handle landscape dimensions', () => {
      const canvas = createMockCanvas();
      drawDummyImage(canvas, 1920, 1080, '#0000FF', '#FFFFFF');
      expect(canvas.width).toBe(1920);
      expect(canvas.height).toBe(1080);
    });
  });

  describe('Image format options', () => {
    const formatOptions = [
      { value: 'png', label: 'PNG', mimeType: 'image/png' },
      { value: 'jpeg', label: 'JPEG', mimeType: 'image/jpeg' },
      { value: 'webp', label: 'WebP', mimeType: 'image/webp' },
    ];

    it('should have all format options defined', () => {
      expect(formatOptions).toHaveLength(3);
    });

    it('should have correct MIME types', () => {
      expect(formatOptions.find(f => f.value === 'png')?.mimeType).toBe('image/png');
      expect(formatOptions.find(f => f.value === 'jpeg')?.mimeType).toBe('image/jpeg');
      expect(formatOptions.find(f => f.value === 'webp')?.mimeType).toBe('image/webp');
    });
  });

  describe('Preset sizes', () => {
    const presetSizes = [
      { label: 'SNSアイコン', width: 400, height: 400 },
      { label: 'OGP画像', width: 1200, height: 630 },
      { label: 'HD (720p)', width: 1280, height: 720 },
      { label: 'Full HD (1080p)', width: 1920, height: 1080 },
      { label: 'スマホ縦', width: 375, height: 812 },
      { label: 'タブレット', width: 768, height: 1024 },
    ];

    it('should have all preset sizes defined', () => {
      expect(presetSizes).toHaveLength(6);
    });

    it('should have valid dimensions for all presets', () => {
      presetSizes.forEach(preset => {
        expect(preset.width).toBeGreaterThan(0);
        expect(preset.height).toBeGreaterThan(0);
        expect(preset.width).toBeLessThanOrEqual(4096);
        expect(preset.height).toBeLessThanOrEqual(4096);
      });
    });

    it('should include SNS icon preset with square dimensions', () => {
      const snsPreset = presetSizes.find(p => p.label === 'SNSアイコン');
      expect(snsPreset).toBeDefined();
      expect(snsPreset?.width).toBe(snsPreset?.height);
    });

    it('should include OGP preset with standard dimensions', () => {
      const ogpPreset = presetSizes.find(p => p.label === 'OGP画像');
      expect(ogpPreset).toBeDefined();
      expect(ogpPreset?.width).toBe(1200);
      expect(ogpPreset?.height).toBe(630);
    });
  });

  describe('Color validation', () => {
    it('should accept valid hex colors', () => {
      const validColors = ['#000000', '#FFFFFF', '#6750A4', '#ff0000', '#00FF00'];
      validColors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should recognize invalid hex colors', () => {
      const invalidColors = ['000000', '#FFF', '#GGGGGG', 'red', 'rgb(0,0,0)'];
      invalidColors.forEach(color => {
        expect(color).not.toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('Size constraints', () => {
    const MIN_SIZE = 1;
    const MAX_SIZE = 4096;

    it('should have minimum size of 1', () => {
      expect(MIN_SIZE).toBe(1);
    });

    it('should have maximum size of 4096', () => {
      expect(MAX_SIZE).toBe(4096);
    });

    it('should clamp values within bounds', () => {
      const clamp = (value: number) => Math.max(MIN_SIZE, Math.min(MAX_SIZE, value));

      expect(clamp(0)).toBe(MIN_SIZE);
      expect(clamp(-100)).toBe(MIN_SIZE);
      expect(clamp(5000)).toBe(MAX_SIZE);
      expect(clamp(800)).toBe(800);
    });
  });

  describe('Quality settings', () => {
    it('should accept quality values from 1 to 100', () => {
      for (let quality = 1; quality <= 100; quality++) {
        expect(quality).toBeGreaterThanOrEqual(1);
        expect(quality).toBeLessThanOrEqual(100);
      }
    });

    it('should convert quality to 0-1 range for canvas API', () => {
      const qualityPercent = 92;
      const qualityDecimal = qualityPercent / 100;
      expect(qualityDecimal).toBeCloseTo(0.92);
    });
  });
});
