import { describe, it, expect } from 'vitest';
import {
  MIME_TYPES,
  filterMimeTypes,
  getMimeCategoryLabel,
  getMimeCategoryClass,
  type MimeType,
} from '../../app/routes/mime-types';

describe('MIME_TYPES', () => {
  it('全データが定義されている', () => {
    expect(MIME_TYPES).toBeDefined();
    expect(Array.isArray(MIME_TYPES)).toBe(true);
    expect(MIME_TYPES.length).toBeGreaterThan(0);
  });

  it('各エントリはtype, extensions, description, categoryを持つ', () => {
    const validCategories = [
      'application',
      'text',
      'image',
      'audio',
      'video',
      'font',
      'multipart',
    ];
    MIME_TYPES.forEach((item) => {
      expect(typeof item.type).toBe('string');
      expect(item.type.trim().length).toBeGreaterThan(0);
      expect(Array.isArray(item.extensions)).toBe(true);
      expect(typeof item.description).toBe('string');
      expect(item.description.trim().length).toBeGreaterThan(0);
      expect(validCategories).toContain(item.category);
    });
  });

  it('MIMEタイプ文字列はtype/subtypeの形式を持つ', () => {
    MIME_TYPES.forEach((item) => {
      expect(item.type).toMatch(/^[a-z0-9]+\//);
    });
  });

  it('MIMEタイプの重複がない', () => {
    const types = MIME_TYPES.map((m) => m.type);
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size).toBe(types.length);
  });

  it('applicationカテゴリのエントリが含まれている', () => {
    const appTypes = MIME_TYPES.filter((m) => m.category === 'application');
    expect(appTypes.length).toBeGreaterThanOrEqual(10);
    const typeNames = appTypes.map((m) => m.type);
    expect(typeNames).toContain('application/json');
    expect(typeNames).toContain('application/pdf');
    expect(typeNames).toContain('application/zip');
    expect(typeNames).toContain('application/octet-stream');
    expect(typeNames).toContain('application/x-www-form-urlencoded');
  });

  it('textカテゴリのエントリが含まれている', () => {
    const textTypes = MIME_TYPES.filter((m) => m.category === 'text');
    expect(textTypes.length).toBeGreaterThanOrEqual(5);
    const typeNames = textTypes.map((m) => m.type);
    expect(typeNames).toContain('text/html');
    expect(typeNames).toContain('text/css');
    expect(typeNames).toContain('text/javascript');
    expect(typeNames).toContain('text/plain');
    expect(typeNames).toContain('text/csv');
  });

  it('imageカテゴリのエントリが含まれている', () => {
    const imageTypes = MIME_TYPES.filter((m) => m.category === 'image');
    expect(imageTypes.length).toBeGreaterThanOrEqual(5);
    const typeNames = imageTypes.map((m) => m.type);
    expect(typeNames).toContain('image/jpeg');
    expect(typeNames).toContain('image/png');
    expect(typeNames).toContain('image/gif');
    expect(typeNames).toContain('image/webp');
    expect(typeNames).toContain('image/svg+xml');
  });

  it('audioカテゴリのエントリが含まれている', () => {
    const audioTypes = MIME_TYPES.filter((m) => m.category === 'audio');
    expect(audioTypes.length).toBeGreaterThanOrEqual(4);
    const typeNames = audioTypes.map((m) => m.type);
    expect(typeNames).toContain('audio/mpeg');
    expect(typeNames).toContain('audio/wav');
    expect(typeNames).toContain('audio/ogg');
  });

  it('videoカテゴリのエントリが含まれている', () => {
    const videoTypes = MIME_TYPES.filter((m) => m.category === 'video');
    expect(videoTypes.length).toBeGreaterThanOrEqual(4);
    const typeNames = videoTypes.map((m) => m.type);
    expect(typeNames).toContain('video/mp4');
    expect(typeNames).toContain('video/webm');
  });

  it('fontカテゴリのエントリが含まれている', () => {
    const fontTypes = MIME_TYPES.filter((m) => m.category === 'font');
    expect(fontTypes.length).toBeGreaterThanOrEqual(3);
    const typeNames = fontTypes.map((m) => m.type);
    expect(typeNames).toContain('font/woff');
    expect(typeNames).toContain('font/woff2');
    expect(typeNames).toContain('font/ttf');
  });

  it('multipartカテゴリのエントリが含まれている', () => {
    const multipartTypes = MIME_TYPES.filter(
      (m) => m.category === 'multipart'
    );
    expect(multipartTypes.length).toBeGreaterThanOrEqual(2);
    const typeNames = multipartTypes.map((m) => m.type);
    expect(typeNames).toContain('multipart/form-data');
  });

  it('application/jsonは.json拡張子を持つ', () => {
    const json = MIME_TYPES.find((m) => m.type === 'application/json');
    expect(json).toBeDefined();
    expect(json?.extensions).toContain('.json');
  });

  it('image/jpegは.jpgと.jpeg拡張子を持つ', () => {
    const jpeg = MIME_TYPES.find((m) => m.type === 'image/jpeg');
    expect(jpeg).toBeDefined();
    expect(jpeg?.extensions).toContain('.jpg');
    expect(jpeg?.extensions).toContain('.jpeg');
  });

  it('font/woff2は.woff2拡張子を持つ', () => {
    const woff2 = MIME_TYPES.find((m) => m.type === 'font/woff2');
    expect(woff2).toBeDefined();
    expect(woff2?.extensions).toContain('.woff2');
  });
});

