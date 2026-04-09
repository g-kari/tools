import { describe, it, expect } from 'vite-plus/test';
import {
  ESLINT_CATEGORIES,
  ESLINT_PRESETS,
  generateEslintConfig,
  generateInstallCommand,
  getConfigFileName,
  getDefaultValues,
} from '../../app/utils/eslint-config-builder';

describe('getDefaultValues', () => {
  it('全カテゴリのデフォルト値を返す', () => {
    const defaults = getDefaultValues();
    expect(defaults).toHaveProperty('configFormat', 'flat');
    expect(defaults).toHaveProperty('target', 'browser');
    expect(defaults).toHaveProperty('ecmaVersion', '2022');
    expect(defaults).toHaveProperty('enableTypeScript', true);
    expect(defaults).toHaveProperty('enableReact', false);
    expect(defaults).toHaveProperty('preferConst', 'error');
  });

  it('全オプションキーが含まれる', () => {
    const defaults = getDefaultValues();
    for (const category of ESLINT_CATEGORIES) {
      for (const option of category.options) {
        expect(defaults).toHaveProperty(option.key);
      }
    }
  });
});

describe('getConfigFileName', () => {
  it('flat 形式では eslint.config.js を返す', () => {
    expect(getConfigFileName({ configFormat: 'flat' })).toBe('eslint.config.js');
  });

  it('legacy 形式では .eslintrc.json を返す', () => {
    expect(getConfigFileName({ configFormat: 'legacy' })).toBe('.eslintrc.json');
  });
});

describe('generateEslintConfig - flat config', () => {
  it('基本的なフラット設定を生成する', () => {
    const values = {
      ...getDefaultValues(),
      enableTypeScript: false,
      enableReact: false,
    };
    const result = generateEslintConfig(values);
    expect(result).toContain('import js from "@eslint/js"');
    expect(result).toContain('export default [');
    expect(result).toContain('js.configs.recommended');
    expect(result).toContain('ignores');
  });

  it('TypeScript が有効な場合は tseslint を含む', () => {
    const values = {
      ...getDefaultValues(),
      enableTypeScript: true,
      tsStrictLevel: 'recommended',
    };
    const result = generateEslintConfig(values);
    expect(result).toContain('import tseslint from "typescript-eslint"');
    expect(result).toContain('tseslint.config(');
    expect(result).toContain('tseslint.configs.recommended');
  });

  it('TypeScript strict レベルに応じた設定を生成する', () => {
    const strictValues = { ...getDefaultValues(), enableTypeScript: true, tsStrictLevel: 'strict' };
    const strictResult = generateEslintConfig(strictValues);
    expect(strictResult).toContain('tseslint.configs.strict');

    const strictTypeCheckedValues = {
      ...getDefaultValues(),
      enableTypeScript: true,
      tsStrictLevel: 'strictTypeChecked',
    };
    const strictTypeCheckedResult = generateEslintConfig(strictTypeCheckedValues);
    expect(strictTypeCheckedResult).toContain('tseslint.configs.strictTypeChecked');
    expect(strictTypeCheckedResult).toContain('parserOptions');
    expect(strictTypeCheckedResult).toContain('project: true');
  });

  it('React が有効な場合は react プラグインを含む', () => {
    const values = {
      ...getDefaultValues(),
      enableReact: true,
      enableReactHooks: true,
    };
    const result = generateEslintConfig(values);
    expect(result).toContain('import reactPlugin from "eslint-plugin-react"');
    expect(result).toContain('import reactHooksPlugin from "eslint-plugin-react-hooks"');
    expect(result).toContain('react: reactPlugin');
    expect(result).toContain('"react-hooks": reactHooksPlugin');
  });

  it('ターゲットに応じた globals 設定を含む', () => {
    const browserValues = { ...getDefaultValues(), target: 'browser' };
    const browserResult = generateEslintConfig(browserValues);
    expect(browserResult).toContain('globals.browser');

    const nodeValues = { ...getDefaultValues(), target: 'node' };
    const nodeResult = generateEslintConfig(nodeValues);
    expect(nodeResult).toContain('globals.node');

    const bothValues = { ...getDefaultValues(), target: 'both' };
    const bothResult = generateEslintConfig(bothValues);
    expect(bothResult).toContain('globals.browser');
    expect(bothResult).toContain('globals.node');
  });

  it('品質ルールが含まれる', () => {
    const values = {
      ...getDefaultValues(),
      preferConst: 'error',
      noConsole: 'warn',
      eqeqeq: 'error',
      noDebugger: 'error',
    };
    const result = generateEslintConfig(values);
    expect(result).toContain('"prefer-const": "error"');
    expect(result).toContain('"no-console": "warn"');
    expect(result).toContain('eqeqeq: "error"');
    expect(result).toContain('"no-debugger": "error"');
  });

  it('TypeScript 有効時は no-unused-vars を off にして @typescript-eslint 版を使う', () => {
    const values = {
      ...getDefaultValues(),
      enableTypeScript: true,
      noUnusedVars: 'error',
    };
    const result = generateEslintConfig(values);
    expect(result).toContain('"no-unused-vars": "off"');
    expect(result).toContain('@typescript-eslint/no-unused-vars');
  });

  it('スタイルルールが有効な場合は含まれる', () => {
    const values = {
      ...getDefaultValues(),
      enableStyleRules: true,
      semi: 'always',
      quotes: 'single',
      indent: '2',
    };
    const result = generateEslintConfig(values);
    expect(result).toContain('semi:');
    expect(result).toContain('quotes:');
    expect(result).toContain('indent:');
  });

  it('スタイルルールが無効な場合は含まれない', () => {
    const values = { ...getDefaultValues(), enableStyleRules: false };
    const result = generateEslintConfig(values);
    expect(result).not.toContain('"semi"');
    expect(result).not.toContain('"quotes"');
  });

  it('ルールが off の場合は出力に含まれない', () => {
    const values = {
      ...getDefaultValues(),
      preferConst: 'off',
      noConsole: 'off',
    };
    const result = generateEslintConfig(values);
    expect(result).not.toContain('prefer-const');
    expect(result).not.toContain('no-console');
  });
});

