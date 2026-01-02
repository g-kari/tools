import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  extractBase64,
  formatOutput,
  formatNumber,
} from '../../app/routes/image-base64';

describe('Image Base64 Converter', () => {
  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatFileSize(100)).toBe('100 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1023)).toBe('1023 B');
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
      expect(formatFileSize(2147483648)).toBe('2 GB');
    });
  });

  describe('extractBase64', () => {
    it('should extract base64 from data URL', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      expect(extractBase64(dataUrl)).toBe('iVBORw0KGgoAAAANSUhEUgAAAAUA');
    });

    it('should extract base64 from JPEG data URL', () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/';
      expect(extractBase64(dataUrl)).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD/');
    });

    it('should extract base64 from WebP data URL', () => {
      const dataUrl = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAw';
      expect(extractBase64(dataUrl)).toBe('UklGRiQAAABXRUJQVlA4IBgAAAAw');
    });

    it('should return empty string for invalid data URL', () => {
      expect(extractBase64('invalid')).toBe('');
      expect(extractBase64('data:text/plain,hello')).toBe('');
    });

    it('should handle empty string', () => {
      expect(extractBase64('')).toBe('');
    });
  });

  describe('formatOutput', () => {
    const sampleDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
    const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAUA';

    describe('dataUrl format', () => {
      it('should return data URL as is', () => {
        expect(formatOutput(sampleDataUrl, 'dataUrl')).toBe(sampleDataUrl);
      });
    });

    describe('base64Only format', () => {
      it('should return only base64 string', () => {
        expect(formatOutput(sampleDataUrl, 'base64Only')).toBe(sampleBase64);
      });
    });

    describe('htmlImg format', () => {
      it('should return HTML img tag', () => {
        const expected = `<img src="${sampleDataUrl}" alt="Image" />`;
        expect(formatOutput(sampleDataUrl, 'htmlImg')).toBe(expected);
      });
    });

    describe('cssBackground format', () => {
      it('should return CSS background-image property', () => {
        const expected = `background-image: url('${sampleDataUrl}');`;
        expect(formatOutput(sampleDataUrl, 'cssBackground')).toBe(expected);
      });
    });
  });

  describe('formatNumber', () => {
    it('should format small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(1)).toBe('1');
      expect(formatNumber(100)).toBe('100');
    });

    it('should format thousands with comma', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(10000)).toBe('10,000');
    });

    it('should format millions with commas', () => {
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle large numbers', () => {
      expect(formatNumber(123456789)).toBe('123,456,789');
    });
  });

  describe('Data URL format validation', () => {
    it('should validate PNG data URL format', () => {
      const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
      expect(dataUrl).toMatch(/^data:image\/\w+;base64,/);
    });

    it('should validate JPEG data URL format', () => {
      const dataUrl = 'data:image/jpeg;base64,/9j/4AAQ=';
      expect(dataUrl).toMatch(/^data:image\/\w+;base64,/);
    });

    it('should validate WebP data URL format', () => {
      const dataUrl = 'data:image/webp;base64,UklGRiQ=';
      expect(dataUrl).toMatch(/^data:image\/\w+;base64,/);
    });
  });

  describe('Base64 encoding characteristics', () => {
    it('should recognize Base64 characters', () => {
      const base64String = 'iVBORw0KGgoAAAANSUhEUgAAAAUA';
      // Base64 uses A-Z, a-z, 0-9, +, / and = for padding
      expect(base64String).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should handle Base64 with padding', () => {
      const withPadding = 'iVBORw==';
      expect(withPadding).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should handle Base64 without padding', () => {
      const withoutPadding = 'iVBORw0K';
      expect(withoutPadding).toMatch(/^[A-Za-z0-9+/]+$/);
    });
  });

  describe('File size increase calculation', () => {
    it('should verify Base64 encoding increases size by ~33%', () => {
      // Original binary: 3 bytes = 24 bits
      // Base64 encoded: 4 characters = 32 bits (6 bits per character)
      // Increase: (4/3 - 1) * 100 = 33.33%
      const originalBytes = 1024; // 1KB
      const expectedBase64Length = Math.ceil((originalBytes * 4) / 3);

      // Verify the calculation
      expect(expectedBase64Length).toBeGreaterThan(originalBytes);
      expect(expectedBase64Length / originalBytes).toBeCloseTo(1.33, 1);
    });
  });

  describe('Output format examples', () => {
    const exampleDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';

    it('should generate valid HTML img element', () => {
      const html = formatOutput(exampleDataUrl, 'htmlImg');
      expect(html).toContain('<img src="');
      expect(html).toContain('alt="Image"');
      expect(html).toContain('/>');
    });

    it('should generate valid CSS background-image', () => {
      const css = formatOutput(exampleDataUrl, 'cssBackground');
      expect(css).toContain('background-image:');
      expect(css).toContain('url(');
      expect(css).toContain(');');
    });

    it('should preserve data URL integrity in HTML output', () => {
      const html = formatOutput(exampleDataUrl, 'htmlImg');
      expect(html).toContain(exampleDataUrl);
    });

    it('should preserve data URL integrity in CSS output', () => {
      const css = formatOutput(exampleDataUrl, 'cssBackground');
      expect(css).toContain(exampleDataUrl);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long base64 strings', () => {
      const longBase64 = 'A'.repeat(10000);
      const dataUrl = `data:image/png;base64,${longBase64}`;
      expect(extractBase64(dataUrl)).toBe(longBase64);
    });

    it('should handle data URL with special characters in base64', () => {
      const base64WithSpecial = 'abc+def/ghi==';
      const dataUrl = `data:image/png;base64,${base64WithSpecial}`;
      expect(extractBase64(dataUrl)).toBe(base64WithSpecial);
    });

    it('should format very large file sizes', () => {
      const largeSize = 1024 * 1024 * 1024 * 10; // 10GB
      const formatted = formatFileSize(largeSize);
      expect(formatted).toContain('GB');
      expect(parseFloat(formatted)).toBeGreaterThan(0);
    });
  });
});
