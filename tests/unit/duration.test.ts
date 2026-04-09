import { describe, it, expect } from 'vite-plus/test';
import {
  secondsToComponents,
  hmsToSeconds,
  secondsToHms,
  secondsToHuman,
  secondsToFrames,
  framesToSeconds,
  framesToTimecode,
  addDurations,
  subtractDurations,
  parseDuration,
  secondsToUnit,
  unitToSeconds,
} from '../../app/utils/duration';

describe('secondsToComponents', () => {
  it('0秒を正しく分解する', () => {
    const c = secondsToComponents(0);
    expect(c.days).toBe(0);
    expect(c.hours).toBe(0);
    expect(c.minutes).toBe(0);
    expect(c.seconds).toBe(0);
    expect(c.milliseconds).toBe(0);
    expect(c.totalSeconds).toBe(0);
  });

  it('3661秒を正しく分解する', () => {
    const c = secondsToComponents(3661);
    expect(c.days).toBe(0);
    expect(c.hours).toBe(1);
    expect(c.minutes).toBe(1);
    expect(c.seconds).toBe(1);
    expect(c.milliseconds).toBe(0);
    expect(c.totalSeconds).toBe(3661);
  });

  it('90061.5秒を正しく分解する（1日1時間1分1秒500ms）', () => {
    const c = secondsToComponents(90061.5);
    expect(c.days).toBe(1);
    expect(c.hours).toBe(1);
    expect(c.minutes).toBe(1);
    expect(c.seconds).toBe(1);
    expect(c.milliseconds).toBe(500);
  });

  it('負の値を正しく分解する', () => {
    const c = secondsToComponents(-3600);
    expect(c.hours).toBe(-1);
    expect(c.totalSeconds).toBe(-3600);
  });
});

describe('hmsToSeconds', () => {
  it('HH:MM:SS 形式を変換する', () => {
    expect(hmsToSeconds('01:00:00')).toBe(3600);
    expect(hmsToSeconds('00:01:30')).toBe(90);
    expect(hmsToSeconds('01:01:01')).toBe(3661);
  });

  it('MM:SS 形式を変換する', () => {
    expect(hmsToSeconds('01:30')).toBe(90);
    expect(hmsToSeconds('00:45')).toBe(45);
  });

  it('SS 形式を変換する', () => {
    expect(hmsToSeconds('90')).toBe(90);
    expect(hmsToSeconds('45')).toBe(45);
  });

  it('ミリ秒付きを変換する', () => {
    expect(hmsToSeconds('00:00:01.500')).toBe(1.5);
    expect(hmsToSeconds('00:01:00,250')).toBe(60.25);
  });

  it('負の値を変換する', () => {
    expect(hmsToSeconds('-01:00:00')).toBe(-3600);
    expect(hmsToSeconds('-00:30:00')).toBe(-1800);
  });

  it('無効な入力に null を返す', () => {
    expect(hmsToSeconds('abc')).toBeNull();
    expect(hmsToSeconds('01:60:00')).toBeNull(); // 分が60以上
    expect(hmsToSeconds('')).toBeNull();
  });
});

describe('secondsToHms', () => {
  it('秒数を HH:MM:SS 形式に変換する', () => {
    expect(secondsToHms(3600)).toBe('01:00:00');
    expect(secondsToHms(3661)).toBe('01:01:01');
    expect(secondsToHms(0)).toBe('00:00:00');
  });

  it('24時間以上を正しく変換する', () => {
    expect(secondsToHms(90000)).toBe('25:00:00');
  });

  it('ミリ秒付き表示', () => {
    expect(secondsToHms(1.5, true)).toBe('00:00:01.500');
    expect(secondsToHms(90.25, true)).toBe('00:01:30.250');
  });

  it('負の値を変換する', () => {
    expect(secondsToHms(-3600)).toBe('-01:00:00');
  });
});

