import { describe, expect, it } from 'vite-plus/test';
import {
  analyzeFloat32,
  analyzeFloat64,
  bitsToNumber,
  hexToNumber,
  getFormula,
  getSpecialValueLabel,
} from '../../app/utils/ieee754';

describe('analyzeFloat32', () => {
  it('1.0 を正しく解析する', () => {
    const r = analyzeFloat32(1.0);
    expect(r.signBit).toBe(0);
    expect(r.exponentRaw).toBe(127); // 1 + bias(127) = 128? no, 2^0 * 1.0 → exp=127
    expect(r.exponentActual).toBe(0);
    expect(r.mantissaFraction).toBe(0);
    expect(r.isNaN).toBe(false);
    expect(r.isInfinity).toBe(false);
    expect(r.isZero).toBe(false);
    expect(r.isSubnormal).toBe(false);
    expect(r.hexRepresentation).toBe('3F800000');
    expect(r.precision).toBe('float32');
  });

  it('-1.0 を正しく解析する', () => {
    const r = analyzeFloat32(-1.0);
    expect(r.signBit).toBe(1);
    expect(r.exponentActual).toBe(0);
    expect(r.mantissaFraction).toBe(0);
    expect(r.hexRepresentation).toBe('BF800000');
  });

  it('0 を正しく解析する', () => {
    const r = analyzeFloat32(0);
    expect(r.isZero).toBe(true);
    expect(r.isNegativeZero).toBe(false);
    expect(r.signBit).toBe(0);
    expect(r.exponentRaw).toBe(0);
    expect(r.hexRepresentation).toBe('00000000');
  });

  it('-0 を正しく解析する', () => {
    const r = analyzeFloat32(-0);
    expect(r.isZero).toBe(true);
    expect(r.isNegativeZero).toBe(true);
    expect(r.signBit).toBe(1);
    expect(r.hexRepresentation).toBe('80000000');
  });

  it('+Infinity を正しく解析する', () => {
    const r = analyzeFloat32(Infinity);
    expect(r.isInfinity).toBe(true);
    expect(r.isNaN).toBe(false);
    expect(r.signBit).toBe(0);
    expect(r.exponentRaw).toBe(0xff);
    expect(r.hexRepresentation).toBe('7F800000');
  });

  it('-Infinity を正しく解析する', () => {
    const r = analyzeFloat32(-Infinity);
    expect(r.isInfinity).toBe(true);
    expect(r.signBit).toBe(1);
    expect(r.hexRepresentation).toBe('FF800000');
  });

  it('NaN を正しく解析する', () => {
    const r = analyzeFloat32(NaN);
    expect(r.isNaN).toBe(true);
    expect(r.exponentRaw).toBe(0xff);
  });

  it('2.0 を正しく解析する', () => {
    const r = analyzeFloat32(2.0);
    expect(r.signBit).toBe(0);
    expect(r.exponentActual).toBe(1); // 2^1 * 1.0
    expect(r.mantissaFraction).toBe(0);
    expect(r.hexRepresentation).toBe('40000000');
  });

  it('ビット配列の長さを確認する', () => {
    const r = analyzeFloat32(1.0);
    expect(r.exponentBits).toHaveLength(8);
    expect(r.mantissaBits).toHaveLength(23);
    expect(r.binaryRepresentation).toHaveLength(32);
    expect(r.hexRepresentation).toHaveLength(8);
  });

  it('非正規化数を正しく検出する', () => {
    // float32 の最小非正規化数
    const r = analyzeFloat32(1.4e-45);
    expect(r.isSubnormal).toBe(true);
    expect(r.exponentRaw).toBe(0);
  });
});

describe('analyzeFloat64', () => {
  it('1.0 を正しく解析する', () => {
    const r = analyzeFloat64(1.0);
    expect(r.signBit).toBe(0);
    expect(r.exponentRaw).toBe(1023);
    expect(r.exponentActual).toBe(0);
    expect(r.mantissaFraction).toBe(0);
    expect(r.isNaN).toBe(false);
    expect(r.isZero).toBe(false);
    expect(r.hexRepresentation).toBe('3FF0000000000000');
    expect(r.precision).toBe('float64');
  });

  it('ビット配列の長さを確認する', () => {
    const r = analyzeFloat64(1.0);
    expect(r.exponentBits).toHaveLength(11);
    expect(r.mantissaBits).toHaveLength(52);
    expect(r.binaryRepresentation).toHaveLength(64);
    expect(r.hexRepresentation).toHaveLength(16);
  });

  it('-0 を正しく検出する', () => {
    const r = analyzeFloat64(-0);
    expect(r.isNegativeZero).toBe(true);
    expect(r.isZero).toBe(true);
    expect(r.hexRepresentation).toBe('8000000000000000');
  });

  it('0.1 + 0.2 の丸め誤差を確認できる', () => {
    const r = analyzeFloat64(0.1 + 0.2);
    // 0.1 + 0.2 は 0.3 と完全には一致しない
    expect(r.decimalValue).not.toBe(0.3);
    expect(r.isNaN).toBe(false);
    expect(r.isZero).toBe(false);
  });

  it('+Infinity を正しく解析する', () => {
    const r = analyzeFloat64(Infinity);
    expect(r.isInfinity).toBe(true);
    expect(r.exponentRaw).toBe(0x7ff);
    expect(r.hexRepresentation).toBe('7FF0000000000000');
  });
});

