import { describe, it, expect } from 'vitest';
import {
  parseCookieHeader,
  parseSetCookieHeader,
  buildCookieHeader,
  buildSetCookieHeader,
  getCookieSecurityWarnings,
  getCookieExpiration,
  type CookieEntry,
  type SetCookieAttributes,
} from '../../app/utils/cookie-parser';

describe('parseCookieHeader', () => {
  it('空文字列は空配列を返す', () => {
    expect(parseCookieHeader('')).toEqual([]);
    expect(parseCookieHeader('   ')).toEqual([]);
  });

  it('単一のCookieをパースする', () => {
    const result = parseCookieHeader('session=abc123');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'session', value: 'abc123' });
  });

  it('複数のCookieをパースする', () => {
    const result = parseCookieHeader('a=1; b=2; c=3');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: 'a', value: '1' });
    expect(result[1]).toEqual({ name: 'b', value: '2' });
    expect(result[2]).toEqual({ name: 'c', value: '3' });
  });

  it('値にイコールが含まれる場合も正しくパースする', () => {
    const result = parseCookieHeader('token=abc=def==');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'token', value: 'abc=def==' });
  });

  it('値なしのCookieをパースする', () => {
    const result = parseCookieHeader('flag');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'flag', value: '' });
  });

  it('前後のスペースをトリムする', () => {
    const result = parseCookieHeader('  name  =  value  ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('name');
  });

  it('空のセグメントをスキップする', () => {
    const result = parseCookieHeader('a=1;;b=2');
    expect(result).toHaveLength(2);
  });

  it('URLエンコードされた値もそのまま返す', () => {
    const result = parseCookieHeader('lang=ja%2FJP');
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('ja%2FJP');
  });
});

describe('parseSetCookieHeader', () => {
  it('空文字列はnullを返す', () => {
    expect(parseSetCookieHeader('')).toBeNull();
    expect(parseSetCookieHeader('   ')).toBeNull();
  });

  it('基本的なSet-Cookieをパースする', () => {
    const result = parseSetCookieHeader('session=abc123');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('session');
    expect(result!.value).toBe('abc123');
    expect(result!.secure).toBe(false);
    expect(result!.httpOnly).toBe(false);
    expect(result!.unknown).toEqual([]);
  });

  it('Secure属性をパースする', () => {
    const result = parseSetCookieHeader('id=1; Secure');
    expect(result!.secure).toBe(true);
  });

  it('HttpOnly属性をパースする', () => {
    const result = parseSetCookieHeader('id=1; HttpOnly');
    expect(result!.httpOnly).toBe(true);
  });

  it('Path属性をパースする', () => {
    const result = parseSetCookieHeader('id=1; Path=/api');
    expect(result!.path).toBe('/api');
  });

  it('Domain属性をパースする', () => {
    const result = parseSetCookieHeader('id=1; Domain=example.com');
    expect(result!.domain).toBe('example.com');
  });

  it('Max-Age属性をパースする', () => {
    const result = parseSetCookieHeader('id=1; Max-Age=3600');
    expect(result!.maxAge).toBe(3600);
  });

  it('Expires属性をパースする', () => {
    const result = parseSetCookieHeader(
      'id=1; Expires=Mon, 01 Jan 2026 00:00:00 GMT'
    );
    expect(result!.expires).toBe('Mon, 01 Jan 2026 00:00:00 GMT');
  });

  it('SameSite属性をパースする', () => {
    const result = parseSetCookieHeader('id=1; SameSite=Strict');
    expect(result!.sameSite).toBe('Strict');
  });

  it('複数の属性を同時にパースする', () => {
    const result = parseSetCookieHeader(
      'session=abc; Path=/; Domain=example.com; HttpOnly; Secure; SameSite=Lax'
    );
    expect(result).not.toBeNull();
    expect(result!.name).toBe('session');
    expect(result!.value).toBe('abc');
    expect(result!.path).toBe('/');
    expect(result!.domain).toBe('example.com');
    expect(result!.httpOnly).toBe(true);
    expect(result!.secure).toBe(true);
    expect(result!.sameSite).toBe('Lax');
  });

  it('属性名の大文字小文字を区別しない', () => {
    const result = parseSetCookieHeader('id=1; httponly; secure; samesite=Lax');
    expect(result!.httpOnly).toBe(true);
    expect(result!.secure).toBe(true);
    expect(result!.sameSite).toBe('Lax');
  });

  it('未知の属性をunknownに格納する', () => {
    const result = parseSetCookieHeader('id=1; CustomAttr=foo');
    expect(result!.unknown).toHaveLength(1);
    expect(result!.unknown[0].key).toBe('CustomAttr');
    expect(result!.unknown[0].value).toBe('foo');
  });

  it('値なし属性もunknownに格納する', () => {
    const result = parseSetCookieHeader('id=1; CustomFlag');
    expect(result!.unknown).toHaveLength(1);
    expect(result!.unknown[0].key).toBe('CustomFlag');
    expect(result!.unknown[0].value).toBeUndefined();
  });
});

