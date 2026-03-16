import { describe, it, expect } from 'vitest';
import { formatToml, minifyToml, validateToml } from '../../app/utils/toml-formatter';

describe('formatToml', () => {
  describe('基本的な整形', () => {
    /**
     * 単純なTOMLを整形するテスト
     */
    it('単純なTOMLを整形する', () => {
      const tomlStr = 'name = "Alice"\nage = 30';
      const result = formatToml(tomlStr);
      expect(result).toContain('name');
      expect(result).toContain('Alice');
      expect(result).toContain('age');
    });

    /**
     * セクションを含むTOMLを整形するテスト
     */
    it('セクションを含むTOMLを整形する', () => {
      const tomlStr = '[package]\nname = "my-app"\nversion = "1.0.0"';
      const result = formatToml(tomlStr);
      expect(result).toContain('[package]');
      expect(result).toContain('name');
      expect(result).toContain('my-app');
    });

    /**
     * 配列を含むTOMLを整形するテスト
     */
    it('配列を含むTOMLを整形する', () => {
      const tomlStr = 'items = ["apple", "banana", "cherry"]';
      const result = formatToml(tomlStr);
      expect(result).toContain('items');
      expect(result).toContain('apple');
    });

    /**
     * インラインテーブルを含むTOMLを整形するテスト
     */
    it('インラインテーブルを含むTOMLを整形する', () => {
      const tomlStr = 'serde = { version = "1.0", features = ["derive"] }';
      const result = formatToml(tomlStr);
      expect(result).toContain('serde');
      expect(result).toContain('1.0');
    });
  });

  describe('エラーケース', () => {
    /**
     * 空文字列でエラーをスローするテスト
     */
    it('空文字列でエラーをスローする', () => {
      expect(() => formatToml('')).toThrow();
    });

    /**
     * 空白のみでエラーをスローするテスト
     */
    it('空白のみでエラーをスローする', () => {
      expect(() => formatToml('   ')).toThrow();
    });

    /**
     * 不正なTOMLでエラーをスローするテスト
     */
    it('不正なTOML（構文エラー）でエラーをスローする', () => {
      expect(() => formatToml('key = @invalid')).toThrow();
    });
  });
});

describe('minifyToml', () => {
  describe('基本的な圧縮', () => {
    /**
     * 空白行を除去するテスト
     */
    it('セクション間の空白行を除去する', () => {
      const tomlStr = '[a]\nx = 1\n\n[b]\ny = 2';
      const result = minifyToml(tomlStr);
      expect(result.split('\n').every((line) => line.trim() !== '')).toBe(true);
    });

    /**
     * 圧縮後もキーと値が保持されるテスト
     */
    it('圧縮後もキーと値が保持される', () => {
      const tomlStr = '[package]\nname = "my-app"\n\nversion = "1.0.0"';
      const result = minifyToml(tomlStr);
      expect(result).toContain('name');
      expect(result).toContain('my-app');
      expect(result).toContain('version');
    });
  });

  describe('エラーケース', () => {
    /**
     * 空文字列でエラーをスローするテスト
     */
    it('空文字列でエラーをスローする', () => {
      expect(() => minifyToml('')).toThrow();
    });

    /**
     * 不正なTOMLでエラーをスローするテスト
     */
    it('不正なTOMLでエラーをスローする', () => {
      expect(() => minifyToml('key = @invalid')).toThrow();
    });
  });
});

describe('validateToml', () => {
  describe('有効なTOML', () => {
    /**
     * 有効なTOMLがvalid: trueを返すテスト
     */
    it('有効なTOMLはvalid: trueを返す', () => {
      const result = validateToml('name = "Alice"\nage = 30');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    /**
     * セクションを含むTOMLが有効なテスト
     */
    it('セクションを含むTOMLは有効', () => {
      const tomlStr = '[package]\nname = "my-app"\nversion = "1.0.0"';
      const result = validateToml(tomlStr);
      expect(result.valid).toBe(true);
    });

    /**
     * 配列を含むTOMLが有効なテスト
     */
    it('配列を含むTOMLは有効', () => {
      const tomlStr = 'items = ["one", "two", "three"]';
      const result = validateToml(tomlStr);
      expect(result.valid).toBe(true);
    });

    /**
     * 複数セクションのTOMLが有効なテスト
     */
    it('複数セクションのTOMLは有効', () => {
      const tomlStr =
        '[package]\nname = "app"\n\n[dependencies]\ntokio = "1.0"';
      const result = validateToml(tomlStr);
      expect(result.valid).toBe(true);
    });
  });

  describe('無効なTOML', () => {
    /**
     * 空文字列がvalid: falseを返すテスト
     */
    it('空文字列はvalid: falseを返す', () => {
      const result = validateToml('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    /**
     * 不正な構文がvalid: falseを返すテスト
     */
    it('不正な構文はvalid: falseを返す', () => {
      const result = validateToml('key = @invalid');
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    /**
     * クォートされていない文字列がvalid: falseを返すテスト
     */
    it('未クォートの不正な値はvalid: falseを返す', () => {
      const result = validateToml('name = unquoted string with spaces');
      expect(result.valid).toBe(false);
    });
  });
});

describe('ラウンドトリップテスト', () => {
  /**
   * formatTomlが冪等であるテスト
   */
  it('formatTomlは冪等（同じ結果を2回呼び出しても変わらない）', () => {
    const original = '[package]\nname = "my-app"\nversion = "1.0.0"';
    const formatted1 = formatToml(original);
    const formatted2 = formatToml(formatted1);
    expect(formatted1).toBe(formatted2);
  });
});
