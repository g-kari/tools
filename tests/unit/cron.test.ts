import { describe, it, expect } from 'vitest';
import {
  parseCronField,
  parseCronExpression,
  getNextExecutionTimes,
  describeCronExpression,
} from '../../app/routes/cron-parser';
import {
  parseCron,
  generateDescription,
  CRON_PRESETS,
  CRON_FIELDS,
} from '../../app/utils/cron';

describe('parseCronField', () => {
  it('should parse wildcard *', () => {
    const result = parseCronField('*', 0, 59);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(60);
    expect(result![0]).toBe(0);
    expect(result![59]).toBe(59);
  });

  it('should parse step wildcard */15', () => {
    const result = parseCronField('*/15', 0, 59);
    expect(result).not.toBeNull();
    expect(result).toEqual([0, 15, 30, 45]);
  });

  it('should parse range 0-5', () => {
    const result = parseCronField('0-5', 0, 59);
    expect(result).not.toBeNull();
    expect(result).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should parse comma-separated list 1,2,3', () => {
    const result = parseCronField('1,2,3', 0, 59);
    expect(result).not.toBeNull();
    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse single value 0', () => {
    const result = parseCronField('0', 0, 59);
    expect(result).not.toBeNull();
    expect(result).toEqual([0]);
  });

  it('should parse range with step 0-30/10', () => {
    const result = parseCronField('0-30/10', 0, 59);
    expect(result).not.toBeNull();
    expect(result).toEqual([0, 10, 20, 30]);
  });

  it('should return null for value out of range', () => {
    const result = parseCronField('60', 0, 59);
    expect(result).toBeNull();
  });

  it('should return null for negative step */0', () => {
    const result = parseCronField('*/0', 0, 59);
    expect(result).toBeNull();
  });

  it('should return null for invalid range 5-3', () => {
    const result = parseCronField('5-3', 0, 59);
    expect(result).toBeNull();
  });

  it('should return null for invalid pattern abc', () => {
    const result = parseCronField('abc', 0, 59);
    expect(result).toBeNull();
  });

  it('should parse hour range 0-23', () => {
    const result = parseCronField('*', 0, 23);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(24);
  });

  it('should return null for value below min', () => {
    const result = parseCronField('0', 1, 31);
    expect(result).toBeNull();
  });

  it('should parse weekday range 1-5', () => {
    const result = parseCronField('1-5', 0, 7);
    expect(result).not.toBeNull();
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('parseCronExpression', () => {
  it('should parse a valid expression * * * * *', () => {
    const result = parseCronExpression('* * * * *');
    expect(result.valid).toBe(true);
    expect(result.fields).toBeDefined();
    expect(result.fields!.minute.length).toBe(60);
    expect(result.fields!.hour.length).toBe(24);
  });

  it('should parse 0 9 * * 1-5', () => {
    const result = parseCronExpression('0 9 * * 1-5');
    expect(result.valid).toBe(true);
    expect(result.fields!.minute).toEqual([0]);
    expect(result.fields!.hour).toEqual([9]);
    expect(result.fields!.weekday).toEqual([1, 2, 3, 4, 5]);
  });

  it('should convert weekday 7 to 0 (Sunday)', () => {
    const result = parseCronExpression('0 0 * * 7');
    expect(result.valid).toBe(true);
    expect(result.fields!.weekday).toEqual([0]);
  });

  it('should fail when field count is less than 5', () => {
    const result = parseCronExpression('* * * *');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('フィールド数');
  });

  it('should fail when field count is more than 5', () => {
    const result = parseCronExpression('* * * * * *');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('フィールド数');
  });

  it('should fail with empty expression', () => {
    const result = parseCronExpression('');
    expect(result.valid).toBe(false);
  });

  it('should fail when minute field is invalid', () => {
    const result = parseCronExpression('60 * * * *');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('分フィールド');
  });

  it('should fail when hour field is invalid', () => {
    const result = parseCronExpression('0 24 * * *');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('時フィールド');
  });

  it('should fail when month field is invalid', () => {
    const result = parseCronExpression('0 0 * 13 *');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('月フィールド');
  });

  it('should parse */15 minute expression', () => {
    const result = parseCronExpression('*/15 * * * *');
    expect(result.valid).toBe(true);
    expect(result.fields!.minute).toEqual([0, 15, 30, 45]);
  });

  it('should parse monthly expression 0 0 1 * *', () => {
    const result = parseCronExpression('0 0 1 * *');
    expect(result.valid).toBe(true);
    expect(result.fields!.day).toEqual([1]);
    expect(result.fields!.month.length).toBe(12);
  });
});

describe('getNextExecutionTimes', () => {
  it('should return 10 times for * * * * *', () => {
    const from = new Date('2024-01-01T00:00:00');
    const times = getNextExecutionTimes('* * * * *', 10, from);
    expect(times).not.toBeNull();
    expect(times!.length).toBe(10);
  });

  it('should return times every minute for * * * * *', () => {
    const from = new Date('2024-01-01T00:00:00');
    const times = getNextExecutionTimes('* * * * *', 3, from);
    expect(times).not.toBeNull();
    // 0:00, 0:01, 0:02
    expect(times![0].getHours()).toBe(0);
    expect(times![0].getMinutes()).toBe(0);
    expect(times![1].getMinutes()).toBe(1);
    expect(times![2].getMinutes()).toBe(2);
  });

  it('should return hourly times for 0 * * * *', () => {
    const from = new Date('2024-01-01T00:00:00');
    const times = getNextExecutionTimes('0 * * * *', 3, from);
    expect(times).not.toBeNull();
    expect(times!.length).toBe(3);
    // 0:00, 1:00, 2:00
    expect(times![0].getMinutes()).toBe(0);
    expect(times![0].getHours()).toBe(0);
    expect(times![1].getHours()).toBe(1);
    expect(times![2].getHours()).toBe(2);
  });

  it('should return null for invalid expression', () => {
    const times = getNextExecutionTimes('invalid');
    expect(times).toBeNull();
  });

  it('should return null for empty expression', () => {
    const times = getNextExecutionTimes('');
    expect(times).toBeNull();
  });

  it('should correctly handle weekday filtering', () => {
    // 2024-01-01 は月曜日
    const from = new Date('2024-01-01T00:00:00');
    const times = getNextExecutionTimes('0 0 * * 1', 3, from);
    expect(times).not.toBeNull();
    // 全て月曜日（1）であること
    times!.forEach((t) => {
      expect(t.getDay()).toBe(1);
      expect(t.getHours()).toBe(0);
      expect(t.getMinutes()).toBe(0);
    });
  });

  it('should handle 0 9 * * * correctly', () => {
    const from = new Date('2024-01-01T00:00:00');
    const times = getNextExecutionTimes('0 9 * * *', 3, from);
    expect(times).not.toBeNull();
    times!.forEach((t) => {
      expect(t.getHours()).toBe(9);
      expect(t.getMinutes()).toBe(0);
    });
  });

  it('should use OR logic when both day and weekday are specified (standard cron)', () => {
    // 2024-01-01 は月曜日（day=1, weekday=1）
    // "0 0 1 * 1" = 毎月1日 OR 毎週月曜日
    const from = new Date('2024-01-01T00:00:00');
    const times = getNextExecutionTimes('0 0 1 * 1', 5, from);
    expect(times).not.toBeNull();
    // 月曜日または1日に実行されるはず
    times!.forEach((t) => {
      const isMonday = t.getDay() === 1;
      const isFirst = t.getDate() === 1;
      expect(isMonday || isFirst).toBe(true);
    });
    // AND条件だと年数件しか一致しないが、OR条件なら複数件ある
    expect(times!.length).toBeGreaterThan(0);
  });
});

describe('describeCronExpression', () => {
  it('should return "毎分実行" for * * * * *', () => {
    const result = describeCronExpression('* * * * *');
    expect(result).toBe('毎分実行');
  });

  it('should describe 0 9 * * * as daily at 9:00', () => {
    const result = describeCronExpression('0 9 * * *');
    expect(result).not.toBeNull();
    expect(result).toContain('9時');
    expect(result).toContain('0分');
    expect(result).toContain('に実行');
  });

  it('should describe 0 0 * * 1 as weekly Monday midnight', () => {
    const result = describeCronExpression('0 0 * * 1');
    expect(result).not.toBeNull();
    expect(result).toContain('月');
    expect(result).toContain('に実行');
  });

  it('should describe */15 * * * * as every 15 minutes', () => {
    const result = describeCronExpression('*/15 * * * *');
    expect(result).not.toBeNull();
    expect(result).toContain('0');
    expect(result).toContain('15');
    expect(result).toContain('30');
    expect(result).toContain('45');
    expect(result).toContain('に実行');
  });

  it('should return null for invalid expression', () => {
    const result = describeCronExpression('invalid');
    expect(result).toBeNull();
  });

  it('should describe 0 0 * * * as daily midnight', () => {
    const result = describeCronExpression('0 0 * * *');
    expect(result).not.toBeNull();
    expect(result).toContain('0時');
    expect(result).toContain('に実行');
  });

  it('should describe 0 9 * * 1-5 correctly including weekdays', () => {
    const result = describeCronExpression('0 9 * * 1-5');
    expect(result).not.toBeNull();
    expect(result).toContain('月');
    expect(result).toContain('金');
    expect(result).toContain('9時');
    expect(result).toContain('に実行');
  });
});

// app/utils/cron.ts (croner使用) のテスト
describe('parseCron (croner)', () => {
  it('should return isValid=true for valid expression * * * * *', () => {
    const result = parseCron('* * * * *');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return 10 nextRuns for * * * * *', () => {
    const result = parseCron('* * * * *');
    expect(result.isValid).toBe(true);
    expect(result.nextRuns.length).toBe(10);
  });

  it('should return nextRuns as Date instances', () => {
    const result = parseCron('0 9 * * *');
    expect(result.isValid).toBe(true);
    result.nextRuns.forEach((d) => {
      expect(d).toBeInstanceOf(Date);
    });
  });

  it('should return isValid=false for invalid expression', () => {
    const result = parseCron('invalid expression');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.nextRuns.length).toBe(0);
  });

  it('should return isValid=false for empty expression', () => {
    const result = parseCron('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Cron式を入力してください');
  });

  it('should include description for valid expression', () => {
    const result = parseCron('* * * * *');
    expect(result.isValid).toBe(true);
    expect(result.description).toBeTruthy();
    expect(result.description).toContain('毎分');
  });

  it('should return 10 nextRuns for all presets', () => {
    for (const preset of CRON_PRESETS) {
      const result = parseCron(preset.value);
      expect(result.isValid).toBe(true);
      expect(result.nextRuns.length).toBe(10);
    }
  });

  it('should have all 5 CRON_FIELDS defined', () => {
    expect(CRON_FIELDS.length).toBe(5);
    const names = CRON_FIELDS.map((f) => f.name);
    expect(names).toContain('minute');
    expect(names).toContain('hour');
    expect(names).toContain('day');
    expect(names).toContain('month');
    expect(names).toContain('weekday');
  });
});

describe('generateDescription', () => {
  it('should return "毎分実行" for * * * * *', () => {
    const result = generateDescription('* * * * *');
    expect(result).toBe('毎分実行');
  });

  it('should describe */5 * * * * as 5分ごと', () => {
    const result = generateDescription('*/5 * * * *');
    expect(result).toContain('5分ごと');
  });

  it('should describe 0 9 * * * as daily', () => {
    const result = generateDescription('0 9 * * *');
    expect(result).toContain('9時');
    expect(result).toContain('0分');
    expect(result).toContain('に実行');
  });

  it('should describe 0 9 * * 1-5 as weekday', () => {
    const result = generateDescription('0 9 * * 1-5');
    expect(result).toContain('平日');
    expect(result).toContain('9時');
    expect(result).toContain('に実行');
  });

  it('should describe 0 0 1 * * as monthly', () => {
    const result = generateDescription('0 0 1 * *');
    expect(result).toContain('1日');
    expect(result).toContain('に実行');
  });

  it('should return "不明なスケジュール" for wrong field count', () => {
    const result = generateDescription('* * *');
    expect(result).toBe('不明なスケジュール');
  });
});
