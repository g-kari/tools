import { describe, it, expect } from 'vitest';
import { formatTimestamp, parseJsonSafe, isValidWsUrl } from '../../app/routes/websocket';

describe('formatTimestamp', () => {
  it('HH:MM:SS.mmm形式にフォーマットする', () => {
    const date = new Date('2024-01-01T12:34:56.789Z');
    // タイムゾーンに依存するため、形式だけ確認
    const result = formatTimestamp(date);
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
  });

  it('1桁の時・分・秒・ミリ秒をゼロパディングする', () => {
    // UTCで0時0分0秒1ミリ秒を作成し、ローカル時刻での各フィールドがパディングされるか確認
    const date = new Date(2024, 0, 1, 1, 2, 3, 5);
    const result = formatTimestamp(date);
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}\.\d{3}$/);
    // ミリ秒は005になるはず
    const ms = result.split('.')[1];
    expect(ms).toBe('005');
  });
});

describe('parseJsonSafe', () => {
  it('有効なJSONを整形して返す', () => {
    const input = '{"key":"value","num":42}';
    const result = parseJsonSafe(input);
    expect(result).toContain('"key"');
    expect(result).toContain('"value"');
    expect(result).toContain('"num"');
    expect(result).toContain('42');
    // インデントされていること
    expect(result).toContain('\n');
  });

  it('無効なJSONはそのまま返す', () => {
    const input = 'Hello, WebSocket!';
    expect(parseJsonSafe(input)).toBe(input);
  });

  it('配列JSONも整形する', () => {
    const input = '[1,2,3]';
    const result = parseJsonSafe(input);
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('3');
  });

  it('空の文字列はそのまま返す', () => {
    expect(parseJsonSafe('')).toBe('');
  });

  it('ネストされたJSONを整形する', () => {
    const input = '{"a":{"b":{"c":1}}}';
    const result = parseJsonSafe(input);
    const parsed = JSON.parse(result);
    expect(parsed.a.b.c).toBe(1);
  });
});

describe('isValidWsUrl', () => {
  it('ws://URLを有効と判定する', () => {
    expect(isValidWsUrl('ws://localhost:8080')).toBe(true);
  });

  it('wss://URLを有効と判定する', () => {
    expect(isValidWsUrl('wss://echo.websocket.org')).toBe(true);
  });

  it('wss://パスなしURLを有効と判定する', () => {
    expect(isValidWsUrl('wss://example.com/path')).toBe(true);
  });

  it('http://URLを無効と判定する', () => {
    expect(isValidWsUrl('http://example.com')).toBe(false);
  });

  it('https://URLを無効と判定する', () => {
    expect(isValidWsUrl('https://example.com')).toBe(false);
  });

  it('空文字列を無効と判定する', () => {
    expect(isValidWsUrl('')).toBe(false);
  });

  it('不正なURLを無効と判定する', () => {
    expect(isValidWsUrl('not-a-url')).toBe(false);
  });

  it('プロトコルなしのURLを無効と判定する', () => {
    expect(isValidWsUrl('echo.websocket.org')).toBe(false);
  });

  it('ポート付きwss://URLを有効と判定する', () => {
    expect(isValidWsUrl('wss://localhost:9000/ws')).toBe(true);
  });
});
