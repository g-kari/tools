import { describe, it, expect } from 'vitest';
import { parseUserAgent } from '../../app/utils/user-agent';

describe('parseUserAgent', () => {
  it('Chrome on Windowsを正しく解析する', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const result = parseUserAgent(ua);

    expect(result.browserName).toBe('Chrome');
    expect(result.browserVersion).toBe('120.0.0.0');
    expect(result.engineName).toBe('Blink');
    expect(result.osName).toBe('Windows');
    expect(result.osVersion).toBe('10/11');
    expect(result.deviceType).toBe('Desktop');
    expect(result.isMobile).toBe(false);
    expect(result.isTablet).toBe(false);
    expect(result.isBot).toBe(false);
  });

  it('Firefox on macOSを正しく解析する', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.2; rv:120.0) Gecko/20100101 Firefox/120.0';
    const result = parseUserAgent(ua);

    expect(result.browserName).toBe('Firefox');
    expect(result.browserVersion).toBe('120.0');
    expect(result.engineName).toBe('Gecko');
    expect(result.osName).toBe('macOS');
    expect(result.osVersion).toBe('14.2');
    expect(result.deviceType).toBe('Desktop');
    expect(result.isMobile).toBe(false);
    expect(result.isTablet).toBe(false);
    expect(result.isBot).toBe(false);
  });

  it('Safari on iPhoneを正しく解析する（Mobile判定）', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';
    const result = parseUserAgent(ua);

    expect(result.browserName).toBe('Safari');
    expect(result.osName).toBe('iOS');
    expect(result.osVersion).toBe('17.2');
    expect(result.deviceType).toBe('Mobile');
    expect(result.isMobile).toBe(true);
    expect(result.isTablet).toBe(false);
    expect(result.isBot).toBe(false);
  });

  it('Chrome on iPadを正しく解析する（Tablet判定）', () => {
    const ua = 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1';
    const result = parseUserAgent(ua);

    expect(result.osName).toBe('iOS');
    expect(result.deviceType).toBe('Tablet');
    expect(result.isTablet).toBe(true);
    expect(result.isMobile).toBe(false);
    expect(result.isBot).toBe(false);
  });

  it('Googlebotを正しく解析する（Bot判定）', () => {
    const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const result = parseUserAgent(ua);

    expect(result.deviceType).toBe('Bot');
    expect(result.isBot).toBe(true);
    expect(result.isMobile).toBe(false);
    expect(result.isTablet).toBe(false);
  });

  it('空文字列の解析ではすべてUnknownになる', () => {
    const result = parseUserAgent('');

    expect(result.browserName).toBe('Unknown');
    expect(result.browserVersion).toBe('Unknown');
    expect(result.engineName).toBe('Unknown');
    expect(result.osName).toBe('Unknown');
    expect(result.osVersion).toBe('Unknown');
    expect(result.deviceType).toBe('Unknown');
    expect(result.isMobile).toBe(false);
    expect(result.isTablet).toBe(false);
    expect(result.isBot).toBe(false);
  });

  it('Edgeブラウザを正しく解析する', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    const result = parseUserAgent(ua);

    expect(result.browserName).toBe('Edge');
    expect(result.browserVersion).toBe('120.0.0.0');
    expect(result.osName).toBe('Windows');
    expect(result.deviceType).toBe('Desktop');
  });

  it('Android Mobileを正しく解析する', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.193 Mobile Safari/537.36';
    const result = parseUserAgent(ua);

    expect(result.osName).toBe('Android');
    expect(result.osVersion).toBe('13');
    expect(result.deviceType).toBe('Mobile');
    expect(result.isMobile).toBe(true);
    expect(result.isTablet).toBe(false);
    expect(result.isBot).toBe(false);
  });

  it('curlをBot判定する', () => {
    const ua = 'curl/7.88.1';
    const result = parseUserAgent(ua);

    expect(result.isBot).toBe(true);
    expect(result.deviceType).toBe('Bot');
  });
});
