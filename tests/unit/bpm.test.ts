import { describe, it, expect } from 'vite-plus/test';
import { calculateBpm, getTempoLabel, bpmToIntervalMs } from '../../app/routes/bpm';

describe('calculateBpm', () => {
  it('タイムスタンプが1件以下の場合は0を返す', () => {
    expect(calculateBpm([])).toBe(0);
    expect(calculateBpm([1000])).toBe(0);
  });

  it('500ms間隔のタップは120BPMになる', () => {
    const timestamps = [0, 500, 1000, 1500];
    expect(calculateBpm(timestamps)).toBe(120);
  });

  it('600ms間隔のタップは100BPMになる', () => {
    const timestamps = [0, 600, 1200, 1800];
    expect(calculateBpm(timestamps)).toBe(100);
  });

  it('250ms間隔のタップは240BPMになる', () => {
    const timestamps = [0, 250, 500, 750];
    expect(calculateBpm(timestamps)).toBe(240);
  });

  it('1000ms間隔のタップは60BPMになる', () => {
    const timestamps = [0, 1000, 2000];
    expect(calculateBpm(timestamps)).toBe(60);
  });

  it('2件のタイムスタンプでも計算できる', () => {
    const timestamps = [0, 500];
    expect(calculateBpm(timestamps)).toBe(120);
  });

  it('小数点以下1桁に丸められる', () => {
    // 700ms間隔: 60000/700 ≈ 85.7142... → 85.7
    const timestamps = [0, 700, 1400];
    const result = calculateBpm(timestamps);
    expect(result).toBe(85.7);
  });

  it('間隔が0の場合は0を返す', () => {
    // 同じタイムスタンプが連続する場合
    const timestamps = [1000, 1000];
    expect(calculateBpm(timestamps)).toBe(0);
  });
});

describe('getTempoLabel', () => {
  it('BPMが0以下の場合はダッシュを返す', () => {
    expect(getTempoLabel(0)).toBe('—');
    expect(getTempoLabel(-1)).toBe('—');
  });

  it('各テンポ記号の境界値を正しく判定する', () => {
    expect(getTempoLabel(20)).toBe('Larghissimo');
    expect(getTempoLabel(39)).toBe('Larghissimo');
    expect(getTempoLabel(40)).toBe('Largo');
    expect(getTempoLabel(59)).toBe('Largo');
    expect(getTempoLabel(60)).toBe('Larghetto');
    expect(getTempoLabel(65)).toBe('Larghetto');
    expect(getTempoLabel(66)).toBe('Adagio');
    expect(getTempoLabel(75)).toBe('Adagio');
    expect(getTempoLabel(76)).toBe('Andante');
    expect(getTempoLabel(107)).toBe('Andante');
    expect(getTempoLabel(108)).toBe('Moderato');
    expect(getTempoLabel(119)).toBe('Moderato');
    expect(getTempoLabel(120)).toBe('Allegro');
    expect(getTempoLabel(155)).toBe('Allegro');
    expect(getTempoLabel(156)).toBe('Vivace');
    expect(getTempoLabel(175)).toBe('Vivace');
    expect(getTempoLabel(176)).toBe('Presto');
    expect(getTempoLabel(199)).toBe('Presto');
    expect(getTempoLabel(200)).toBe('Prestissimo');
    expect(getTempoLabel(300)).toBe('Prestissimo');
  });

  it('代表的なBPMのテンポラベルを返す', () => {
    expect(getTempoLabel(72)).toBe('Adagio');
    expect(getTempoLabel(90)).toBe('Andante');
    expect(getTempoLabel(120)).toBe('Allegro');
    expect(getTempoLabel(160)).toBe('Vivace');
  });
});

describe('bpmToIntervalMs', () => {
  it('BPMが0以下の場合は0を返す', () => {
    expect(bpmToIntervalMs(0)).toBe(0);
    expect(bpmToIntervalMs(-10)).toBe(0);
  });

  it('120BPMは500msになる', () => {
    expect(bpmToIntervalMs(120)).toBe(500);
  });

  it('60BPMは1000msになる', () => {
    expect(bpmToIntervalMs(60)).toBe(1000);
  });

  it('240BPMは250msになる', () => {
    expect(bpmToIntervalMs(240)).toBe(250);
  });

  it('100BPMは600msになる', () => {
    expect(bpmToIntervalMs(100)).toBe(600);
  });

  it('整数に丸められる', () => {
    // 90BPM: 60000/90 = 666.666... → 667
    expect(bpmToIntervalMs(90)).toBe(667);
  });
});
