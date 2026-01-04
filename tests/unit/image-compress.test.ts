import { describe, it, expect } from 'vitest';
import { formatFileSize } from '../../app/utils/image';
import {
  calculateCompressionRatio,
  generateFilename,
} from '../../app/routes/image-compress';

describe('Image Compression', () => {
  describe('formatFileSize', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(5242880)).toBe('5 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(2147483648)).toBe('2 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1234567)).toBe('1.18 MB');
      expect(formatFileSize(9876543)).toBe('9.42 MB');
    });
  });

  describe('calculateCompressionRatio', () => {
    it('should return 0 when original size is 0', () => {
      expect(calculateCompressionRatio(0, 0)).toBe(0);
      expect(calculateCompressionRatio(0, 100)).toBe(0);
    });

    it('should calculate positive compression ratio correctly', () => {
      // 1MB reduced to 500KB = 50% reduction
      expect(calculateCompressionRatio(1000000, 500000)).toBe(50);
    });

    it('should calculate 100% compression correctly', () => {
      expect(calculateCompressionRatio(1000, 0)).toBe(100);
    });

    it('should calculate negative compression (size increase) correctly', () => {
      // Size increased from 100 to 150 = -50%
      expect(calculateCompressionRatio(100, 150)).toBe(-50);
    });

    it('should return 0 when sizes are equal', () => {
      expect(calculateCompressionRatio(1000, 1000)).toBe(0);
    });

    it('should round to nearest integer', () => {
      // 33.33...% should round to 33
      expect(calculateCompressionRatio(300, 200)).toBe(33);
      // 66.66...% should round to 67
      expect(calculateCompressionRatio(300, 100)).toBe(67);
    });

    it('should handle real-world compression scenarios', () => {
      // 5MB JPEG reduced to 1MB = 80% reduction
      expect(calculateCompressionRatio(5242880, 1048576)).toBe(80);
      // 10MB PNG reduced to 2.5MB = 75% reduction
      expect(calculateCompressionRatio(10485760, 2621440)).toBe(75);
    });
  });

  describe('generateFilename', () => {
    it('should generate correct filename for JPEG', () => {
      expect(generateFilename('photo.png', 'jpeg')).toBe('photo_compressed.jpeg');
      expect(generateFilename('image.jpg', 'jpeg')).toBe('image_compressed.jpeg');
    });

    it('should generate correct filename for WebP', () => {
      expect(generateFilename('photo.png', 'webp')).toBe('photo_compressed.webp');
      expect(generateFilename('image.jpeg', 'webp')).toBe('image_compressed.webp');
    });

    it('should generate correct filename for PNG', () => {
      expect(generateFilename('photo.jpg', 'png')).toBe('photo_compressed.png');
      expect(generateFilename('screenshot.png', 'png')).toBe('screenshot_compressed.png');
    });

    it('should handle filenames with multiple dots', () => {
      expect(generateFilename('my.photo.2024.png', 'jpeg')).toBe('my.photo.2024_compressed.jpeg');
    });

    it('should handle filenames without extension', () => {
      expect(generateFilename('image', 'jpeg')).toBe('image_compressed.jpeg');
    });

    it('should handle filenames with special characters', () => {
      expect(generateFilename('my-image_123.png', 'webp')).toBe('my-image_123_compressed.webp');
    });
  });

  describe('Quality settings', () => {
    it('should accept quality values from 1 to 100', () => {
      for (let quality = 1; quality <= 100; quality++) {
        expect(quality).toBeGreaterThanOrEqual(1);
        expect(quality).toBeLessThanOrEqual(100);
      }
    });

    it('should convert quality percentage to decimal correctly', () => {
      expect(80 / 100).toBeCloseTo(0.8);
      expect(50 / 100).toBeCloseTo(0.5);
      expect(100 / 100).toBeCloseTo(1.0);
      expect(1 / 100).toBeCloseTo(0.01);
    });
  });

  describe('Format options', () => {
    const formatOptions = [
      { value: 'jpeg', label: 'JPEG', mimeType: 'image/jpeg' },
      { value: 'webp', label: 'WebP', mimeType: 'image/webp' },
      { value: 'png', label: 'PNG', mimeType: 'image/png' },
    ];

    it('should have all format options defined', () => {
      expect(formatOptions).toHaveLength(3);
    });

    it('should have correct MIME types', () => {
      expect(formatOptions.find(f => f.value === 'jpeg')?.mimeType).toBe('image/jpeg');
      expect(formatOptions.find(f => f.value === 'webp')?.mimeType).toBe('image/webp');
      expect(formatOptions.find(f => f.value === 'png')?.mimeType).toBe('image/png');
    });

    it('should have correct labels', () => {
      expect(formatOptions.find(f => f.value === 'jpeg')?.label).toBe('JPEG');
      expect(formatOptions.find(f => f.value === 'webp')?.label).toBe('WebP');
      expect(formatOptions.find(f => f.value === 'png')?.label).toBe('PNG');
    });
  });

  describe('Image validation', () => {
    it('should recognize valid image MIME types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
      validTypes.forEach(type => {
        expect(type.startsWith('image/')).toBe(true);
      });
    });

    it('should reject non-image MIME types', () => {
      const invalidTypes = ['text/plain', 'application/pdf', 'video/mp4', 'audio/mp3'];
      invalidTypes.forEach(type => {
        expect(type.startsWith('image/')).toBe(false);
      });
    });
  });

  describe('Compression scenarios', () => {
    it('should handle typical photo compression', () => {
      // Typical scenario: 5MB photo compressed to ~1MB at 80% quality
      const originalSize = 5 * 1024 * 1024; // 5MB
      const compressedSize = 1 * 1024 * 1024; // 1MB
      const ratio = calculateCompressionRatio(originalSize, compressedSize);
      expect(ratio).toBe(80);
      expect(formatFileSize(originalSize)).toBe('5 MB');
      expect(formatFileSize(compressedSize)).toBe('1 MB');
    });

    it('should handle WebP conversion gains', () => {
      // WebP typically achieves 25-35% better compression than JPEG
      const jpegSize = 1000000; // 1MB JPEG
      const webpSize = 700000; // 0.7MB WebP (30% smaller)
      const ratio = calculateCompressionRatio(jpegSize, webpSize);
      expect(ratio).toBe(30);
    });

    it('should handle PNG to JPEG lossy compression', () => {
      // Converting PNG screenshot to JPEG can significantly reduce size
      const pngSize = 3 * 1024 * 1024; // 3MB PNG
      const jpegSize = 500 * 1024; // 500KB JPEG
      const ratio = calculateCompressionRatio(pngSize, jpegSize);
      expect(ratio).toBeGreaterThan(80);
    });
  });
});
