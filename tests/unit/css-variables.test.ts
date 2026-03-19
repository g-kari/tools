import { describe, it, expect } from 'vitest';
import {
  parseCssVariables,
  isCssColor,
  resolveColorValue,
  exportAsCss,
  exportAsJson,
  exportAsJs,
} from '../../app/utils/css-variables';

describe('isCssColor', () => {
  it('16進数カラーを認識する', () => {
    expect(isCssColor('#fff')).toBe(true);
    expect(isCssColor('#ffffff')).toBe(true);
    expect(isCssColor('#6750a4')).toBe(true);
    expect(isCssColor('#6750a4ff')).toBe(true);
    expect(isCssColor('#abc')).toBe(true);
  });

  it('rgb/rgba を認識する', () => {
    expect(isCssColor('rgb(255, 0, 0)')).toBe(true);
    expect(isCssColor('rgba(0, 0, 0, 0.5)')).toBe(true);
  });

  it('hsl/hsla を認識する', () => {
    expect(isCssColor('hsl(270, 100%, 50%)')).toBe(true);
    expect(isCssColor('hsla(270, 100%, 50%, 0.5)')).toBe(true);
  });

  it('oklch/oklab を認識する', () => {
    expect(isCssColor('oklch(59.69% 0.156 301.39)')).toBe(true);
    expect(isCssColor('oklab(0.5 0.1 -0.1)')).toBe(true);
  });

  it('カラーキーワードを認識する', () => {
    expect(isCssColor('red')).toBe(true);
    expect(isCssColor('transparent')).toBe(true);
    expect(isCssColor('white')).toBe(true);
  });

  it('非カラー値を拒否する', () => {
    expect(isCssColor('16px')).toBe(false);
    expect(isCssColor('1rem')).toBe(false);
    expect(isCssColor('bold')).toBe(false);
    expect(isCssColor('400')).toBe(false);
    expect(isCssColor('')).toBe(false);
  });
});

describe('resolveColorValue', () => {
  it('有効なカラー値を返す', () => {
    expect(resolveColorValue('#6750a4')).toBe('#6750a4');
    expect(resolveColorValue('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
  });

  it('非カラーにはnullを返す', () => {
    expect(resolveColorValue('16px')).toBeNull();
  });

  it('var()参照にはnullを返す', () => {
    expect(resolveColorValue('var(--other-color)')).toBeNull();
  });
});

describe('parseCssVariables', () => {
  it('空文字列は空配列を返す', () => {
    const result = parseCssVariables('');
    expect(result.variables).toHaveLength(0);
    expect(result.error).toBeNull();
  });

  it(':root内の変数を抽出する', () => {
    const css = `:root {
  --color-primary: #6750a4;
  --spacing-md: 16px;
}`;
    const result = parseCssVariables(css);
    expect(result.variables).toHaveLength(2);
    expect(result.variables[0].name).toBe('--color-primary');
    expect(result.variables[0].value).toBe('#6750a4');
    expect(result.variables[0].selector).toBe(':root');
    expect(result.variables[0].isColor).toBe(true);
    expect(result.variables[1].name).toBe('--spacing-md');
    expect(result.variables[1].value).toBe('16px');
    expect(result.variables[1].isColor).toBe(false);
  });

  it('複数セレクターの変数を抽出する', () => {
    const css = `:root { --a: 1px; }
.dark { --a: 2px; --b: red; }`;
    const result = parseCssVariables(css);
    expect(result.variables).toHaveLength(3);
  });

  it('コメントを無視する', () => {
    const css = `:root {
  /* カラー変数 */
  --color: #fff; /* インラインコメント */
}`;
    const result = parseCssVariables(css);
    expect(result.variables).toHaveLength(1);
    expect(result.variables[0].name).toBe('--color');
  });

  it('カラー変数を正しく識別する', () => {
    const css = `:root {
  --primary: #6750a4;
  --size: 16px;
  --bg: rgba(0,0,0,0.5);
}`;
    const result = parseCssVariables(css);
    const colorVars = result.variables.filter((v) => v.isColor);
    expect(colorVars).toHaveLength(2);
  });

  it('colorValue を正しく解決する', () => {
    const css = `:root { --c: #ff0000; --d: var(--other); }`;
    const result = parseCssVariables(css);
    expect(result.variables[0].colorValue).toBe('#ff0000');
    expect(result.variables[1].colorValue).toBeNull();
  });
});

describe('exportAsCss', () => {
  it('CSS形式でエクスポートする', () => {
    const vars = [
      { name: '--a', value: '#fff', selector: ':root', isColor: true, colorValue: '#fff' },
      { name: '--b', value: '16px', selector: ':root', isColor: false, colorValue: null },
    ];
    const result = exportAsCss(vars);
    expect(result).toContain(':root {');
    expect(result).toContain('  --a: #fff;');
    expect(result).toContain('  --b: 16px;');
  });

  it('空配列は空文字列を返す', () => {
    expect(exportAsCss([])).toBe('');
  });

  it('カスタムセレクターを使用する', () => {
    const vars = [{ name: '--x', value: '1', selector: ':root', isColor: false, colorValue: null }];
    const result = exportAsCss(vars, '.my-class');
    expect(result).toContain('.my-class {');
  });
});

describe('exportAsJson', () => {
  it('JSON形式でエクスポートする', () => {
    const vars = [
      { name: '--color', value: '#fff', selector: ':root', isColor: true, colorValue: '#fff' },
    ];
    const result = exportAsJson(vars);
    const parsed = JSON.parse(result);
    expect(parsed['--color']).toBe('#fff');
  });
});

describe('exportAsJs', () => {
  it('TypeScript定数としてエクスポートする', () => {
    const vars = [
      { name: '--color-primary', value: '#6750a4', selector: ':root', isColor: true, colorValue: '#6750a4' },
    ];
    const result = exportAsJs(vars);
    expect(result).toContain('export const cssVariables');
    expect(result).toContain('colorPrimary');
    expect(result).toContain('#6750a4');
    expect(result).toContain('as const');
  });

  it('空配列は空オブジェクトを返す', () => {
    const result = exportAsJs([]);
    expect(result).toBe('export const cssVariables = {};');
  });
});
