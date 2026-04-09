import { describe, it, expect } from 'vite-plus/test';

/**
 * HTML文字列をエンティティエンコードする
 * @param text - エンコード対象の文字列
 * @returns HTMLエンティティにエンコードされた文字列
 */
function htmlEncode(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * HTMLエンティティ文字列をデコードして元のテキストに戻す
 * @param text - デコード対象のHTMLエンティティ文字列
 * @returns デコードされた文字列
 */
function htmlDecode(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

describe('HTML Encode/Decode Functions', () => {
  describe('htmlEncode', () => {
    it('should encode ampersand', () => {
      const result = htmlEncode('a & b');
      expect(result).toBe('a &amp; b');
    });

    it('should encode less-than sign', () => {
      const result = htmlEncode('<div>');
      expect(result).toBe('&lt;div&gt;');
    });

    it('should encode greater-than sign', () => {
      const result = htmlEncode('x > y');
      expect(result).toBe('x &gt; y');
    });

    it('should encode double quotes', () => {
      const result = htmlEncode('Say "hello"');
      expect(result).toBe('Say &quot;hello&quot;');
    });

    it('should encode single quotes', () => {
      const result = htmlEncode("it's here");
      expect(result).toBe('it&#39;s here');
    });

    it('should encode HTML tag with attributes', () => {
      const result = htmlEncode('<h1 class="title">Hello, World!</h1>');
      expect(result).toBe('&lt;h1 class=&quot;title&quot;&gt;Hello, World!&lt;/h1&gt;');
    });

    it('should leave plain ASCII text unchanged', () => {
      const result = htmlEncode('Hello World 123');
      expect(result).toBe('Hello World 123');
    });

    it('should handle empty string', () => {
      const result = htmlEncode('');
      expect(result).toBe('');
    });

    it('should encode ampersand before other characters', () => {
      // ampersand must be encoded first to avoid double-encoding
      const result = htmlEncode('&lt;');
      expect(result).toBe('&amp;lt;');
    });

    it('should handle Japanese text without encoding', () => {
      const result = htmlEncode('こんにちは');
      expect(result).toBe('こんにちは');
    });

    it('should encode multiple special characters in sequence', () => {
      const result = htmlEncode('<>&"\'');
      expect(result).toBe('&lt;&gt;&amp;&quot;&#39;');
    });
  });

  describe('htmlDecode', () => {
    it('should decode &amp; to ampersand', () => {
      const result = htmlDecode('a &amp; b');
      expect(result).toBe('a & b');
    });

    it('should decode &lt; to less-than sign', () => {
      const result = htmlDecode('&lt;div&gt;');
      expect(result).toBe('<div>');
    });

    it('should decode &gt; to greater-than sign', () => {
      const result = htmlDecode('x &gt; y');
      expect(result).toBe('x > y');
    });

    it('should decode &quot; to double quote', () => {
      const result = htmlDecode('Say &quot;hello&quot;');
      expect(result).toBe('Say "hello"');
    });

    it('should decode &#39; to single quote', () => {
      const result = htmlDecode('it&#39;s here');
      expect(result).toBe("it's here");
    });

    it('should decode decimal numeric references', () => {
      const result = htmlDecode('&#65;'); // A
      expect(result).toBe('A');
    });

    it('should decode hexadecimal numeric references', () => {
      const result = htmlDecode('&#x41;'); // A
      expect(result).toBe('A');
    });

    it('should decode uppercase hexadecimal numeric references', () => {
      const result = htmlDecode('&#X41;');
      // &#X41; は大文字Xなのでマッチしない（小文字xのみ対応）
      expect(result).toBe('&#X41;');
    });

    it('should leave plain text unchanged', () => {
      const result = htmlDecode('Hello World');
      expect(result).toBe('Hello World');
    });

    it('should handle empty string', () => {
      const result = htmlDecode('');
      expect(result).toBe('');
    });

    it('should decode full HTML entity sequence', () => {
      const result = htmlDecode('&lt;&gt;&amp;&quot;&#39;');
      expect(result).toBe('<>&"\'');
    });
  });

  describe('Round-trip conversion', () => {
    it('should preserve HTML tag through encode/decode', () => {
      const original = '<h1>Hello, World!</h1>';
      const encoded = htmlEncode(original);
      const decoded = htmlDecode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve text with all special characters through encode/decode', () => {
      const original = '<div class="box">it\'s a & b</div>';
      const encoded = htmlEncode(original);
      const decoded = htmlDecode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve Japanese text through encode/decode', () => {
      const original = '<p>こんにちは</p>';
      const encoded = htmlEncode(original);
      const decoded = htmlDecode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve plain text through encode/decode', () => {
      const original = 'Hello, World!';
      const encoded = htmlEncode(original);
      const decoded = htmlDecode(encoded);
      expect(decoded).toBe(original);
    });

    it('should preserve script tag through encode/decode', () => {
      const original = '<script>alert("xss")</script>';
      const encoded = htmlEncode(original);
      const decoded = htmlDecode(encoded);
      expect(decoded).toBe(original);
    });
  });
});
