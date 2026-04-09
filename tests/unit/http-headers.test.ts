import { describe, it, expect } from 'vite-plus/test';
import {
  HTTP_HEADERS,
  filterHeaders,
  type HttpHeader,
} from '../../app/routes/http-headers';

describe('HTTP_HEADERS データ', () => {
  it('ヘッダーが1件以上存在する', () => {
    expect(HTTP_HEADERS.length).toBeGreaterThan(0);
  });

  it('全ヘッダーに必須フィールドが存在する', () => {
    for (const header of HTTP_HEADERS) {
      expect(header.name, `${header.name} に name がない`).toBeTruthy();
      expect(header.category, `${header.name} に category がない`).toMatch(
        /^(request|response|general)$/
      );
      expect(
        header.description,
        `${header.name} に description がない`
      ).toBeTruthy();
      expect(header.example, `${header.name} に example がない`).toBeTruthy();
      expect(typeof header.security, `${header.name} の security が boolean でない`).toBe('boolean');
    }
  });

  it('ヘッダー名が重複していない', () => {
    const names = HTTP_HEADERS.map((h) => h.name.toLowerCase());
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('リクエストヘッダーが存在する', () => {
    const requests = HTTP_HEADERS.filter((h) => h.category === 'request');
    expect(requests.length).toBeGreaterThan(0);
  });

  it('レスポンスヘッダーが存在する', () => {
    const responses = HTTP_HEADERS.filter((h) => h.category === 'response');
    expect(responses.length).toBeGreaterThan(0);
  });

  it('共通ヘッダーが存在する', () => {
    const generals = HTTP_HEADERS.filter((h) => h.category === 'general');
    expect(generals.length).toBeGreaterThan(0);
  });

  it('セキュリティ関連ヘッダーが存在する', () => {
    const securityHeaders = HTTP_HEADERS.filter((h) => h.security);
    expect(securityHeaders.length).toBeGreaterThan(0);
  });

  it('Content-Type ヘッダーが general カテゴリである', () => {
    const header = HTTP_HEADERS.find((h) => h.name === 'Content-Type');
    expect(header).toBeDefined();
    expect(header!.category).toBe('general');
  });

  it('Authorization ヘッダーがセキュリティ関連として分類されている', () => {
    const header = HTTP_HEADERS.find((h) => h.name === 'Authorization');
    expect(header).toBeDefined();
    expect(header!.security).toBe(true);
  });

  it('Content-Security-Policy ヘッダーがセキュリティ関連として分類されている', () => {
    const header = HTTP_HEADERS.find(
      (h) => h.name === 'Content-Security-Policy'
    );
    expect(header).toBeDefined();
    expect(header!.security).toBe(true);
    expect(header!.category).toBe('response');
  });

  it('Strict-Transport-Security ヘッダーが response カテゴリでセキュリティ関連', () => {
    const header = HTTP_HEADERS.find(
      (h) => h.name === 'Strict-Transport-Security'
    );
    expect(header).toBeDefined();
    expect(header!.category).toBe('response');
    expect(header!.security).toBe(true);
  });
});

describe('filterHeaders', () => {
  const sampleHeaders: HttpHeader[] = [
    {
      name: 'Authorization',
      category: 'request',
      description: '認証情報を送信します',
      example: 'Authorization: Bearer token',
      security: true,
    },
    {
      name: 'Content-Type',
      category: 'general',
      description: 'ボディのメディアタイプを指定します',
      example: 'Content-Type: application/json',
      security: false,
    },
    {
      name: 'Set-Cookie',
      category: 'response',
      description: 'Cookieを設定します',
      example: 'Set-Cookie: id=abc; HttpOnly',
      security: true,
    },
    {
      name: 'Content-Security-Policy',
      category: 'response',
      description: 'CSPポリシーを設定します',
      example: "Content-Security-Policy: default-src 'self'",
      security: true,
    },
  ];

  it('tab=all のとき全件返す', () => {
    const result = filterHeaders(sampleHeaders, '', 'all');
    expect(result).toHaveLength(sampleHeaders.length);
  });

  it('tab=request のとき request カテゴリのみ返す', () => {
    const result = filterHeaders(sampleHeaders, '', 'request');
    expect(result.every((h) => h.category === 'request')).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('tab=response のとき response カテゴリのみ返す', () => {
    const result = filterHeaders(sampleHeaders, '', 'response');
    expect(result.every((h) => h.category === 'response')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('tab=general のとき general カテゴリのみ返す', () => {
    const result = filterHeaders(sampleHeaders, '', 'general');
    expect(result.every((h) => h.category === 'general')).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('tab=security のとき security=true のヘッダーのみ返す', () => {
    const result = filterHeaders(sampleHeaders, '', 'security');
    expect(result.every((h) => h.security)).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('クエリでヘッダー名を検索できる', () => {
    const result = filterHeaders(sampleHeaders, 'authorization', 'all');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Authorization');
  });

  it('クエリで説明文を検索できる', () => {
    const result = filterHeaders(sampleHeaders, 'メディアタイプ', 'all');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((h) => h.name === 'Content-Type')).toBe(true);
  });

  it('クエリで使用例を検索できる', () => {
    const result = filterHeaders(sampleHeaders, 'HttpOnly', 'all');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((h) => h.name === 'Set-Cookie')).toBe(true);
  });

  it('クエリ検索はカテゴリフィルターと組み合わせられる', () => {
    const result = filterHeaders(sampleHeaders, 'Content', 'response');
    expect(result.every((h) => h.category === 'response')).toBe(true);
    expect(result.some((h) => h.name === 'Content-Security-Policy')).toBe(true);
    // Content-Type は general なので含まれない
    expect(result.some((h) => h.name === 'Content-Type')).toBe(false);
  });

  it('一致しないクエリのとき空配列を返す', () => {
    const result = filterHeaders(sampleHeaders, 'nonexistent-header-xyz', 'all');
    expect(result).toHaveLength(0);
  });

  it('クエリは大文字小文字を区別しない', () => {
    const lower = filterHeaders(sampleHeaders, 'authorization', 'all');
    const upper = filterHeaders(sampleHeaders, 'AUTHORIZATION', 'all');
    const mixed = filterHeaders(sampleHeaders, 'Authorization', 'all');
    expect(lower).toHaveLength(1);
    expect(upper).toHaveLength(1);
    expect(mixed).toHaveLength(1);
  });

  it('空クエリかつ tab=all で全件返す', () => {
    const result = filterHeaders(sampleHeaders, '   ', 'all');
    expect(result).toHaveLength(sampleHeaders.length);
  });
});
