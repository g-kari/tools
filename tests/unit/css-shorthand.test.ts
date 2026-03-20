import { describe, it, expect } from 'vitest';
import {
  splitCssValues,
  expandShorthand,
  collapseShorthand,
  getShorthandDefinition,
  SHORTHAND_DEFINITIONS,
} from '../../app/utils/css-shorthand';

describe('splitCssValues', () => {
  it('単純な空白区切り値を分割する', () => {
    expect(splitCssValues('10px 20px')).toEqual(['10px', '20px']);
  });

  it('1つの値を正しく処理する', () => {
    expect(splitCssValues('auto')).toEqual(['auto']);
  });

  it('3値を正しく分割する', () => {
    expect(splitCssValues('10px 20px 30px')).toEqual(['10px', '20px', '30px']);
  });

  it('4値を正しく分割する', () => {
    expect(splitCssValues('10px 20px 30px 40px')).toEqual([
      '10px',
      '20px',
      '30px',
      '40px',
    ]);
  });

  it('括弧内のスペースを区切りとして扱わない', () => {
    expect(splitCssValues('calc(100% - 20px) auto')).toEqual([
      'calc(100% - 20px)',
      'auto',
    ]);
  });

  it('ネストした括弧を正しく処理する', () => {
    expect(splitCssValues('max(10px, min(20px, 30px)) 0')).toEqual([
      'max(10px, min(20px, 30px))',
      '0',
    ]);
  });

  it('前後の空白を除去する', () => {
    expect(splitCssValues('  10px  20px  ')).toEqual(['10px', '20px']);
  });

  it('空文字列は空配列を返す', () => {
    expect(splitCssValues('')).toEqual([]);
    expect(splitCssValues('   ')).toEqual([]);
  });
});

describe('getShorthandDefinition', () => {
  it('有効なプロパティ名の定義を返す', () => {
    const def = getShorthandDefinition('margin');
    expect(def).not.toBeNull();
    expect(def?.name).toBe('margin');
  });

  it('無効なプロパティ名には null を返す', () => {
    expect(getShorthandDefinition('unknown-property')).toBeNull();
    expect(getShorthandDefinition('')).toBeNull();
  });

  it('全ての定義が取得できる', () => {
    for (const def of SHORTHAND_DEFINITIONS) {
      expect(getShorthandDefinition(def.name)).toBe(def);
    }
  });
});

describe('expandShorthand - margin', () => {
  it('1値展開: 全方向同じ値', () => {
    expect(expandShorthand('margin', '10px')).toEqual([
      { property: 'margin-top', value: '10px' },
      { property: 'margin-right', value: '10px' },
      { property: 'margin-bottom', value: '10px' },
      { property: 'margin-left', value: '10px' },
    ]);
  });

  it('2値展開: 上下/左右', () => {
    expect(expandShorthand('margin', '10px 20px')).toEqual([
      { property: 'margin-top', value: '10px' },
      { property: 'margin-right', value: '20px' },
      { property: 'margin-bottom', value: '10px' },
      { property: 'margin-left', value: '20px' },
    ]);
  });

  it('3値展開: 上/(左右)/下', () => {
    expect(expandShorthand('margin', '10px 20px 30px')).toEqual([
      { property: 'margin-top', value: '10px' },
      { property: 'margin-right', value: '20px' },
      { property: 'margin-bottom', value: '30px' },
      { property: 'margin-left', value: '20px' },
    ]);
  });

  it('4値展開: 上/右/下/左', () => {
    expect(expandShorthand('margin', '10px 20px 30px 40px')).toEqual([
      { property: 'margin-top', value: '10px' },
      { property: 'margin-right', value: '20px' },
      { property: 'margin-bottom', value: '30px' },
      { property: 'margin-left', value: '40px' },
    ]);
  });

  it('auto 値を正しく展開する', () => {
    const result = expandShorthand('margin', '0 auto');
    expect(result).toEqual([
      { property: 'margin-top', value: '0' },
      { property: 'margin-right', value: 'auto' },
      { property: 'margin-bottom', value: '0' },
      { property: 'margin-left', value: 'auto' },
    ]);
  });

  it('calc() 値を正しく展開する', () => {
    const result = expandShorthand('margin', 'calc(100% - 20px) 0');
    expect(result).toEqual([
      { property: 'margin-top', value: 'calc(100% - 20px)' },
      { property: 'margin-right', value: '0' },
      { property: 'margin-bottom', value: 'calc(100% - 20px)' },
      { property: 'margin-left', value: '0' },
    ]);
  });

  it('5値以上は null を返す', () => {
    expect(expandShorthand('margin', '1px 2px 3px 4px 5px')).toBeNull();
  });

  it('空文字列は null を返す', () => {
    expect(expandShorthand('margin', '')).toBeNull();
  });

  it('存在しないプロパティは null を返す', () => {
    expect(expandShorthand('unknown-property', '10px')).toBeNull();
  });
});

