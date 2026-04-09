import { describe, it, expect } from 'vite-plus/test';

/**
 * HTML属性エスケープ関数（ユーティリティのコピー）
 */
function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

interface BasicSeoData {
  title: string;
  description: string;
  keywords: string;
  author: string;
  canonicalUrl: string;
  robots: string;
}

interface OgData {
  title: string;
  description: string;
  url: string;
  image: string;
  type: string;
  siteName: string;
  locale: string;
}

interface TwitterData {
  card: string;
  title: string;
  description: string;
  image: string;
  site: string;
  creator: string;
}

function generateBasicMetaTags(data: BasicSeoData, indent = '  '): string[] {
  const tags: string[] = [];
  if (data.title) {
    tags.push(`${indent}<title>${escapeHtmlAttr(data.title)}</title>`);
  }
  if (data.description) {
    tags.push(
      `${indent}<meta name="description" content="${escapeHtmlAttr(data.description)}">`
    );
  }
  if (data.keywords) {
    tags.push(
      `${indent}<meta name="keywords" content="${escapeHtmlAttr(data.keywords)}">`
    );
  }
  if (data.author) {
    tags.push(
      `${indent}<meta name="author" content="${escapeHtmlAttr(data.author)}">`
    );
  }
  tags.push(
    `${indent}<meta name="robots" content="${escapeHtmlAttr(data.robots)}">`
  );
  if (data.canonicalUrl) {
    tags.push(
      `${indent}<link rel="canonical" href="${escapeHtmlAttr(data.canonicalUrl)}">`
    );
  }
  return tags;
}

function generateOgTags(data: OgData, indent = '  '): string[] {
  const tags: string[] = [];
  tags.push(
    `${indent}<meta property="og:type" content="${escapeHtmlAttr(data.type)}">`
  );
  if (data.title) {
    tags.push(
      `${indent}<meta property="og:title" content="${escapeHtmlAttr(data.title)}">`
    );
  }
  if (data.description) {
    tags.push(
      `${indent}<meta property="og:description" content="${escapeHtmlAttr(data.description)}">`
    );
  }
  if (data.url) {
    tags.push(
      `${indent}<meta property="og:url" content="${escapeHtmlAttr(data.url)}">`
    );
  }
  if (data.image) {
    tags.push(
      `${indent}<meta property="og:image" content="${escapeHtmlAttr(data.image)}">`
    );
  }
  if (data.siteName) {
    tags.push(
      `${indent}<meta property="og:site_name" content="${escapeHtmlAttr(data.siteName)}">`
    );
  }
  if (data.locale) {
    tags.push(
      `${indent}<meta property="og:locale" content="${escapeHtmlAttr(data.locale)}">`
    );
  }
  return tags;
}

function generateTwitterTags(data: TwitterData, indent = '  '): string[] {
  const tags: string[] = [];
  tags.push(
    `${indent}<meta name="twitter:card" content="${escapeHtmlAttr(data.card)}">`
  );
  if (data.title) {
    tags.push(
      `${indent}<meta name="twitter:title" content="${escapeHtmlAttr(data.title)}">`
    );
  }
  if (data.description) {
    tags.push(
      `${indent}<meta name="twitter:description" content="${escapeHtmlAttr(data.description)}">`
    );
  }
  if (data.image) {
    tags.push(
      `${indent}<meta name="twitter:image" content="${escapeHtmlAttr(data.image)}">`
    );
  }
  if (data.site) {
    tags.push(
      `${indent}<meta name="twitter:site" content="${escapeHtmlAttr(data.site)}">`
    );
  }
  if (data.creator) {
    tags.push(
      `${indent}<meta name="twitter:creator" content="${escapeHtmlAttr(data.creator)}">`
    );
  }
  return tags;
}

function truncateTitle(title: string, maxLength = 60): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 1) + '…';
}

function truncateDescription(description: string, maxLength = 160): string {
  if (description.length <= maxLength) return description;
  return description.slice(0, maxLength - 1) + '…';
}

