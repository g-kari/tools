import { describe, it, expect } from 'vitest';
import { tokenizeXml, formatXml, minifyXml, validateXml } from '../../app/utils/xml';

describe('tokenizeXml', () => {
  describe('基本的なトークン化', () => {
    it('開きタグをトークン化する', () => {
      const tokens = tokenizeXml('<root>text</root>');
      expect(tokens[0]).toMatchObject({ type: 'open', name: 'root', selfClose: false });
    });

    it('閉じタグをトークン化する', () => {
      const tokens = tokenizeXml('<root></root>');
      expect(tokens[1]).toMatchObject({ type: 'close', name: 'root' });
    });

    it('テキストノードをトークン化する', () => {
      const tokens = tokenizeXml('<root>hello world</root>');
      expect(tokens[1]).toMatchObject({ type: 'text', value: 'hello world' });
    });

    it('セルフクロージングタグをトークン化する', () => {
      const tokens = tokenizeXml('<root><br/></root>');
      const brToken = tokens.find((t) => t.type === 'open' && (t as { name: string }).name === 'br');
      expect(brToken).toBeDefined();
      expect(brToken).toMatchObject({ type: 'open', name: 'br', selfClose: true });
    });

    it('XML宣言をトークン化する', () => {
      const tokens = tokenizeXml('<?xml version="1.0"?><root/>');
      expect(tokens[0]).toMatchObject({ type: 'declaration' });
    });

    it('コメントをトークン化する', () => {
      const tokens = tokenizeXml('<root><!-- comment --></root>');
      const comment = tokens.find((t) => t.type === 'comment');
      expect(comment).toBeDefined();
      expect(comment).toMatchObject({ type: 'comment', value: ' comment ' });
    });

    it('CDATAセクションをトークン化する', () => {
      const tokens = tokenizeXml('<root><![CDATA[<b>bold</b>]]></root>');
      const cdata = tokens.find((t) => t.type === 'cdata');
      expect(cdata).toBeDefined();
      expect(cdata).toMatchObject({ type: 'cdata', value: '<b>bold</b>' });
    });

    it('属性付きタグをトークン化する', () => {
      const tokens = tokenizeXml('<root id="1" class="x">val</root>');
      expect(tokens[0]).toMatchObject({ type: 'open', name: 'root', attrs: 'id="1" class="x"' });
    });
  });

  describe('エラーケース', () => {
    it('空文字列はエラーをスローする', () => {
      expect(() => tokenizeXml('')).toThrow('XML文字列が空です');
    });

    it('空白のみはエラーをスローする', () => {
      expect(() => tokenizeXml('   ')).toThrow('XML文字列が空です');
    });

    it('閉じられていないコメントはエラーをスローする', () => {
      expect(() => tokenizeXml('<root><!-- unclosed</root>')).toThrow(
        'コメントが閉じられていません'
      );
    });

    it('閉じられていないCDATAはエラーをスローする', () => {
      expect(() => tokenizeXml('<root><![CDATA[not closed')).toThrow(
        'CDATAセクションが閉じられていません'
      );
    });

    it('閉じられていない宣言タグはエラーをスローする', () => {
      expect(() => tokenizeXml('<?xml version="1.0"')).toThrow('宣言タグが閉じられていません');
    });

    it('閉じられていない閉じタグはエラーをスローする', () => {
      expect(() => tokenizeXml('<root></root')).toThrow('閉じタグが正しく閉じられていません');
    });

    it('閉じられていない開きタグはエラーをスローする', () => {
      expect(() => tokenizeXml('<root')).toThrow('開きタグが正しく閉じられていません');
    });

    it('タグ名が空のタグはエラーをスローする', () => {
      expect(() => tokenizeXml('< >')).toThrow('タグ名が空です');
    });
  });
});

