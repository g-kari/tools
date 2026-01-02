import { describe, it, expect } from 'vitest';
import {
  UNIT_CATEGORIES,
  getUnitsForCategory,
  convertUnit,
  formatNumber,
  createHistoryEntry,
  type UnitCategory,
} from '../../app/utils/unit-converter';

describe('Unit converter - Category definitions', () => {
  it('should have all 8 categories defined', () => {
    expect(UNIT_CATEGORIES).toHaveLength(8);
    const categoryIds = UNIT_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('length');
    expect(categoryIds).toContain('weight');
    expect(categoryIds).toContain('temperature');
    expect(categoryIds).toContain('dataSize');
    expect(categoryIds).toContain('area');
    expect(categoryIds).toContain('volume');
    expect(categoryIds).toContain('speed');
    expect(categoryIds).toContain('time');
  });

  it('should have units for each category', () => {
    for (const category of UNIT_CATEGORIES) {
      expect(category.units.length).toBeGreaterThan(0);
      expect(category.baseUnit).toBeDefined();
      expect(category.name).toBeDefined();
    }
  });

  it('should have correct unit structure', () => {
    for (const category of UNIT_CATEGORIES) {
      for (const unit of category.units) {
        expect(unit.id).toBeDefined();
        expect(unit.name).toBeDefined();
        expect(unit.symbol).toBeDefined();
        expect(typeof unit.toBase).toBe('number');
      }
    }
  });
});

describe('Unit converter - getUnitsForCategory', () => {
  it('should return units for valid category', () => {
    const lengthUnits = getUnitsForCategory('length');
    expect(lengthUnits.length).toBeGreaterThan(0);
    expect(lengthUnits.some((u) => u.id === 'm')).toBe(true);
    expect(lengthUnits.some((u) => u.id === 'km')).toBe(true);
  });

  it('should return empty array for invalid category', () => {
    const units = getUnitsForCategory('invalid' as UnitCategory);
    expect(units).toEqual([]);
  });
});

describe('Unit converter - Length conversions', () => {
  it('should convert meters to kilometers', () => {
    const result = convertUnit(1000, 'm', 'km', 'length');
    expect(result).toBeCloseTo(1, 10);
  });

  it('should convert kilometers to meters', () => {
    const result = convertUnit(1, 'km', 'm', 'length');
    expect(result).toBeCloseTo(1000, 10);
  });

  it('should convert meters to centimeters', () => {
    const result = convertUnit(1, 'm', 'cm', 'length');
    expect(result).toBeCloseTo(100, 10);
  });

  it('should convert miles to kilometers', () => {
    const result = convertUnit(1, 'mi', 'km', 'length');
    expect(result).toBeCloseTo(1.609344, 5);
  });

  it('should convert feet to meters', () => {
    const result = convertUnit(1, 'ft', 'm', 'length');
    expect(result).toBeCloseTo(0.3048, 5);
  });

  it('should convert inches to centimeters', () => {
    const result = convertUnit(1, 'in', 'cm', 'length');
    expect(result).toBeCloseTo(2.54, 5);
  });
});

describe('Unit converter - Weight conversions', () => {
  it('should convert kilograms to grams', () => {
    const result = convertUnit(1, 'kg', 'g', 'weight');
    expect(result).toBeCloseTo(1000, 10);
  });

  it('should convert grams to kilograms', () => {
    const result = convertUnit(1000, 'g', 'kg', 'weight');
    expect(result).toBeCloseTo(1, 10);
  });

  it('should convert pounds to kilograms', () => {
    const result = convertUnit(1, 'lb', 'kg', 'weight');
    expect(result).toBeCloseTo(0.45359237, 5);
  });

  it('should convert ounces to grams', () => {
    const result = convertUnit(1, 'oz', 'g', 'weight');
    expect(result).toBeCloseTo(28.349523125, 5);
  });

  it('should convert tons to kilograms', () => {
    const result = convertUnit(1, 't', 'kg', 'weight');
    expect(result).toBeCloseTo(1000, 10);
  });
});

describe('Unit converter - Temperature conversions', () => {
  it('should convert celsius to fahrenheit', () => {
    const result = convertUnit(0, 'c', 'f', 'temperature');
    expect(result).toBeCloseTo(32, 5);
  });

  it('should convert celsius 100 to fahrenheit', () => {
    const result = convertUnit(100, 'c', 'f', 'temperature');
    expect(result).toBeCloseTo(212, 5);
  });

  it('should convert fahrenheit to celsius', () => {
    const result = convertUnit(32, 'f', 'c', 'temperature');
    expect(result).toBeCloseTo(0, 5);
  });

  it('should convert fahrenheit 212 to celsius', () => {
    const result = convertUnit(212, 'f', 'c', 'temperature');
    expect(result).toBeCloseTo(100, 5);
  });

  it('should convert celsius to kelvin', () => {
    const result = convertUnit(0, 'c', 'k', 'temperature');
    expect(result).toBeCloseTo(273.15, 5);
  });

  it('should convert kelvin to celsius', () => {
    const result = convertUnit(273.15, 'k', 'c', 'temperature');
    expect(result).toBeCloseTo(0, 5);
  });

  it('should convert fahrenheit to kelvin', () => {
    const result = convertUnit(32, 'f', 'k', 'temperature');
    expect(result).toBeCloseTo(273.15, 5);
  });

  it('should handle negative temperatures', () => {
    const result = convertUnit(-40, 'c', 'f', 'temperature');
    expect(result).toBeCloseTo(-40, 5); // -40°C = -40°F
  });
});

