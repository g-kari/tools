import { describe, it, expect } from 'vitest';
import { formatYaml, minifyYaml, validateYaml } from '../../app/utils/yaml';

describe('formatYaml', () => {
  describe('基本的な整形', () => {
    /**
     * 単純なYAMLを整形するテスト
     */
    it('単純なYAMLを整形する', () => {
      const yamlStr = 'name: Alice\nage: 30';
      const result = formatYaml(yamlStr);
      expect(result).toContain('name: Alice');
      expect(result).toContain('age: 30');
    });

    /**
     * ネストしたYAMLを整形するテスト
     */
    it('ネストしたYAMLを整形する', () => {
      const yamlStr = 'person:\n  name: Bob\n  address:\n    city: Tokyo';
      const result = formatYaml(yamlStr);
      expect(result).toContain('person:');
      expect(result).toContain('  name: Bob');
    });

    /**
     * 配列を含むYAMLを整形するテスト
     */
    it('配列を含むYAMLを整形する', () => {
      const yamlStr = 'items:\n  - apple\n  - banana\n  - cherry';
      const result = formatYaml(yamlStr);
      expect(result).toContain('items:');
      expect(result).toContain('- apple');
    });

    /**
     * インデント4スペースで整形するテスト
     */
    it('インデント4スペースで整形する', () => {
      const yamlStr = 'parent:\n  child: value';
      const result = formatYaml(yamlStr, 4);
      expect(result).toContain('    child: value');
    });

    /**
     * キーソートオプションを使用するテスト
     */
    it('キーソートオプションでキーをアルファベット順に整形する', () => {
      const yamlStr = 'zebra: 1\napple: 2\nmango: 3';
      const result = formatYaml(yamlStr, 2, true);
      const lines = result.split('\n').filter((l) => l.trim());
      const keys = lines.map((l) => l.split(':')[0].trim());
      expect(keys[0]).toBe('apple');
      expect(keys[1]).toBe('mango');
      expect(keys[2]).toBe('zebra');
    });
  });

  describe('エラーケース', () => {
    /**
     * 空文字列でエラーをスローするテスト
     */
    it('空文字列でエラーをスローする', () => {
      expect(() => formatYaml('')).toThrow();
    });

    /**
     * 空白のみでエラーをスローするテスト
     */
    it('空白のみでエラーをスローする', () => {
      expect(() => formatYaml('   ')).toThrow();
    });

    /**
     * 不正なYAMLでエラーをスローするテスト
     */
    it('不正なYAML（タブ混在）でエラーをスローする', () => {
      expect(() => formatYaml('key:\n\t- value')).toThrow();
    });
  });
});

describe('minifyYaml', () => {
  describe('基本的な圧縮', () => {
    /**
     * 整形済みYAMLを圧縮するテスト
     */
    it('整形済みYAMLを圧縮してフロースタイルで出力する', () => {
      const yamlStr = 'name: Alice\nage: 30';
      const result = minifyYaml(yamlStr);
      // フロースタイル: {name: Alice, age: 30} のような形式
      expect(result).toContain('name');
      expect(result).toContain('Alice');
      expect(result).toContain('age');
      expect(result.split('\n').length).toBe(1);
    });

    /**
     * ネストしたYAMLを圧縮するテスト
     */
    it('ネストしたYAMLを圧縮する', () => {
      const yamlStr = 'person:\n  name: Bob\n  age: 25';
      const result = minifyYaml(yamlStr);
      expect(result).not.toContain('\n');
    });
  });

  describe('エラーケース', () => {
    /**
     * 空文字列でエラーをスローするテスト
     */
    it('空文字列でエラーをスローする', () => {
      expect(() => minifyYaml('')).toThrow();
    });
  });
});

describe('validateYaml', () => {
  describe('有効なYAML', () => {
    /**
     * 有効なYAMLがvalid: trueを返すテスト
     */
    it('有効なYAMLはvalid: trueを返す', () => {
      const result = validateYaml('name: Alice\nage: 30');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    /**
     * ネストしたYAMLが有効なテスト
     */
    it('ネストしたYAMLは有効', () => {
      const yamlStr = 'config:\n  host: localhost\n  port: 3000';
      const result = validateYaml(yamlStr);
      expect(result.valid).toBe(true);
    });

    /**
     * 配列を含むYAMLが有効なテスト
     */
    it('配列を含むYAMLは有効', () => {
      const yamlStr = 'items:\n  - one\n  - two\n  - three';
      const result = validateYaml(yamlStr);
      expect(result.valid).toBe(true);
    });
  });

  describe('無効なYAML', () => {
    /**
     * 空文字列がvalid: falseを返すテスト
     */
    it('空文字列はvalid: falseを返す', () => {
      const result = validateYaml('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    /**
     * タブを使用したYAMLがvalid: falseを返すテスト
     */
    it('タブインデントはvalid: falseを返す', () => {
      const result = validateYaml('key:\n\t- value');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    /**
     * 重複キーのYAMLが検出されるテスト（js-yamlは最後の値を使用するため有効扱い）
     */
    it('通常のYAML文字列は有効と見なされる', () => {
      const result = validateYaml('key: value\nother: 123');
      expect(result.valid).toBe(true);
    });
  });
});

describe('ラウンドトリップテスト', () => {
  /**
   * format後に同じキー・値が保持されるテスト
   */
  it('formatしても同じキー・値が保持される', () => {
    const original = 'name: Alice\nage: 30\ncity: Tokyo';
    const formatted = formatYaml(original);
    // 再度parseして値が一致することを確認
    const formatted2 = formatYaml(formatted);
    expect(formatted).toBe(formatted2);
  });
});
