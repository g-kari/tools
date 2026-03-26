import { describe, it, expect } from 'vitest';
import { buildUtmUrl, parseUtmUrl, isValidUrl } from '../../app/utils/utm';

describe('isValidUrl', () => {
  it('有効なhttpsのURLを受け入れる', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('有効なhttpのURLを受け入れる', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('パスを含むURLを受け入れる', () => {
    expect(isValidUrl('https://example.com/path/to/page')).toBe(true);
  });

  it('クエリパラメータを含むURLを受け入れる', () => {
    expect(isValidUrl('https://example.com?foo=bar')).toBe(true);
  });

  it('空文字列は無効', () => {
    expect(isValidUrl('')).toBe(false);
  });

  it('プロトコルなしのURLは無効', () => {
    expect(isValidUrl('example.com')).toBe(false);
  });

  it('ftpプロトコルは無効', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
  });

  it('ランダムな文字列は無効', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });
});

describe('buildUtmUrl', () => {
  it('必須パラメータのみでURLを生成する', () => {
    const result = buildUtmUrl('https://example.com', {
      source: 'google',
      medium: 'cpc',
    });
    expect(result).toContain('utm_source=google');
    expect(result).toContain('utm_medium=cpc');
    expect(result).toContain('https://example.com');
  });

  it('全パラメータを含むURLを生成する', () => {
    const result = buildUtmUrl('https://example.com/page', {
      source: 'facebook',
      medium: 'social',
      campaign: 'spring_sale',
      term: 'running+shoes',
      content: 'logolink',
    });
    expect(result).toContain('utm_source=facebook');
    expect(result).toContain('utm_medium=social');
    expect(result).toContain('utm_campaign=spring_sale');
    expect(result).toContain('utm_term=running%2Bshoes');
    expect(result).toContain('utm_content=logolink');
  });

  it('空文字列パラメータは除外される', () => {
    const result = buildUtmUrl('https://example.com', {
      source: 'google',
      medium: 'cpc',
      campaign: '',
      term: '',
      content: '',
    });
    expect(result).not.toContain('utm_campaign');
    expect(result).not.toContain('utm_term');
    expect(result).not.toContain('utm_content');
  });

  it('既存のクエリパラメータを保持する', () => {
    const result = buildUtmUrl('https://example.com?ref=homepage', {
      source: 'google',
      medium: 'cpc',
    });
    expect(result).toContain('ref=homepage');
    expect(result).toContain('utm_source=google');
    expect(result).toContain('utm_medium=cpc');
  });

  it('無効なベースURLで空文字列を返す', () => {
    const result = buildUtmUrl('not-a-url', {
      source: 'google',
      medium: 'cpc',
    });
    expect(result).toBe('');
  });

  it('空のベースURLで空文字列を返す', () => {
    const result = buildUtmUrl('', {
      source: 'google',
      medium: 'cpc',
    });
    expect(result).toBe('');
  });

  it('パラメータが空オブジェクトでもベースURLを返す', () => {
    const result = buildUtmUrl('https://example.com', {});
    expect(result).toBe('https://example.com/');
  });
});

describe('parseUtmUrl', () => {
  it('UTMパラメータを正しく解析する', () => {
    const url = 'https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale';
    const result = parseUtmUrl(url);
    expect(result.params.source).toBe('google');
    expect(result.params.medium).toBe('cpc');
    expect(result.params.campaign).toBe('spring_sale');
  });

  it('全パラメータを解析する', () => {
    const url =
      'https://example.com?utm_source=facebook&utm_medium=social&utm_campaign=sale&utm_term=shoes&utm_content=logo';
    const result = parseUtmUrl(url);
    expect(result.params.source).toBe('facebook');
    expect(result.params.medium).toBe('social');
    expect(result.params.campaign).toBe('sale');
    expect(result.params.term).toBe('shoes');
    expect(result.params.content).toBe('logo');
  });

  it('ベースURLを正しく抽出する（UTMパラメータを除去）', () => {
    const url = 'https://example.com/page?utm_source=google&utm_medium=cpc&ref=homepage';
    const result = parseUtmUrl(url);
    expect(result.baseUrl).toContain('https://example.com/page');
    expect(result.baseUrl).not.toContain('utm_source');
    expect(result.baseUrl).not.toContain('utm_medium');
    expect(result.baseUrl).toContain('ref=homepage');
  });

  it('UTMパラメータなしのURLを解析する', () => {
    const url = 'https://example.com/page';
    const result = parseUtmUrl(url);
    expect(result.baseUrl).toBe('https://example.com/page');
    expect(result.params).toEqual({});
  });

  it('一部のパラメータのみを含むURLを解析する', () => {
    const url = 'https://example.com?utm_source=google';
    const result = parseUtmUrl(url);
    expect(result.params.source).toBe('google');
    expect(result.params.medium).toBeUndefined();
    expect(result.params.campaign).toBeUndefined();
  });

  it('空文字列で空のオブジェクトを返す', () => {
    const result = parseUtmUrl('');
    expect(result.baseUrl).toBe('');
    expect(result.params).toEqual({});
  });

  it('無効なURLで空のオブジェクトを返す', () => {
    const result = parseUtmUrl('not-a-url');
    expect(result.baseUrl).toBe('');
    expect(result.params).toEqual({});
  });
});