describe('bitsToNumber', () => {
  it('float32 のゼロを復元できる', () => {
    const bits = new Array(32).fill(0);
    expect(bitsToNumber(bits, 'float32')).toBe(0);
  });

  it('float32 の 1.0 を復元できる', () => {
    // 1.0 = 0 01111111 00000000000000000000000
    const bits = [
      0,
      0, 1, 1, 1, 1, 1, 1, 1,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    expect(bitsToNumber(bits, 'float32')).toBe(1.0);
  });

  it('float64 のゼロを復元できる', () => {
    const bits = new Array(64).fill(0);
    expect(bitsToNumber(bits, 'float64')).toBe(0);
  });

  it('analyzeFloat32 と bitsToNumber が双方向変換できる', () => {
    const original = 3.14;
    const r = analyzeFloat32(original);
    const reconstructedBits = [r.signBit, ...r.exponentBits, ...r.mantissaBits];
    const restored = bitsToNumber(reconstructedBits, 'float32');
    // float32 に変換されるので元の float64 3.14 と完全一致はしない
    expect(Math.abs(restored - original)).toBeLessThan(0.001);
  });
});

describe('hexToNumber', () => {
  it('float32: 3F800000 → 1.0', () => {
    expect(hexToNumber('3F800000', 'float32')).toBe(1.0);
  });

  it('float32: 40000000 → 2.0', () => {
    expect(hexToNumber('40000000', 'float32')).toBe(2.0);
  });

  it('float32: 00000000 → 0', () => {
    expect(hexToNumber('00000000', 'float32')).toBe(0);
  });

  it('float32: 7F800000 → Infinity', () => {
    expect(hexToNumber('7F800000', 'float32')).toBe(Infinity);
  });

  it('float64: 3FF0000000000000 → 1.0', () => {
    expect(hexToNumber('3FF0000000000000', 'float64')).toBe(1.0);
  });

  it('0x プレフィックスを無視する', () => {
    expect(hexToNumber('0x3F800000', 'float32')).toBe(1.0);
  });

  it('小文字の hex を受け入れる', () => {
    expect(hexToNumber('3f800000', 'float32')).toBe(1.0);
  });
});

describe('getFormula', () => {
  it('NaN の場合 "NaN" を返す', () => {
    const r = analyzeFloat32(NaN);
    expect(getFormula(r)).toBe('NaN');
  });

  it('+Infinity の場合 "+∞" を返す', () => {
    const r = analyzeFloat32(Infinity);
    expect(getFormula(r)).toBe('+∞');
  });

  it('-Infinity の場合 "-∞" を返す', () => {
    const r = analyzeFloat32(-Infinity);
    expect(getFormula(r)).toBe('-∞');
  });

  it('0 の場合 "0" を返す', () => {
    const r = analyzeFloat32(0);
    expect(getFormula(r)).toBe('0');
  });

  it('通常の数値で数式を含む', () => {
    const r = analyzeFloat32(1.0);
    const formula = getFormula(r);
    expect(formula).toContain('×');
    expect(formula).toContain('2^');
  });
});

describe('getSpecialValueLabel', () => {
  it('NaN を検出する', () => {
    const r = analyzeFloat32(NaN);
    expect(getSpecialValueLabel(r)).toContain('NaN');
  });

  it('+Infinity を検出する', () => {
    const r = analyzeFloat32(Infinity);
    const label = getSpecialValueLabel(r);
    expect(label).toContain('Infinity');
  });

  it('-Infinity を検出する', () => {
    const r = analyzeFloat32(-Infinity);
    const label = getSpecialValueLabel(r);
    expect(label).toContain('負の無限大');
  });

  it('-0 を検出する', () => {
    const r = analyzeFloat32(-0);
    expect(getSpecialValueLabel(r)).toContain('-0');
  });

  it('+0 を検出する', () => {
    const r = analyzeFloat32(0);
    expect(getSpecialValueLabel(r)).toContain('+0');
  });

  it('通常の数値では null を返す', () => {
    const r = analyzeFloat32(3.14);
    expect(getSpecialValueLabel(r)).toBeNull();
  });

  it('非正規化数を検出する', () => {
    const r = analyzeFloat32(1.4e-45);
    if (r.isSubnormal) {
      expect(getSpecialValueLabel(r)).toContain('非正規化数');
    }
  });
});
