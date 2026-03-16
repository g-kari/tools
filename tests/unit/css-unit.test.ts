import { describe, it, expect } from 'vitest';
import {
  toPx,
  fromPx,
  convertAllUnits,
  formatCssValue,
  DEFAULT_CONTEXT,
  CSS_UNITS,
  type CssConversionContext,
} from '../../app/utils/css-unit';

const ctx: CssConversionContext = {
  rootFontSize: 16,
  parentFontSize: 16,
  viewportWidth: 1920,
  viewportHeight: 1080,
  parentSize: 1000,
};

describe('toPx', () => {
  it('px はそのまま返す', () => {
    expect(toPx(100, 'px', ctx)).toBe(100);
  });

  it('rem: 1rem = rootFontSize px', () => {
    expect(toPx(1, 'rem', ctx)).toBe(16);
    expect(toPx(2, 'rem', ctx)).toBe(32);
  });

  it('em: 1em = parentFontSize px', () => {
    expect(toPx(1, 'em', ctx)).toBe(16);
    expect(toPx(1.5, 'em', ctx)).toBe(24);
  });

  it('vw: 1vw = viewportWidth / 100', () => {
    expect(toPx(1, 'vw', ctx)).toBe(19.2);
    expect(toPx(100, 'vw', ctx)).toBe(1920);
  });

  it('vh: 1vh = viewportHeight / 100', () => {
    expect(toPx(1, 'vh', ctx)).toBe(10.8);
    expect(toPx(100, 'vh', ctx)).toBe(1080);
  });

  it('%: 1% = parentSize / 100', () => {
    expect(toPx(1, '%', ctx)).toBe(10);
    expect(toPx(50, '%', ctx)).toBe(500);
  });

  it('pt: 1pt = 96/72 px', () => {
    expect(toPx(72, 'pt', ctx)).toBeCloseTo(96, 5);
    expect(toPx(1, 'pt', ctx)).toBeCloseTo(96 / 72, 5);
  });

  it('pc: 1pc = 16px', () => {
    expect(toPx(1, 'pc', ctx)).toBeCloseTo(16, 5);
    expect(toPx(6, 'pc', ctx)).toBeCloseTo(96, 5);
  });

  it('cm: 1cm = 96/2.54 px', () => {
    expect(toPx(1, 'cm', ctx)).toBeCloseTo(96 / 2.54, 5);
    expect(toPx(2.54, 'cm', ctx)).toBeCloseTo(96, 5);
  });

  it('mm: 1mm = 96/25.4 px', () => {
    expect(toPx(1, 'mm', ctx)).toBeCloseTo(96 / 25.4, 5);
    expect(toPx(25.4, 'mm', ctx)).toBeCloseTo(96, 5);
  });

  it('in: 1in = 96px', () => {
    expect(toPx(1, 'in', ctx)).toBe(96);
    expect(toPx(2, 'in', ctx)).toBe(192);
  });

  it('NaN は null を返す', () => {
    expect(toPx(NaN, 'px', ctx)).toBeNull();
  });

  it('Infinity は null を返す', () => {
    expect(toPx(Infinity, 'px', ctx)).toBeNull();
  });
});

describe('fromPx', () => {
  it('px はそのまま返す', () => {
    expect(fromPx(100, 'px', ctx)).toBe(100);
  });

  it('rem: 16px = 1rem', () => {
    expect(fromPx(16, 'rem', ctx)).toBe(1);
    expect(fromPx(32, 'rem', ctx)).toBe(2);
  });

  it('em: 16px = 1em', () => {
    expect(fromPx(16, 'em', ctx)).toBe(1);
  });

  it('vw: 1920px = 100vw', () => {
    expect(fromPx(1920, 'vw', ctx)).toBe(100);
    expect(fromPx(192, 'vw', ctx)).toBeCloseTo(10, 5);
  });

  it('vh: 1080px = 100vh', () => {
    expect(fromPx(1080, 'vh', ctx)).toBe(100);
  });

  it('%: 1000px = 100%', () => {
    expect(fromPx(1000, '%', ctx)).toBe(100);
    expect(fromPx(500, '%', ctx)).toBe(50);
  });

  it('rootFontSize が 0 のとき rem は null', () => {
    const zeroCtx = { ...ctx, rootFontSize: 0 };
    expect(fromPx(16, 'rem', zeroCtx)).toBeNull();
  });

  it('viewportWidth が 0 のとき vw は null', () => {
    const zeroCtx = { ...ctx, viewportWidth: 0 };
    expect(fromPx(100, 'vw', zeroCtx)).toBeNull();
  });

  it('viewportHeight が 0 のとき vh は null', () => {
    const zeroCtx = { ...ctx, viewportHeight: 0 };
    expect(fromPx(100, 'vh', zeroCtx)).toBeNull();
  });

  it('parentSize が 0 のとき % は null', () => {
    const zeroCtx = { ...ctx, parentSize: 0 };
    expect(fromPx(100, '%', zeroCtx)).toBeNull();
  });

  it('in: 96px = 1in', () => {
    expect(fromPx(96, 'in', ctx)).toBe(1);
  });
});