describe('buildCookieHeader', () => {
  it('空配列は空文字列を返す', () => {
    expect(buildCookieHeader([])).toBe('');
  });

  it('単一のCookieを生成する', () => {
    const entries: CookieEntry[] = [{ name: 'session', value: 'abc' }];
    expect(buildCookieHeader(entries)).toBe('session=abc');
  });

  it('複数のCookieをセミコロンで結合する', () => {
    const entries: CookieEntry[] = [
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
    ];
    expect(buildCookieHeader(entries)).toBe('a=1; b=2');
  });

  it('値なしのCookieは名前のみ出力する', () => {
    const entries: CookieEntry[] = [{ name: 'flag', value: '' }];
    expect(buildCookieHeader(entries)).toBe('flag');
  });

  it('名前が空のエントリーをスキップする', () => {
    const entries: CookieEntry[] = [
      { name: '', value: 'ignored' },
      { name: 'a', value: '1' },
    ];
    expect(buildCookieHeader(entries)).toBe('a=1');
  });
});

describe('buildSetCookieHeader', () => {
  it('基本的なSet-Cookieヘッダーを生成する', () => {
    const attrs: SetCookieAttributes = {
      name: 'session',
      value: 'abc',
      secure: false,
      httpOnly: false,
      unknown: [],
    };
    expect(buildSetCookieHeader(attrs)).toBe('session=abc');
  });

  it('Path付きのヘッダーを生成する', () => {
    const attrs: SetCookieAttributes = {
      name: 'id',
      value: '1',
      path: '/',
      secure: false,
      httpOnly: false,
      unknown: [],
    };
    expect(buildSetCookieHeader(attrs)).toBe('id=1; Path=/');
  });

  it('全属性付きのヘッダーを生成する', () => {
    const attrs: SetCookieAttributes = {
      name: 'session',
      value: 'abc123',
      path: '/',
      domain: 'example.com',
      maxAge: 3600,
      sameSite: 'Strict',
      secure: true,
      httpOnly: true,
      unknown: [],
    };
    const result = buildSetCookieHeader(attrs);
    expect(result).toContain('session=abc123');
    expect(result).toContain('Path=/');
    expect(result).toContain('Domain=example.com');
    expect(result).toContain('Max-Age=3600');
    expect(result).toContain('SameSite=Strict');
    expect(result).toContain('Secure');
    expect(result).toContain('HttpOnly');
  });

  it('Secureがfalseの場合はSecureを含まない', () => {
    const attrs: SetCookieAttributes = {
      name: 'id',
      value: '1',
      secure: false,
      httpOnly: false,
      unknown: [],
    };
    expect(buildSetCookieHeader(attrs)).not.toContain('Secure');
  });
});

