import { describe, it, expect } from 'vitest';
import {
  parseCronField,
  parseCronExpression,
  getNextExecutionTimes,
  describeCronExpression,
} from '../../app/routes/cron-parser';

describe('parseCronField', () => {
  it('ワイルドカード * で全ての値を返す', () => {
    const result = parseCronField('*', 0, 4);
    expect(result).toEqual([0, 1, 2, 3, 4]);
  });

  it('単一数値を返す', () => {
    expect(parseCronField('5', 0, 59)).toEqual([5]);
  });

  it('範囲 a-b を展開する', () => {
    expect(parseCronField('1-5', 0, 7)).toEqual([1, 2, 3, 4, 5]);
  });

  it('カンマ区切りで複数の値を返す', () => {
    expect(parseCronField('0,15,30,45', 0, 59)).toEqual([0, 15, 30, 45]);
  });

  it('*/n でステップ値を展開する', () => {
    expect(parseCronField('*/15', 0, 59)).toEqual([0, 15, 30, 45]);
  });

  it('a-b/n で範囲+ステップを展開する', () => {
    expect(parseCronField('0-12/3', 0, 23)).toEqual([0, 3, 6, 9, 12]);
  });

  it('範囲外の値は null を返す', () => {
    expect(parseCronField('60', 0, 59)).toBeNull();
  });

  it('最小値未満の値は null を返す', () => {
    expect(parseCronField('0', 1, 31)).toBeNull();
  });

  it('step が 0 の場合 null を返す', () => {
    expect(parseCronField('*/0', 0, 59)).toBeNull();
  });

  it('無効なパターンは null を返す', () => {
    expect(parseCronField('abc', 0, 59)).toBeNull();
  });

  it('結果はソートされた配列で返す', () => {
    const result = parseCronField('30,0,15', 0, 59);
    expect(result).toEqual([0, 15, 30]);
  });
});

describe('parseCronExpression', () => {
  it('有効なcron式をパースする', () => {
    const result = parseCronExpression('0 9 * * 1-5');
    expect(result.valid).toBe(true);
    expect(result.fields?.minute).toEqual([0]);
    expect(result.fields?.hour).toEqual([9]);
    expect(result.fields?.weekday).toEqual([1, 2, 3, 4, 5]);
  });

  it('毎分実行の式（* * * * *）をパースする', () => {
    const result = parseCronExpression('* * * * *');
    expect(result.valid).toBe(true);
    expect(result.fields?.minute).toHaveLength(60);
    expect(result.fields?.hour).toHaveLength(24);
  });

  it('空文字列は無効', () => {
    const result = parseCronExpression('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('フィールド数が5以外は無効', () => {
    const result = parseCronExpression('0 9 * *');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('フィールド数が不正');
  });

  it('分フィールドが不正な場合エラーを返す', () => {
    const result = parseCronExpression('60 9 * * *');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('分フィールド');
  });

  it('時フィールドが不正な場合エラーを返す', () => {
    const result = parseCronExpression('0 24 * * *');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('時フィールド');
  });

  it('曜日の7は0（日曜日）に統一される', () => {
    const result7 = parseCronExpression('0 0 * * 7');
    const result0 = parseCronExpression('0 0 * * 0');
    expect(result7.valid).toBe(true);
    expect(result0.valid).toBe(true);
    expect(result7.fields?.weekday).toEqual([0]);
    expect(result0.fields?.weekday).toEqual([0]);
  });

  it('dayWildcard と weekdayWildcard が正しく設定される', () => {
    const result = parseCronExpression('0 0 * * 1');
    expect(result.fields?.dayWildcard).toBe(true);
    expect(result.fields?.weekdayWildcard).toBe(false);
  });
});

describe('describeCronExpression', () => {
  it('* * * * * は "毎分実行" と説明する', () => {
    expect(describeCronExpression('* * * * *')).toBe('毎分実行');
  });

  it('0 * * * * は "毎時0分に実行" と説明する', () => {
    expect(describeCronExpression('0 * * * *')).toBe('毎時0分に実行');
  });

  it('0 0 * * * は "0時0分に実行" と説明する', () => {
    expect(describeCronExpression('0 0 * * *')).toBe('0時0分に実行');
  });

  it('0 9 * * 1-5 は平日9時を説明する', () => {
    const desc = describeCronExpression('0 9 * * 1-5');
    expect(desc).toContain('9時0分');
    expect(desc).toContain('月');
  });

  it('無効な式は null を返す', () => {
    expect(describeCronExpression('invalid')).toBeNull();
  });

  it('空文字列は null を返す', () => {
    expect(describeCronExpression('')).toBeNull();
  });
});

describe('getNextExecutionTimes', () => {
  it('次回実行時刻を指定件数返す', () => {
    const from = new Date('2025-01-01T00:00:00');
    const times = getNextExecutionTimes('* * * * *', 5, from);
    expect(times).toHaveLength(5);
  });

  it('毎時0分の次回実行時刻を正しく返す', () => {
    const from = new Date('2025-01-01T09:30:00');
    const times = getNextExecutionTimes('0 * * * *', 1, from);
    expect(times).not.toBeNull();
    expect(times![0].getMinutes()).toBe(0);
    expect(times![0].getHours()).toBe(10);
  });

  it('無効なcron式は null を返す', () => {
    expect(getNextExecutionTimes('invalid')).toBeNull();
  });

  it('特定の時刻に実行するcron式の結果が正しい', () => {
    const from = new Date('2025-01-01T00:00:00');
    const times = getNextExecutionTimes('0 9 * * *', 3, from);
    expect(times).not.toBeNull();
    for (const t of times!) {
      expect(t.getHours()).toBe(9);
      expect(t.getMinutes()).toBe(0);
    }
  });

  it('デフォルトでは10件返す', () => {
    const from = new Date('2025-01-01T00:00:00');
    const times = getNextExecutionTimes('* * * * *', 10, from);
    expect(times).toHaveLength(10);
  });
});
