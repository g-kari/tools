import { describe, it, expect } from 'vitest';
import {
  toDegrees,
  fromDegrees,
  calcTrigValues,
  calcInverseTrig,
  formatTrigValue,
  formatAngle,
  COMMON_ANGLES_DEG,
  COMMON_ANGLE_RAD_LABELS,
} from '../../app/utils/trig';

const EPSILON = 1e-8;

describe('toDegrees', () => {
  it('度 → 度はそのまま', () => {
    expect(toDegrees(90, 'deg')).toBe(90);
    expect(toDegrees(0, 'deg')).toBe(0);
    expect(toDegrees(360, 'deg')).toBe(360);
  });

  it('ラジアン → 度', () => {
    expect(toDegrees(Math.PI, 'rad')).toBeCloseTo(180, 8);
    expect(toDegrees(Math.PI / 2, 'rad')).toBeCloseTo(90, 8);
    expect(toDegrees(0, 'rad')).toBeCloseTo(0, 8);
    expect(toDegrees(2 * Math.PI, 'rad')).toBeCloseTo(360, 8);
  });

  it('グラジアン → 度', () => {
    expect(toDegrees(100, 'grad')).toBeCloseTo(90, 8);
    expect(toDegrees(200, 'grad')).toBeCloseTo(180, 8);
    expect(toDegrees(400, 'grad')).toBeCloseTo(360, 8);
  });

  it('回転 → 度', () => {
    expect(toDegrees(0.25, 'turn')).toBeCloseTo(90, 8);
    expect(toDegrees(0.5, 'turn')).toBeCloseTo(180, 8);
    expect(toDegrees(1, 'turn')).toBeCloseTo(360, 8);
  });
});

describe('fromDegrees', () => {
  it('度 → 度はそのまま', () => {
    expect(fromDegrees(180, 'deg')).toBe(180);
  });

  it('度 → ラジアン', () => {
    expect(fromDegrees(180, 'rad')).toBeCloseTo(Math.PI, 8);
    expect(fromDegrees(90, 'rad')).toBeCloseTo(Math.PI / 2, 8);
    expect(fromDegrees(0, 'rad')).toBeCloseTo(0, 8);
  });

  it('度 → グラジアン', () => {
    expect(fromDegrees(90, 'grad')).toBeCloseTo(100, 8);
    expect(fromDegrees(180, 'grad')).toBeCloseTo(200, 8);
    expect(fromDegrees(360, 'grad')).toBeCloseTo(400, 8);
  });

  it('度 → 回転', () => {
    expect(fromDegrees(90, 'turn')).toBeCloseTo(0.25, 8);
    expect(fromDegrees(180, 'turn')).toBeCloseTo(0.5, 8);
    expect(fromDegrees(360, 'turn')).toBeCloseTo(1, 8);
  });

  it('往復変換で元に戻る', () => {
    const units = ['deg', 'rad', 'grad', 'turn'] as const;
    const testValues = [0, 30, 45, 90, 180, 270, 360, -45, 720];
    for (const val of testValues) {
      for (const unit of units) {
        const converted = fromDegrees(val, unit);
        const back = toDegrees(converted, unit);
        expect(back).toBeCloseTo(val, 8);
      }
    }
  });
});

describe('calcTrigValues', () => {
  it('0度の三角関数値', () => {
    const v = calcTrigValues(0);
    expect(v.sin).toBeCloseTo(0, 8);
    expect(v.cos).toBeCloseTo(1, 8);
    expect(v.tan).toBeCloseTo(0, 8);
    expect(v.cot).toBeNull(); // cot(0) = cos/sin = 1/0 → 未定義
    expect(v.sec).toBeCloseTo(1, 8);
    expect(v.csc).toBeNull(); // csc(0) = 1/sin(0) → 未定義
  });

  it('30度の三角関数値', () => {
    const v = calcTrigValues(30);
    expect(v.sin).toBeCloseTo(0.5, 8);
    expect(v.cos).toBeCloseTo(Math.sqrt(3) / 2, 8);
    expect(v.tan).toBeCloseTo(1 / Math.sqrt(3), 8);
  });

  it('45度の三角関数値', () => {
    const v = calcTrigValues(45);
    expect(v.sin).toBeCloseTo(Math.SQRT2 / 2, 8);
    expect(v.cos).toBeCloseTo(Math.SQRT2 / 2, 8);
    expect(v.tan).toBeCloseTo(1, 8);
    expect(v.cot).toBeCloseTo(1, 8);
  });

  it('60度の三角関数値', () => {
    const v = calcTrigValues(60);
    expect(v.sin).toBeCloseTo(Math.sqrt(3) / 2, 8);
    expect(v.cos).toBeCloseTo(0.5, 8);
    expect(v.tan).toBeCloseTo(Math.sqrt(3), 8);
  });

  it('90度では tan・sec・cot が未定義になる', () => {
    const v = calcTrigValues(90);
    expect(v.sin).toBeCloseTo(1, 8);
    expect(v.cos).toBeCloseTo(0, 8);
    expect(v.tan).toBeNull();
    expect(v.sec).toBeNull();
    expect(v.cot).toBeCloseTo(0, 8);
  });

  it('180度の三角関数値', () => {
    const v = calcTrigValues(180);
    expect(v.sin).toBeCloseTo(0, 8);
    expect(v.cos).toBeCloseTo(-1, 8);
    expect(v.tan).toBeCloseTo(0, 8);
    expect(v.cot).toBeNull(); // sin(180) ≈ 0
    expect(v.sec).toBeCloseTo(-1, 8);
    expect(v.csc).toBeNull();
  });

  it('270度では tan・sec・cot が未定義になる', () => {
    const v = calcTrigValues(270);
    expect(v.sin).toBeCloseTo(-1, 8);
    expect(v.cos).toBeCloseTo(0, 6);
    expect(v.tan).toBeNull();
    expect(v.sec).toBeNull();
  });

  it('負の角度でも計算できる', () => {
    const v = calcTrigValues(-45);
    expect(v.sin).toBeCloseTo(-Math.SQRT2 / 2, 8);
    expect(v.cos).toBeCloseTo(Math.SQRT2 / 2, 8);
    expect(v.tan).toBeCloseTo(-1, 8);
  });
});

