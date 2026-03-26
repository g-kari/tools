import { describe, it, expect } from 'vitest';
import {
  getTemplates,
  getCategoryLabel,
  generateGitAttributesContent,
  CATEGORY_ORDER,
  type GitAttributesCategory,
} from '~/utils/gitattributes';

describe('getTemplates', () => {
  it('テンプレート一覧が空でない', () => {
    const templates = getTemplates();
    expect(templates.length).toBeGreaterThan(0);
  });

  it('各テンプレートにid・label・category・contentが存在する', () => {
    const templates = getTemplates();
    for (const t of templates) {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.content).toBeTruthy();
    }
  });

  it('IDが重複していない', () => {
    const templates = getTemplates();
    const ids = templates.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('全カテゴリのテンプレートが含まれる', () => {
    const templates = getTemplates();
    const categories = new Set(templates.map((t) => t.category));
    expect(categories.has('general')).toBe(true);
    expect(categories.has('language')).toBe(true);
    expect(categories.has('lfs')).toBe(true);
    expect(categories.has('linguist')).toBe(true);
  });

  it('auto-crlf テンプレートが存在する', () => {
    const templates = getTemplates();
    const t = templates.find((x) => x.id === 'auto-crlf');
    expect(t).toBeDefined();
    expect(t?.category).toBe('general');
    expect(t?.content).toContain('text=auto');
  });

  it('node テンプレートが存在する', () => {
    const templates = getTemplates();
    const t = templates.find((x) => x.id === 'node');
    expect(t).toBeDefined();
    expect(t?.category).toBe('language');
    expect(t?.content).toContain('*.ts');
  });

  it('lfs-images テンプレートが存在する', () => {
    const templates = getTemplates();
    const t = templates.find((x) => x.id === 'lfs-images');
    expect(t).toBeDefined();
    expect(t?.category).toBe('lfs');
    expect(t?.content).toContain('filter=lfs');
  });

  it('linguist-vendored テンプレートが存在する', () => {
    const templates = getTemplates();
    const t = templates.find((x) => x.id === 'linguist-vendored');
    expect(t).toBeDefined();
    expect(t?.category).toBe('linguist');
    expect(t?.content).toContain('linguist-vendored');
  });
});

describe('getCategoryLabel', () => {
  it('全カテゴリの日本語ラベルが返る', () => {
    const categories: GitAttributesCategory[] = ['general', 'language', 'lfs', 'linguist'];
    for (const cat of categories) {
      const label = getCategoryLabel(cat);
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    }
  });

  it('各カテゴリのラベルが正しい', () => {
    expect(getCategoryLabel('general')).toBe('汎用');
    expect(getCategoryLabel('language')).toBe('言語');
    expect(getCategoryLabel('lfs')).toBe('Git LFS');
    expect(getCategoryLabel('linguist')).toBe('GitHub Linguist');
  });
});

describe('CATEGORY_ORDER', () => {
  it('全カテゴリが含まれる', () => {
    expect(CATEGORY_ORDER).toContain('general');
    expect(CATEGORY_ORDER).toContain('language');
    expect(CATEGORY_ORDER).toContain('lfs');
    expect(CATEGORY_ORDER).toContain('linguist');
  });

  it('general が最初', () => {
    expect(CATEGORY_ORDER[0]).toBe('general');
  });
});

describe('generateGitAttributesContent', () => {
  it('空の配列を渡すと空文字を返す', () => {
    const result = generateGitAttributesContent([]);
    expect(result).toBe('');
  });

  it('存在しないIDを渡すと空文字を返す', () => {
    const result = generateGitAttributesContent(['nonexistent-id']);
    expect(result).toBe('');
  });

  it('auto-crlfを選択するとtext=autoが含まれる', () => {
    const result = generateGitAttributesContent(['auto-crlf']);
    expect(result).toContain('text=auto');
  });

  it('lfs-imagesを選択するとfilter=lfsが含まれる', () => {
    const result = generateGitAttributesContent(['lfs-images']);
    expect(result).toContain('filter=lfs');
    expect(result).toContain('*.png');
  });

  it('複数選択時は両方のコンテンツが含まれる', () => {
    const result = generateGitAttributesContent(['auto-crlf', 'node']);
    expect(result).toContain('text=auto');
    expect(result).toContain('*.ts');
  });

  it('生成結果はヘッダーコメントを含む', () => {
    const result = generateGitAttributesContent(['auto-crlf']);
    expect(result).toContain('# .gitattributes');
  });

  it('生成結果の末尾は改行で終わる', () => {
    const result = generateGitAttributesContent(['auto-crlf']);
    expect(result.endsWith('\n')).toBe(true);
  });

  it('linguist-vendored を選択すると linguist-vendored ルールが含まれる', () => {
    const result = generateGitAttributesContent(['linguist-vendored']);
    expect(result).toContain('linguist-vendored');
    expect(result).toContain('vendor/**');
  });

  it('export-ignore を選択すると export-ignore ルールが含まれる', () => {
    const result = generateGitAttributesContent(['export-ignore']);
    expect(result).toContain('export-ignore');
    expect(result).toContain('.gitattributes');
  });
});
