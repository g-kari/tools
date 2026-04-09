import { describe, it, expect } from 'vite-plus/test';
import {
  isValidColor,
  isValidUrl,
  guessIconType,
  buildManifestObject,
  generateManifestJson,
  generateLinkTag,
  createDefaultIcons,
  DEFAULT_MANIFEST_OPTIONS,
  type ManifestOptions,
  type ManifestIcon,
} from '../../app/utils/webManifest';

describe('isValidColor', () => {
  describe('有効な色コード', () => {
    it('#RGB 形式を有効と判定する', () => {
      expect(isValidColor('#fff')).toBe(true);
      expect(isValidColor('#000')).toBe(true);
      expect(isValidColor('#abc')).toBe(true);
      expect(isValidColor('#F0F')).toBe(true);
    });

    it('#RRGGBB 形式を有効と判定する', () => {
      expect(isValidColor('#ffffff')).toBe(true);
      expect(isValidColor('#000000')).toBe(true);
      expect(isValidColor('#1a2b3c')).toBe(true);
      expect(isValidColor('#AABBCC')).toBe(true);
    });

    it('#RRGGBBAA 形式を有効と判定する', () => {
      expect(isValidColor('#ffffff80')).toBe(true);
      expect(isValidColor('#00000000')).toBe(true);
      expect(isValidColor('#1A2B3CFF')).toBe(true);
    });
  });

  describe('無効な色コード', () => {
    it('空文字列を無効と判定する', () => {
      expect(isValidColor('')).toBe(false);
    });

    it('# なしの色コードを無効と判定する', () => {
      expect(isValidColor('ffffff')).toBe(false);
    });

    it('無効な長さの色コードを無効と判定する', () => {
      expect(isValidColor('#ff')).toBe(false);
      expect(isValidColor('#ffff')).toBe(false);
      expect(isValidColor('#fffff')).toBe(false);
      expect(isValidColor('#fffffff')).toBe(false);
    });

    it('無効な文字を含む色コードを無効と判定する', () => {
      expect(isValidColor('#xyz')).toBe(false);
      expect(isValidColor('#gggggg')).toBe(false);
    });

    it('color名を無効と判定する', () => {
      expect(isValidColor('red')).toBe(false);
      expect(isValidColor('white')).toBe(false);
    });
  });
});

