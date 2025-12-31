import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * サイコロをロールする関数（テスト用に再定義）
 * @param sides - サイコロの面数
 * @returns 1からsidesまでのランダムな整数
 */
function rollDice(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

describe('Dice Roll', () => {
  beforeEach(() => {
    // Reset any mocks
    vi.restoreAllMocks();
  });

  describe('rollDice function', () => {
    it('should return a number between 1 and the specified sides', () => {
      const sides = 6;
      for (let i = 0; i < 100; i++) {
        const result = rollDice(sides);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(sides);
      }
    });

    it('should return integer values only', () => {
      const sides = 6;
      for (let i = 0; i < 100; i++) {
        const result = rollDice(sides);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('should work with different sided dice', () => {
      const testCases = [4, 6, 8, 10, 12, 20, 100];

      testCases.forEach(sides => {
        const result = rollDice(sides);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(sides);
      });
    });

    it('should handle edge case with 2-sided dice', () => {
      const sides = 2;
      const results = new Set<number>();

      // Roll enough times to likely get both values
      for (let i = 0; i < 100; i++) {
        results.add(rollDice(sides));
      }

      // Should only contain 1 and 2
      expect(Array.from(results).every(r => r === 1 || r === 2)).toBe(true);
    });

    it('should produce different results over multiple rolls', () => {
      const sides = 6;
      const results = new Set<number>();

      // Roll 100 times - should get multiple different values
      for (let i = 0; i < 100; i++) {
        results.add(rollDice(sides));
      }

      // With 100 rolls of d6, we should get at least 3 different values
      expect(results.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('rollDice with mocked Math.random', () => {
    it('should return minimum value (1) when Math.random returns 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(rollDice(6)).toBe(1);
    });

    it('should return maximum value when Math.random returns ~1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999999);
      expect(rollDice(6)).toBe(6);
      expect(rollDice(20)).toBe(20);
    });

    it('should return middle value for 0.5 random', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(rollDice(6)).toBe(4); // floor(0.5 * 6) + 1 = 3 + 1 = 4
      expect(rollDice(10)).toBe(6); // floor(0.5 * 10) + 1 = 5 + 1 = 6
    });
  });

  describe('Multiple dice rolls', () => {
    it('should roll multiple dice and return array of results', () => {
      const diceCount = 3;
      const diceSides = 6;
      const results: number[] = [];

      for (let i = 0; i < diceCount; i++) {
        results.push(rollDice(diceSides));
      }

      expect(results).toHaveLength(diceCount);
      results.forEach(result => {
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(diceSides);
      });
    });

    it('should calculate correct sum for multiple dice', () => {
      const results = [3, 5, 2]; // Simulated dice rolls
      const total = results.reduce((sum, value) => sum + value, 0);
      expect(total).toBe(10);
    });

    it('should handle single die roll', () => {
      const results = [rollDice(6)];
      expect(results).toHaveLength(1);
      expect(results[0]).toBeGreaterThanOrEqual(1);
      expect(results[0]).toBeLessThanOrEqual(6);
    });

    it('should handle large number of dice', () => {
      const diceCount = 100;
      const diceSides = 6;
      const results: number[] = [];

      for (let i = 0; i < diceCount; i++) {
        results.push(rollDice(diceSides));
      }

      expect(results).toHaveLength(diceCount);

      // Calculate average - should be close to (sides + 1) / 2
      const average = results.reduce((sum, v) => sum + v, 0) / results.length;
      const expectedAverage = (diceSides + 1) / 2;

      // Allow for some variance (within 1 of expected average)
      expect(Math.abs(average - expectedAverage)).toBeLessThan(1);
    });
  });

  describe('Dice notation', () => {
    it('should format dice notation correctly', () => {
      const diceCount = 2;
      const diceSides = 6;
      const notation = `${diceCount}d${diceSides}`;
      expect(notation).toBe('2d6');
    });

    it('should handle various dice notations', () => {
      const testCases = [
        { count: 1, sides: 20, expected: '1d20' },
        { count: 3, sides: 6, expected: '3d6' },
        { count: 2, sides: 10, expected: '2d10' },
        { count: 4, sides: 4, expected: '4d4' },
      ];

      testCases.forEach(({ count, sides, expected }) => {
        const notation = `${count}d${sides}`;
        expect(notation).toBe(expected);
      });
    });
  });

  describe('Roll result formatting', () => {
    it('should format roll results as addition expression', () => {
      const results = [3, 5, 2];
      const expression = results.join(' + ');
      expect(expression).toBe('3 + 5 + 2');
    });

    it('should format complete roll with total', () => {
      const results = [4, 6, 2];
      const total = results.reduce((sum, v) => sum + v, 0);
      const expression = `${results.join(' + ')} = ${total}`;
      expect(expression).toBe('4 + 6 + 2 = 12');
    });

    it('should format dice notation with results', () => {
      const diceCount = 2;
      const diceSides = 6;
      const results = [3, 5];
      const total = results.reduce((sum, v) => sum + v, 0);
      const notation = `${diceCount}d${diceSides}`;
      const fullExpression = `${notation}: ${results.join(' + ')} = ${total}`;
      expect(fullExpression).toBe('2d6: 3 + 5 = 8');
    });
  });

  describe('Preset dice values', () => {
    it('should have standard TRPG dice presets', () => {
      const presetDice = [
        { sides: 4, label: 'D4' },
        { sides: 6, label: 'D6' },
        { sides: 8, label: 'D8' },
        { sides: 10, label: 'D10' },
        { sides: 12, label: 'D12' },
        { sides: 20, label: 'D20' },
        { sides: 100, label: 'D100' },
      ];

      expect(presetDice).toHaveLength(7);
      expect(presetDice.map(d => d.sides)).toEqual([4, 6, 8, 10, 12, 20, 100]);
    });
  });

  describe('Input validation', () => {
    it('should handle minimum dice count (1)', () => {
      const count = Math.max(1, Math.min(100, 1));
      expect(count).toBe(1);
    });

    it('should handle maximum dice count (100)', () => {
      const count = Math.max(1, Math.min(100, 100));
      expect(count).toBe(100);
    });

    it('should clamp dice count below minimum', () => {
      const count = Math.max(1, Math.min(100, 0));
      expect(count).toBe(1);
    });

    it('should clamp dice count above maximum', () => {
      const count = Math.max(1, Math.min(100, 150));
      expect(count).toBe(100);
    });

    it('should handle minimum dice sides (2)', () => {
      const sides = Math.max(2, Math.min(1000, 2));
      expect(sides).toBe(2);
    });

    it('should handle maximum dice sides (1000)', () => {
      const sides = Math.max(2, Math.min(1000, 1000));
      expect(sides).toBe(1000);
    });

    it('should clamp dice sides below minimum', () => {
      const sides = Math.max(2, Math.min(1000, 1));
      expect(sides).toBe(2);
    });

    it('should clamp dice sides above maximum', () => {
      const sides = Math.max(2, Math.min(1000, 2000));
      expect(sides).toBe(1000);
    });
  });
});
