import { describe, it, expect } from 'vite-plus/test';
import {
  filterDuplicateFiles,
  createCompressItem,
  buildZipFilename,
  getTotalCompressionSummary,
  calculateCompressionRatio,
  generateFilename,
} from '../../app/routes/image-compress';
import type { CompressItem } from '../../app/types/image-compress';

/**
 * モック用Fileオブジェクトを生成するヘルパー
 */
function createMockFile(name: string, size: number, type = 'image/jpeg'): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

/**
 * モック用CompressItemを生成するヘルパー
 */
function createMockCompressItem(
  override: Partial<CompressItem> = {}
): CompressItem {
  return {
    id: Math.random().toString(),
    originalFile: createMockFile('test.jpg', 1000),
    previewUrl: 'blob:test',
    compressedBlob: null,
    compressedPreviewUrl: null,
    status: 'pending',
    ...override,
  };
}

describe('filterDuplicateFiles', () => {
  it('重複なしの場合は全ファイルを返す', () => {
    const existing = [
      createMockCompressItem({ originalFile: createMockFile('a.jpg', 100) }),
    ];
    const newFiles = [
      createMockFile('b.jpg', 200),
      createMockFile('c.png', 300),
    ];
    const result = filterDuplicateFiles(existing, newFiles);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('b.jpg');
    expect(result[1].name).toBe('c.png');
  });

  it('同名・同サイズのファイルは除外される', () => {
    const existing = [
      createMockCompressItem({ originalFile: createMockFile('photo.jpg', 1000) }),
    ];
    const newFiles = [
      createMockFile('photo.jpg', 1000), // 重複
      createMockFile('other.jpg', 500),  // 新規
    ];
    const result = filterDuplicateFiles(existing, newFiles);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('other.jpg');
  });

  it('同名でもサイズが異なる場合は含まれる', () => {
    const existing = [
      createMockCompressItem({ originalFile: createMockFile('photo.jpg', 1000) }),
    ];
    const newFiles = [
      createMockFile('photo.jpg', 2000), // 同名・異サイズ → 含まれる
    ];
    const result = filterDuplicateFiles(existing, newFiles);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('photo.jpg');
    expect(result[0].size).toBe(2000);
  });

  it('空配列に全ファイルを追加できる', () => {
    const existing: CompressItem[] = [];
    const newFiles = [
      createMockFile('a.jpg', 100),
      createMockFile('b.png', 200),
      createMockFile('c.webp', 300),
    ];
    const result = filterDuplicateFiles(existing, newFiles);
    expect(result).toHaveLength(3);
  });
});

describe('createCompressItem', () => {
  it('2回呼び出しで異なるidが生成される', async () => {
    const file = createMockFile('test.jpg', 1000);
    const item1 = createCompressItem(file, 'blob:url1');
    // IDがDate.now()ベースのため、微小な時間差のために少し待機
    await new Promise((resolve) => setTimeout(resolve, 5));
    const item2 = createCompressItem(file, 'blob:url2');
    expect(item1.id).not.toBe(item2.id);
  });

  it('statusが "pending" であること', () => {
    const file = createMockFile('test.jpg', 500);
    const item = createCompressItem(file, 'blob:preview');
    expect(item.status).toBe('pending');
  });

  it('file と previewUrl が正しくセットされること', () => {
    const file = createMockFile('sample.png', 2048, 'image/png');
    const previewUrl = 'blob:http://localhost/abc-123';
    const item = createCompressItem(file, previewUrl);
    expect(item.originalFile).toBe(file);
    expect(item.previewUrl).toBe(previewUrl);
  });

  it('compressedBlob が null であること', () => {
    const file = createMockFile('test.webp', 800, 'image/webp');
    const item = createCompressItem(file, 'blob:preview');
    expect(item.compressedBlob).toBeNull();
  });

  it('compressedPreviewUrl が null であること', () => {
    const file = createMockFile('test.jpg', 1000);
    const item = createCompressItem(file, 'blob:preview');
    expect(item.compressedPreviewUrl).toBeNull();
  });
});

describe('buildZipFilename', () => {
  it('compressed_images_YYYYMMDD.zip の形式であること', () => {
    const filename = buildZipFilename();
    expect(filename).toMatch(/^compressed_images_\d{8}\.zip$/);
  });

  it('.zip で終わること', () => {
    const filename = buildZipFilename();
    expect(filename.endsWith('.zip')).toBe(true);
  });

  it('プレフィックスが compressed_images_ であること', () => {
    const filename = buildZipFilename();
    expect(filename.startsWith('compressed_images_')).toBe(true);
  });

  it('日付部分が8桁の数字であること', () => {
    const filename = buildZipFilename();
    const datepart = filename.replace('compressed_images_', '').replace('.zip', '');
    expect(datepart).toHaveLength(8);
    expect(/^\d{8}$/.test(datepart)).toBe(true);
  });
});