describe('getCookieSecurityWarnings', () => {
  const baseAttrs: SetCookieAttributes = {
    name: 'session',
    value: 'abc',
    secure: true,
    httpOnly: true,
    sameSite: 'Strict',
    unknown: [],
  };

  it('全属性が正しく設定されている場合は警告なし', () => {
    const warnings = getCookieSecurityWarnings(baseAttrs);
    expect(warnings).toHaveLength(0);
  });

  it('Secureがない場合に警告を出す', () => {
    const attrs = { ...baseAttrs, secure: false };
    const warnings = getCookieSecurityWarnings(attrs);
    const hasSecureWarning = warnings.some((w) =>
      w.message.includes('Secure')
    );
    expect(hasSecureWarning).toBe(true);
  });

  it('HttpOnlyがない場合に警告を出す', () => {
    const attrs = { ...baseAttrs, httpOnly: false };
    const warnings = getCookieSecurityWarnings(attrs);
    const hasHttpOnlyWarning = warnings.some((w) =>
      w.message.includes('HttpOnly')
    );
    expect(hasHttpOnlyWarning).toBe(true);
  });

  it('SameSiteがない場合に警告を出す', () => {
    const attrs = { ...baseAttrs, sameSite: undefined };
    const warnings = getCookieSecurityWarnings(attrs);
    const hasSameSiteWarning = warnings.some((w) =>
      w.message.includes('SameSite')
    );
    expect(hasSameSiteWarning).toBe(true);
  });

  it('SameSite=NoneかつSecureなしはエラーレベルの警告を出す', () => {
    const attrs = { ...baseAttrs, sameSite: 'None', secure: false };
    const warnings = getCookieSecurityWarnings(attrs);
    const hasError = warnings.some((w) => w.level === 'error');
    expect(hasError).toBe(true);
  });

  it('Max-AgeとExpiresの両方指定はinfoレベルの警告を出す', () => {
    const attrs = {
      ...baseAttrs,
      maxAge: 3600,
      expires: 'Mon, 01 Jan 2026 00:00:00 GMT',
    };
    const warnings = getCookieSecurityWarnings(attrs);
    const hasInfo = warnings.some((w) => w.level === 'info');
    expect(hasInfo).toBe(true);
  });
});

describe('getCookieExpiration', () => {
  const baseAttrs: SetCookieAttributes = {
    name: 'session',
    value: 'abc',
    secure: false,
    httpOnly: false,
    unknown: [],
  };

  it('Max-Ageが0以下の場合はセッション/即時削除を返す', () => {
    const result = getCookieExpiration({ ...baseAttrs, maxAge: 0 });
    expect(result).toBeTruthy();
    expect(result).toContain('セッション');
  });

  it('Max-Ageが60未満は秒で返す', () => {
    const result = getCookieExpiration({ ...baseAttrs, maxAge: 30 });
    expect(result).toBe('30秒後');
  });

  it('Max-Ageが3600未満は分で返す', () => {
    const result = getCookieExpiration({ ...baseAttrs, maxAge: 120 });
    expect(result).toBe('2分後');
  });

  it('Max-Ageが86400未満は時間で返す', () => {
    const result = getCookieExpiration({ ...baseAttrs, maxAge: 7200 });
    expect(result).toBe('2時間後');
  });

  it('Max-Ageが86400以上は日数で返す', () => {
    const result = getCookieExpiration({ ...baseAttrs, maxAge: 86400 * 7 });
    expect(result).toBe('7日後');
  });

  it('Max-AgeがExpiresより優先される', () => {
    const attrs = {
      ...baseAttrs,
      maxAge: 3600,
      expires: 'Mon, 01 Jan 2026 00:00:00 GMT',
    };
    const result = getCookieExpiration(attrs);
    expect(result).toContain('時間');
  });

  it('期限なしはnullを返す', () => {
    const result = getCookieExpiration(baseAttrs);
    expect(result).toBeNull();
  });

  it('過去のExpiresは期限切れを返す', () => {
    const result = getCookieExpiration({
      ...baseAttrs,
      expires: 'Mon, 01 Jan 2020 00:00:00 GMT',
    });
    expect(result).toBe('期限切れ');
  });
});
