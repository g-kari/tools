import { describe, it, expect } from 'vite-plus/test';
import {
  generatePrettierConfig,
  getDefaultValues,
  PRETTIER_CATEGORIES,
  PRETTIER_PRESETS,
} from '../../app/utils/prettier-config-builder';

describe('getDefaultValues', () => {
  it('全カテゴリのデフォルト値を返す', () => {
    const defaults = getDefaultValues();
    expect(typeof defaults).toBe('object');
    // 全オプションのキーが含まれること
    for (const category of PRETTIER_CATEGORIES) {
      for (const option of category.options) {
        expect(defaults).toHaveProperty(option.key);
        expect(defaults[option.key]).toBe(option.defaultValue);
      }
    }
  });

  it('printWidth のデフォルトは 80', () => {
    const defaults = getDefaultValues();
    expect(defaults.printWidth).toBe(80);
  });

  it('semi のデフォルトは true', () => {
    const defaults = getDefaultValues();
    expect(defaults.semi).toBe(true);
  });

  it('singleQuote のデフォルトは false', () => {
    const defaults = getDefaultValues();
    expect(defaults.singleQuote).toBe(false);
  });

  it('trailingComma のデフォルトは "all"', () => {
    const defaults = getDefaultValues();
    expect(defaults.trailingComma).toBe('all');
  });

  it('endOfLine のデフォルトは "lf"', () => {
    const defaults = getDefaultValues();
    expect(defaults.endOfLine).toBe('lf');
  });
});

describe('generatePrettierConfig', () => {
  it('デフォルト値のみの場合は空オブジェクトを返す', () => {
    const defaults = getDefaultValues();
    const output = generatePrettierConfig(defaults);
    expect(output).toBe('{}');
  });

  it('変更した値のみを出力する', () => {
    const defaults = getDefaultValues();
    const values = { ...defaults, semi: false, singleQuote: true };
    const output = generatePrettierConfig(values);
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toHaveProperty('semi', false);
    expect(parsed).toHaveProperty('singleQuote', true);
    expect(parsed).not.toHaveProperty('printWidth');
    expect(parsed).not.toHaveProperty('tabWidth');
  });

  it('有効な JSON を生成する', () => {
    const defaults = getDefaultValues();
    const values = { ...defaults, semi: false, printWidth: 100 };
    const output = generatePrettierConfig(values);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('数値型オプションを正しく出力する', () => {
    const defaults = getDefaultValues();
    const values = { ...defaults, printWidth: 120, tabWidth: 4 };
    const output = generatePrettierConfig(values);
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed.printWidth).toBe(120);
    expect(parsed.tabWidth).toBe(4);
  });

  it('enum オプションを正しく出力する', () => {
    const defaults = getDefaultValues();
    const values = { ...defaults, trailingComma: 'es5', arrowParens: 'avoid' };
    const output = generatePrettierConfig(values);
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed.trailingComma).toBe('es5');
    expect(parsed.arrowParens).toBe('avoid');
  });

  it('インデントは2スペース', () => {
    const defaults = getDefaultValues();
    const values = { ...defaults, semi: false };
    const output = generatePrettierConfig(values);
    // インデントは2スペースであること
    expect(output).toContain('  "semi"');
  });

  it('全オプションを変更した場合にすべて出力される', () => {
    const nonDefaultValues: Record<string, boolean | number | string> = {
      printWidth: 120,
      tabWidth: 4,
      useTabs: true,
      semi: false,
      singleQuote: true,
      jsxSingleQuote: true,
      quoteProps: 'consistent',
      trailingComma: 'none',
      bracketSpacing: false,
      bracketSameLine: true,
      arrowParens: 'avoid',
      endOfLine: 'crlf',
      proseWrap: 'always',
      htmlWhitespaceSensitivity: 'strict',
      singleAttributePerLine: true,
      embeddedLanguageFormatting: 'off',
    };
    const output = generatePrettierConfig(nonDefaultValues);
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(Object.keys(parsed).length).toBe(16);
  });
});

describe('PRETTIER_CATEGORIES', () => {
  it('カテゴリが存在する', () => {
    expect(PRETTIER_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('各カテゴリに id, label, icon, options がある', () => {
    for (const cat of PRETTIER_CATEGORIES) {
      expect(cat.id).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(Array.isArray(cat.options)).toBe(true);
      expect(cat.options.length).toBeGreaterThan(0);
    }
  });

  it('enum タイプのオプションには choices がある', () => {
    for (const cat of PRETTIER_CATEGORIES) {
      for (const opt of cat.options) {
        if (opt.type === 'enum') {
          expect(Array.isArray(opt.choices)).toBe(true);
          expect((opt.choices ?? []).length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('全オプションのデフォルト値が正しい型を持つ', () => {
    for (const cat of PRETTIER_CATEGORIES) {
      for (const opt of cat.options) {
        if (opt.type === 'boolean') {
          expect(typeof opt.defaultValue).toBe('boolean');
        } else if (opt.type === 'number') {
          expect(typeof opt.defaultValue).toBe('number');
        } else if (opt.type === 'enum') {
          expect(typeof opt.defaultValue).toBe('string');
          expect(opt.choices).toContain(opt.defaultValue);
        }
      }
    }
  });
});

describe('PRETTIER_PRESETS', () => {
  it('プリセットが存在する', () => {
    expect(PRETTIER_PRESETS.length).toBeGreaterThan(0);
  });

  it('各プリセットに id, label, description, values がある', () => {
    for (const preset of PRETTIER_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(typeof preset.values).toBe('object');
    }
  });

  it('デフォルトプリセットが存在する', () => {
    const defaultPreset = PRETTIER_PRESETS.find((p) => p.id === 'default');
    expect(defaultPreset).toBeDefined();
  });

  it('各プリセットの値が有効な Prettier オプションキーである', () => {
    const allKeys = new Set(
      PRETTIER_CATEGORIES.flatMap((cat) => cat.options.map((opt) => opt.key))
    );
    for (const preset of PRETTIER_PRESETS) {
      for (const key of Object.keys(preset.values)) {
        expect(allKeys.has(key)).toBe(true);
      }
    }
  });
});
