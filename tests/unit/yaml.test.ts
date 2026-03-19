import { describe, it, expect } from 'vitest';
import { formatYaml, minifyYaml, validateYaml } from '../../app/utils/yaml';

describe('YAML Utility Functions', () => {
  describe('formatYaml', () => {
    it('シンプルなオブジェクトを整形できる', () => {
      const input = 'name: 太郎\nage: 30';
      const result = formatYaml(input);
      expect(result).toContain('name: 太郎');
      expect(result).toContain('age: 30');
    });

    it('インデント2スペースで整形できる', () => {
      const input = 'config:\n  port: 3000\n  debug: true';
      const result = formatYaml(input, 2);
      expect(result).toContain('config:');
      expect(result).toContain('  port: 3000');
    });

    it('インデント4スペースで整形できる', () => {
      const input = 'config:\n  port: 3000';
      const result = formatYaml(input, 4);
      expect(result).toContain('config:');
      expect(result).toContain('    port: 3000');
    });

    it('キーのソートが機能する', () => {
      const input = 'z: last\na: first\nm: middle';
      const result = formatYaml(input, 2, true);
      const aIdx = result.indexOf('a:');
      const mIdx = result.indexOf('m:');
      const zIdx = result.indexOf('z:');
      expect(aIdx).toBeLessThan(mIdx);
      expect(mIdx).toBeLessThan(zIdx);
    });

    it('キーのソートなしでは元の順序を維持する', () => {
      const input = 'z: last\na: first';
      const result = formatYaml(input, 2, false);
      const zIdx = result.indexOf('z:');
      const aIdx = result.indexOf('a:');
      expect(zIdx).toBeLessThan(aIdx);
    });

    it('ネストされたオブジェクトを整形できる', () => {
      const input = 'user:\n  name: 太郎\n  address:\n    city: 東京';
      const result = formatYaml(input);
      expect(result).toContain('user:');
      expect(result).toContain('name: 太郎');
      expect(result).toContain('address:');
      expect(result).toContain('city: 東京');
    });

    it('配列を整形できる', () => {
      const input = 'items:\n  - apple\n  - banana';
      const result = formatYaml(input);
      expect(result).toContain('items:');
      expect(result).toContain('- apple');
      expect(result).toContain('- banana');
    });

    it('空文字列でエラーを投げる', () => {
      expect(() => formatYaml('')).toThrow('YAMLデータが空です');
    });

    it('空白のみでエラーを投げる', () => {
      expect(() => formatYaml('   ')).toThrow('YAMLデータが空です');
    });

    it('無効なYAMLでエラーを投げる', () => {
      expect(() => formatYaml(': invalid: yaml: {')).toThrow();
    });
  });

  describe('minifyYaml', () => {
    it('シンプルなYAMLを圧縮できる', () => {
      const input = 'name: 太郎\nage: 30';
      const result = minifyYaml(input);
      expect(result).not.toContain('\n');
      expect(result).toContain('name');
      expect(result).toContain('age');
    });

    it('フロースタイルで出力される', () => {
      const input = 'key: value';
      const result = minifyYaml(input);
      expect(result).toMatch(/\{.*\}/);
    });

    it('ネストされたオブジェクトを圧縮できる', () => {
      const input = 'user:\n  name: 太郎\n  age: 30';
      const result = minifyYaml(input);
      expect(result).not.toContain('\n');
      expect(result).toContain('user');
    });

    it('配列を含むYAMLを圧縮できる', () => {
      const input = 'items:\n  - apple\n  - banana';
      const result = minifyYaml(input);
      expect(result).not.toContain('\n');
      expect(result).toContain('items');
    });

    it('空文字列でエラーを投げる', () => {
      expect(() => minifyYaml('')).toThrow('YAMLデータが空です');
    });

    it('空白のみでエラーを投げる', () => {
      expect(() => minifyYaml('   ')).toThrow('YAMLデータが空です');
    });
  });

  describe('validateYaml', () => {
    it('有効なYAMLでtrueを返す', () => {
      const result = validateYaml('name: 太郎\nage: 30');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('有効なネストYAMLでtrueを返す', () => {
      const result = validateYaml('user:\n  name: 太郎\n  address:\n    city: 東京');
      expect(result.valid).toBe(true);
    });

    it('有効な配列YAMLでtrueを返す', () => {
      const result = validateYaml('items:\n  - apple\n  - banana');
      expect(result.valid).toBe(true);
    });

    it('空文字列でfalseを返す', () => {
      const result = validateYaml('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('空白のみでfalseを返す', () => {
      const result = validateYaml('   ');
      expect(result.valid).toBe(false);
    });

    it('無効なYAMLでfalseとエラーメッセージを返す', () => {
      const result = validateYaml(': invalid: yaml: {');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    it('nullコンテンツ(~)はこのツールでは空データとしてfalseを返す', () => {
      // YAMLの ~ はnullを表す有効な構文だが、このツールではnullを空データとして無効扱い
      const result = validateYaml('~');
      expect(result.valid).toBe(false);
    });
  });

  describe('ラウンドトリップ変換', () => {
    it('整形→再整形で同一結果が得られる', () => {
      const input = 'name: 太郎\nage: 30';
      const formatted = formatYaml(input);
      const reFormatted = formatYaml(formatted);
      expect(reFormatted).toBe(formatted);
    });

    it('圧縮後もvalidateがtrueを返す', () => {
      const input = 'user:\n  name: 太郎\n  age: 30';
      const minified = minifyYaml(input);
      const validateResult = validateYaml(minified);
      expect(validateResult.valid).toBe(true);
    });
  });
});
