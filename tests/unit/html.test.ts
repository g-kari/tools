import { describe, it, expect } from 'vite-plus/test';
import { decodeHtmlEntities } from '../../app/utils/html';

describe('decodeHtmlEntities', () => {
  describe('基本的な名前付きエンティティ', () => {
    it('&amp; を & にデコードする', () => {
      expect(decodeHtmlEntities('&amp;')).toBe('&');
    });

    it('&lt; を < にデコードする', () => {
      expect(decodeHtmlEntities('&lt;')).toBe('<');
    });

    it('&gt; を > にデコードする', () => {
      expect(decodeHtmlEntities('&gt;')).toBe('>');
    });

    it('&quot; を " にデコードする', () => {
      expect(decodeHtmlEntities('&quot;')).toBe('"');
    });

    it('&apos; を \' にデコードする', () => {
      expect(decodeHtmlEntities('&apos;')).toBe("'");
    });

    it('&nbsp; をノーブレークスペースにデコードする', () => {
      expect(decodeHtmlEntities('&nbsp;')).toBe('\u00A0');
    });
  });

  describe('記号エンティティ', () => {
    it('&copy; を © にデコードする', () => {
      expect(decodeHtmlEntities('&copy;')).toBe('\u00A9');
    });

    it('&reg; を ® にデコードする', () => {
      expect(decodeHtmlEntities('&reg;')).toBe('\u00AE');
    });

    it('&trade; を ™ にデコードする', () => {
      expect(decodeHtmlEntities('&trade;')).toBe('\u2122');
    });

    it('&mdash; を — にデコードする', () => {
      expect(decodeHtmlEntities('&mdash;')).toBe('\u2014');
    });

    it('&ndash; を – にデコードする', () => {
      expect(decodeHtmlEntities('&ndash;')).toBe('\u2013');
    });

    it('&hellip; を … にデコードする', () => {
      expect(decodeHtmlEntities('&hellip;')).toBe('\u2026');
    });

    it('&bull; を • にデコードする', () => {
      expect(decodeHtmlEntities('&bull;')).toBe('\u2022');
    });
  });

  describe('通貨・数学エンティティ', () => {
    it('&cent; を ¢ にデコードする', () => {
      expect(decodeHtmlEntities('&cent;')).toBe('\u00A2');
    });

    it('&pound; を £ にデコードする', () => {
      expect(decodeHtmlEntities('&pound;')).toBe('\u00A3');
    });

    it('&yen; を ¥ にデコードする', () => {
      expect(decodeHtmlEntities('&yen;')).toBe('\u00A5');
    });

    it('&euro; を € にデコードする', () => {
      expect(decodeHtmlEntities('&euro;')).toBe('\u20AC');
    });

    it('&times; を × にデコードする', () => {
      expect(decodeHtmlEntities('&times;')).toBe('\u00D7');
    });

    it('&divide; を ÷ にデコードする', () => {
      expect(decodeHtmlEntities('&divide;')).toBe('\u00F7');
    });

    it('&plusmn; を ± にデコードする', () => {
      expect(decodeHtmlEntities('&plusmn;')).toBe('\u00B1');
    });

    it('&frac12; を ½ にデコードする', () => {
      expect(decodeHtmlEntities('&frac12;')).toBe('\u00BD');
    });

    it('&frac14; を ¼ にデコードする', () => {
      expect(decodeHtmlEntities('&frac14;')).toBe('\u00BC');
    });

    it('&frac34; を ¾ にデコードする', () => {
      expect(decodeHtmlEntities('&frac34;')).toBe('\u00BE');
    });
  });

  describe('レガシー数値エンティティ', () => {
    it('&#39; をシングルクォートにデコードする', () => {
      expect(decodeHtmlEntities('&#39;')).toBe("'");
    });

    it('&#x27; をシングルクォートにデコードする', () => {
      expect(decodeHtmlEntities('&#x27;')).toBe("'");
    });

    it('&#X27; をシングルクォートにデコードする（大文字）', () => {
      expect(decodeHtmlEntities('&#X27;')).toBe("'");
    });

    it('&#x2F; をスラッシュにデコードする', () => {
      expect(decodeHtmlEntities('&#x2F;')).toBe('/');
    });

    it('&#x2f; をスラッシュにデコードする（小文字）', () => {
      expect(decodeHtmlEntities('&#x2f;')).toBe('/');
    });
  });

  describe('十進数数値参照', () => {
    it('&#65; を A にデコードする', () => {
      expect(decodeHtmlEntities('&#65;')).toBe('A');
    });

    it('&#97; を a にデコードする', () => {
      expect(decodeHtmlEntities('&#97;')).toBe('a');
    });

    it('&#9731; を ☃ にデコードする', () => {
      expect(decodeHtmlEntities('&#9731;')).toBe('☃');
    });

    it('&#12354; を あ にデコードする', () => {
      expect(decodeHtmlEntities('&#12354;')).toBe('あ');
    });
  });

  describe('十六進数数値参照', () => {
    it('&#x41; を A にデコードする', () => {
      expect(decodeHtmlEntities('&#x41;')).toBe('A');
    });

    it('&#x61; を a にデコードする', () => {
      expect(decodeHtmlEntities('&#x61;')).toBe('a');
    });

    it('&#x2603; を ☃ にデコードする', () => {
      expect(decodeHtmlEntities('&#x2603;')).toBe('☃');
    });

    it('&#x3042; を あ にデコードする', () => {
      expect(decodeHtmlEntities('&#x3042;')).toBe('あ');
    });

    it('大文字十六進数 &#X41; を A にデコードする', () => {
      expect(decodeHtmlEntities('&#X41;')).toBe('A');
    });
  });

  describe('複合テキスト', () => {
    it('HTMLタグを含む文字列をデコードする', () => {
      expect(decodeHtmlEntities('&lt;p&gt;Hello&lt;/p&gt;')).toBe('<p>Hello</p>');
    });

    it('複数のエンティティを含む文字列をデコードする', () => {
      expect(decodeHtmlEntities('&amp;lt; &amp;gt;')).toBe('&lt; &gt;');
    });

    it('通常テキストとエンティティが混在する場合をデコードする', () => {
      expect(decodeHtmlEntities('Price: &yen;1,000 &amp; &euro;10')).toBe('Price: ¥1,000 & €10');
    });

    it('エンティティがない文字列はそのまま返す', () => {
      expect(decodeHtmlEntities('Hello, World!')).toBe('Hello, World!');
    });

    it('空文字列をそのまま返す', () => {
      expect(decodeHtmlEntities('')).toBe('');
    });

    it('日本語テキストはそのまま返す', () => {
      expect(decodeHtmlEntities('こんにちは世界')).toBe('こんにちは世界');
    });
  });

  describe('大文字小文字の区別なし', () => {
    it('&LT; を < にデコードする', () => {
      expect(decodeHtmlEntities('&LT;')).toBe('<');
    });

    it('&GT; を > にデコードする', () => {
      expect(decodeHtmlEntities('&GT;')).toBe('>');
    });

    it('&AMP; を & にデコードする', () => {
      expect(decodeHtmlEntities('&AMP;')).toBe('&');
    });
  });

  describe('未知のエンティティ', () => {
    it('未知のエンティティはそのまま残す', () => {
      expect(decodeHtmlEntities('&unknown;')).toBe('&unknown;');
    });

    it('不完全なエンティティはそのまま残す', () => {
      expect(decodeHtmlEntities('&amp')).toBe('&amp');
    });
  });
});
