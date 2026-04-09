import { describe, expect, it } from 'vite-plus/test';
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

  describe('特殊記号の名前付きエンティティ', () => {
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

  describe('通貨・数学記号のエンティティ', () => {
    it('&euro; を € にデコードする', () => {
      expect(decodeHtmlEntities('&euro;')).toBe('\u20AC');
    });

    it('&yen; を ¥ にデコードする', () => {
      expect(decodeHtmlEntities('&yen;')).toBe('\u00A5');
    });

    it('&pound; を £ にデコードする', () => {
      expect(decodeHtmlEntities('&pound;')).toBe('\u00A3');
    });

    it('&cent; を ¢ にデコードする', () => {
      expect(decodeHtmlEntities('&cent;')).toBe('\u00A2');
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

  describe('十進数数値参照', () => {
    it('&#65; を A にデコードする', () => {
      expect(decodeHtmlEntities('&#65;')).toBe('A');
    });

    it('&#97; を a にデコードする', () => {
      expect(decodeHtmlEntities('&#97;')).toBe('a');
    });

    it('&#12354; を あ にデコードする', () => {
      expect(decodeHtmlEntities('&#12354;')).toBe('あ');
    });

    it('&#169; を © にデコードする', () => {
      expect(decodeHtmlEntities('&#169;')).toBe('\u00A9');
    });
  });

  describe('十六進数数値参照', () => {
    it('&#x41; を A にデコードする', () => {
      expect(decodeHtmlEntities('&#x41;')).toBe('A');
    });

    it('&#x61; を a にデコードする', () => {
      expect(decodeHtmlEntities('&#x61;')).toBe('a');
    });

    it('&#x3042; を あ にデコードする', () => {
      expect(decodeHtmlEntities('&#x3042;')).toBe('あ');
    });

    it('大文字 &#X41; もデコードする', () => {
      expect(decodeHtmlEntities('&#X41;')).toBe('A');
    });

    it('&#xA9; を © にデコードする', () => {
      expect(decodeHtmlEntities('&#xA9;')).toBe('\u00A9');
    });
  });

  describe('レガシー数値エンティティ', () => {
    it('&#39; を \' にデコードする', () => {
      expect(decodeHtmlEntities('&#39;')).toBe("'");
    });

    it('&#x27; を \' にデコードする', () => {
      expect(decodeHtmlEntities('&#x27;')).toBe("'");
    });

    it('&#x2F; を / にデコードする', () => {
      expect(decodeHtmlEntities('&#x2F;')).toBe('/');
    });
  });

  describe('大文字小文字の区別なし', () => {
    it('&AMP; を & にデコードする（大文字）', () => {
      expect(decodeHtmlEntities('&AMP;')).toBe('&');
    });

    it('&LT; を < にデコードする（大文字）', () => {
      expect(decodeHtmlEntities('&LT;')).toBe('<');
    });

    it('&Amp; を & にデコードする（混合）', () => {
      expect(decodeHtmlEntities('&Amp;')).toBe('&');
    });
  });

  describe('複合テキスト', () => {
    it('複数のエンティティを一括デコードする', () => {
      expect(decodeHtmlEntities('&lt;div&gt;Hello &amp; World&lt;/div&gt;')).toBe(
        '<div>Hello & World</div>'
      );
    });

    it('エンティティを含む日本語テキストをデコードする', () => {
      expect(decodeHtmlEntities('価格：&yen;1,000&nbsp;（税込）')).toBe(
        '価格：¥1,000\u00A0（税込）'
      );
    });

    it('数値参照と名前付きエンティティが混在する場合', () => {
      expect(decodeHtmlEntities('&copy; &#65; &#x42;')).toBe('© A B');
    });
  });

  describe('エッジケース', () => {
    it('空文字列は空文字列を返す', () => {
      expect(decodeHtmlEntities('')).toBe('');
    });

    it('エンティティを含まない文字列はそのまま返す', () => {
      expect(decodeHtmlEntities('Hello World')).toBe('Hello World');
    });

    it('不完全なエンティティ（セミコロンなし）はそのまま残す', () => {
      expect(decodeHtmlEntities('&amp')).toBe('&amp');
    });

    it('未知のエンティティはそのまま残す', () => {
      expect(decodeHtmlEntities('&unknown;')).toBe('&unknown;');
    });

    it('& 単体はそのまま残す', () => {
      expect(decodeHtmlEntities('&')).toBe('&');
    });
  });
});
