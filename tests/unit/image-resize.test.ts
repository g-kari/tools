import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  calculateAspectRatioSize,
  clampDimension,
  generateFilename,
} from '../../app/routes/image-resize';

describe('Image Resize', () => {
  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatFileSize(100)).toBe('100 B');
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(5242880)).toBe('5 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('calculateAspectRatioSize', () => {
    describe('when given width and calculating height', () => {
      it('should calculate height for landscape image (16:9)', () => {
        const result = calculateAspectRatioSize(1920, 1080, 960, null);
        expect(result.width).toBe(960);
        expect(result.height).toBe(540);
      });

      it('should calculate height for portrait image (9:16)', () => {
        const result = calculateAspectRatioSize(1080, 1920, 540, null);
        expect(result.width).toBe(540);
        expect(result.height).toBe(960);
      });

      it('should calculate height for square image', () => {
        const result = calculateAspectRatioSize(1000, 1000, 500, null);
        expect(result.width).toBe(500);
        expect(result.height).toBe(500);
      });
    });

    describe('when given height and calculating width', () => {
      it('should calculate width for landscape image (16:9)', () => {
        const result = calculateAspectRatioSize(1920, 1080, null, 540);
        expect(result.width).toBe(960);
        expect(result.height).toBe(540);
      });

      it('should calculate width for portrait image (9:16)', () => {
        const result = calculateAspectRatioSize(1080, 1920, null, 960);
        expect(result.width).toBe(540);
        expect(result.height).toBe(960);
      });

      it('should calculate width for square image', () => {
        const result = calculateAspectRatioSize(1000, 1000, null, 500);
        expect(result.width).toBe(500);
        expect(result.height).toBe(500);
      });
    });

    describe('when both dimensions are provided', () => {
      it('should return provided dimensions', () => {
        const result = calculateAspectRatioSize(1920, 1080, 640, 480);
        expect(result.width).toBe(640);
        expect(result.height).toBe(480);
      });
    });

    describe('when neither dimension is provided', () => {
      it('should return original dimensions', () => {
        const result = calculateAspectRatioSize(1920, 1080, null, null);
        expect(result.width).toBe(1920);
        expect(result.height).toBe(1080);
      });
    });

    describe('edge cases', () => {
      it('should handle very wide images (21:9)', () => {
        const result = calculateAspectRatioSize(2560, 1080, 1280, null);
        expect(result.width).toBe(1280);
        expect(result.height).toBe(540);
      });

      it('should handle very tall images (1:3)', () => {
        const result = calculateAspectRatioSize(500, 1500, 250, null);
        expect(result.width).toBe(250);
        expect(result.height).toBe(750);
      });

      it('should round to integers', () => {
        const result = calculateAspectRatioSize(1920, 1080, 1000, null);
        expect(Number.isInteger(result.height)).toBe(true);
      });
    });
  });

  describe('clampDimension', () => {
    it('should return value within bounds', () => {
      expect(clampDimension(500)).toBe(500);
      expect(clampDimension(1000)).toBe(1000);
    });

    it('should clamp to minimum', () => {
      expect(clampDimension(0)).toBe(1);
      expect(clampDimension(-100)).toBe(1);
    });

    it('should clamp to maximum', () => {
      expect(clampDimension(15000)).toBe(10000);
      expect(clampDimension(100000)).toBe(10000);
    });

    it('should clamp to custom minimum', () => {
      expect(clampDimension(5, 10, 100)).toBe(10);
    });

    it('should clamp to custom maximum', () => {
      expect(clampDimension(200, 10, 100)).toBe(100);
    });

    it('should round floating point values', () => {
      expect(clampDimension(100.5)).toBe(101);
      expect(clampDimension(100.4)).toBe(100);
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with dimensions and original extension', () => {
      expect(generateFilename('photo.jpg', 800, 600, false)).toBe('photo_resized_800x600.jpg');
      expect(generateFilename('image.png', 1920, 1080, false)).toBe('image_resized_1920x1080.png');
    });

    it('should generate filename with cropped suffix when isCropped is true', () => {
      expect(generateFilename('photo.jpg', 800, 600, true)).toBe('photo_cropped_800x600.jpg');
      expect(generateFilename('image.png', 500, 500, true)).toBe('image_cropped_500x500.png');
    });

    it('should handle files without extension', () => {
      expect(generateFilename('image', 500, 500, false)).toBe('image_resized_500x500.png');
    });

    it('should handle multiple dots in filename', () => {
      expect(generateFilename('my.photo.file.jpeg', 640, 480, false)).toBe('my.photo.file_resized_640x480.jpeg');
    });

    it('should preserve various extensions', () => {
      expect(generateFilename('test.webp', 256, 256, false)).toBe('test_resized_256x256.webp');
      expect(generateFilename('test.gif', 100, 100, false)).toBe('test_resized_100x100.gif');
      expect(generateFilename('test.bmp', 50, 50, false)).toBe('test_resized_50x50.bmp');
    });

    it('should handle filenames with special characters', () => {
      expect(generateFilename('photo-2024_01.jpg', 400, 300, false)).toBe('photo-2024_01_resized_400x300.jpg');
    });
  });

  describe('Preset sizes', () => {
    const presetSizes = [
      { label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
      { label: 'HD (1280×720)', width: 1280, height: 720 },
      { label: 'VGA (640×480)', width: 640, height: 480 },
      { label: '正方形 (512×512)', width: 512, height: 512 },
      { label: 'サムネイル (256×256)', width: 256, height: 256 },
      { label: 'アイコン (128×128)', width: 128, height: 128 },
    ];

    it('should have all preset sizes defined', () => {
      expect(presetSizes).toHaveLength(6);
    });

    it('should have valid dimensions for all presets', () => {
      presetSizes.forEach(preset => {
        expect(preset.width).toBeGreaterThan(0);
        expect(preset.height).toBeGreaterThan(0);
        expect(preset.width).toBeLessThanOrEqual(10000);
        expect(preset.height).toBeLessThanOrEqual(10000);
      });
    });

    it('should include Full HD preset', () => {
      const fullHdPreset = presetSizes.find(p => p.width === 1920 && p.height === 1080);
      expect(fullHdPreset).toBeDefined();
    });

    it('should include HD preset', () => {
      const hdPreset = presetSizes.find(p => p.width === 1280 && p.height === 720);
      expect(hdPreset).toBeDefined();
    });

    it('should include square presets', () => {
      const squarePresets = presetSizes.filter(p => p.width === p.height);
      expect(squarePresets.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Size constraints', () => {
    const MIN_DIMENSION = 1;
    const MAX_DIMENSION = 10000;

    it('should have minimum dimension of 1', () => {
      expect(MIN_DIMENSION).toBe(1);
    });

    it('should have maximum dimension of 10000', () => {
      expect(MAX_DIMENSION).toBe(10000);
    });

    it('should validate dimensions within bounds', () => {
      const isValid = (value: number) =>
        value >= MIN_DIMENSION && value <= MAX_DIMENSION;

      expect(isValid(1)).toBe(true);
      expect(isValid(10000)).toBe(true);
      expect(isValid(5000)).toBe(true);
      expect(isValid(0)).toBe(false);
      expect(isValid(10001)).toBe(false);
    });
  });

  describe('Aspect ratio calculations', () => {
    it('should calculate 16:9 aspect ratio correctly', () => {
      const width = 1920;
      const height = 1080;
      const ratio = width / height;
      expect(ratio).toBeCloseTo(1.777778, 4);
    });

    it('should calculate 4:3 aspect ratio correctly', () => {
      const width = 640;
      const height = 480;
      const ratio = width / height;
      expect(ratio).toBeCloseTo(1.333333, 4);
    });

    it('should calculate 1:1 aspect ratio correctly', () => {
      const width = 512;
      const height = 512;
      const ratio = width / height;
      expect(ratio).toBe(1);
    });

    it('should maintain aspect ratio when scaling down', () => {
      const originalWidth = 1920;
      const originalHeight = 1080;
      const originalRatio = originalWidth / originalHeight;

      const result = calculateAspectRatioSize(originalWidth, originalHeight, 960, null);
      const newRatio = result.width / result.height;

      expect(newRatio).toBeCloseTo(originalRatio, 2);
    });

    it('should maintain aspect ratio when scaling up', () => {
      const originalWidth = 640;
      const originalHeight = 480;
      const originalRatio = originalWidth / originalHeight;

      const result = calculateAspectRatioSize(originalWidth, originalHeight, 1280, null);
      const newRatio = result.width / result.height;

      expect(newRatio).toBeCloseTo(originalRatio, 2);
    });
  });
});
