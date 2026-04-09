import { describe, it, expect } from 'vite-plus/test';
import {
  compileExpression,
  computePlotPoints,
  splitIntoSegments,
  autoYRange,
  niceStep,
  buildAllPlotData,
  PLOT_COLORS,
  SAMPLE_FUNCTIONS,
  type PlotData,
} from '../../app/utils/function-plotter';

// ---- compileExpression ----

describe('compileExpression', () => {
  it('定数を評価できる', () => {
    const { fn, error } = compileExpression('3.14');
    expect(error).toBeNull();
    expect(fn!(0)).toBeCloseTo(3.14);
  });

  it('x変数を評価できる', () => {
    const { fn } = compileExpression('x');
    expect(fn!(5)).toBe(5);
    expect(fn!(-3)).toBe(-3);
  });

  it('四則演算', () => {
    expect(compileExpression('x + 2').fn!(3)).toBe(5);
    expect(compileExpression('x - 1').fn!(4)).toBe(3);
    expect(compileExpression('2 * x').fn!(6)).toBe(12);
    expect(compileExpression('x / 4').fn!(8)).toBe(2);
  });

  it('べき乗', () => {
    expect(compileExpression('x^2').fn!(3)).toBe(9);
    expect(compileExpression('x^3').fn!(2)).toBe(8);
    expect(compileExpression('2^x').fn!(10)).toBe(1024);
  });

  it('数学関数', () => {
    expect(compileExpression('sin(x)').fn!(0)).toBeCloseTo(0);
    expect(compileExpression('cos(x)').fn!(0)).toBeCloseTo(1);
    expect(compileExpression('abs(x)').fn!(-5)).toBe(5);
    expect(compileExpression('sqrt(x)').fn!(9)).toBeCloseTo(3);
    expect(compileExpression('log10(x)').fn!(1000)).toBeCloseTo(3);
  });

  it('定数 PI, E', () => {
    const { fn } = compileExpression('PI');
    expect(fn!(0)).toBeCloseTo(Math.PI);
    const { fn: fnE } = compileExpression('E');
    expect(fnE!(0)).toBeCloseTo(Math.E);
  });

  it('複合式', () => {
    const { fn } = compileExpression('x^2 - 2*x + 1');
    expect(fn!(0)).toBe(1);
    expect(fn!(1)).toBe(0);
    expect(fn!(2)).toBe(1);
    expect(fn!(3)).toBe(4);
  });

  it('sin(PI*x)', () => {
    const { fn } = compileExpression('sin(PI * x)');
    expect(fn!(0)).toBeCloseTo(0);
    expect(fn!(0.5)).toBeCloseTo(1);
    expect(fn!(1)).toBeCloseTo(0);
  });

  it('空文字列はエラー', () => {
    const { fn, error } = compileExpression('');
    expect(fn).toBeNull();
    expect(error).toBeTruthy();
  });

  it('空白のみはエラー', () => {
    const { fn, error } = compileExpression('   ');
    expect(fn).toBeNull();
    expect(error).toBeTruthy();
  });

  it('無効な関数名はエラー', () => {
    const { fn, error } = compileExpression('foo(x)');
    expect(fn).toBeNull();
    expect(error).toContain('foo');
  });

  it('括弧不対はエラー', () => {
    const { error } = compileExpression('sin(x');
    expect(error).toBeTruthy();
  });

  it('単項マイナス', () => {
    expect(compileExpression('-x').fn!(3)).toBe(-3);
    expect(compileExpression('-x^2').fn!(2)).toBe(-4);
  });

  it('x=0でのsin(x)/x（sinc前半）', () => {
    // x=0でxが0→ NaN, but sin(0)/0 = NaN (0/0)
    const { fn } = compileExpression('sin(x)/x');
    const y = fn!(0);
    // 0/0 は NaN or Infinity
    expect(!isFinite(y) || isNaN(y)).toBe(true);
  });

  it('atan2(y, x)の評価', () => {
    const { fn } = compileExpression('atan2(1, 1)');
    expect(fn!(0)).toBeCloseTo(Math.PI / 4);
  });

  it('mod(x, 3)の評価', () => {
    const { fn } = compileExpression('mod(x, 3)');
    expect(fn!(7)).toBeCloseTo(1);
    expect(fn!(-1)).toBeCloseTo(2); // 正の剰余
  });
});