describe('secondsToHuman', () => {
  it('0秒を変換する', () => {
    expect(secondsToHuman(0)).toBe('0秒');
  });

  it('秒のみを変換する', () => {
    expect(secondsToHuman(45)).toBe('45秒');
  });

  it('分・秒を変換する', () => {
    expect(secondsToHuman(90)).toBe('1分 30秒');
  });

  it('時間・分・秒を変換する', () => {
    expect(secondsToHuman(3661)).toBe('1時間 1分 1秒');
  });

  it('日・時間を変換する', () => {
    expect(secondsToHuman(86400)).toBe('1日');
    expect(secondsToHuman(90000)).toBe('1日 1時間');
  });

  it('負の値を変換する', () => {
    expect(secondsToHuman(-3600)).toBe('−1時間');
  });
});

describe('secondsToFrames', () => {
  it('30fpsでのフレーム数を計算する', () => {
    expect(secondsToFrames(1, 30)).toBe(30);
    expect(secondsToFrames(2, 30)).toBe(60);
    expect(secondsToFrames(0, 30)).toBe(0);
  });

  it('24fpsでのフレーム数を計算する', () => {
    expect(secondsToFrames(1, 24)).toBe(24);
    expect(secondsToFrames(2.5, 24)).toBe(60);
  });

  it('60fpsでのフレーム数を計算する', () => {
    expect(secondsToFrames(1, 60)).toBe(60);
  });
});

describe('framesToSeconds', () => {
  it('フレーム数を秒に変換する', () => {
    expect(framesToSeconds(30, 30)).toBe(1);
    expect(framesToSeconds(60, 30)).toBe(2);
    expect(framesToSeconds(24, 24)).toBe(1);
  });
});

describe('framesToTimecode', () => {
  it('タイムコード形式で返す', () => {
    expect(framesToTimecode(0, 30)).toBe('00:00:00:00');
    expect(framesToTimecode(30, 30)).toBe('00:00:01:00');
    expect(framesToTimecode(1800, 30)).toBe('00:01:00:00');
    expect(framesToTimecode(108000, 30)).toBe('01:00:00:00');
  });

  it('フレーム部分を正しく計算する', () => {
    expect(framesToTimecode(35, 30)).toBe('00:00:01:05');
    expect(framesToTimecode(15, 30)).toBe('00:00:00:15');
  });
});

describe('addDurations / subtractDurations', () => {
  it('2つの時間を加算する', () => {
    expect(addDurations(3600, 1800)).toBe(5400);
    expect(addDurations(0, 0)).toBe(0);
  });

  it('2つの時間を減算する', () => {
    expect(subtractDurations(3600, 1800)).toBe(1800);
    expect(subtractDurations(1800, 3600)).toBe(-1800);
  });
});

describe('parseDuration', () => {
  it('秒数として解析する', () => {
    expect(parseDuration('3600')).toBe(3600);
    expect(parseDuration('90.5')).toBe(90.5);
    expect(parseDuration('-1800')).toBe(-1800);
  });

  it('HH:MM:SS 形式として解析する', () => {
    expect(parseDuration('01:00:00')).toBe(3600);
    expect(parseDuration('00:01:30')).toBe(90);
  });

  it('空文字に null を返す', () => {
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('   ')).toBeNull();
  });

  it('無効な入力に null を返す', () => {
    expect(parseDuration('abc')).toBeNull();
  });
});

describe('unitToSeconds / secondsToUnit', () => {
  it('単位から秒に変換する', () => {
    expect(unitToSeconds(1, 'hours')).toBe(3600);
    expect(unitToSeconds(1, 'minutes')).toBe(60);
    expect(unitToSeconds(1, 'days')).toBe(86400);
    expect(unitToSeconds(1000, 'milliseconds')).toBe(1);
  });

  it('秒から単位に変換する', () => {
    expect(secondsToUnit(3600, 'hours')).toBe(1);
    expect(secondsToUnit(60, 'minutes')).toBe(1);
    expect(secondsToUnit(86400, 'days')).toBe(1);
    expect(secondsToUnit(1, 'milliseconds')).toBe(1000);
  });
});