describe('getMimeCategoryLabel', () => {
  it('allはすべてを返す', () => {
    expect(getMimeCategoryLabel('all')).toBe('すべて');
  });

  it('各カテゴリのラベルを返す', () => {
    expect(getMimeCategoryLabel('application')).toBe('application');
    expect(getMimeCategoryLabel('text')).toBe('text');
    expect(getMimeCategoryLabel('image')).toBe('image');
    expect(getMimeCategoryLabel('audio')).toBe('audio');
    expect(getMimeCategoryLabel('video')).toBe('video');
    expect(getMimeCategoryLabel('font')).toBe('font');
    expect(getMimeCategoryLabel('multipart')).toBe('multipart');
  });

  it('未知のカテゴリはそのまま返す', () => {
    expect(getMimeCategoryLabel('unknown')).toBe('unknown');
  });
});

describe('getMimeCategoryClass', () => {
  it('各カテゴリの正しいCSSクラス名を返す', () => {
    expect(getMimeCategoryClass('application')).toBe('mime-cat-application');
    expect(getMimeCategoryClass('text')).toBe('mime-cat-text');
    expect(getMimeCategoryClass('image')).toBe('mime-cat-image');
    expect(getMimeCategoryClass('audio')).toBe('mime-cat-audio');
    expect(getMimeCategoryClass('video')).toBe('mime-cat-video');
    expect(getMimeCategoryClass('font')).toBe('mime-cat-font');
    expect(getMimeCategoryClass('multipart')).toBe('mime-cat-multipart');
  });

  it('未知のカテゴリは空文字を返す', () => {
    expect(getMimeCategoryClass('unknown')).toBe('');
  });
});

describe('filterMimeTypes', () => {
  const sampleTypes: MimeType[] = [
    {
      type: 'application/json',
      extensions: ['.json'],
      description: 'JSON形式のデータ',
      category: 'application',
    },
    {
      type: 'text/html',
      extensions: ['.html', '.htm'],
      description: 'HTMLドキュメント',
      category: 'text',
    },
    {
      type: 'image/png',
      extensions: ['.png'],
      description: 'PNG画像',
      category: 'image',
    },
    {
      type: 'audio/mpeg',
      extensions: ['.mp3'],
      description: 'MP3音声',
      category: 'audio',
    },
    {
      type: 'font/woff2',
      extensions: ['.woff2'],
      description: 'WOFF2フォント',
      category: 'font',
    },
  ];

  it('空のクエリとallカテゴリは全件返す', () => {
    const result = filterMimeTypes(sampleTypes, '', 'all');
    expect(result).toHaveLength(sampleTypes.length);
  });

  it('カテゴリフィルタが機能する', () => {
    const result = filterMimeTypes(sampleTypes, '', 'image');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('image/png');
  });

  it('MIMEタイプ名での検索が機能する', () => {
    const result = filterMimeTypes(sampleTypes, 'json', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('application/json');
  });

  it('大文字小文字を区別しない検索が機能する', () => {
    const result = filterMimeTypes(sampleTypes, 'HTML', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('text/html');
  });

  it('拡張子での検索が機能する', () => {
    const result = filterMimeTypes(sampleTypes, '.mp3', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('audio/mpeg');
  });

  it('説明文での検索が機能する', () => {
    const result = filterMimeTypes(sampleTypes, '画像', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('image/png');
  });

  it('カテゴリとキーワードの組み合わせが機能する', () => {
    const result = filterMimeTypes(sampleTypes, 'woff', 'font');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('font/woff2');
  });

  it('マッチしない検索は空配列を返す', () => {
    const result = filterMimeTypes(sampleTypes, 'xyznotexist', 'all');
    expect(result).toHaveLength(0);
  });

  it('カテゴリ不一致は空配列を返す', () => {
    const result = filterMimeTypes(sampleTypes, 'json', 'image');
    expect(result).toHaveLength(0);
  });

  it('スペースのみのクエリは全件返す', () => {
    const result = filterMimeTypes(sampleTypes, '   ', 'all');
    expect(result).toHaveLength(sampleTypes.length);
  });

  it('複数の拡張子を持つエントリはいずれかの拡張子で検索できる', () => {
    const result1 = filterMimeTypes(sampleTypes, '.html', 'all');
    expect(result1).toHaveLength(1);
    expect(result1[0].type).toBe('text/html');

    const result2 = filterMimeTypes(sampleTypes, '.htm', 'all');
    expect(result2).toHaveLength(1);
    expect(result2[0].type).toBe('text/html');
  });

  it('空の配列を渡すと空の配列を返す', () => {
    const result = filterMimeTypes([], 'json', 'all');
    expect(result).toHaveLength(0);
  });
});