describe('Unit converter - Data size conversions', () => {
  it('should convert bytes to kilobytes (1024)', () => {
    const result = convertUnit(1024, 'b', 'kb', 'dataSize');
    expect(result).toBeCloseTo(1, 10);
  });

  it('should convert kilobytes to megabytes', () => {
    const result = convertUnit(1024, 'kb', 'mb', 'dataSize');
    expect(result).toBeCloseTo(1, 10);
  });

  it('should convert megabytes to gigabytes', () => {
    const result = convertUnit(1024, 'mb', 'gb', 'dataSize');
    expect(result).toBeCloseTo(1, 10);
  });

  it('should convert gigabytes to terabytes', () => {
    const result = convertUnit(1024, 'gb', 'tb', 'dataSize');
    expect(result).toBeCloseTo(1, 10);
  });

  it('should convert bytes to kilobytes (1000)', () => {
    const result = convertUnit(1000, 'b', 'kb1000', 'dataSize');
    expect(result).toBeCloseTo(1, 10);
  });

  it('should handle large data sizes', () => {
    const result = convertUnit(1, 'pb', 'b', 'dataSize');
    expect(result).toBeCloseTo(Math.pow(1024, 5), 0);
  });
});

describe('Unit converter - Area conversions', () => {
  it('should convert square meters to square kilometers', () => {
    const result = convertUnit(1000000, 'sqm', 'sqkm', 'area');
    expect(result).toBeCloseTo(1, 10);
  });

  it('should convert hectares to square meters', () => {
    const result = convertUnit(1, 'ha', 'sqm', 'area');
    expect(result).toBeCloseTo(10000, 10);
  });

  it('should convert tsubo to square meters', () => {
    const result = convertUnit(1, 'tsubo', 'sqm', 'area');
    expect(result).toBeCloseTo(3.305785, 3);
  });

  it('should convert jo (tatami) to square meters', () => {
    const result = convertUnit(1, 'jo', 'sqm', 'area');
    expect(result).toBeCloseTo(1.6529, 3);
  });
});

describe('Unit converter - Volume conversions', () => {
  it('should convert liters to milliliters', () => {
    const result = convertUnit(1, 'l', 'ml', 'volume');
    expect(result).toBeCloseTo(1000, 10);
  });

  it('should convert liters to cubic meters', () => {
    const result = convertUnit(1000, 'l', 'cbm', 'volume');
    expect(result).toBeCloseTo(1, 10);
  });

  it('should convert gallons (US) to liters', () => {
    const result = convertUnit(1, 'gal', 'l', 'volume');
    expect(result).toBeCloseTo(3.785411784, 5);
  });

  it('should convert cups to milliliters', () => {
    const result = convertUnit(1, 'cup', 'ml', 'volume');
    expect(result).toBeCloseTo(236.5882365, 3);
  });
});

describe('Unit converter - Speed conversions', () => {
  it('should convert m/s to km/h', () => {
    const result = convertUnit(1, 'ms', 'kmh', 'speed');
    expect(result).toBeCloseTo(3.6, 5);
  });

  it('should convert km/h to m/s', () => {
    const result = convertUnit(3.6, 'kmh', 'ms', 'speed');
    expect(result).toBeCloseTo(1, 5);
  });

  it('should convert mph to km/h', () => {
    const result = convertUnit(1, 'mph', 'kmh', 'speed');
    expect(result).toBeCloseTo(1.609344, 5);
  });

  it('should convert knots to km/h', () => {
    const result = convertUnit(1, 'kt', 'kmh', 'speed');
    expect(result).toBeCloseTo(1.852, 3);
  });
});