describe('isValidUrl', () => {
  describe('有効なURL', () => {
    it('絶対URLを有効と判定する', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('パス形式のURLを有効と判定する', () => {
      expect(isValidUrl('/')).toBe(true);
      expect(isValidUrl('/app')).toBe(true);
      expect(isValidUrl('/app/path')).toBe(true);
    });

    it('クエリパラメータ付きURLを有効と判定する', () => {
      expect(isValidUrl('https://example.com?q=test')).toBe(true);
    });
  });

  describe('無効なURL', () => {
    it('空文字列を無効と判定する', () => {
      expect(isValidUrl('')).toBe(false);
    });
  });
});

describe('guessIconType', () => {
  it('png 拡張子から image/png を返す', () => {
    expect(guessIconType('/icons/icon.png')).toBe('image/png');
  });

  it('jpg 拡張子から image/jpeg を返す', () => {
    expect(guessIconType('/icons/icon.jpg')).toBe('image/jpeg');
  });

  it('jpeg 拡張子から image/jpeg を返す', () => {
    expect(guessIconType('/icons/icon.jpeg')).toBe('image/jpeg');
  });

  it('svg 拡張子から image/svg+xml を返す', () => {
    expect(guessIconType('/icons/icon.svg')).toBe('image/svg+xml');
  });

  it('webp 拡張子から image/webp を返す', () => {
    expect(guessIconType('/icons/icon.webp')).toBe('image/webp');
  });

  it('ico 拡張子から image/x-icon を返す', () => {
    expect(guessIconType('/icons/favicon.ico')).toBe('image/x-icon');
  });

  it('大文字拡張子も正しく処理する', () => {
    expect(guessIconType('/icons/icon.PNG')).toBe('image/png');
  });

  it('未知の拡張子は image/png をデフォルトで返す', () => {
    expect(guessIconType('/icons/icon.bmp')).toBe('image/png');
    expect(guessIconType('/icons/icon')).toBe('image/png');
  });
});

describe('buildManifestObject', () => {
  const baseOptions: ManifestOptions = {
    ...DEFAULT_MANIFEST_OPTIONS,
    name: 'Test App',
    short_name: 'Test',
  };

  it('必須フィールドを含むオブジェクトを生成する', () => {
    const result = buildManifestObject(baseOptions);
    expect(result.name).toBe('Test App');
    expect(result.short_name).toBe('Test');
    expect(result.start_url).toBe('/');
    expect(result.display).toBe('standalone');
    expect(result.theme_color).toBe('#ffffff');
    expect(result.background_color).toBe('#ffffff');
  });

  it('description が空の場合は含まない', () => {
    const result = buildManifestObject({ ...baseOptions, description: '' });
    expect('description' in result).toBe(false);
  });

  it('description がある場合は含む', () => {
    const result = buildManifestObject({ ...baseOptions, description: 'テストアプリ' });
    expect(result.description).toBe('テストアプリ');
  });

  it('orientation が "any" の場合は含まない', () => {
    const result = buildManifestObject({ ...baseOptions, orientation: 'any' });
    expect('orientation' in result).toBe(false);
  });

  it('orientation が "any" 以外の場合は含む', () => {
    const result = buildManifestObject({ ...baseOptions, orientation: 'portrait' });
    expect(result.orientation).toBe('portrait');
  });

  it('dir が "auto" の場合は含まない', () => {
    const result = buildManifestObject({ ...baseOptions, dir: 'auto' });
    expect('dir' in result).toBe(false);
  });

  it('dir が "ltr" または "rtl" の場合は含む', () => {
    const result = buildManifestObject({ ...baseOptions, dir: 'ltr' });
    expect(result.dir).toBe('ltr');
  });

  it('categories が空の場合は含まない', () => {
    const result = buildManifestObject({ ...baseOptions, categories: [] });
    expect('categories' in result).toBe(false);
  });

  it('categories がある場合は含む', () => {
    const result = buildManifestObject({ ...baseOptions, categories: ['utilities'] });
    expect(result.categories).toEqual(['utilities']);
  });

  it('prefer_related_applications が false の場合は含まない', () => {
    const result = buildManifestObject({ ...baseOptions, prefer_related_applications: false });
    expect('prefer_related_applications' in result).toBe(false);
  });

  it('prefer_related_applications が true の場合は含む', () => {
    const result = buildManifestObject({ ...baseOptions, prefer_related_applications: true });
    expect(result.prefer_related_applications).toBe(true);
  });

  it('アイコンが空の場合は含まない', () => {
    const result = buildManifestObject({ ...baseOptions, icons: [] });
    expect('icons' in result).toBe(false);
  });

  it('アイコンが指定された場合は id を除いて含む', () => {
    const icons: ManifestIcon[] = [
      { id: 'test-id', src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    ];
    const result = buildManifestObject({ ...baseOptions, icons });
    const resultIcons = result.icons as Record<string, string>[];
    expect(resultIcons).toHaveLength(1);
    expect(resultIcons[0].src).toBe('/icon.png');
    expect(resultIcons[0].sizes).toBe('192x192');
    expect('id' in resultIcons[0]).toBe(false);
  });

  it('アイコンの purpose が "any" の場合は除く', () => {
    const icons: ManifestIcon[] = [
      { id: 'test-id', src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    ];
    const result = buildManifestObject({ ...baseOptions, icons });
    const resultIcons = result.icons as Record<string, string>[];
    expect('purpose' in resultIcons[0]).toBe(false);
  });

  it('アイコンの purpose が "maskable" の場合は含む', () => {
    const icons: ManifestIcon[] = [
      { id: 'test-id', src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    ];
    const result = buildManifestObject({ ...baseOptions, icons });
    const resultIcons = result.icons as Record<string, string>[];
    expect(resultIcons[0].purpose).toBe('maskable');
  });
});

describe('generateManifestJson', () => {
  it('有効なJSON文字列を生成する', () => {
    const result = generateManifestJson(DEFAULT_MANIFEST_OPTIONS);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('インデント付きのJSON文字列を生成する', () => {
    const result = generateManifestJson(DEFAULT_MANIFEST_OPTIONS);
    expect(result).toContain('\n');
    expect(result).toContain('  ');
  });

  it('name フィールドを含むJSONを生成する', () => {
    const options = { ...DEFAULT_MANIFEST_OPTIONS, name: 'My PWA' };
    const result = generateManifestJson(options);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('My PWA');
  });
});

describe('generateLinkTag', () => {
  it('manifest link タグを含む', () => {
    const result = generateLinkTag(DEFAULT_MANIFEST_OPTIONS);
    expect(result).toContain('<link rel="manifest" href="/manifest.json">');
  });

  it('theme-color meta タグを含む', () => {
    const options = { ...DEFAULT_MANIFEST_OPTIONS, theme_color: '#ff0000' };
    const result = generateLinkTag(options);
    expect(result).toContain('<meta name="theme-color" content="#ff0000">');
  });

  it('apple-mobile-web-app-capable meta タグを含む', () => {
    const result = generateLinkTag(DEFAULT_MANIFEST_OPTIONS);
    expect(result).toContain('<meta name="apple-mobile-web-app-capable" content="yes">');
  });

  it('apple-mobile-web-app-title にshort_nameを使用する', () => {
    const options = { ...DEFAULT_MANIFEST_OPTIONS, short_name: 'MyApp', name: 'My Application' };
    const result = generateLinkTag(options);
    expect(result).toContain('content="MyApp"');
  });

  it('アイコンがない場合は apple-touch-icon タグを含まない', () => {
    const result = generateLinkTag({ ...DEFAULT_MANIFEST_OPTIONS, icons: [] });
    expect(result).not.toContain('apple-touch-icon');
  });

  it('アイコンがある場合は最大サイズのアイコンを apple-touch-icon に使用する', () => {
    const icons: ManifestIcon[] = [
      { id: '1', src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { id: '2', src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ];
    const result = generateLinkTag({ ...DEFAULT_MANIFEST_OPTIONS, icons });
    expect(result).toContain('<link rel="apple-touch-icon" href="/icon-512.png">');
  });

  it('maskable アイコンは apple-touch-icon に使用しない', () => {
    const icons: ManifestIcon[] = [
      { id: '1', src: '/icon-any.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { id: '2', src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ];
    const result = generateLinkTag({ ...DEFAULT_MANIFEST_OPTIONS, icons });
    expect(result).toContain('href="/icon-any.png"');
    expect(result).not.toContain('href="/icon-maskable.png"');
  });
});

describe('createDefaultIcons', () => {
  it('3つのデフォルトアイコンを生成する', () => {
    const icons = createDefaultIcons();
    expect(icons).toHaveLength(3);
  });

  it('192x192 の "any" アイコンを含む', () => {
    const icons = createDefaultIcons();
    const icon192 = icons.find((i) => i.sizes === '192x192' && i.purpose === 'any');
    expect(icon192).toBeDefined();
    expect(icon192?.src).toBe('/icons/icon-192x192.png');
  });

  it('512x512 の "any" アイコンを含む', () => {
    const icons = createDefaultIcons();
    const icon512 = icons.find((i) => i.sizes === '512x512' && i.purpose === 'any');
    expect(icon512).toBeDefined();
    expect(icon512?.src).toBe('/icons/icon-512x512.png');
  });

  it('192x192 の "maskable" アイコンを含む', () => {
    const icons = createDefaultIcons();
    const maskable = icons.find((i) => i.purpose === 'maskable');
    expect(maskable).toBeDefined();
    expect(maskable?.sizes).toBe('192x192');
  });

  it('各アイコンにユニークなIDが設定される', () => {
    const icons = createDefaultIcons();
    const ids = icons.map((i) => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('各アイコンのtypeはすべて image/png である', () => {
    const icons = createDefaultIcons();
    icons.forEach((icon) => {
      expect(icon.type).toBe('image/png');
    });
  });
});