describe('SEOメタタグ生成', () => {
  describe('escapeHtmlAttr', () => {
    it('アンパサンドをエスケープする', () => {
      expect(escapeHtmlAttr('A & B')).toBe('A &amp; B');
    });
    it('ダブルクォートをエスケープする', () => {
      expect(escapeHtmlAttr('say "hello"')).toBe('say &quot;hello&quot;');
    });
    it('小なり・大なりをエスケープする', () => {
      expect(escapeHtmlAttr('<script>')).toBe('&lt;script&gt;');
    });
    it('特殊文字がない場合はそのまま返す', () => {
      expect(escapeHtmlAttr('normal text')).toBe('normal text');
    });
    it('空文字をそのまま返す', () => {
      expect(escapeHtmlAttr('')).toBe('');
    });
    it('複数の特殊文字を同時にエスケープする', () => {
      expect(escapeHtmlAttr('<a href="?a=1&b=2">')).toBe(
        '&lt;a href=&quot;?a=1&amp;b=2&quot;&gt;'
      );
    });
  });

  describe('generateBasicMetaTags', () => {
    it('全フィールド入力時に正しいタグを生成する', () => {
      const data: BasicSeoData = {
        title: 'テストページ',
        description: 'テスト説明文',
        keywords: 'test, demo',
        author: 'テスト著者',
        canonicalUrl: 'https://example.com/test',
        robots: 'index, follow',
      };
      const tags = generateBasicMetaTags(data);
      expect(tags).toContain('  <title>テストページ</title>');
      expect(tags).toContain('  <meta name="description" content="テスト説明文">');
      expect(tags).toContain('  <meta name="keywords" content="test, demo">');
      expect(tags).toContain('  <meta name="author" content="テスト著者">');
      expect(tags).toContain('  <meta name="robots" content="index, follow">');
      expect(tags).toContain(
        '  <link rel="canonical" href="https://example.com/test">'
      );
    });

    it('タイトルが空の場合はtitleタグを生成しない', () => {
      const data: BasicSeoData = {
        title: '',
        description: '説明',
        keywords: '',
        author: '',
        canonicalUrl: '',
        robots: 'index, follow',
      };
      const tags = generateBasicMetaTags(data);
      expect(tags.some((t) => t.includes('<title>'))).toBe(false);
    });

    it('robotsタグは常に生成される', () => {
      const data: BasicSeoData = {
        title: '',
        description: '',
        keywords: '',
        author: '',
        canonicalUrl: '',
        robots: 'noindex, nofollow',
      };
      const tags = generateBasicMetaTags(data);
      expect(tags).toContain(
        '  <meta name="robots" content="noindex, nofollow">'
      );
    });

    it('canonicalUrlが空の場合はlinkタグを生成しない', () => {
      const data: BasicSeoData = {
        title: 'title',
        description: '',
        keywords: '',
        author: '',
        canonicalUrl: '',
        robots: 'index, follow',
      };
      const tags = generateBasicMetaTags(data);
      expect(tags.some((t) => t.includes('canonical'))).toBe(false);
    });

    it('タイトルのHTMLエスケープが正しく行われる', () => {
      const data: BasicSeoData = {
        title: 'A <B> & "C"',
        description: '',
        keywords: '',
        author: '',
        canonicalUrl: '',
        robots: 'index, follow',
      };
      const tags = generateBasicMetaTags(data);
      expect(tags).toContain(
        '  <title>A &lt;B&gt; &amp; &quot;C&quot;</title>'
      );
    });

    it('カスタムインデントが適用される', () => {
      const data: BasicSeoData = {
        title: 'Test',
        description: '',
        keywords: '',
        author: '',
        canonicalUrl: '',
        robots: 'index, follow',
      };
      const tags = generateBasicMetaTags(data, '    ');
      expect(tags[0].startsWith('    <title>')).toBe(true);
    });
  });

  describe('generateOgTags', () => {
    it('全フィールド入力時に正しいOGタグを生成する', () => {
      const data: OgData = {
        title: 'OGタイトル',
        description: 'OG説明文',
        url: 'https://example.com',
        image: 'https://example.com/ogp.png',
        type: 'website',
        siteName: 'サイト名',
        locale: 'ja_JP',
      };
      const tags = generateOgTags(data);
      expect(tags).toContain('  <meta property="og:type" content="website">');
      expect(tags).toContain('  <meta property="og:title" content="OGタイトル">');
      expect(tags).toContain('  <meta property="og:description" content="OG説明文">');
      expect(tags).toContain(
        '  <meta property="og:url" content="https://example.com">'
      );
      expect(tags).toContain(
        '  <meta property="og:image" content="https://example.com/ogp.png">'
      );
      expect(tags).toContain('  <meta property="og:site_name" content="サイト名">');
      expect(tags).toContain('  <meta property="og:locale" content="ja_JP">');
    });

    it('og:typeタグは常に生成される', () => {
      const data: OgData = {
        title: '',
        description: '',
        url: '',
        image: '',
        type: 'article',
        siteName: '',
        locale: '',
      };
      const tags = generateOgTags(data);
      expect(tags).toContain('  <meta property="og:type" content="article">');
    });

    it('空フィールドのタグは生成されない', () => {
      const data: OgData = {
        title: '',
        description: '',
        url: '',
        image: '',
        type: 'website',
        siteName: '',
        locale: '',
      };
      const tags = generateOgTags(data);
      expect(tags.length).toBe(1); // og:typeのみ
    });

    it('OGタイトルのHTMLエスケープが正しく行われる', () => {
      const data: OgData = {
        title: '"Hello" & <World>',
        description: '',
        url: '',
        image: '',
        type: 'website',
        siteName: '',
        locale: '',
      };
      const tags = generateOgTags(data);
      expect(tags).toContain(
        '  <meta property="og:title" content="&quot;Hello&quot; &amp; &lt;World&gt;">'
      );
    });
  });

  describe('generateTwitterTags', () => {
    it('全フィールド入力時に正しいTwitterタグを生成する', () => {
      const data: TwitterData = {
        card: 'summary_large_image',
        title: 'Twitterタイトル',
        description: 'Twitter説明文',
        image: 'https://example.com/card.png',
        site: '@example',
        creator: '@author',
      };
      const tags = generateTwitterTags(data);
      expect(tags).toContain(
        '  <meta name="twitter:card" content="summary_large_image">'
      );
      expect(tags).toContain(
        '  <meta name="twitter:title" content="Twitterタイトル">'
      );
      expect(tags).toContain(
        '  <meta name="twitter:description" content="Twitter説明文">'
      );
      expect(tags).toContain(
        '  <meta name="twitter:image" content="https://example.com/card.png">'
      );
      expect(tags).toContain('  <meta name="twitter:site" content="@example">');
      expect(tags).toContain(
        '  <meta name="twitter:creator" content="@author">'
      );
    });

    it('twitter:cardタグは常に生成される', () => {
      const data: TwitterData = {
        card: 'summary',
        title: '',
        description: '',
        image: '',
        site: '',
        creator: '',
      };
      const tags = generateTwitterTags(data);
      expect(tags).toContain('  <meta name="twitter:card" content="summary">');
      expect(tags.length).toBe(1);
    });
  });

  describe('truncateTitle', () => {
    it('60文字以内のタイトルはそのまま返す', () => {
      const title = 'A'.repeat(60);
      expect(truncateTitle(title)).toBe(title);
    });

    it('60文字を超えるタイトルは省略する', () => {
      const title = 'A'.repeat(61);
      const result = truncateTitle(title);
      expect(result.length).toBeLessThanOrEqual(60);
      expect(result.endsWith('…')).toBe(true);
    });

    it('カスタム最大長が機能する', () => {
      const title = 'ABCDE';
      expect(truncateTitle(title, 3)).toBe('AB…');
    });

    it('空文字をそのまま返す', () => {
      expect(truncateTitle('')).toBe('');
    });
  });

  describe('truncateDescription', () => {
    it('160文字以内のdescriptionはそのまま返す', () => {
      const desc = 'A'.repeat(160);
      expect(truncateDescription(desc)).toBe(desc);
    });

    it('160文字を超えるdescriptionは省略する', () => {
      const desc = 'A'.repeat(161);
      const result = truncateDescription(desc);
      expect(result.length).toBeLessThanOrEqual(160);
      expect(result.endsWith('…')).toBe(true);
    });

    it('日本語テキストも正しく処理する', () => {
      const desc = 'あ'.repeat(161);
      const result = truncateDescription(desc);
      expect(result.endsWith('…')).toBe(true);
    });
  });
});
