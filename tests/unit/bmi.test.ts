import { describe, it, expect } from 'vitest';
import {
  calcBmi,
  getBmiCategory,
  calcIdealWeight,
  calcWeightDiff,
} from '../../app/utils/bmi';

describe('BMI計算ユーティリティ', () => {
  describe('calcBmi', () => {
    it('正常な身長・体重でBMIを計算できる', () => {
      // 170cm, 65kg => 65 / (1.7 * 1.7) = 22.49...
      const bmi = calcBmi(65, 170);
      expect(bmi).toBeCloseTo(22.49, 1);
    });

    it('BMI 18.5未満（低体重）を計算できる', () => {
      // 170cm, 50kg => 50 / (1.7 * 1.7) = 17.30...
      const bmi = calcBmi(50, 170);
      expect(bmi).toBeCloseTo(17.3, 1);
    });

    it('BMI 25以上（過体重）を計算できる', () => {
      // 170cm, 75kg => 75 / (1.7 * 1.7) = 25.95...
      const bmi = calcBmi(75, 170);
      expect(bmi).toBeCloseTo(25.95, 1);
    });

    it('身長0のとき NaN を返す', () => {
      expect(calcBmi(65, 0)).toBeNaN();
    });

    it('体重0のとき NaN を返す', () => {
      expect(calcBmi(0, 170)).toBeNaN();
    });

    it('負の身長のとき NaN を返す', () => {
      expect(calcBmi(65, -170)).toBeNaN();
    });

    it('負の体重のとき NaN を返す', () => {
      expect(calcBmi(-65, 170)).toBeNaN();
    });
  });

  describe('getBmiCategory', () => {
    it('BMI < 18.5 は低体重（underweight）', () => {
      expect(getBmiCategory(17)).toBe('underweight');
      expect(getBmiCategory(18.4)).toBe('underweight');
    });

    it('18.5 <= BMI < 25 は普通体重（normal）', () => {
      expect(getBmiCategory(18.5)).toBe('normal');
      expect(getBmiCategory(22)).toBe('normal');
      expect(getBmiCategory(24.9)).toBe('normal');
    });

    it('25 <= BMI < 30 は前肥満（overweight）', () => {
      expect(getBmiCategory(25)).toBe('overweight');
      expect(getBmiCategory(27)).toBe('overweight');
      expect(getBmiCategory(29.9)).toBe('overweight');
    });

    it('30 <= BMI < 35 は肥満1度（obese1）', () => {
      expect(getBmiCategory(30)).toBe('obese1');
      expect(getBmiCategory(34.9)).toBe('obese1');
    });

    it('35 <= BMI < 40 は肥満2度（obese2）', () => {
      expect(getBmiCategory(35)).toBe('obese2');
      expect(getBmiCategory(39.9)).toBe('obese2');
    });

    it('BMI >= 40 は肥満3度以上（obese3）', () => {
      expect(getBmiCategory(40)).toBe('obese3');
      expect(getBmiCategory(50)).toBe('obese3');
    });

    it('NaN は低体重（underweight）として扱う', () => {
      expect(getBmiCategory(NaN)).toBe('underweight');
    });

    it('Infinity は低体重（underweight）として扱う', () => {
      expect(getBmiCategory(Infinity)).toBe('underweight');
    });
  });

  describe('calcIdealWeight', () => {
    it('BMI=22を基準に標準体重を計算できる', () => {
      // 170cm => 22 * 1.7 * 1.7 = 63.58kg
      const ideal = calcIdealWeight(170);
      expect(ideal).toBeCloseTo(63.58, 1);
    });

    it('身長0のとき NaN を返す', () => {
      expect(calcIdealWeight(0)).toBeNaN();
    });

    it('負の身長のとき NaN を返す', () => {
      expect(calcIdealWeight(-170)).toBeNaN();
    });
  });

  describe('calcWeightDiff', () => {
    it('標準体重より重い場合は正の値を返す', () => {
      // 170cm の標準体重は約63.58kg, 70kgで計算
      const diff = calcWeightDiff(70, 170);
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeCloseTo(70 - 63.58, 1);
    });

    it('標準体重より軽い場合は負の値を返す', () => {
      const diff = calcWeightDiff(55, 170);
      expect(diff).toBeLessThan(0);
    });

    it('標準体重と同じ場合はほぼ0を返す', () => {
      // 170cm の標準体重 = 22 * 1.7 * 1.7 = 63.58
      const ideal = calcIdealWeight(170);
      const diff = calcWeightDiff(ideal, 170);
      expect(diff).toBeCloseTo(0, 5);
    });
  });
});
