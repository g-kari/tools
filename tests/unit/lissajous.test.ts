import { describe, it, expect } from 'vitest';
import {
  degToRad,
  calcLissajousPoint,
  generateLissajousPoints,
  gcd,
  lcm,
  formatFreqRatio,
  describeLissajous,
} from '../../app/utils/lissajous';

describe('リサジュー図形ユーティリティ', () => {
  describe('degToRad', () => {
    it('0度は0ラジアン', () => {
      expect(degToRad(0)).toBeCloseTo(0);
    });

    it('90度はπ/2ラジアン', () => {
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    });

    it('180度はπラジアン', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI);
    });

    it('360度は2πラジアン', () => {
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
    });

    it('負の値も変換できる', () => {
      expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe('gcd', () => {
    it('gcd(12, 8) = 4', () => {
      expect(gcd(12, 8)).toBe(4);
    });

    it('gcd(7, 3) = 1 (互いに素)', () => {
      expect(gcd(7, 3)).toBe(1);
    });

    it('gcd(6, 6) = 6', () => {
      expect(gcd(6, 6)).toBe(6);
    });

    it('gcd(1, 1) = 1', () => {
      expect(gcd(1, 1)).toBe(1);
    });

    it('gcd(10, 5) = 5', () => {
      expect(gcd(10, 5)).toBe(5);
    });

    it('負の数でも正しく動作する', () => {
      expect(gcd(-12, 8)).toBe(4);
    });
  });

  describe('lcm', () => {
    it('lcm(4, 6) = 12', () => {
      expect(lcm(4, 6)).toBe(12);
    });

    it('lcm(3, 5) = 15', () => {
      expect(lcm(3, 5)).toBe(15);
    });

    it('lcm(1, 1) = 1', () => {
      expect(lcm(1, 1)).toBe(1);
    });

    it('lcm(7, 7) = 7', () => {
      expect(lcm(7, 7)).toBe(7);
    });

    it('lcm(2, 3) = 6', () => {
      expect(lcm(2, 3)).toBe(6);
    });
  });

  describe('calcLissajousPoint', () => {
    const baseParams = { freqX: 1, freqY: 1, phaseDeg: 0, amplitude: 1 };

    it('t=0, 位相差0 のとき x=0, y=0', () => {
      const pt = calcLissajousPoint(0, baseParams);
      expect(pt.x).toBeCloseTo(0);
      expect(pt.y).toBeCloseTo(0);
    });

    it('t=π/2, freqX=1, freqY=1, 位相差0 のとき x=1, y=1 (直線)', () => {
      const pt = calcLissajousPoint(Math.PI / 2, baseParams);
      expect(pt.x).toBeCloseTo(1);
      expect(pt.y).toBeCloseTo(1);
    });

    it('位相差90°の場合に円を描く (freqX=freqY=1)', () => {
      const params = { freqX: 1, freqY: 1, phaseDeg: 90, amplitude: 1 };
      // 円の場合 x^2 + y^2 = amplitude^2 が常に成り立つ
      for (let i = 0; i < 10; i++) {
        const t = (i / 10) * 2 * Math.PI;
        const pt = calcLissajousPoint(t, params);
        expect(pt.x * pt.x + pt.y * pt.y).toBeCloseTo(1, 5);
      }
    });

    it('振幅が正しく反映される', () => {
      const params = { freqX: 1, freqY: 1, phaseDeg: 90, amplitude: 0.5 };
      for (let i = 0; i < 10; i++) {
        const t = (i / 10) * 2 * Math.PI;
        const pt = calcLissajousPoint(t, params);
        expect(Math.abs(pt.x)).toBeLessThanOrEqual(0.5 + 1e-9);
        expect(Math.abs(pt.y)).toBeLessThanOrEqual(0.5 + 1e-9);
      }
    });

    it('振幅0のとき常に原点', () => {
      const params = { freqX: 3, freqY: 2, phaseDeg: 45, amplitude: 0 };
      const pt = calcLissajousPoint(1.23, params);
      expect(pt.x).toBeCloseTo(0);
      expect(pt.y).toBeCloseTo(0);
    });

    it('周波数比3:2で正しい点を生成する', () => {
      const params = { freqX: 3, freqY: 2, phaseDeg: 90, amplitude: 1 };
      const pt = calcLissajousPoint(0, params);
      // t=0: x = sin(3*0 + π/2) = sin(π/2) = 1, y = sin(2*0) = 0
      expect(pt.x).toBeCloseTo(1);
      expect(pt.y).toBeCloseTo(0);
    });
  });

  describe('generateLissajousPoints', () => {
    it('指定ステップ数+1の点を返す', () => {
      const params = { freqX: 1, freqY: 1, phaseDeg: 0, amplitude: 1 };
      const points = generateLissajousPoints(params, 100);
      expect(points).toHaveLength(101);
    });

    it('デフォルトのステップ数で動作する', () => {
      const params = { freqX: 1, freqY: 2, phaseDeg: 90, amplitude: 1 };
      const points = generateLissajousPoints(params);
      expect(points).toHaveLength(2001);
    });

    it('全点が振幅の範囲内に収まる', () => {
      const amplitude = 0.85;
      const params = { freqX: 5, freqY: 4, phaseDeg: 45, amplitude };
      const points = generateLissajousPoints(params, 500);
      points.forEach((pt) => {
        expect(Math.abs(pt.x)).toBeLessThanOrEqual(amplitude + 1e-9);
        expect(Math.abs(pt.y)).toBeLessThanOrEqual(amplitude + 1e-9);
      });
    });

    it('最初と最後の点が近い (閉じた曲線)', () => {
      const params = { freqX: 3, freqY: 2, phaseDeg: 0, amplitude: 1 };
      const points = generateLissajousPoints(params, 2000);
      const first = points[0];
      const last = points[points.length - 1];
      expect(Math.abs(first.x - last.x)).toBeLessThan(0.01);
      expect(Math.abs(first.y - last.y)).toBeLessThan(0.01);
    });
  });

  describe('formatFreqRatio', () => {
    it('6:4 → "3:2" に簡約される', () => {
      expect(formatFreqRatio(6, 4)).toBe('3:2');
    });

    it('1:1 → "1:1"', () => {
      expect(formatFreqRatio(1, 1)).toBe('1:1');
    });

    it('3:2 は変わらない', () => {
      expect(formatFreqRatio(3, 2)).toBe('3:2');
    });

    it('5:5 → "1:1"', () => {
      expect(formatFreqRatio(5, 5)).toBe('1:1');
    });

    it('10:4 → "5:2"', () => {
      expect(formatFreqRatio(10, 4)).toBe('5:2');
    });
  });

  describe('describeLissajous', () => {
    it('freqX=freqY, 位相差0° → 斜線', () => {
      expect(describeLissajous(1, 1, 0)).toBe('斜線（直線）');
    });

    it('freqX=freqY, 位相差180° → 斜線', () => {
      expect(describeLissajous(2, 2, 180)).toBe('斜線（直線）');
    });

    it('freqX=freqY, 位相差90° → 円', () => {
      expect(describeLissajous(1, 1, 90)).toBe('円');
    });

    it('freqX=freqY, 位相差270° → 円', () => {
      expect(describeLissajous(1, 1, 270)).toBe('円');
    });

    it('freqX=freqY, 位相差45° → 楕円', () => {
      expect(describeLissajous(1, 1, 45)).toBe('楕円');
    });

    it('freqX≠freqY → リサジュー図形 + 周波数比', () => {
      expect(describeLissajous(3, 2, 90)).toBe('リサジュー図形 (3:2)');
    });

    it('freqX≠freqY で簡約される', () => {
      expect(describeLissajous(6, 4, 45)).toBe('リサジュー図形 (3:2)');
    });
  });
});