describe('calcInverseTrig', () => {
  it('arcsin の計算', () => {
    expect(calcInverseTrig('asin', 0)).toBeCloseTo(0, 8);
    expect(calcInverseTrig('asin', 0.5)).toBeCloseTo(30, 8);
    expect(calcInverseTrig('asin', 1)).toBeCloseTo(90, 8);
    expect(calcInverseTrig('asin', -1)).toBeCloseTo(-90, 8);
  });

  it('arcsin は範囲外で null を返す', () => {
    expect(calcInverseTrig('asin', 1.1)).toBeNull();
    expect(calcInverseTrig('asin', -1.1)).toBeNull();
  });

  it('arccos の計算', () => {
    expect(calcInverseTrig('acos', 1)).toBeCloseTo(0, 8);
    expect(calcInverseTrig('acos', 0.5)).toBeCloseTo(60, 8);
    expect(calcInverseTrig('acos', 0)).toBeCloseTo(90, 8);
    expect(calcInverseTrig('acos', -1)).toBeCloseTo(180, 8);
  });

  it('arccos は範囲外で null を返す', () => {
    expect(calcInverseTrig('acos', 1.01)).toBeNull();
    expect(calcInverseTrig('acos', -1.01)).toBeNull();
  });

  it('arctan の計算', () => {
    expect(calcInverseTrig('atan', 0)).toBeCloseTo(0, 8);
    expect(calcInverseTrig('atan', 1)).toBeCloseTo(45, 8);
    expect(calcInverseTrig('atan', -1)).toBeCloseTo(-45, 8);
    expect(calcInverseTrig('atan', Math.sqrt(3))).toBeCloseTo(60, 8);
  });

  it('atan2 の計算', () => {
    // atan2(y, x) で第1引数が y, 第2引数が x
    expect(calcInverseTrig('atan2', 1, 1)).toBeCloseTo(45, 8);
    expect(calcInverseTrig('atan2', 0, 1)).toBeCloseTo(0, 8);
    expect(calcInverseTrig('atan2', 1, 0)).toBeCloseTo(90, 8);
  });

  it('atan2 で y が未定義なら null', () => {
    expect(calcInverseTrig('atan2', 1, undefined)).toBeNull();
  });
});

describe('formatTrigValue', () => {
  it('null を「未定義」と表示', () => {
    expect(formatTrigValue(null)).toBe('未定義');
  });

  it('ゼロに近い値を「0」と表示', () => {
    expect(formatTrigValue(0)).toBe('0');
    expect(formatTrigValue(1e-15)).toBe('0');
  });

  it('通常の値をフォーマット', () => {
    expect(formatTrigValue(0.5)).toBe('0.5');
    expect(formatTrigValue(1)).toBe('1');
    expect(formatTrigValue(-1)).toBe('-1');
  });

  it('Infinity を「∞」と表示', () => {
    expect(formatTrigValue(Infinity)).toBe('∞');
    expect(formatTrigValue(-Infinity)).toBe('∞');
  });
});

describe('formatAngle', () => {
  it('0 を「0」と表示', () => {
    expect(formatAngle(0)).toBe('0');
  });

  it('整数に近い値はそのまま', () => {
    expect(formatAngle(45)).toBe('45');
    expect(formatAngle(180)).toBe('180');
  });

  it('小数の場合は末尾ゼロを除去', () => {
    const result = formatAngle(0.25);
    expect(result).toBe('0.25');
  });
});

describe('COMMON_ANGLES_DEG', () => {
  it('よく使う角度が含まれている', () => {
    expect(COMMON_ANGLES_DEG).toContain(0);
    expect(COMMON_ANGLES_DEG).toContain(30);
    expect(COMMON_ANGLES_DEG).toContain(45);
    expect(COMMON_ANGLES_DEG).toContain(60);
    expect(COMMON_ANGLES_DEG).toContain(90);
    expect(COMMON_ANGLES_DEG).toContain(180);
    expect(COMMON_ANGLES_DEG).toContain(360);
  });
});

describe('COMMON_ANGLE_RAD_LABELS', () => {
  it('よく使う角度のラベルが定義されている', () => {
    expect(COMMON_ANGLE_RAD_LABELS[0]).toBe('0');
    expect(COMMON_ANGLE_RAD_LABELS[90]).toBe('π/2');
    expect(COMMON_ANGLE_RAD_LABELS[180]).toBe('π');
    expect(COMMON_ANGLE_RAD_LABELS[360]).toBe('2π');
  });
});