describe('formatXml', () => {
  describe('基本的な整形', () => {
    it('単純なXMLを整形する', () => {
      const xml = '<root><child>テキスト</child></root>';
      const result = formatXml(xml);
      expect(result).toContain('<root>');
      expect(result).toContain('  <child>テキスト</child>');
      expect(result).toContain('</root>');
    });

    it('ネストしたXMLを整形する', () => {
      const xml = '<root><parent><child>値</child></parent></root>';
      const result = formatXml(xml);
      const lines = result.split('\n');
      expect(lines[0]).toBe('<root>');
      expect(lines[1]).toBe('  <parent>');
      expect(lines[2]).toBe('    <child>値</child>');
      expect(lines[3]).toBe('  </parent>');
      expect(lines[4]).toBe('</root>');
    });

    it('セルフクロージングタグを整形する', () => {
      const xml = '<root><br/><hr/></root>';
      const result = formatXml(xml);
      expect(result).toContain('  <br/>');
      expect(result).toContain('  <hr/>');
    });

    it('XMLデクラレーション付きを整形する', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root><item>値</item></root>';
      const result = formatXml(xml);
      const lines = result.split('\n');
      expect(lines[0]).toBe('<?xml version="1.0" encoding="UTF-8"?>');
      expect(lines[1]).toBe('<root>');
      expect(lines[2]).toBe('  <item>値</item>');
      expect(lines[3]).toBe('</root>');
    });

    it('インデント4スペースで整形する', () => {
      const xml = '<root><child>値</child></root>';
      const result = formatXml(xml, 4);
      expect(result).toContain('    <child>値</child>');
    });

    it('コメントを整形する', () => {
      const xml = '<root><!-- これはコメント --><item>値</item></root>';
      const result = formatXml(xml);
      expect(result).toContain('<!-- これはコメント -->');
      expect(result).toContain('  <item>値</item>');
    });

    it('CDATAセクションを整形する', () => {
      const xml = '<root><![CDATA[<b>bold</b>]]></root>';
      const result = formatXml(xml);
      expect(result).toContain('<![CDATA[<b>bold</b>]]>');
    });

    it('属性付きタグを整形する', () => {
      const xml = '<root><item id="1" class="x">値</item></root>';
      const result = formatXml(xml);
      expect(result).toContain('<item id="1" class="x">値</item>');
    });

    it('複数の子要素を持つXMLを整形する', () => {
      const xml = '<root><a>1</a><b>2</b><c>3</c></root>';
      const result = formatXml(xml);
      const lines = result.split('\n');
      expect(lines[0]).toBe('<root>');
      expect(lines[1]).toBe('  <a>1</a>');
      expect(lines[2]).toBe('  <b>2</b>');
      expect(lines[3]).toBe('  <c>3</c>');
      expect(lines[4]).toBe('</root>');
    });

    it('空白のみのテキストノードは出力しない', () => {
      const xml = '<root>  \n  <item>値</item>\n  </root>';
      const result = formatXml(xml);
      const lines = result.split('\n');
      // 空白のみのテキストは出力されない
      expect(lines.every((l) => l.trim() !== '')).toBe(true);
    });

    it('セルフクロージングタグに属性がある場合', () => {
      const xml = '<root><img src="test.png"/></root>';
      const result = formatXml(xml);
      expect(result).toContain('<img src="test.png"/>');
    });

    it('開きタグの次がテキストで、異なる名前の閉じタグが続く場合は通常整形', () => {
      const xml = '<root><a>text</a><b>other</b></root>';
      const result = formatXml(xml);
      expect(result).toContain('<a>text</a>');
      expect(result).toContain('<b>other</b>');
    });
  });

  describe('エラーケース', () => {
    it('空文字列でエラーをスローする', () => {
      expect(() => formatXml('')).toThrow();
    });

    it('無効なXML（タグが閉じられていない）でエラーをスローする', () => {
      expect(() => formatXml('<root><child')).toThrow();
    });
  });
});