describe('toPx と fromPx のラウンドトリップ', () => {
  const units = ['px', 'rem', 'em', 'vw', 'vh', '%', 'pt', 'pc', 'cm', 'mm', 'in'] as const;

  for (const unit of units) {
    it(`${unit}: px→unit→px が元の値を返す`, () => {
      const original = 100;
      const converted = fromPx(original, unit, ctx);
      if (converted !== null) {
        const back = toPx(converted, unit, ctx);
        expect(back).toBeCloseTo(original, 4);
      }
    });
  }
});

describe('convertAllUnits', () => {
  it('16px を全単位に変換する', () => {
    const results = convertAllUnits(16, 'px', ctx);
    expect(results.px).toBe(16);
    expect(results.rem).toBe(1);
    expect(results.em).toBe(1);
    expect(results.vw).toBeCloseTo(16 / 1920 * 100, 5);
    expect(results.vh).toBeCloseTo(16 / 1080 * 100, 5);
    expect(results['%']).toBeCloseTo(1.6, 5);
    expect(results.in).toBeCloseTo(16 / 96, 5);
  });

  it('NaN 入力のとき全結果が null', () => {
    const results = convertAllUnits(NaN, 'px', ctx);
    for (const unit of CSS_UNITS) {
      expect(results[unit.id]).toBeNull();
    }
  });

  it('1rem を変換すると px = rootFontSize', () => {
    const results = convertAllUnits(1, 'rem', ctx);
    expect(results.px).toBe(16);
  });
});

describe('formatCssValue', () => {
  it('整数はそのまま表示', () => {
    expect(formatCssValue(16)).toBe('16');
    expect(formatCssValue(100)).toBe('100');
  });

  it('小数は末尾の 0 を除去', () => {
    expect(formatCssValue(1.5)).toBe('1.5');
    expect(formatCssValue(1.0)).toBe('1');
  });

  it('非常に小さい値は ≈ 0', () => {
    expect(formatCssValue(1e-10)).toBe('≈ 0');
  });

  it('非常に大きい値は指数表記', () => {
    const result = formatCssValue(2e9);
    expect(result).toContain('e');
  });

  it('Infinity は — を返す', () => {
    expect(formatCssValue(Infinity)).toBe('—');
  });

  it('NaN は — を返す', () => {
    expect(formatCssValue(NaN)).toBe('—');
  });
});

describe('DEFAULT_CONTEXT', () => {
  it('デフォルト値が正しく設定されている', () => {
    expect(DEFAULT_CONTEXT.rootFontSize).toBe(16);
    expect(DEFAULT_CONTEXT.parentFontSize).toBe(16);
    expect(DEFAULT_CONTEXT.viewportWidth).toBe(1920);
    expect(DEFAULT_CONTEXT.viewportHeight).toBe(1080);
    expect(DEFAULT_CONTEXT.parentSize).toBe(1000);
  });
});

describe('CSS_UNITS', () => {
  it('11 種類の単位が定義されている', () => {
    expect(CSS_UNITS).toHaveLength(11);
  });

  it('contextDependent フラグが正しく設定されている', () => {
    const dependent = CSS_UNITS.filter((u) => u.contextDependent).map((u) => u.id);
    const notDependent = CSS_UNITS.filter((u) => !u.contextDependent).map((u) => u.id);
    expect(dependent).toEqual(expect.arrayContaining(['rem', 'em', 'vw', 'vh', '%']));
    expect(notDependent).toEqual(expect.arrayContaining(['px', 'pt', 'pc', 'cm', 'mm', 'in']));
  });
});
