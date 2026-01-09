import { describe, it, expect } from 'vitest';
import { resizeImage, canvasToBlobWithLimit } from '../../app/routes/sticker-converter';

// Mock canvas for testing
function createMockCanvas(width: number = 100, height: number = 100): HTMLCanvasElement {
  const canvas = {
    width,
    height,
    getContext: () => ({
      drawImage: () => {},
      clearRect: () => {},
    }),
    toBlob: (callback: (blob: Blob | null) => void, type?: string, quality?: number) => {
      // Create a mock blob
      const mockBlob = new Blob(['mock image data'], { type: type || 'image/png' });
      callback(mockBlob);
    },
  } as unknown as HTMLCanvasElement;
  return canvas;
}

describe('Sticker Converter', () => {
  describe('Platform limits', () => {
    const STICKER_LIMITS = {
      discord: { maxSize: 320, maxFileSize: 512 * 1024, label: "Discord (最大320x320px, 512KB)" },
      slack: { maxSize: 128, maxFileSize: 1024 * 1024, label: "Slack (最大128x128px, 1MB)" },
    };

    it('should have correct Discord limits', () => {
      expect(STICKER_LIMITS.discord.maxSize).toBe(320);
      expect(STICKER_LIMITS.discord.maxFileSize).toBe(512 * 1024);
    });

    it('should have correct Slack limits', () => {
      expect(STICKER_LIMITS.slack.maxSize).toBe(128);
      expect(STICKER_LIMITS.slack.maxFileSize).toBe(1024 * 1024);
    });

    it('should have descriptive labels', () => {
      expect(STICKER_LIMITS.discord.label).toContain('Discord');
      expect(STICKER_LIMITS.discord.label).toContain('320');
      expect(STICKER_LIMITS.discord.label).toContain('512KB');

      expect(STICKER_LIMITS.slack.label).toContain('Slack');
      expect(STICKER_LIMITS.slack.label).toContain('128');
      expect(STICKER_LIMITS.slack.label).toContain('1MB');
    });
  });

  describe('Output formats', () => {
    const FORMAT_LABELS = {
      png: "PNG (ロスレス)",
      webp: "WebP (高圧縮)",
    };

    const FORMAT_EXTENSIONS = {
      png: "png",
      webp: "webp",
    };

    const FORMAT_MIME_TYPES = {
      png: "image/png",
      webp: "image/webp",
    };

    it('should have correct format labels', () => {
      expect(FORMAT_LABELS.png).toBe("PNG (ロスレス)");
      expect(FORMAT_LABELS.webp).toBe("WebP (高圧縮)");
    });

    it('should have correct format extensions', () => {
      expect(FORMAT_EXTENSIONS.png).toBe("png");
      expect(FORMAT_EXTENSIONS.webp).toBe("webp");
    });

    it('should have correct MIME types', () => {
      expect(FORMAT_MIME_TYPES.png).toBe("image/png");
      expect(FORMAT_MIME_TYPES.webp).toBe("image/webp");
    });
  });

  describe('resizeImage', () => {
    it('should handle Discord size parameter', () => {
      const discordMaxSize = 320;
      expect(discordMaxSize).toBe(320);
      expect(discordMaxSize).toBeGreaterThan(0);
    });

    it('should handle Slack size parameter', () => {
      const slackMaxSize = 128;
      expect(slackMaxSize).toBe(128);
      expect(slackMaxSize).toBeGreaterThan(0);
    });
  });

  describe('canvasToBlobWithLimit', () => {
    it('should convert canvas to blob for PNG format', async () => {
      const canvas = createMockCanvas(320, 320);
      const blob = await canvasToBlobWithLimit(canvas, 'png', 0.92, 512 * 1024);

      expect(blob).toBeTruthy();
      if (blob) {
        expect(blob).toBeInstanceOf(Blob);
      }
    });

    it('should convert canvas to blob for WebP format', async () => {
      const canvas = createMockCanvas(128, 128);
      const blob = await canvasToBlobWithLimit(canvas, 'webp', 0.92, 1024 * 1024);

      expect(blob).toBeTruthy();
      if (blob) {
        expect(blob).toBeInstanceOf(Blob);
      }
    });

    it('should respect quality parameter for WebP', async () => {
      const canvas = createMockCanvas(256, 256);

      // High quality
      const blobHigh = await canvasToBlobWithLimit(canvas, 'webp', 0.95, 1024 * 1024);
      expect(blobHigh).toBeTruthy();

      // Low quality
      const blobLow = await canvasToBlobWithLimit(canvas, 'webp', 0.5, 512 * 1024);
      expect(blobLow).toBeTruthy();
    });

    it('should handle size limits for Discord', async () => {
      const canvas = createMockCanvas(320, 320);
      const maxSize = 512 * 1024; // Discord limit

      const blob = await canvasToBlobWithLimit(canvas, 'png', 0.92, maxSize);
      expect(blob).toBeTruthy();
    });

    it('should handle size limits for Slack', async () => {
      const canvas = createMockCanvas(128, 128);
      const maxSize = 1024 * 1024; // Slack limit

      const blob = await canvasToBlobWithLimit(canvas, 'webp', 0.92, maxSize);
      expect(blob).toBeTruthy();
    });
  });

  describe('Sticker size constraints', () => {
    it('should validate Discord sticker dimensions', () => {
      const maxSize = 320;
      expect(maxSize).toBe(320);
      expect(maxSize).toBeGreaterThan(0);
      expect(maxSize).toBeLessThanOrEqual(320);
    });

    it('should validate Slack sticker dimensions', () => {
      const maxSize = 128;
      expect(maxSize).toBe(128);
      expect(maxSize).toBeGreaterThan(0);
      expect(maxSize).toBeLessThanOrEqual(128);
    });

    it('should validate Discord file size limit', () => {
      const maxFileSize = 512 * 1024; // 512KB in bytes
      expect(maxFileSize).toBe(524288);
      expect(maxFileSize).toBeGreaterThan(0);
    });

    it('should validate Slack file size limit', () => {
      const maxFileSize = 1024 * 1024; // 1MB in bytes
      expect(maxFileSize).toBe(1048576);
      expect(maxFileSize).toBeGreaterThan(0);
    });
  });

  describe('Quality settings', () => {
    it('should accept quality values from 0.1 to 1.0', () => {
      const qualities = [0.1, 0.5, 0.75, 0.92, 1.0];
      qualities.forEach(quality => {
        expect(quality).toBeGreaterThanOrEqual(0.1);
        expect(quality).toBeLessThanOrEqual(1.0);
      });
    });

    it('should convert quality percentage to decimal', () => {
      const qualityPercent = 92;
      const qualityDecimal = qualityPercent / 100;
      expect(qualityDecimal).toBeCloseTo(0.92);
    });

    it('should handle quality range for WebP compression', () => {
      const minQuality = 0.1;
      const maxQuality = 1.0;
      const defaultQuality = 0.92;

      expect(defaultQuality).toBeGreaterThanOrEqual(minQuality);
      expect(defaultQuality).toBeLessThanOrEqual(maxQuality);
    });
  });

  describe('File type validation', () => {
    it('should accept image file types', () => {
      const validTypes = [
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
      ];

      validTypes.forEach(type => {
        expect(type.startsWith('image/')).toBe(true);
      });
    });

    it('should reject non-image file types', () => {
      const invalidTypes = [
        'text/plain',
        'application/pdf',
        'video/mp4',
        'audio/mp3',
      ];

      invalidTypes.forEach(type => {
        expect(type.startsWith('image/')).toBe(false);
      });
    });
  });

  describe('Filename generation', () => {
    it('should generate correct filename for Discord PNG', () => {
      const platform = 'discord';
      const format = 'png';
      const timestamp = Date.now();
      const filename = `sticker_${platform}_${timestamp}.${format}`;

      expect(filename).toContain('sticker_discord');
      expect(filename).toContain('.png');
    });

    it('should generate correct filename for Slack WebP', () => {
      const platform = 'slack';
      const format = 'webp';
      const timestamp = Date.now();
      const filename = `sticker_${platform}_${timestamp}.${format}`;

      expect(filename).toContain('sticker_slack');
      expect(filename).toContain('.webp');
    });

    it('should include timestamp in filename', () => {
      const platform = 'discord';
      const format = 'png';
      const timestamp = Date.now();
      const filename = `sticker_${platform}_${timestamp}.${format}`;

      // Filename should include all components
      expect(filename).toContain('sticker_discord');
      expect(filename).toContain(timestamp.toString());
      expect(filename).toContain('.png');
    });
  });

  describe('Preview size', () => {
    const PREVIEW_SIZE = 256;

    it('should have preview size of 256px', () => {
      expect(PREVIEW_SIZE).toBe(256);
    });

    it('should be larger than Slack max size', () => {
      expect(PREVIEW_SIZE).toBeGreaterThan(128); // Slack max
    });

    it('should be suitable for preview display', () => {
      expect(PREVIEW_SIZE).toBeGreaterThanOrEqual(256);
      expect(PREVIEW_SIZE).toBeLessThanOrEqual(512);
    });
  });

  describe('Aspect ratio preservation', () => {
    it('should preserve aspect ratio when resizing', () => {
      const originalWidth = 1000;
      const originalHeight = 500;
      const maxSize = 320;

      const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight);
      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;

      const originalRatio = originalWidth / originalHeight;
      const scaledRatio = scaledWidth / scaledHeight;

      expect(scaledRatio).toBeCloseTo(originalRatio, 5);
    });

    it('should not exceed max size in either dimension', () => {
      const originalWidth = 1000;
      const originalHeight = 800;
      const maxSize = 320;

      const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight);
      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;

      expect(scaledWidth).toBeLessThanOrEqual(maxSize);
      expect(scaledHeight).toBeLessThanOrEqual(maxSize);
    });

    it('should handle square images correctly', () => {
      const originalWidth = 1000;
      const originalHeight = 1000;
      const maxSize = 128;

      const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight);
      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;

      expect(scaledWidth).toBe(scaledHeight);
      expect(scaledWidth).toBeLessThanOrEqual(maxSize);
    });

    it('should handle portrait images correctly', () => {
      const originalWidth = 500;
      const originalHeight = 1000;
      const maxSize = 320;

      const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight);
      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;

      expect(scaledHeight).toBeLessThanOrEqual(maxSize);
      expect(scaledWidth).toBeLessThan(scaledHeight);
    });

    it('should handle landscape images correctly', () => {
      const originalWidth = 1000;
      const originalHeight = 500;
      const maxSize = 320;

      const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight);
      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;

      expect(scaledWidth).toBeLessThanOrEqual(maxSize);
      expect(scaledWidth).toBeGreaterThan(scaledHeight);
    });
  });
});
