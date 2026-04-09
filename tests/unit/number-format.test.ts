import { describe, expect, it } from 'vite-plus/test';
import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
  formatForAllLocales,
  formatNumber,
  parseNumberInput,
} from '../../app/utils/number-format';

describe('SUPPORTED_LOCALES', () => {
  it('ja-JP が含まれている', () => {
    expect(SUPPORTED_LOCALES.some((l) => l.code === 'ja-JP')).toBe(true);
  });

  it('en-US が含まれている', () => {
    expect(SUPPORTED_LOCALES.some((l) => l.code === 'en-US')).toBe(true);
  });

  it('各エントリが code と name を持つ', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(locale.code).toBeTruthy();
      expect(locale.name).toBeTruthy();
    }
  });
});

describe('SUPPORTED_CURRENCIES', () => {
  it('JPY が含まれている', () => {
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === 'JPY')).toBe(true);
  });

  it('USD が含まれている', () => {
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === 'USD')).toBe(true);
  });
});

describe('parseNumberInput', () => {
  it('整数を正しくパースする', () => {
    expect(parseNumberInput('1234')).toBe(1234);
  });

  it('小数を正しくパースする', () => {
    expect(parseNumberInput('1234.56')).toBe(1234.56);
  });

  it('負の数を正しくパースする', () => {
    expect(parseNumberInput('-100')).toBe(-100);
  });

  it('カンマ区切りの数値をパースする', () => {
    expect(parseNumberInput('1,234,567')).toBe(1234567);
  });

  it('空文字列は undefined を返す', () => {
    expect(parseNumberInput('')).toBeUndefined();
    expect(parseNumberInput('   ')).toBeUndefined();
  });

  it('無効な文字列は undefined を返す', () => {
    expect(parseNumberInput('abc')).toBeUndefined();
    expect(parseNumberInput('12abc')).toBeUndefined();
  });

  it('0 を正しくパースする', () => {
    expect(parseNumberInput('0')).toBe(0);
  });
});