describe('generateEslintConfig - legacy config', () => {
  it('基本的なレガシー設定を生成する（JSON形式）', () => {
    const values = {
      ...getDefaultValues(),
      configFormat: 'legacy',
      enableTypeScript: false,
    };
    const result = generateEslintConfig(values);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('env');
    expect(parsed).toHaveProperty('extends');
    expect(parsed.extends).toContain('eslint:recommended');
  });

  it('TypeScript が有効な場合はパーサーと拡張設定を含む', () => {
    const values = {
      ...getDefaultValues(),
      configFormat: 'legacy',
      enableTypeScript: true,
      tsStrictLevel: 'recommended',
    };
    const result = generateEslintConfig(values);
    const parsed = JSON.parse(result);
    expect(parsed.parser).toBe('@typescript-eslint/parser');
    expect(parsed.extends).toContain('plugin:@typescript-eslint/recommended');
    expect(parsed.plugins).toContain('@typescript-eslint');
  });

  it('React が有効な場合は react プラグインを含む', () => {
    const values = {
      ...getDefaultValues(),
      configFormat: 'legacy',
      enableReact: true,
      enableReactHooks: true,
    };
    const result = generateEslintConfig(values);
    const parsed = JSON.parse(result);
    expect(parsed.extends).toContain('plugin:react/recommended');
    expect(parsed.extends).toContain('plugin:react-hooks/recommended');
    expect(parsed.plugins).toContain('react');
  });

  it('ブラウザターゲットでは browser env が有効', () => {
    const values = { ...getDefaultValues(), configFormat: 'legacy', target: 'browser' };
    const parsed = JSON.parse(generateEslintConfig(values));
    expect(parsed.env.browser).toBe(true);
    expect(parsed.env.node).toBeUndefined();
  });

  it('Node.js ターゲットでは node env が有効', () => {
    const values = { ...getDefaultValues(), configFormat: 'legacy', target: 'node' };
    const parsed = JSON.parse(generateEslintConfig(values));
    expect(parsed.env.node).toBe(true);
    expect(parsed.env.browser).toBeUndefined();
  });

  it('both ターゲットでは browser と node の両方が有効', () => {
    const values = { ...getDefaultValues(), configFormat: 'legacy', target: 'both' };
    const parsed = JSON.parse(generateEslintConfig(values));
    expect(parsed.env.browser).toBe(true);
    expect(parsed.env.node).toBe(true);
  });

  it('有効な JSON 文字列を返す', () => {
    const values = { ...getDefaultValues(), configFormat: 'legacy' };
    const result = generateEslintConfig(values);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});

describe('generateInstallCommand', () => {
  it('フラット設定では @eslint/js と globals を含む', () => {
    const values = { ...getDefaultValues(), configFormat: 'flat', enableTypeScript: false };
    const cmd = generateInstallCommand(values);
    expect(cmd).toContain('eslint');
    expect(cmd).toContain('@eslint/js');
    expect(cmd).toContain('globals');
    expect(cmd).not.toContain('typescript-eslint');
  });

  it('TypeScript 有効時は typescript-eslint を含む（flat）', () => {
    const values = { ...getDefaultValues(), configFormat: 'flat', enableTypeScript: true };
    const cmd = generateInstallCommand(values);
    expect(cmd).toContain('typescript-eslint');
  });

  it('React 有効時は eslint-plugin-react を含む', () => {
    const values = { ...getDefaultValues(), configFormat: 'flat', enableReact: true };
    const cmd = generateInstallCommand(values);
    expect(cmd).toContain('eslint-plugin-react');
  });

  it('React Hooks 有効時は eslint-plugin-react-hooks を含む', () => {
    const values = { ...getDefaultValues(), configFormat: 'flat', enableReactHooks: true };
    const cmd = generateInstallCommand(values);
    expect(cmd).toContain('eslint-plugin-react-hooks');
  });

  it('レガシー設定では @typescript-eslint パッケージを含む', () => {
    const values = { ...getDefaultValues(), configFormat: 'legacy', enableTypeScript: true };
    const cmd = generateInstallCommand(values);
    expect(cmd).toContain('@typescript-eslint/parser');
    expect(cmd).toContain('@typescript-eslint/eslint-plugin');
    // flat config 専用の 'typescript-eslint' パッケージ（@ なし）は含まれない
    expect(cmd).not.toMatch(/ typescript-eslint(?![/-])/u);
  });

  it('npm install --save-dev で始まる', () => {
    const values = getDefaultValues();
    expect(generateInstallCommand(values)).toMatch(/^npm install --save-dev /);
  });
});

describe('ESLINT_CATEGORIES', () => {
  it('5つのカテゴリが存在する', () => {
    expect(ESLINT_CATEGORIES).toHaveLength(5);
  });

  it('各カテゴリに id・label・icon・options が存在する', () => {
    for (const cat of ESLINT_CATEGORIES) {
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('label');
      expect(cat).toHaveProperty('icon');
      expect(cat).toHaveProperty('options');
      expect(cat.options.length).toBeGreaterThan(0);
    }
  });

  it('各オプションに必須フィールドが存在する', () => {
    for (const cat of ESLINT_CATEGORIES) {
      for (const opt of cat.options) {
        expect(opt).toHaveProperty('key');
        expect(opt).toHaveProperty('description');
        expect(opt).toHaveProperty('type');
        expect(opt).toHaveProperty('defaultValue');
        if (opt.type === 'enum') {
          expect(opt.choices).toBeDefined();
          expect(opt.choices!.length).toBeGreaterThan(0);
          expect(opt.choices).toContain(opt.defaultValue);
        }
      }
    }
  });
});

describe('ESLINT_PRESETS', () => {
  it('5つのプリセットが存在する', () => {
    expect(ESLINT_PRESETS).toHaveLength(5);
  });

  it('各プリセットに id・label・description・values が存在する', () => {
    for (const preset of ESLINT_PRESETS) {
      expect(preset).toHaveProperty('id');
      expect(preset).toHaveProperty('label');
      expect(preset).toHaveProperty('description');
      expect(preset).toHaveProperty('values');
    }
  });

  it('各プリセットの values で設定ファイルが生成できる', () => {
    const defaults = getDefaultValues();
    for (const preset of ESLINT_PRESETS) {
      const values = { ...defaults, ...preset.values };
      expect(() => generateEslintConfig(values)).not.toThrow();
    }
  });
});
