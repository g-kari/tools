import { describe, it, expect } from 'vite-plus/test';
import { bytesToBase64, base64ToBytes, compressText, decompressBase64, formatBytes, GZIP_FORMAT_LABELS } from '../../app/utils/gzip';

describe('GZip/Deflate 圧縮・解凍ユーティリティ', () => {
  // ---------------------------------------------------------------------------
  // bytesToBase64 / base64ToBytes
  // ---------------------------------------------------------------------------
  describe('bytesToBase64', () => {
    it('空のバイト列を変換できる', () => {
      const result = bytesToBase64(new Uint8Array(0));
      expect(result).toBe('');
    });

    it('単純なバイト列を Base64 に変換できる', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = bytesToBase64(bytes);
      expect(result).toBe('SGVsbG8=');
    });

    it('すべての 0 バイトを変換できる', () => {
      const bytes = new Uint8Array([0, 0, 0]);
      const result = bytesToBase64(bytes);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('base64ToBytes', () => {
    it('Base64 文字列を Uint8Array に変換できる', () => {
      const result = base64ToBytes('SGVsbG8=');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('空文字列を変換すると空の Uint8Array を返す', () => {
      const result = base64ToBytes('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });

    it('空白を含む Base64 文字列を正しく処理する', () => {
      const result = base64ToBytes('  SGVs  bG8=  ');
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('無効な Base64 文字列でエラーを投げる', () => {
      expect(() => base64ToBytes('invalid!!!')).toThrow();
    });

    it('bytesToBase64 との往復変換が成立する', () => {
      const original = new Uint8Array([1, 2, 3, 255, 128, 64]);
      const base64 = bytesToBase64(original);
      const restored = base64ToBytes(base64);
      expect(Array.from(restored)).toEqual(Array.from(original));
    });
  });

  // ---------------------------------------------------------------------------
  // compressText
  // ---------------------------------------------------------------------------
  describe('compressText', () => {
    it('gzip 形式でテキストを圧縮できる', async () => {
      const result = await compressText('Hello, World!', 'gzip');
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.bytes.length).toBeGreaterThan(0);
      expect(result.base64).toBeTruthy();
      expect(typeof result.base64).toBe('string');
      expect(result.originalSize).toBe(13); // "Hello, World!" は 13 バイト
      expect(result.compressedSize).toBe(result.bytes.length);
    });

    it('deflate 形式でテキストを圧縮できる', async () => {
      const result = await compressText('Test text', 'deflate');
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.compressedSize).toBeGreaterThan(0);
    });

    it('deflate-raw 形式でテキストを圧縮できる', async () => {
      const result = await compressText('Test text', 'deflate-raw');
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.compressedSize).toBeGreaterThan(0);
    });

    it('長いテキストは圧縮率が正になる', async () => {
      const longText = 'aaaaaaaaaa'.repeat(1000);
      const result = await compressText(longText, 'gzip');
      expect(result.ratio).toBeGreaterThan(0);
      expect(result.compressedSize).toBeLessThan(result.originalSize);
    });

    it('日本語テキストを圧縮できる', async () => {
      const text = 'こんにちは、世界！';
      const result = await compressText(text, 'gzip');
      expect(result.bytes).toBeInstanceOf(Uint8Array);
      expect(result.originalSize).toBeGreaterThan(0);
    });

    it('空文字列を圧縮できる', async () => {
      const result = await compressText('', 'gzip');
      expect(result.originalSize).toBe(0);
      expect(result.ratio).toBe(0);
    });

    it('compressedSize が bytes.length と一致する', async () => {
      const result = await compressText('sample text', 'gzip');
      expect(result.compressedSize).toBe(result.bytes.length);
    });

    it('base64 が bytesToBase64(bytes) と一致する', async () => {
      const result = await compressText('test', 'gzip');
      expect(result.base64).toBe(bytesToBase64(result.bytes));
    });
  });

  // ---------------------------------------------------------------------------
  // decompressBase64
  // ---------------------------------------------------------------------------
  describe('decompressBase64', () => {
    it('gzip 形式で圧縮したデータを解凍できる', async () => {
      const text = 'Hello, Compression World!';
      const compressed = await compressText(text, 'gzip');
      const decompressed = await decompressBase64(compressed.base64, 'gzip');
      expect(decompressed.text).toBe(text);
    });

    it('deflate 形式で圧縮したデータを解凍できる', async () => {
      const text = 'deflate test';
      const compressed = await compressText(text, 'deflate');
      const decompressed = await decompressBase64(compressed.base64, 'deflate');
      expect(decompressed.text).toBe(text);
    });

    it('deflate-raw 形式で圧縮したデータを解凍できる', async () => {
      const text = 'deflate-raw test';
      const compressed = await compressText(text, 'deflate-raw');
      const decompressed = await decompressBase64(compressed.base64, 'deflate-raw');
      expect(decompressed.text).toBe(text);
    });

    it('日本語テキストの往復変換が成立する', async () => {
      const text = 'テストデータ：日本語・漢字・ひらがなカタカナ！';
      const compressed = await compressText(text, 'gzip');
      const decompressed = await decompressBase64(compressed.base64, 'gzip');
      expect(decompressed.text).toBe(text);
    });

    it('compressedSize と decompressedSize が正しく設定される', async () => {
      const text = 'size test data';
      const compressed = await compressText(text, 'gzip');
      const decompressed = await decompressBase64(compressed.base64, 'gzip');
      expect(decompressed.compressedSize).toBe(compressed.compressedSize);
      expect(decompressed.decompressedSize).toBe(compressed.originalSize);
    });

    it('無効な Base64 でエラーを投げる', async () => {
      await expect(decompressBase64('not-valid-base64!!!', 'gzip')).rejects.toThrow();
    });

    it('空白を含む Base64 文字列を正しく処理する', async () => {
      const text = 'whitespace test';
      const compressed = await compressText(text, 'gzip');
      const base64WithSpaces = compressed.base64.replace(/(.{10})/g, '$1 ');
      const decompressed = await decompressBase64(base64WithSpaces, 'gzip');
      expect(decompressed.text).toBe(text);
    });
  });

  // ---------------------------------------------------------------------------
  // formatBytes
  // ---------------------------------------------------------------------------
  describe('formatBytes', () => {
    it('1023 バイト以下は B 単位で表示する', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1)).toBe('1 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1023)).toBe('1023 B');
    });

    it('1024〜1048575 バイトは KB 単位で表示する', () => {
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(2048)).toBe('2.00 KB');
      expect(formatBytes(1536)).toBe('1.50 KB');
    });

    it('1048576 バイト以上は MB 単位で表示する', () => {
      expect(formatBytes(1048576)).toBe('1.00 MB');
      expect(formatBytes(2097152)).toBe('2.00 MB');
    });
  });

  // ---------------------------------------------------------------------------
  // GZIP_FORMAT_LABELS
  // ---------------------------------------------------------------------------
  describe('GZIP_FORMAT_LABELS', () => {
    it('3 つの形式すべてのラベルが定義されている', () => {
      expect(GZIP_FORMAT_LABELS['gzip']).toBeTruthy();
      expect(GZIP_FORMAT_LABELS['deflate']).toBeTruthy();
      expect(GZIP_FORMAT_LABELS['deflate-raw']).toBeTruthy();
    });

    it('各ラベルが文字列である', () => {
      for (const label of Object.values(GZIP_FORMAT_LABELS)) {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      }
    });
  });
});
