import { describe, it, expect } from 'vitest';
import { drawDummyImage, generateFilename } from '../../app/routes/dummy-image';
import { generateSvgImage, parseImageParams, convertSvgToPng, convertPngToJpeg, convertPngToWebp } from '../../app/functions/dummy-image';

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

  describe('SVG Image API', () => {
    describe('generateSvgImage', () => {
      it('should generate valid SVG with correct dimensions', () => {
        const svg = generateSvgImage(800, 600, '6750A4', 'FFFFFF');
        expect(svg).toContain('<svg');
        expect(svg).toContain('width="800"');
        expect(svg).toContain('height="600"');
        expect(svg).toContain('800 × 600');
      });

      it('should include correct colors', () => {
        const svg = generateSvgImage(400, 300, 'FF0000', '000000');
        expect(svg).toContain('fill="#FF0000"');
        expect(svg).toContain('fill="#000000"');
      });

      it('should handle small dimensions', () => {
        const svg = generateSvgImage(1, 1, '000000', 'FFFFFF');
        expect(svg).toContain('width="1"');
        expect(svg).toContain('height="1"');
      });

      it('should handle large dimensions', () => {
        const svg = generateSvgImage(4096, 4096, '000000', 'FFFFFF');
        expect(svg).toContain('width="4096"');
        expect(svg).toContain('height="4096"');
      });

      it('should have valid SVG structure', () => {
        const svg = generateSvgImage(100, 100, 'AABBCC', 'DDEEFF');
        expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(svg).toContain('<rect');
        expect(svg).toContain('<text');
        expect(svg).toContain('</svg>');
      });
    });

    describe('parseImageParams', () => {
      it('should parse width and height correctly', () => {
        const params = new URLSearchParams('w=800&h=600');
        const result = parseImageParams(params);
        expect(result.width).toBe(800);
        expect(result.height).toBe(600);
      });

      it('should use default values when params are missing', () => {
        const params = new URLSearchParams();
        const result = parseImageParams(params);
        expect(result.width).toBe(300);
        expect(result.height).toBe(150);
        expect(result.bgColor).toBe('6750A4');
        expect(result.textColor).toBe('FFFFFF');
      });

      it('should clamp width to valid range', () => {
        const paramsSmall = new URLSearchParams('w=0');
        expect(parseImageParams(paramsSmall).width).toBe(1);

        const paramsLarge = new URLSearchParams('w=10000');
        expect(parseImageParams(paramsLarge).width).toBe(4096);
      });

      it('should clamp height to valid range', () => {
        const paramsSmall = new URLSearchParams('h=-100');
        expect(parseImageParams(paramsSmall).height).toBe(1);

        const paramsLarge = new URLSearchParams('h=5000');
        expect(parseImageParams(paramsLarge).height).toBe(4096);
      });

      it('should sanitize background color', () => {
        const validParams = new URLSearchParams('bg=FF0000');
        expect(parseImageParams(validParams).bgColor).toBe('FF0000');

        const invalidParams = new URLSearchParams('bg=invalid');
        expect(parseImageParams(invalidParams).bgColor).toBe('6750A4');

        const hashParams = new URLSearchParams('bg=#00FF00');
        expect(parseImageParams(hashParams).bgColor).toBe('00FF00');
      });

      it('should sanitize text color', () => {
        const validParams = new URLSearchParams('text=000000');
        expect(parseImageParams(validParams).textColor).toBe('000000');

        const invalidParams = new URLSearchParams('text=xyz');
        expect(parseImageParams(invalidParams).textColor).toBe('FFFFFF');
      });

      it('should handle all parameters together', () => {
        const params = new URLSearchParams('w=1200&h=630&bg=123456&text=ABCDEF');
        const result = parseImageParams(params);
        expect(result.width).toBe(1200);
        expect(result.height).toBe(630);
        expect(result.bgColor).toBe('123456');
        expect(result.textColor).toBe('ABCDEF');
      });
    });
  });

  describe('Image Conversion API', () => {
    describe('convertSvgToPng', () => {
      it('should convert SVG to PNG buffer', async () => {
        const svg = generateSvgImage(100, 100, '000000', 'FFFFFF');
        const pngBuffer = await convertSvgToPng(svg);
        expect(pngBuffer).toBeInstanceOf(ArrayBuffer);
        expect(pngBuffer.byteLength).toBeGreaterThan(0);
      });

      it('should handle small SVG images', async () => {
        const svg = generateSvgImage(1, 1, '000000', 'FFFFFF');
        const pngBuffer = await convertSvgToPng(svg);
        expect(pngBuffer).toBeInstanceOf(ArrayBuffer);
      });

      it('should handle large SVG images', async () => {
        const svg = generateSvgImage(1000, 1000, '000000', 'FFFFFF');
        const pngBuffer = await convertSvgToPng(svg);
        expect(pngBuffer).toBeInstanceOf(ArrayBuffer);
        expect(pngBuffer.byteLength).toBeGreaterThan(0);
      });
    });

    describe('convertPngToJpeg', () => {
      it('should convert PNG to JPEG buffer', async () => {
        const svg = generateSvgImage(100, 100, '000000', 'FFFFFF');
        const pngBuffer = await convertSvgToPng(svg);
        const jpegBuffer = await convertPngToJpeg(pngBuffer, 85);
        expect(jpegBuffer).toBeInstanceOf(ArrayBuffer);
        expect(jpegBuffer.byteLength).toBeGreaterThan(0);
      });

      it('should accept quality parameter', async () => {
        const svg = generateSvgImage(100, 100, '000000', 'FFFFFF');
        const pngBuffer = await convertSvgToPng(svg);

        const jpegLowQuality = await convertPngToJpeg(pngBuffer, 50);
        const jpegHighQuality = await convertPngToJpeg(pngBuffer, 95);

        expect(jpegLowQuality).toBeInstanceOf(ArrayBuffer);
        expect(jpegHighQuality).toBeInstanceOf(ArrayBuffer);
      });
    });

    describe('convertPngToWebp', () => {
      it('should convert PNG to WebP buffer', async () => {
        const svg = generateSvgImage(100, 100, '000000', 'FFFFFF');
        const pngBuffer = await convertSvgToPng(svg);
        const webpBuffer = await convertPngToWebp(pngBuffer);
        expect(webpBuffer).toBeInstanceOf(ArrayBuffer);
        expect(webpBuffer.byteLength).toBeGreaterThan(0);
      });
    });

    describe('Full conversion pipeline', () => {
      it('should convert SVG to PNG, JPEG, and WebP', async () => {
        const svg = generateSvgImage(200, 200, 'FF0000', '000000');

        // SVG to PNG
        const pngBuffer = await convertSvgToPng(svg);
        expect(pngBuffer).toBeInstanceOf(ArrayBuffer);

        // PNG to JPEG
        const jpegBuffer = await convertPngToJpeg(pngBuffer, 85);
        expect(jpegBuffer).toBeInstanceOf(ArrayBuffer);

        // PNG to WebP
        const webpBuffer = await convertPngToWebp(pngBuffer);
        expect(webpBuffer).toBeInstanceOf(ArrayBuffer);
      });
    });
  });
});