describe('Unit converter - Time conversions', () => {
  it('should convert minutes to seconds', () => {
    const result = convertUnit(1, 'min', 's', 'time');
    expect(result).toBeCloseTo(60, 10);
  });

  it('should convert hours to minutes', () => {
    const result = convertUnit(1, 'h', 'min', 'time');
    expect(result).toBeCloseTo(60, 10);
  });

  it('should convert days to hours', () => {
    const result = convertUnit(1, 'd', 'h', 'time');
    expect(result).toBeCloseTo(24, 10);
  });

  it('should convert weeks to days', () => {
    const result = convertUnit(1, 'w', 'd', 'time');
    expect(result).toBeCloseTo(7, 10);
  });

  it('should convert years to days', () => {
    const result = convertUnit(1, 'y', 'd', 'time');
    expect(result).toBeCloseTo(365, 10);
  });

  it('should convert milliseconds to seconds', () => {
    const result = convertUnit(1000, 'ms', 's', 'time');
    expect(result).toBeCloseTo(1, 10);
  });
});

describe('Unit converter - Error handling', () => {
  it('should return null for invalid category', () => {
    const result = convertUnit(1, 'm', 'km', 'invalid' as UnitCategory);
    expect(result).toBeNull();
  });

  it('should return null for invalid from unit', () => {
    const result = convertUnit(1, 'invalid', 'km', 'length');
    expect(result).toBeNull();
  });

  it('should return null for invalid to unit', () => {
    const result = convertUnit(1, 'm', 'invalid', 'length');
    expect(result).toBeNull();
  });

  it('should handle zero values', () => {
    const result = convertUnit(0, 'm', 'km', 'length');
    expect(result).toBe(0);
  });

  it('should handle negative values', () => {
    const result = convertUnit(-100, 'm', 'km', 'length');
    expect(result).toBeCloseTo(-0.1, 10);
  });

  it('should handle very small values', () => {
    const result = convertUnit(0.001, 'm', 'mm', 'length');
    expect(result).toBeCloseTo(1, 10);
  });

  it('should handle very large values', () => {
    const result = convertUnit(1e15, 'm', 'km', 'length');
    expect(result).toBeCloseTo(1e12, 5);
  });
});

describe('Unit converter - formatNumber', () => {
  it('should format integers with locale separators', () => {
    const result = formatNumber(1000000);
    expect(result).toBe('1,000,000');
  });

  it('should format decimals correctly', () => {
    const result = formatNumber(3.14159);
    expect(result).toContain('3');
    expect(result).toContain('14159');
  });

  it('should remove trailing zeros', () => {
    const result = formatNumber(1.5);
    expect(result).toBe('1.5');
  });

  it('should use exponential notation for very large numbers', () => {
    const result = formatNumber(1e16);
    expect(result).toContain('e');
  });

  it('should use exponential notation for very small numbers', () => {
    const result = formatNumber(1e-12);
    expect(result).toContain('e');
  });

  it('should handle zero', () => {
    const result = formatNumber(0);
    expect(result).toBe('0');
  });

  it('should handle Infinity', () => {
    const result = formatNumber(Infinity);
    expect(result).toBe('計算できません');
  });

  it('should handle NaN', () => {
    const result = formatNumber(NaN);
    expect(result).toBe('計算できません');
  });
});

describe('Unit converter - createHistoryEntry', () => {
  it('should create a valid history entry', () => {
    const entry = createHistoryEntry('length', 100, 'm', 'km', 0.1);
    expect(entry.id).toBeDefined();
    expect(entry.categoryId).toBe('length');
    expect(entry.inputValue).toBe(100);
    expect(entry.fromUnitId).toBe('m');
    expect(entry.toUnitId).toBe('km');
    expect(entry.result).toBe(0.1);
    expect(entry.timestamp).toBeInstanceOf(Date);
  });

  it('should generate unique IDs', () => {
    const entry1 = createHistoryEntry('length', 100, 'm', 'km', 0.1);
    const entry2 = createHistoryEntry('length', 100, 'm', 'km', 0.1);
    expect(entry1.id).not.toBe(entry2.id);
  });
});

describe('Unit converter - Same unit conversions', () => {
  it('should return same value for same unit conversion', () => {
    const result = convertUnit(100, 'm', 'm', 'length');
    expect(result).toBe(100);
  });

  it('should return same value for celsius to celsius', () => {
    const result = convertUnit(25, 'c', 'c', 'temperature');
    expect(result).toBe(25);
  });
});

describe('Unit converter - Precision tests', () => {
  it('should maintain precision for inch to cm conversion', () => {
    // 1 inch = 2.54 cm exactly
    const result = convertUnit(1, 'in', 'cm', 'length');
    expect(result).toBeCloseTo(2.54, 10);
  });

  it('should maintain precision for foot to meter conversion', () => {
    // 1 foot = 0.3048 m exactly
    const result = convertUnit(1, 'ft', 'm', 'length');
    expect(result).toBeCloseTo(0.3048, 10);
  });

  it('should maintain precision for pound to gram conversion', () => {
    // 1 lb = 453.59237 g exactly
    const result = convertUnit(1, 'lb', 'g', 'weight');
    expect(result).toBeCloseTo(453.59237, 5);
  });
});
