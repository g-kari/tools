import { describe, expect, it } from 'vite-plus/test';
import {
  convertHtmlToMarkdown,
  convertInline,
  decodeHtmlEntities,
} from '../../app/utils/html-markdown';

describe('decodeHtmlEntities', () => {
  it('基本的なHTMLエンティティをデコードする', () => {
    expect(decodeHtmlEntities('&amp;')).toBe('&');
    expect(decodeHtmlEntities('&lt;')).toBe('<');
    expect(decodeHtmlEntities('&gt;')).toBe('>');
    expect(decodeHtmlEntities('&quot;')).toBe('"');
    expect(decodeHtmlEntities('&#39;')).toBe("'");
    expect(decodeHtmlEntities('&nbsp;')).toBe(' ');
  });

  it('数値エンティティをデコードする', () => {
    expect(decodeHtmlEntities('&#65;')).toBe('A');
    expect(decodeHtmlEntities('&#x41;')).toBe('A');
  });

  it('複数エンティティを含むテキストをデコードする', () => {
    expect(decodeHtmlEntities('1 &lt; 2 &amp; 3 &gt; 0')).toBe('1 < 2 & 3 > 0');
  });
});

describe('convertInline', () => {
  it('<strong>/<b> を ** に変換する', () => {
    expect(convertInline('<strong>太字</strong>')).toBe('**太字**');
    expect(convertInline('<b>太字</b>')).toBe('**太字**');
  });

  it('<em>/<i> を * に変換する', () => {
    expect(convertInline('<em>斜体</em>')).toBe('*斜体*');
    expect(convertInline('<i>斜体</i>')).toBe('*斜体*');
  });

  it('<del>/<s> を ~~ に変換する', () => {
    expect(convertInline('<del>削除</del>')).toBe('~~削除~~');
    expect(convertInline('<s>削除</s>')).toBe('~~削除~~');
  });

  it('<code> をバッククォートに変換する', () => {
    expect(convertInline('<code>const x = 1;</code>')).toBe('`const x = 1;`');
  });

  it('<a> をリンクに変換する', () => {
    expect(convertInline('<a href="https://example.com">リンク</a>')).toBe(
      '[リンク](https://example.com)'
    );
  });

  it('<img> を画像に変換する', () => {
    expect(convertInline('<img src="/img.png" alt="画像" />')).toBe('![画像](/img.png)');
    expect(convertInline('<img src="/img.png">')).toBe('![](/img.png)');
  });

  it('<br> を改行に変換する', () => {
    expect(convertInline('行1<br>行2')).toBe('行1  \n行2');
    expect(convertInline('行1<br/>行2')).toBe('行1  \n行2');
  });

  it('ネストしたインライン要素を変換する', () => {
    expect(convertInline('<strong><em>強調斜体</em></strong>')).toBe('***強調斜体***');
  });
});

describe('convertHtmlToMarkdown', () => {
  describe('見出し変換', () => {
    it('h1〜h6 を # に変換する', () => {
      expect(convertHtmlToMarkdown('<h1>見出し1</h1>')).toBe('# 見出し1');
      expect(convertHtmlToMarkdown('<h2>見出し2</h2>')).toBe('## 見出し2');
      expect(convertHtmlToMarkdown('<h3>見出し3</h3>')).toBe('### 見出し3');
      expect(convertHtmlToMarkdown('<h4>見出し4</h4>')).toBe('#### 見出し4');
      expect(convertHtmlToMarkdown('<h5>見出し5</h5>')).toBe('##### 見出し5');
      expect(convertHtmlToMarkdown('<h6>見出し6</h6>')).toBe('###### 見出し6');
    });
  });

  describe('段落変換', () => {
    it('<p> を改行区切りに変換する', () => {
      const result = convertHtmlToMarkdown('<p>段落テキスト</p>');
      expect(result).toBe('段落テキスト');
    });

    it('複数の <p> を2行改行で区切る', () => {
      const result = convertHtmlToMarkdown('<p>第1段落</p><p>第2段落</p>');
      expect(result).toBe('第1段落\n\n第2段落');
    });
  });

  describe('コードブロック変換', () => {
    it('<pre><code> をフェンスドコードブロックに変換する', () => {
      const html = '<pre><code>const x = 1;</code></pre>';
      const result = convertHtmlToMarkdown(html);
      expect(result).toBe('```\nconst x = 1;\n```');
    });

    it('言語クラス付きコードブロックを変換する', () => {
      const html = '<pre><code class="language-typescript">const x = 1;</code></pre>';
      const result = convertHtmlToMarkdown(html);
      expect(result).toBe('```typescript\nconst x = 1;\n```');
    });
  });

  describe('リスト変換', () => {
    it('<ul><li> をMarkdownリストに変換する', () => {
      const html = '<ul><li>アイテム1</li><li>アイテム2</li></ul>';
      const result = convertHtmlToMarkdown(html);
      expect(result).toContain('- アイテム1');
      expect(result).toContain('- アイテム2');
    });

    it('<ol><li> を番号付きリストに変換する', () => {
      const html = '<ol><li>アイテム1</li><li>アイテム2</li></ol>';
      const result = convertHtmlToMarkdown(html);
      expect(result).toContain('1. アイテム1');
      expect(result).toContain('2. アイテム2');
    });
  });

  describe('水平線変換', () => {
    it('<hr> を --- に変換する', () => {
      const result = convertHtmlToMarkdown('<hr>');
      expect(result).toBe('---');
    });
  });

  describe('blockquote変換', () => {
    it('<blockquote> を > に変換する', () => {
      const html = '<blockquote><p>引用テキスト</p></blockquote>';
      const result = convertHtmlToMarkdown(html);
      expect(result).toContain('> 引用テキスト');
    });
  });

  describe('テーブル変換', () => {
    it('基本的なテーブルをMarkdownテーブルに変換する', () => {
      const html = `<table>
        <thead><tr><th>名前</th><th>年齢</th></tr></thead>
        <tbody><tr><td>山田</td><td>30</td></tr></tbody>
      </table>`;
      const result = convertHtmlToMarkdown(html);
      expect(result).toContain('| 名前 | 年齢 |');
      expect(result).toContain('| --- | --- |');
      expect(result).toContain('| 山田 | 30 |');
    });
  });

  describe('空入力', () => {
    it('空文字列は空文字列を返す', () => {
      expect(convertHtmlToMarkdown('')).toBe('');
      expect(convertHtmlToMarkdown('   ')).toBe('');
    });
  });

  describe('コメント除去', () => {
    it('HTMLコメントを除去する', () => {
      const result = convertHtmlToMarkdown('<!-- コメント --><p>テキスト</p>');
      expect(result).toBe('テキスト');
      expect(result).not.toContain('コメント');
    });
  });

  describe('複合コンテンツ', () => {
    it('複数の要素を含むHTMLを変換する', () => {
      const html = '<h1>タイトル</h1><p>説明<strong>重要</strong></p>';
      const result = convertHtmlToMarkdown(html);
      expect(result).toContain('# タイトル');
      expect(result).toContain('**重要**');
    });
  });
});