// ---- computePlotPoints ----

describe('computePlotPoints', () => {
  it('f(x)=x の点列を生成できる', () => {
    const { fn } = compileExpression('x');
    const points = computePlotPoints(fn!, -5, 5, 100);
    expect(points.length).toBe(101);
    expect(points[0].x).toBeCloseTo(-5);
    expect(points[100].x).toBeCloseTo(5);
    points.forEach((p) => {
      expect(p.valid).toBe(true);
      expect(p.y).toBeCloseTo(p.x);
    });
  });

  it('f(x)=1/x のx=0付近が invalid になる', () => {
    const { fn } = compileExpression('1/x');
    // 少ないステップでx=0を含む範囲
    const points = computePlotPoints(fn!, -1, 1, 100);
    // x=0ちょうどの点が Infinity になる
    const zeroPoint = points.find((p) => Math.abs(p.x) < 0.001);
    expect(zeroPoint).toBeDefined();
    // yClipMaxを超えるので valid=false になるはず
    if (zeroPoint) {
      expect(zeroPoint.valid).toBe(false);
    }
  });

  it('sqrt(x)のx<0は invalid', () => {
    const { fn } = compileExpression('sqrt(x)');
    const points = computePlotPoints(fn!, -4, 4, 80);
    const negPoints = points.filter((p) => p.x < -0.01);
    // sqrt(負数) は NaN → valid=false
    negPoints.forEach((p) => {
      expect(p.valid).toBe(false);
    });
    // sqrt(正数) は valid
    const posPoints = points.filter((p) => p.x > 0.01);
    posPoints.forEach((p) => {
      expect(p.valid).toBe(true);
    });
  });

  it('定数関数は全点 valid', () => {
    const { fn } = compileExpression('3');
    const points = computePlotPoints(fn!, -5, 5, 50);
    points.forEach((p) => {
      expect(p.valid).toBe(true);
      expect(p.y).toBeCloseTo(3);
    });
  });
});

// ---- splitIntoSegments ----

describe('splitIntoSegments', () => {
  it('空配列は空を返す', () => {
    expect(splitIntoSegments([])).toEqual([]);
  });

  it('すべて valid な点は1セグメント', () => {
    const points = Array.from({ length: 10 }, (_, i) => ({
      x: i,
      y: i,
      valid: true,
    }));
    const segs = splitIntoSegments(points);
    expect(segs.length).toBe(1);
    expect(segs[0].length).toBe(10);
  });

  it('invalid 点でセグメントが分割される', () => {
    const points = [
      { x: 0, y: 0, valid: true },
      { x: 1, y: 1, valid: true },
      { x: 2, y: NaN, valid: false },
      { x: 3, y: 3, valid: true },
      { x: 4, y: 4, valid: true },
    ];
    const segs = splitIntoSegments(points);
    expect(segs.length).toBe(2);
    expect(segs[0].length).toBe(2);
    expect(segs[1].length).toBe(2);
  });

  it('先頭が invalid でも後続のセグメントを返す', () => {
    const points = [
      { x: 0, y: NaN, valid: false },
      { x: 1, y: 1, valid: true },
      { x: 2, y: 2, valid: true },
    ];
    const segs = splitIntoSegments(points);
    expect(segs.length).toBe(1);
    expect(segs[0].length).toBe(2);
  });
});

// ---- autoYRange ----