describe('minifyXml', () => {
  describe('基本的な圧縮', () => {
    it('整形済みXMLを圧縮する', () => {
      const xml = '<root>\n  <child>値</child>\n</root>';
      const result = minifyXml(xml);
      expect(result).toBe('<root><child>値</child></root>');
    });

    it('テキストノードを持つXMLを圧縮する', () => {
      const xml = '<person>\n  <name>太郎</name>\n  <age>30</age>\n</person>';
      const result = minifyXml(xml);
      expect(result).toBe('<person><name>太郎</name><age>30</age></person>');
    });

    it('既に圧縮されたXMLはそのままになる', () => {
      const xml = '<root><child>値</child></root>';
      const result = minifyXml(xml);
      expect(result).toBe(xml);
    });

    it('先頭・末尾の空白を除去する', () => {
      const xml = '  <root><child>値</child></root>  ';
      const result = minifyXml(xml);
      expect(result).toBe('<root><child>値</child></root>');
    });
  });

  describe('エラーケース', () => {
    it('空文字列でエラーをスローする', () => {
      expect(() => minifyXml('')).toThrow();
    });

    it('不正なXMLでエラーをスローする', () => {
      expect(() => minifyXml('<root><unclosed')).toThrow();
    });
  });
});

describe('validateXml', () => {
  describe('有効なXML', () => {
    it('有効なXMLはvalid: trueを返す', () => {
      const result = validateXml('<root><child>値</child></root>');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('XMLデクラレーション付きは有効', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root><item>値</item></root>';
      const result = validateXml(xml);
      expect(result.valid).toBe(true);
    });

    it('セルフクロージングタグを含む有効なXMLを検証する', () => {
      const result = validateXml('<root><br/><child>テキスト</child></root>');
      expect(result.valid).toBe(true);
    });

    it('ルートがセルフクロージングタグでも有効', () => {
      const result = validateXml('<br/>');
      expect(result.valid).toBe(true);
    });

    it('コメント付きのXMLが有効', () => {
      const result = validateXml('<!-- comment --><root><item>値</item></root>');
      expect(result.valid).toBe(true);
    });

    it('CDATAセクション付きのXMLが有効', () => {
      const result = validateXml('<root><![CDATA[content]]></root>');
      expect(result.valid).toBe(true);
    });

    it('深くネストしたXMLが有効', () => {
      const result = validateXml('<a><b><c><d>text</d></c></b></a>');
      expect(result.valid).toBe(true);
    });
  });

  describe('無効なXML', () => {
    it('閉じタグなしはvalid: falseを返す', () => {
      const result = validateXml('<root><child>値</child>');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('閉じタグ不一致はvalid: falseを返す', () => {
      const result = validateXml('<root><child>値</other></root>');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('空文字列はvalid: falseを返す', () => {
      const result = validateXml('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('ルート要素が複数はvalid: falseを返す', () => {
      const result = validateXml('<root1/><root2/>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('ルート要素は1つでなければなりません');
    });

    it('タグ名不一致の閉じタグはvalid: falseを返す', () => {
      const result = validateXml('<root></extra></root>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('タグの対応が不一致');
    });

    it('スタックが空のときの閉じタグはvalid: falseを返す', () => {
      // XMLデクラレーションのみで閉じタグが来るケース
      const result = validateXml('</root>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('対応する開きタグがない');
    });

    it('コメントのみのXMLはルート要素がないのでvalid: falseを返す', () => {
      const result = validateXml('<!-- only comment -->');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('ルート要素が存在しません');
    });

    it('不正なXML構文はvalid: falseを返す', () => {
      const result = validateXml('<root><unclosed');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('複数の通常ルート要素はvalid: falseを返す', () => {
      const result = validateXml('<root1></root1><root2></root2>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('ルート要素は1つでなければなりません');
    });
  });
});

describe('ラウンドトリップテスト', () => {
  it('format後にminifyすると元の構造が保持される', () => {
    const original = '<root><child>値</child><other>データ</other></root>';
    const formatted = formatXml(original);
    const minified = minifyXml(formatted);
    expect(minified).toBe(original);
  });

  it('XML宣言付きのformat→minifyラウンドトリップ', () => {
    const original = '<?xml version="1.0" encoding="UTF-8"?><root><item>テスト</item></root>';
    const formatted = formatXml(original);
    const minified = minifyXml(formatted);
    expect(minified).toBe(original);
  });
});
