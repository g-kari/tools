import { describe, expect, it } from 'vitest';
import {
  encodeBadgeText,
  generateBadgeUrl,
  generateBadgeMarkdown,
  generateBadgeHtml,
  type BadgeConfig,
} from '../../app/utils/github-badge';

describe('encodeBadgeText', () => {
  it('スペースをアンダースコアに変換する', () => {
    expect(encodeBadgeText('hello world')).toBe('hello_world');
  });

  it('ハイフンをダブルハイフンに変換する', () => {
    expect(encodeBadgeText('hello-world')).toBe('hello--world');
  });

  it('アンダースコアをダブルアンダースコアに変換する', () => {
    expect(encodeBadgeText('hello_world')).toBe('hello__world');
  });

  it('通常のテキストはそのままURLエンコードされる', () => {
    expect(encodeBadgeText('passing')).toBe('passing');
  });

  it('日本語テキストをURLエンコードする', () => {
    const encoded = encodeBadgeText('テスト');
    expect(encoded).not.toBe('テスト');
    expect(encoded.length).toBeGreaterThan(0);
  });

  it('空文字列はそのまま返す', () => {
    expect(encodeBadgeText('')).toBe('');
  });
});

describe('generateBadgeUrl', () => {
  const baseConfig: BadgeConfig = {
    label: 'build',
    message: 'passing',
    color: 'brightgreen',
    style: 'flat',
  };

  it('shields.io のURLを生成する', () => {
    const url = generateBadgeUrl(baseConfig);
    expect(url).toContain('https://img.shields.io/badge/');
  });

  it('ラベルとメッセージと色がURLに含まれる', () => {
    const url = generateBadgeUrl(baseConfig);
    expect(url).toContain('build');
    expect(url).toContain('passing');
    expect(url).toContain('brightgreen');
  });

  it('ラベルが空の場合はメッセージと色のみのパスになる', () => {
    const config: BadgeConfig = { ...baseConfig, label: '' };
    const url = generateBadgeUrl(config);
    expect(url).toContain('https://img.shields.io/badge/passing-brightgreen');
  });

  it('デフォルトスタイル（flat）はクエリパラメータに含まれない', () => {
    const url = generateBadgeUrl(baseConfig);
    expect(url).not.toContain('style=flat');
  });

  it('flatでないスタイルはクエリパラメータに含まれる', () => {
    const config: BadgeConfig = { ...baseConfig, style: 'for-the-badge' };
    const url = generateBadgeUrl(config);
    expect(url).toContain('style=for-the-badge');
  });

  it('ロゴが指定された場合はクエリパラメータに含まれる', () => {
    const config: BadgeConfig = { ...baseConfig, logo: 'github' };
    const url = generateBadgeUrl(config);
    expect(url).toContain('logo=github');
  });

  it('ロゴカラーが指定された場合はクエリパラメータに含まれる', () => {
    const config: BadgeConfig = { ...baseConfig, logo: 'github', logoColor: 'white' };
    const url = generateBadgeUrl(config);
    expect(url).toContain('logoColor=white');
  });

  it('ラベルカラーが指定された場合はクエリパラメータに含まれる', () => {
    const config: BadgeConfig = { ...baseConfig, labelColor: 'grey' };
    const url = generateBadgeUrl(config);
    expect(url).toContain('labelColor=grey');
  });

  it('メッセージが空の場合は空文字列を返す', () => {
    const config: BadgeConfig = { ...baseConfig, message: '' };
    expect(generateBadgeUrl(config)).toBe('');
  });

  it('メッセージが空白のみの場合は空文字列を返す', () => {
    const config: BadgeConfig = { ...baseConfig, message: '   ' };
    expect(generateBadgeUrl(config)).toBe('');
  });

  it('ハイフンを含むメッセージを正しくエンコードする', () => {
    const config: BadgeConfig = { ...baseConfig, message: 'v1-0-0' };
    const url = generateBadgeUrl(config);
    expect(url).toContain('v1--0--0');
  });
});

describe('generateBadgeMarkdown', () => {
  const config: BadgeConfig = {
    label: 'build',
    message: 'passing',
    color: 'brightgreen',
    style: 'flat',
  };

  it('Markdown画像記法を生成する', () => {
    const md = generateBadgeMarkdown(config);
    expect(md).toMatch(/^!\[.*\]\(https:\/\/img\.shields\.io\/badge\/.*\)$/);
  });

  it('altテキストにラベルとメッセージが含まれる', () => {
    const md = generateBadgeMarkdown(config);
    expect(md).toContain('build: passing');
  });

  it('ラベルが空の場合はメッセージのみがaltテキストになる', () => {
    const noLabelConfig: BadgeConfig = { ...config, label: '' };
    const md = generateBadgeMarkdown(noLabelConfig);
    expect(md).toContain('![passing]');
  });

  it('リンクURLが指定された場合はリンク付きMarkdownを生成する', () => {
    const md = generateBadgeMarkdown(config, 'https://github.com');
    expect(md).toMatch(/^\[!\[.*\]\(.*\)\]\(https:\/\/github\.com\)$/);
  });

  it('メッセージが空の場合は空文字列を返す', () => {
    const emptyConfig: BadgeConfig = { ...config, message: '' };
    expect(generateBadgeMarkdown(emptyConfig)).toBe('');
  });
});

describe('generateBadgeHtml', () => {
  const config: BadgeConfig = {
    label: 'license',
    message: 'MIT',
    color: 'yellow',
    style: 'flat',
  };

  it('HTML img タグを生成する', () => {
    const html = generateBadgeHtml(config);
    expect(html).toContain('<img');
    expect(html).toContain('src=');
    expect(html).toContain('alt=');
  });

  it('src に shields.io のURLが含まれる', () => {
    const html = generateBadgeHtml(config);
    expect(html).toContain('https://img.shields.io/badge/');
  });

  it('altテキストにラベルとメッセージが含まれる', () => {
    const html = generateBadgeHtml(config);
    expect(html).toContain('license: MIT');
  });

  it('リンクURLが指定された場合はaタグでラップされる', () => {
    const html = generateBadgeHtml(config, 'https://opensource.org/licenses/MIT');
    expect(html).toContain('<a href="https://opensource.org/licenses/MIT">');
    expect(html).toContain('</a>');
  });

  it('メッセージが空の場合は空文字列を返す', () => {
    const emptyConfig: BadgeConfig = { ...config, message: '' };
    expect(generateBadgeHtml(emptyConfig)).toBe('');
  });
});