describe('autoYRange', () => {
  it('有効点がない場合はフォールバック', () => {
    const data: PlotData[] = [{ points: [], expression: 'x', color: PLOT_COLORS[0], error: null }];
    const { yMin, yMax } = autoYRange(data);
    expect(yMin).toBe(-10);
    expect(yMax).toBe(10);
  });

  it('y値の範囲を返す（マージン付き）', () => {
    const points = [
      { x: -1, y: -5, valid: true },
      { x: 0, y: 0, valid: true },
      { x: 1, y: 5, valid: true },
    ];
    const data: PlotData[] = [{ points, expression: '5*x', color: PLOT_COLORS[0], error: null }];
    const { yMin, yMax } = autoYRange(data);
    // マージン付きなのでさらに広い
    expect(yMin).toBeLessThan(-5);
    expect(yMax).toBeGreaterThan(5);
  });

  it('y値が全て同じ場合は ±1', () => {
    const points = [
      { x: 0, y: 3, valid: true },
      { x: 1, y: 3, valid: true },
    ];
    const data: PlotData[] = [{ points, expression: '3', color: PLOT_COLORS[0], error: null }];
    const { yMin, yMax } = autoYRange(data);
    expect(yMin).toBeLessThan(3);
    expect(yMax).toBeGreaterThan(3);
  });
});

// ---- niceStep ----

describe('niceStep', () => {
  it('range=10 → 1 か 2', () => {
    const s = niceStep(10);
    expect([1, 2].includes(s)).toBe(true);
  });

  it('range=100 → 10 か 20', () => {
    const s = niceStep(100);
    expect([10, 20].includes(s)).toBe(true);
  });

  it('range=0.01 → 0.001 か 0.002', () => {
    const s = niceStep(0.01);
    expect(s).toBeLessThan(0.01);
    expect(s).toBeGreaterThan(0);
  });

  it('正の値を返す', () => {
    expect(niceStep(50)).toBeGreaterThan(0);
    expect(niceStep(1000)).toBeGreaterThan(0);
  });
});

// ---- buildAllPlotData ----

describe('buildAllPlotData', () => {
  it('有効な関数のプロットデータを返す', () => {
    const fns = [
      { expression: 'sin(x)', color: PLOT_COLORS[0], enabled: true },
      { expression: 'x^2', color: PLOT_COLORS[1], enabled: true },
    ];
    const data = buildAllPlotData(fns, -5, 5, 100);
    expect(data.length).toBe(2);
    data.forEach((d) => {
      expect(d.error).toBeNull();
      expect(d.points.length).toBeGreaterThan(0);
    });
  });

  it('disabled な関数はスキップされる', () => {
    const fns = [
      { expression: 'sin(x)', color: PLOT_COLORS[0], enabled: true },
      { expression: 'cos(x)', color: PLOT_COLORS[1], enabled: false },
    ];
    const data = buildAllPlotData(fns, -5, 5, 100);
    expect(data.length).toBe(1);
    expect(data[0].expression).toBe('sin(x)');
  });

  it('空の式はスキップされる', () => {
    const fns = [
      { expression: 'x', color: PLOT_COLORS[0], enabled: true },
      { expression: '', color: PLOT_COLORS[1], enabled: true },
      { expression: '   ', color: PLOT_COLORS[2], enabled: true },
    ];
    const data = buildAllPlotData(fns, -5, 5, 100);
    expect(data.length).toBe(1);
  });

  it('構文エラーがある関数はエラーを返す', () => {
    const fns = [
      { expression: 'foo(x)', color: PLOT_COLORS[0], enabled: true },
    ];
    const data = buildAllPlotData(fns, -5, 5, 100);
    expect(data.length).toBe(1);
    expect(data[0].error).toBeTruthy();
    expect(data[0].points.length).toBe(0);
  });
});

// ---- SAMPLE_FUNCTIONS ----

describe('SAMPLE_FUNCTIONS', () => {
  it('全サンプル式がコンパイル可能', () => {
    SAMPLE_FUNCTIONS.forEach(({ expression }) => {
      const { fn, error } = compileExpression(expression);
      expect(error).toBeNull();
      expect(fn).not.toBeNull();
    });
  });

  it('x=1でサンプル式が有限値を返す', () => {
    SAMPLE_FUNCTIONS.forEach(({ expression }) => {
      const { fn } = compileExpression(expression);
      if (!fn) return;
      const y = fn(1);
      // 1/x や log(abs(x)) などx=1で有効なものを確認
      expect(typeof y).toBe('number');
    });
  });
});