describe('formatNumber', () => {
  describe('decimal スタイル', () => {
    it('整数を小数フォーマットする（en-US）', () => {
      const result = formatNumber(1234567, {
        locale: 'en-US',
        style: 'decimal',
        currency: 'USD',
        compact: 'none',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBe('1,234,567');
    });

    it('小数をフォーマットする（ja-JP）', () => {
      const result = formatNumber(1234567.89, {
        locale: 'ja-JP',
        style: 'decimal',
        currency: 'JPY',
        compact: 'none',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBeTruthy();
    });

    it('3桁区切りなしでフォーマットする', () => {
      const result = formatNumber(1234567, {
        locale: 'en-US',
        style: 'decimal',
        currency: 'USD',
        compact: 'none',
        useGrouping: false,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBe('1234567');
    });

    it('小数点以下桁数を固定する', () => {
      const result = formatNumber(1.5, {
        locale: 'en-US',
        style: 'decimal',
        currency: 'USD',
        compact: 'none',
        useGrouping: true,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBe('1.50');
    });

    it('負の数をフォーマットする', () => {
      const result = formatNumber(-1234, {
        locale: 'en-US',
        style: 'decimal',
        currency: 'USD',
        compact: 'none',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBe('-1,234');
    });

    it('0 をフォーマットする', () => {
      const result = formatNumber(0, {
        locale: 'en-US',
        style: 'decimal',
        currency: 'USD',
        compact: 'none',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBe('0');
    });
  });

  describe('currency スタイル', () => {
    it('JPY 通貨でフォーマットする（ja-JP）', () => {
      const result = formatNumber(1000, {
        locale: 'ja-JP',
        style: 'currency',
        currency: 'JPY',
        compact: 'none',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toContain('1,000');
    });

    it('USD 通貨でフォーマットする（en-US）', () => {
      const result = formatNumber(1234.56, {
        locale: 'en-US',
        style: 'currency',
        currency: 'USD',
        compact: 'none',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toContain('1,234.56');
    });

    it('EUR 通貨でフォーマットする（de-DE）', () => {
      const result = formatNumber(1000, {
        locale: 'de-DE',
        style: 'currency',
        currency: 'EUR',
        compact: 'none',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBeTruthy();
    });
  });

  describe('percent スタイル', () => {
    it('0.5 を 50% にフォーマットする', () => {
      const result = formatNumber(0.5, {
        locale: 'en-US',
        style: 'percent',
        currency: 'USD',
        compact: 'none',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBe('50%');
    });

    it('0.1234 をパーセントフォーマットする', () => {
      const result = formatNumber(0.1234, {
        locale: 'en-US',
        style: 'percent',
        currency: 'USD',
        compact: 'none',
        useGrouping: true,
        maximumFractionDigits: 2,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBe('12.34%');
    });
  });

  describe('compact 表記', () => {
    it('short compact で 1000 → 1K（en-US）', () => {
      const result = formatNumber(1000, {
        locale: 'en-US',
        style: 'decimal',
        currency: 'USD',
        compact: 'short',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBeTruthy();
    });

    it('short compact で 10000 → 1万（ja-JP）', () => {
      const result = formatNumber(10000, {
        locale: 'ja-JP',
        style: 'decimal',
        currency: 'JPY',
        compact: 'short',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBeTruthy();
    });

    it('long compact で 1000000 をフォーマットする', () => {
      const result = formatNumber(1000000, {
        locale: 'en-US',
        style: 'decimal',
        currency: 'USD',
        compact: 'long',
        useGrouping: true,
      });
      expect(result.error).toBeUndefined();
      expect(result.formatted).toBeTruthy();
    });
  });

  describe('無効な入力', () => {
    it('NaN はエラーを返す', () => {
      const result = formatNumber(NaN, {
        locale: 'en-US',
        style: 'decimal',
        currency: 'USD',
        compact: 'none',
        useGrouping: true,
      });
      expect(result.error).toBeTruthy();
    });

    it('Infinity はエラーを返す', () => {
      const result = formatNumber(Infinity, {
        locale: 'en-US',
        style: 'decimal',
        currency: 'USD',
        compact: 'none',
        useGrouping: true,
      });
      expect(result.error).toBeTruthy();
    });
  });
});

describe('formatForAllLocales', () => {
  it('全ロケール分のエントリを返す', () => {
    const entries = formatForAllLocales(1234567, {
      style: 'decimal',
      currency: 'JPY',
      compact: 'none',
      useGrouping: true,
    });
    expect(entries.length).toBe(SUPPORTED_LOCALES.length);
  });

  it('各エントリが locale・name・formatted を持つ', () => {
    const entries = formatForAllLocales(1000, {
      style: 'decimal',
      currency: 'JPY',
      compact: 'none',
      useGrouping: true,
    });
    for (const entry of entries) {
      expect(entry.locale).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.formatted).toBeTruthy();
    }
  });

  it('ロケールごとに異なるフォーマット結果を返す', () => {
    const entries = formatForAllLocales(1234567.89, {
      style: 'decimal',
      currency: 'JPY',
      compact: 'none',
      useGrouping: true,
    });
    const formattedValues = entries.map((e) => e.formatted);
    // 少なくとも2種類以上の異なるフォーマットがあるはず
    const uniqueValues = new Set(formattedValues);
    expect(uniqueValues.size).toBeGreaterThan(1);
  });

  it('通貨フォーマットで全ロケール分のエントリを返す', () => {
    const entries = formatForAllLocales(1000, {
      style: 'currency',
      currency: 'USD',
      compact: 'none',
      useGrouping: true,
    });
    expect(entries.length).toBe(SUPPORTED_LOCALES.length);
    for (const entry of entries) {
      expect(entry.formatted).toBeTruthy();
    }
  });
});
