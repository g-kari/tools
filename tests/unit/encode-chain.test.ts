import { describe, it, expect } from 'vite-plus/test';
import { applyTransform } from '../../app/routes/encode-chain';

describe('applyTransform', () => {
  describe('base64-encode', () => {
    it('ASCII文字列をBase64にエンコードする', () => {
      const { output, error } = applyTransform('Hello, World!', 'base64-encode');
      expect(output).toBe('SGVsbG8sIFdvcmxkIQ==');
      expect(error).toBeUndefined();
    });

    it('日本語をBase64にエンコードする', () => {
      const { output, error } = applyTransform('こんにちは', 'base64-encode');
      expect(output).toBeTruthy();
      expect(error).toBeUndefined();
    });

    it('空文字列をBase64にエンコードする', () => {
      const { output } = applyTransform('', 'base64-encode');
      expect(output).toBe('');
    });
  });

  describe('base64-decode', () => {
    it('Base64文字列をデコードする', () => {
      const { output, error } = applyTransform('SGVsbG8sIFdvcmxkIQ==', 'base64-decode');
      expect(output).toBe('Hello, World!');
      expect(error).toBeUndefined();
    });

    it('無効なBase64はエラーを返す', () => {
      const { error } = applyTransform('invalid!!!base64', 'base64-decode');
      expect(error).toBeDefined();
    });
  });

  describe('url-encode / url-decode', () => {
    it('特殊文字をURLエンコードする', () => {
      const { output } = applyTransform('hello world & foo=bar', 'url-encode');
      expect(output).toBe('hello%20world%20%26%20foo%3Dbar');
    });

    it('URLエンコードをデコードする', () => {
      const { output } = applyTransform('hello%20world%20%26%20foo%3Dbar', 'url-decode');
      expect(output).toBe('hello world & foo=bar');
    });

    it('encode→decodeで元に戻る', () => {
      const original = 'テスト text 123!@#';
      const { output: encoded } = applyTransform(original, 'url-encode');
      const { output: decoded } = applyTransform(encoded, 'url-decode');
      expect(decoded).toBe(original);
    });
  });

  describe('hex-encode / hex-decode', () => {
    it('ASCIIテキストをHexにエンコードする', () => {
      const { output } = applyTransform('AB', 'hex-encode');
      expect(output).toBe('4142');
    });

    it('Hexをテキストにデコードする', () => {
      const { output } = applyTransform('4142', 'hex-decode');
      expect(output).toBe('AB');
    });

    it('奇数長のHexはエラーを返す', () => {
      const { error } = applyTransform('abc', 'hex-decode');
      expect(error).toBeDefined();
    });

    it('無効なHex文字はエラーを返す', () => {
      const { error } = applyTransform('gg', 'hex-decode');
      expect(error).toBeDefined();
    });
  });

  describe('html-escape / html-unescape', () => {
    it('HTMLタグをエスケープする', () => {
      const { output } = applyTransform('<script>alert("xss")</script>', 'html-escape');
      expect(output).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('HTMLエンティティをアンエスケープする', () => {
      const { output } = applyTransform('&lt;b&gt;bold&lt;/b&gt;', 'html-unescape');
      expect(output).toBe('<b>bold</b>');
    });

    it('& を正しくエスケープする', () => {
      const { output } = applyTransform('a & b', 'html-escape');
      expect(output).toBe('a &amp; b');
    });
  });

  describe('json-stringify / json-parse', () => {
    it('文字列をJSON文字列化する', () => {
      const { output } = applyTransform('hello\nworld', 'json-stringify');
      expect(output).toBe('"hello\\nworld"');
    });

    it('JSON文字列をパースする', () => {
      const { output } = applyTransform('"hello\\nworld"', 'json-parse');
      expect(output).toBe('hello\nworld');
    });

    it('無効なJSONはエラーを返す', () => {
      const { error } = applyTransform('invalid json', 'json-parse');
      expect(error).toBeDefined();
    });
  });

  describe('テキスト変換', () => {
    it('uppercase: 大文字に変換する', () => {
      const { output } = applyTransform('hello world', 'uppercase');
      expect(output).toBe('HELLO WORLD');
    });

    it('lowercase: 小文字に変換する', () => {
      const { output } = applyTransform('HELLO WORLD', 'lowercase');
      expect(output).toBe('hello world');
    });

    it('reverse: 文字列を反転する', () => {
      const { output } = applyTransform('abcde', 'reverse');
      expect(output).toBe('edcba');
    });

    it('trim: 空白を除去する', () => {
      const { output } = applyTransform('  hello  ', 'trim');
      expect(output).toBe('hello');
    });

    it('rot13: アルファベットを13文字シフト', () => {
      const { output } = applyTransform('Hello, World!', 'rot13');
      expect(output).toBe('Uryyb, Jbeyq!');
    });

    it('rot13: 2回適用で元に戻る', () => {
      const original = 'Hello, World!';
      const { output: once } = applyTransform(original, 'rot13');
      const { output: twice } = applyTransform(once, 'rot13');
      expect(twice).toBe(original);
    });
  });

  describe('連鎖適用', () => {
    it('Base64エンコード → URLエンコードの連鎖', () => {
      const { output: base64 } = applyTransform('Hello!', 'base64-encode');
      const { output: urlEncoded } = applyTransform(base64, 'url-encode');
      expect(urlEncoded).toBeTruthy();
      // URLデコード → Base64デコードで元に戻る
      const { output: urlDecoded } = applyTransform(urlEncoded, 'url-decode');
      const { output: final } = applyTransform(urlDecoded, 'base64-decode');
      expect(final).toBe('Hello!');
    });
  });
});