describe('expandShorthand - padding', () => {
  it('1値展開', () => {
    expect(expandShorthand('padding', '8px')).toEqual([
      { property: 'padding-top', value: '8px' },
      { property: 'padding-right', value: '8px' },
      { property: 'padding-bottom', value: '8px' },
      { property: 'padding-left', value: '8px' },
    ]);
  });

  it('2値展開', () => {
    expect(expandShorthand('padding', '8px 16px')).toEqual([
      { property: 'padding-top', value: '8px' },
      { property: 'padding-right', value: '16px' },
      { property: 'padding-bottom', value: '8px' },
      { property: 'padding-left', value: '16px' },
    ]);
  });
});

describe('expandShorthand - border-radius', () => {
  it('1値展開: 全角同じ', () => {
    const result = expandShorthand('border-radius', '4px');
    expect(result).toEqual([
      { property: 'border-top-left-radius', value: '4px' },
      { property: 'border-top-right-radius', value: '4px' },
      { property: 'border-bottom-right-radius', value: '4px' },
      { property: 'border-bottom-left-radius', value: '4px' },
    ]);
  });

  it('4値展開: 各角個別指定', () => {
    const result = expandShorthand('border-radius', '4px 8px 4px 8px');
    expect(result).toEqual([
      { property: 'border-top-left-radius', value: '4px' },
      { property: 'border-top-right-radius', value: '8px' },
      { property: 'border-bottom-right-radius', value: '4px' },
      { property: 'border-bottom-left-radius', value: '8px' },
    ]);
  });
});

describe('expandShorthand - inset', () => {
  it('1値展開', () => {
    expect(expandShorthand('inset', '0')).toEqual([
      { property: 'top', value: '0' },
      { property: 'right', value: '0' },
      { property: 'bottom', value: '0' },
      { property: 'left', value: '0' },
    ]);
  });

  it('2値展開', () => {
    expect(expandShorthand('inset', '0 auto')).toEqual([
      { property: 'top', value: '0' },
      { property: 'right', value: 'auto' },
      { property: 'bottom', value: '0' },
      { property: 'left', value: 'auto' },
    ]);
  });
});

describe('expandShorthand - overflow', () => {
  it('1値: x/y 両方同じ', () => {
    expect(expandShorthand('overflow', 'hidden')).toEqual([
      { property: 'overflow-x', value: 'hidden' },
      { property: 'overflow-y', value: 'hidden' },
    ]);
  });

  it('2値: x/y 個別指定', () => {
    expect(expandShorthand('overflow', 'hidden auto')).toEqual([
      { property: 'overflow-x', value: 'hidden' },
      { property: 'overflow-y', value: 'auto' },
    ]);
  });

  it('3値以上は null を返す', () => {
    expect(expandShorthand('overflow', 'hidden auto scroll')).toBeNull();
  });
});

describe('expandShorthand - gap', () => {
  it('1値: row-gap と column-gap が同じ', () => {
    expect(expandShorthand('gap', '16px')).toEqual([
      { property: 'row-gap', value: '16px' },
      { property: 'column-gap', value: '16px' },
    ]);
  });

  it('2値: 個別指定', () => {
    expect(expandShorthand('gap', '16px 24px')).toEqual([
      { property: 'row-gap', value: '16px' },
      { property: 'column-gap', value: '24px' },
    ]);
  });
});

describe('expandShorthand - flex', () => {
  it('none: grow=0 shrink=0 basis=auto', () => {
    expect(expandShorthand('flex', 'none')).toEqual([
      { property: 'flex-grow', value: '0' },
      { property: 'flex-shrink', value: '0' },
      { property: 'flex-basis', value: 'auto' },
    ]);
  });

  it('auto: grow=1 shrink=1 basis=auto', () => {
    expect(expandShorthand('flex', 'auto')).toEqual([
      { property: 'flex-grow', value: '1' },
      { property: 'flex-shrink', value: '1' },
      { property: 'flex-basis', value: 'auto' },
    ]);
  });

  it('数値1つ: grow=n shrink=1 basis=0', () => {
    expect(expandShorthand('flex', '2')).toEqual([
      { property: 'flex-grow', value: '2' },
      { property: 'flex-shrink', value: '1' },
      { property: 'flex-basis', value: '0' },
    ]);
  });

  it('flex: 1 は grow=1 shrink=1 basis=0', () => {
    expect(expandShorthand('flex', '1')).toEqual([
      { property: 'flex-grow', value: '1' },
      { property: 'flex-shrink', value: '1' },
      { property: 'flex-basis', value: '0' },
    ]);
  });

  it('寸法値1つ: basis として扱う', () => {
    expect(expandShorthand('flex', '100px')).toEqual([
      { property: 'flex-grow', value: '1' },
      { property: 'flex-shrink', value: '1' },
      { property: 'flex-basis', value: '100px' },
    ]);
  });

  it('2値: grow shrink（basis=0）', () => {
    expect(expandShorthand('flex', '1 2')).toEqual([
      { property: 'flex-grow', value: '1' },
      { property: 'flex-shrink', value: '2' },
      { property: 'flex-basis', value: '0' },
    ]);
  });

  it('3値: grow shrink basis', () => {
    expect(expandShorthand('flex', '1 2 100px')).toEqual([
      { property: 'flex-grow', value: '1' },
      { property: 'flex-shrink', value: '2' },
      { property: 'flex-basis', value: '100px' },
    ]);
  });

  it('4値以上は null を返す', () => {
    expect(expandShorthand('flex', '1 2 3 4')).toBeNull();
  });
});

