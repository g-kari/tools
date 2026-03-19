import { describe, it, expect } from 'vitest';
import {
  generateFibonacci,
  generateLucas,
  generatePrimes,
  generateTriangular,
  generateSquare,
  generateCube,
  generatePowersOf2,
  generateCatalan,
  generatePadovan,
  generateArithmetic,
  generateGeometric,
  generateCollatz,
  generateSequence,
} from '../../app/utils/sequences';

describe('数列ジェネレーター', () => {
  describe('generateFibonacci', () => {
    it('最初の10項を正しく生成する', () => {
      const result = generateFibonacci(10);
      expect(result.map(String)).toEqual(['0', '1', '1', '2', '3', '5', '8', '13', '21', '34']);
    });

    it('count=0 で空配列を返す', () => {
      expect(generateFibonacci(0)).toEqual([]);
    });

    it('count=1 で [0] を返す', () => {
      expect(generateFibonacci(1).map(String)).toEqual(['0']);
    });

    it('大きな値でも正確に計算する (BigInt)', () => {
      const result = generateFibonacci(20);
      expect(result[19].toString()).toBe('4181');
    });
  });

  describe('generateLucas', () => {
    it('最初の10項を正しく生成する', () => {
      const result = generateLucas(10);
      expect(result.map(String)).toEqual(['2', '1', '3', '4', '7', '11', '18', '29', '47', '76']);
    });

    it('count=1 で [2] を返す', () => {
      expect(generateLucas(1).map(String)).toEqual(['2']);
    });
  });

  describe('generatePrimes', () => {
    it('最初の10個の素数を生成する', () => {
      const result = generatePrimes(10);
      expect(result).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
    });

    it('count=1 で [2] を返す', () => {
      expect(generatePrimes(1)).toEqual([2]);
    });

    it('count=0 で空配列を返す', () => {
      expect(generatePrimes(0)).toEqual([]);
    });

    it('素数のみを含む', () => {
      const result = generatePrimes(20);
      for (const p of result) {
        if (p < 2) {
          expect(false).toBe(true);
        }
        let isPrime = true;
        for (let i = 2; i * i <= p; i++) {
          if (p % i === 0) {
            isPrime = false;
            break;
          }
        }
        expect(isPrime).toBe(true);
      }
    });
  });

  describe('generateTriangular', () => {
    it('最初の10個の三角数を生成する', () => {
      const result = generateTriangular(10);
      expect(result).toEqual([1, 3, 6, 10, 15, 21, 28, 36, 45, 55]);
    });
  });

  describe('generateSquare', () => {
    it('最初の10個の平方数を生成する', () => {
      const result = generateSquare(10);
      expect(result).toEqual([1, 4, 9, 16, 25, 36, 49, 64, 81, 100]);
    });
  });

  describe('generateCube', () => {
    it('最初の5個の立方数を生成する', () => {
      const result = generateCube(5);
      expect(result).toEqual([1, 8, 27, 64, 125]);
    });
  });

  describe('generatePowersOf2', () => {
    it('最初の10個の2の冪乗を生成する', () => {
      const result = generatePowersOf2(10);
      expect(result.map(String)).toEqual(['1', '2', '4', '8', '16', '32', '64', '128', '256', '512']);
    });
  });

  describe('generateCatalan', () => {
    it('最初の10個のカタラン数を生成する', () => {
      const result = generateCatalan(10);
      expect(result.map(String)).toEqual(['1', '1', '2', '5', '14', '42', '132', '429', '1430', '4862']);
    });

    it('count=0 で空配列を返す', () => {
      expect(generateCatalan(0)).toEqual([]);
    });
  });

  describe('generatePadovan', () => {
    it('最初の10項を正しく生成する', () => {
      const result = generatePadovan(10);
      expect(result.map(String)).toEqual(['1', '1', '1', '2', '2', '3', '4', '5', '7', '9']);
    });
  });

  describe('generateArithmetic', () => {
    it('初項1・公差3の等差数列 5項', () => {
      const result = generateArithmetic(1, 3, 5);
      expect(result).toEqual([1, 4, 7, 10, 13]);
    });

    it('初項0・公差1の等差数列 5項', () => {
      const result = generateArithmetic(0, 1, 5);
      expect(result).toEqual([0, 1, 2, 3, 4]);
    });

    it('負の公差', () => {
      const result = generateArithmetic(10, -3, 5);
      expect(result).toEqual([10, 7, 4, 1, -2]);
    });
  });

  describe('generateGeometric', () => {
    it('初項1・公比2の等比数列 8項', () => {
      const result = generateGeometric(1, 2, 8);
      expect(result).toEqual([1, 2, 4, 8, 16, 32, 64, 128]);
    });

    it('初項3・公比3の等比数列 4項', () => {
      const result = generateGeometric(3, 3, 4);
      expect(result).toEqual([3, 9, 27, 81]);
    });
  });

  describe('generateCollatz', () => {
    it('6から開始すると 6,3,10,5,16,8,4,2,1 を返す', () => {
      const result = generateCollatz(6);
      expect(result.map(String)).toEqual(['6', '3', '10', '5', '16', '8', '4', '2', '1']);
    });

    it('1から開始すると [1] を返す', () => {
      const result = generateCollatz(1);
      expect(result.map(String)).toEqual(['1']);
    });

    it('最終要素が1である', () => {
      const result = generateCollatz(27);
      expect(result[result.length - 1].toString()).toBe('1');
    });

    it('無効な入力 (0以下) で空配列を返す', () => {
      expect(generateCollatz(0)).toEqual([]);
      expect(generateCollatz(-5)).toEqual([]);
    });
  });

  describe('generateSequence (統合関数)', () => {
    it('fibonacci を正しく呼び出す', () => {
      const result = generateSequence('fibonacci', 5);
      expect(result).toEqual(['0', '1', '1', '2', '3']);
    });

    it('arithmetic でパラメーターを使用する', () => {
      const result = generateSequence('arithmetic', 5, [10, 5]);
      expect(result).toEqual(['10', '15', '20', '25', '30']);
    });

    it('geometric でパラメーターを使用する', () => {
      const result = generateSequence('geometric', 4, [2, 3]);
      expect(result).toEqual(['2', '6', '18', '54']);
    });

    it('primes を正しく呼び出す', () => {
      const result = generateSequence('primes', 5);
      expect(result).toEqual(['2', '3', '5', '7', '11']);
    });

    it('collatz でパラメーターを使用する', () => {
      const result = generateSequence('collatz', 10000, [6]);
      expect(result).toEqual(['6', '3', '10', '5', '16', '8', '4', '2', '1']);
    });
  });
});
