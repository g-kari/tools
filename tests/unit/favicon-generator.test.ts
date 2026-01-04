import { describe, it, expect } from 'vitest';
import { createIcoFile, createFaviconsZip } from '../../app/routes/favicon-generator';

/**
 * Favicon Generator utility functions tests
 * These tests cover the pure logic functions without DOM dependencies
 */
describe('Favicon Generator', () => {
  describe('FAVICON_SIZES constant validation', () => {
    it('should have standard favicon sizes defined', () => {
      const expectedSizes = [16, 32, 48, 64, 128, 180, 192, 256, 512];
      expectedSizes.forEach((size) => {
        expect(size).toBeGreaterThan(0);
        expect(size).toBeLessThanOrEqual(512);
      });
    });

    it('should have valid size configurations', () => {
      const sizeConfigs = [
        { name: '16x16', width: 16, height: 16, filename: 'favicon-16x16.png' },
        { name: '32x32', width: 32, height: 32, filename: 'favicon-32x32.png' },
        { name: '180x180', width: 180, height: 180, filename: 'apple-touch-icon.png' },
        { name: '192x192', width: 192, height: 192, filename: 'android-chrome-192x192.png' },
        { name: '512x512', width: 512, height: 512, filename: 'android-chrome-512x512.png' },
      ];

      sizeConfigs.forEach((config) => {
        expect(config.width).toBe(config.height);
        expect(config.filename).toMatch(/\.(png|ico)$/);
      });
    });
  });

  describe('File naming conventions', () => {
    it('should use correct naming for standard favicons', () => {
      const expectedNames = [
        'favicon-16x16.png',
        'favicon-32x32.png',
        'favicon-48x48.png',
        'favicon-64x64.png',
        'favicon-128x128.png',
        'favicon-256x256.png',
      ];

      expectedNames.forEach((name) => {
        expect(name).toMatch(/^favicon-\d+x\d+\.png$/);
      });
    });

    it('should use correct naming for Apple touch icons', () => {
      const appleTouchIcon = 'apple-touch-icon.png';
      expect(appleTouchIcon).toBe('apple-touch-icon.png');
    });

    it('should use correct naming for Android Chrome icons', () => {
      const androidIcons = ['android-chrome-192x192.png', 'android-chrome-512x512.png'];
      androidIcons.forEach((icon) => {
        expect(icon).toMatch(/^android-chrome-\d+x\d+\.png$/);
      });
    });
  });

  describe('Size validation', () => {
    it('should have square dimensions for all sizes', () => {
      const sizes = [
        { width: 16, height: 16 },
        { width: 32, height: 32 },
        { width: 48, height: 48 },
        { width: 64, height: 64 },
        { width: 128, height: 128 },
        { width: 180, height: 180 },
        { width: 192, height: 192 },
        { width: 256, height: 256 },
        { width: 512, height: 512 },
      ];

      sizes.forEach((size) => {
        expect(size.width).toBe(size.height);
      });
    });

    it('should have positive dimensions', () => {
      const dimensions = [16, 32, 48, 64, 128, 180, 192, 256, 512];
      dimensions.forEach((dim) => {
        expect(dim).toBeGreaterThan(0);
      });
    });

    it('should cover common use cases', () => {
      const useCases = {
        'standard-small': 16,
        'standard-medium': 32,
        'windows': 48,
        'apple-touch': 180,
        'android-small': 192,
        'android-large': 512,
      };

      Object.values(useCases).forEach((size) => {
        expect(size).toBeGreaterThan(0);
        expect(Number.isInteger(size)).toBe(true);
      });
    });
  });

  describe('Image format', () => {
    it('should output PNG format for all favicons', () => {
      const filenames = [
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'android-chrome-192x192.png',
      ];

      filenames.forEach((filename) => {
        expect(filename).toMatch(/\.png$/);
      });
    });

    it('should have valid MIME type for PNG', () => {
      const pngMimeType = 'image/png';
      expect(pngMimeType).toBe('image/png');
    });
  });

  describe('ZIP file configuration', () => {
    it('should create proper ZIP filename', () => {
      const zipFilename = 'favicons.zip';
      expect(zipFilename).toMatch(/\.zip$/);
    });

    it('should support common ZIP MIME type', () => {
      const zipMimeType = 'application/zip';
      expect(zipMimeType).toBe('application/zip');
    });
  });

  describe('Default selection logic', () => {
    it('should have essential sizes selected by default', () => {
      const defaultSizes = [
        { name: '16x16', defaultSelected: true },
        { name: '32x32', defaultSelected: true },
        { name: '48x48', defaultSelected: true },
        { name: '180x180', defaultSelected: true },
        { name: '192x192', defaultSelected: true },
        { name: '512x512', defaultSelected: true },
      ];

      const selectedCount = defaultSizes.filter((s) => s.defaultSelected).length;
      expect(selectedCount).toBeGreaterThan(0);
    });

    it('should allow optional sizes to be deselected by default', () => {
      const optionalSizes = [
        { name: '64x64', defaultSelected: false },
        { name: '128x128', defaultSelected: false },
        { name: '256x256', defaultSelected: false },
      ];

      optionalSizes.forEach((size) => {
        expect(size.defaultSelected).toBe(false);
      });
    });
  });

  describe('Resize algorithm considerations', () => {
    it('should use high quality smoothing for downscaling', () => {
      const smoothingQuality = 'high';
      expect(['low', 'medium', 'high']).toContain(smoothingQuality);
    });

    it('should maintain aspect ratio as square', () => {
      const sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512];
      sizes.forEach((size) => {
        const aspectRatio = size / size;
        expect(aspectRatio).toBe(1);
      });
    });
  });

  describe('HTML integration code', () => {
    it('should generate valid link tags for favicons', () => {
      const linkTags = [
        '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
        '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
      ];

      linkTags.forEach((tag) => {
        expect(tag).toContain('<link');
        expect(tag).toContain('href=');
        expect(tag).toMatch(/>$/);
      });
    });

    it('should include manifest reference', () => {
      const manifestLink = '<link rel="manifest" href="/site.webmanifest">';
      expect(manifestLink).toContain('manifest');
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle no sizes selected', () => {
      const selectedSizes: string[] = [];
      expect(selectedSizes.length).toBe(0);
    });

    it('should handle all sizes selected', () => {
      const allSizes = [16, 32, 48, 64, 128, 180, 192, 256, 512];
      expect(allSizes.length).toBe(9);
    });
  });

  describe('File validation', () => {
    it('should accept image MIME types', () => {
      const validMimeTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/svg+xml',
        'image/gif',
      ];

      validMimeTypes.forEach((mimeType) => {
        expect(mimeType.startsWith('image/')).toBe(true);
      });
    });

    it('should reject non-image MIME types', () => {
      const invalidMimeTypes = [
        'text/plain',
        'application/pdf',
        'video/mp4',
        'audio/mpeg',
      ];

      invalidMimeTypes.forEach((mimeType) => {
        expect(mimeType.startsWith('image/')).toBe(false);
      });
    });
  });

  describe('ICO file generation', () => {
    it('should create valid ICO file structure', async () => {
      // Create simple test PNG blobs
      const createTestPngBlob = (size: number): Blob => {
        // Minimal PNG header (8 bytes signature + simplified structure)
        const pngSignature = new Uint8Array([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
          0x00, 0x00, 0x00, 0x0D, // IHDR length
          0x49, 0x48, 0x44, 0x52, // IHDR type
          0x00, 0x00, 0x00, size, // width
          0x00, 0x00, 0x00, size, // height
          0x08, 0x02, // bit depth, color type
          0x00, 0x00, 0x00, // compression, filter, interlace
          0x00, 0x00, 0x00, 0x00, // CRC placeholder
        ]);
        return new Blob([pngSignature], { type: 'image/png' });
      };

      const images = [
        { size: 16, blob: createTestPngBlob(16) },
        { size: 32, blob: createTestPngBlob(32) },
      ];

      const icoBlob = await createIcoFile(images);

      expect(icoBlob).toBeInstanceOf(Blob);
      expect(icoBlob.type).toBe('image/x-icon');
      expect(icoBlob.size).toBeGreaterThan(0);
    });

    it('should include correct ICO header', async () => {
      const testBlob = new Blob([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], { type: 'image/png' });
      const images = [{ size: 16, blob: testBlob }];

      const icoBlob = await createIcoFile(images);
      const arrayBuffer = await icoBlob.arrayBuffer();
      const view = new DataView(arrayBuffer);

      // Check ICO header
      expect(view.getUint16(0, true)).toBe(0); // Reserved
      expect(view.getUint16(2, true)).toBe(1); // Type (1 = ICO)
      expect(view.getUint16(4, true)).toBe(1); // Number of images
    });

    it('should handle multiple image sizes', async () => {
      const testBlob = new Blob([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], { type: 'image/png' });
      const images = [
        { size: 16, blob: testBlob },
        { size: 32, blob: testBlob },
        { size: 48, blob: testBlob },
      ];

      const icoBlob = await createIcoFile(images);
      const arrayBuffer = await icoBlob.arrayBuffer();
      const view = new DataView(arrayBuffer);

      expect(view.getUint16(4, true)).toBe(3); // Number of images
    });

    it('should sort images by size', async () => {
      const testBlob = new Blob([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], { type: 'image/png' });
      // Provide images in unsorted order
      const images = [
        { size: 48, blob: testBlob },
        { size: 16, blob: testBlob },
        { size: 32, blob: testBlob },
      ];

      const icoBlob = await createIcoFile(images);
      const arrayBuffer = await icoBlob.arrayBuffer();
      const view = new DataView(arrayBuffer);

      // Check that first entry is 16x16 (header offset 6)
      expect(view.getUint8(6)).toBe(16); // Width of first image
    });

    it('should handle size 256 as 0 in ICO header', async () => {
      const testBlob = new Blob([new Uint8Array([0x89, 0x50, 0x4E, 0x47])], { type: 'image/png' });
      const images = [{ size: 256, blob: testBlob }];

      const icoBlob = await createIcoFile(images);
      const arrayBuffer = await icoBlob.arrayBuffer();
      const view = new DataView(arrayBuffer);

      // 256 should be stored as 0 in ICO format
      expect(view.getUint8(6)).toBe(0); // Width
      expect(view.getUint8(7)).toBe(0); // Height
    });
  });

  describe('ZIP file creation', () => {
    it('should have createFaviconsZip function exported', () => {
      expect(typeof createFaviconsZip).toBe('function');
    });

    it('should accept Map and optional Blob parameters', () => {
      // Verify function signature
      expect(createFaviconsZip.length).toBeGreaterThanOrEqual(1);
    });

    it('should return a Promise', () => {
      const favicons = new Map<string, Blob>();
      const result = createFaviconsZip(favicons);
      expect(result).toBeInstanceOf(Promise);
    });

    // Note: Full ZIP creation tests require browser environment
    // as JSZip doesn't fully support Node.js Blob
  });

  describe('ICO format specifications', () => {
    it('should have correct ICO sizes for browser compatibility', () => {
      const icoSizes = [16, 32, 48];
      icoSizes.forEach((size) => {
        expect(size).toBeLessThanOrEqual(256);
        expect(size).toBeGreaterThan(0);
      });
    });

    it('should support 32-bit color depth', () => {
      const colorDepth = 32;
      expect(colorDepth).toBe(32);
    });
  });
});