describe('expandShorthand - place-content', () => {
  it('1値: align と justify が同じ', () => {
    expect(expandShorthand('place-content', 'center')).toEqual([
      { property: 'align-content', value: 'center' },
      { property: 'justify-content', value: 'center' },
    ]);
  });

  it('2値: 個別指定', () => {
    expect(expandShorthand('place-content', 'center space-between')).toEqual([
      { property: 'align-content', value: 'center' },
      { property: 'justify-content', value: 'space-between' },
    ]);
  });
});

describe('collapseShorthand - margin', () => {
  it('全方向同じ値: 1値に圧縮', () => {
    expect(
      collapseShorthand('margin', {
        'margin-top': '10px',
        'margin-right': '10px',
        'margin-bottom': '10px',
        'margin-left': '10px',
      })
    ).toBe('10px');
  });

  it('上下同じ・左右同じ: 2値に圧縮', () => {
    expect(
      collapseShorthand('margin', {
        'margin-top': '10px',
        'margin-right': '20px',
        'margin-bottom': '10px',
        'margin-left': '20px',
      })
    ).toBe('10px 20px');
  });

  it('左右同じ・上下異なる: 3値に圧縮', () => {
    expect(
      collapseShorthand('margin', {
        'margin-top': '10px',
        'margin-right': '20px',
        'margin-bottom': '30px',
        'margin-left': '20px',
      })
    ).toBe('10px 20px 30px');
  });

  it('全方向異なる: 4値のまま', () => {
    expect(
      collapseShorthand('margin', {
        'margin-top': '10px',
        'margin-right': '20px',
        'margin-bottom': '30px',
        'margin-left': '40px',
      })
    ).toBe('10px 20px 30px 40px');
  });

  it('プロパティが不足している場合は null を返す', () => {
    expect(
      collapseShorthand('margin', {
        'margin-top': '10px',
        'margin-right': '20px',
      })
    ).toBeNull();
  });
});

describe('collapseShorthand - overflow', () => {
  it('x と y が同じ: 1値に圧縮', () => {
    expect(
      collapseShorthand('overflow', { 'overflow-x': 'hidden', 'overflow-y': 'hidden' })
    ).toBe('hidden');
  });

  it('x と y が異なる: 2値のまま', () => {
    expect(
      collapseShorthand('overflow', { 'overflow-x': 'hidden', 'overflow-y': 'auto' })
    ).toBe('hidden auto');
  });
});

describe('collapseShorthand - flex', () => {
  it('none: grow=0 shrink=0 basis=auto', () => {
    expect(
      collapseShorthand('flex', {
        'flex-grow': '0',
        'flex-shrink': '0',
        'flex-basis': 'auto',
      })
    ).toBe('none');
  });

  it('auto: grow=1 shrink=1 basis=auto', () => {
    expect(
      collapseShorthand('flex', {
        'flex-grow': '1',
        'flex-shrink': '1',
        'flex-basis': 'auto',
      })
    ).toBe('auto');
  });

  it('通常の3値', () => {
    expect(
      collapseShorthand('flex', {
        'flex-grow': '1',
        'flex-shrink': '2',
        'flex-basis': '100px',
      })
    ).toBe('1 2 100px');
  });

  it('プロパティが不足している場合は null を返す', () => {
    expect(collapseShorthand('flex', { 'flex-grow': '1' })).toBeNull();
  });
});

describe('collapseShorthand - gap', () => {
  it('row と column が同じ: 1値に圧縮', () => {
    expect(
      collapseShorthand('gap', { 'row-gap': '16px', 'column-gap': '16px' })
    ).toBe('16px');
  });

  it('row と column が異なる: 2値のまま', () => {
    expect(
      collapseShorthand('gap', { 'row-gap': '16px', 'column-gap': '24px' })
    ).toBe('16px 24px');
  });
});

describe('collapseShorthand - 存在しないプロパティ', () => {
  it('null を返す', () => {
    expect(collapseShorthand('invalid', { 'foo': 'bar' })).toBeNull();
  });
});