describe('getTotalCompressionSummary', () => {
  it('done 状態のアイテムのみ集計されること', () => {
    const blob = new Blob([new ArrayBuffer(500)]);
    const items: CompressItem[] = [
      createMockCompressItem({
        status: 'done',
        originalFile: createMockFile('a.jpg', 1000),
        compressedBlob: blob,
      }),
      createMockCompressItem({
        status: 'done',
        originalFile: createMockFile('b.jpg', 2000),
        compressedBlob: new Blob([new ArrayBuffer(1000)]),
      }),
      createMockCompressItem({ status: 'pending' }),
    ];
    const summary = getTotalCompressionSummary(items);
    expect(summary.originalTotal).toBe(3000);
    expect(summary.compressedTotal).toBe(1500);
  });

  it('pending 状態のアイテムは除外されること', () => {
    const items: CompressItem[] = [
      createMockCompressItem({ status: 'pending' }),
      createMockCompressItem({ status: 'pending' }),
    ];
    const summary = getTotalCompressionSummary(items);
    expect(summary.originalTotal).toBe(0);
    expect(summary.compressedTotal).toBe(0);
    expect(summary.ratio).toBe(0);
  });

  it('error 状態のアイテムは除外されること', () => {
    const items: CompressItem[] = [
      createMockCompressItem({ status: 'error', error: '圧縮に失敗しました' }),
    ];
    const summary = getTotalCompressionSummary(items);
    expect(summary.originalTotal).toBe(0);
    expect(summary.compressedTotal).toBe(0);
    expect(summary.ratio).toBe(0);
  });

  it('空配列の場合は 0 を返すこと', () => {
    const summary = getTotalCompressionSummary([]);
    expect(summary.originalTotal).toBe(0);
    expect(summary.compressedTotal).toBe(0);
    expect(summary.ratio).toBe(0);
  });

  it('削減率が正しく計算されること', () => {
    const items: CompressItem[] = [
      createMockCompressItem({
        status: 'done',
        originalFile: createMockFile('a.jpg', 1000),
        compressedBlob: new Blob([new ArrayBuffer(500)]),
      }),
    ];
    const summary = getTotalCompressionSummary(items);
    // 1000 -> 500 = 50% 削減
    expect(summary.ratio).toBe(50);
  });

  it('compressingアイテムのcompressedBlobがnullの場合は集計しない', () => {
    const items: CompressItem[] = [
      createMockCompressItem({
        status: 'done',
        originalFile: createMockFile('a.jpg', 1000),
        compressedBlob: null, // done だが blob なし → 除外
      }),
    ];
    const summary = getTotalCompressionSummary(items);
    // compressedBlob が null の done アイテムは除外
    expect(summary.originalTotal).toBe(0);
    expect(summary.compressedTotal).toBe(0);
    expect(summary.ratio).toBe(0);
  });
});

describe('calculateCompressionRatio（既存）', () => {
  it('50% 削減の計算', () => {
    expect(calculateCompressionRatio(1000, 500)).toBe(50);
  });

  it('0KB元ファイルの場合に 0 を返す', () => {
    expect(calculateCompressionRatio(0, 0)).toBe(0);
    expect(calculateCompressionRatio(0, 100)).toBe(0);
  });

  it('圧縮後が大きい場合（マイナス値）', () => {
    // 100 -> 150 = -50%
    expect(calculateCompressionRatio(100, 150)).toBe(-50);
  });
});

describe('generateFilename（既存）', () => {
  it('jpeg形式', () => {
    expect(generateFilename('photo.png', 'jpeg')).toBe('photo_compressed.jpeg');
  });

  it('webp形式', () => {
    expect(generateFilename('photo.png', 'webp')).toBe('photo_compressed.webp');
  });

  it('拡張子付きのファイル名', () => {
    expect(generateFilename('image.jpg', 'jpeg')).toBe('image_compressed.jpeg');
    expect(generateFilename('screenshot.png', 'png')).toBe('screenshot_compressed.png');
  });

  it('複数ドットを含むファイル名', () => {
    expect(generateFilename('my.photo.2024.jpg', 'webp')).toBe('my.photo.2024_compressed.webp');
  });
});
