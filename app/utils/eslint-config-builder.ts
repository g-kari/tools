/**
 * @fileoverview ESLint Config Builder のオプション定義とジェネレーター
 * ESLint オプションのカテゴリ別定義と設定ファイル生成を管理する
 */

/** オプションの型 */
export type EslintOptionType = 'boolean' | 'enum';

/** ルール値の型 */
export type RuleLevel = 'error' | 'warn' | 'off';

/**
 * ESLint オプションの定義
 */
export interface EslintOption {
  /** オプション名（内部キー） */
  key: string;
  /** オプションの説明 */
  description: string;
  /** 値の型 */
  type: EslintOptionType;
  /** デフォルト値 */
  defaultValue: boolean | string;
  /** enum の選択肢 */
  choices?: string[];
  /** このオプションの推奨ユースケース */
  recommended?: string[];
}

/**
 * ESLint オプションのカテゴリ
 */
export interface EslintCategory {
  /** カテゴリ識別子 */
  id: string;
  /** カテゴリ表示名 */
  label: string;
  /** カテゴリアイコン */
  icon: string;
  /** カテゴリに含まれるオプション */
  options: EslintOption[];
}

/**
 * プリセット定義
 */
export interface EslintPreset {
  /** プリセット識別子 */
  id: string;
  /** プリセット表示名 */
  label: string;
  /** プリセットの説明 */
  description: string;
  /** 設定値 */
  values: Record<string, boolean | string>;
}

/** ESLint オプションのカテゴリ一覧 */
export const ESLINT_CATEGORIES: EslintCategory[] = [
  {
    id: 'format',
    label: '設定形式',
    icon: '⚙️',
    options: [
      {
        key: 'configFormat',
        description:
          '設定ファイルの形式。flat: eslint.config.js（ESLint 9+）, legacy: .eslintrc.json（ESLint 8 以前）',
        type: 'enum',
        defaultValue: 'flat',
        choices: ['flat', 'legacy'],
        recommended: ['推奨: flat（ESLint 9 以降の標準）'],
      },
      {
        key: 'target',
        description: '実行環境。browser: ブラウザ, node: Node.js, both: 両方',
        type: 'enum',
        defaultValue: 'browser',
        choices: ['browser', 'node', 'both'],
      },
      {
        key: 'ecmaVersion',
        description: 'ECMAScript のバージョン。構文解析の基準となる',
        type: 'enum',
        defaultValue: '2022',
        choices: ['2020', '2021', '2022', '2023', '2024', 'latest'],
        recommended: ['推奨: 2022 以降'],
      },
      {
        key: 'sourceType',
        description: 'ソースコードの形式。module: ESM, commonjs: CJS, script: スクリプト',
        type: 'enum',
        defaultValue: 'module',
        choices: ['module', 'commonjs', 'script'],
      },
    ],
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    icon: '🔷',
    options: [
      {
        key: 'enableTypeScript',
        description: '@typescript-eslint プラグインを有効にする',
        type: 'boolean',
        defaultValue: true,
        recommended: ['TypeScript プロジェクト'],
      },
      {
        key: 'tsStrictLevel',
        description:
          'TypeScript ESLint の厳格度。recommended: 基本, strict: 厳しめ, strictTypeChecked: 型情報を使った最大レベル',
        type: 'enum',
        defaultValue: 'recommended',
        choices: ['recommended', 'strict', 'strictTypeChecked'],
        recommended: ['strict: 新規プロジェクトに推奨', 'strictTypeChecked: 最高精度（要 tsconfig）'],
      },
    ],
  },
  {
    id: 'react',
    label: 'React',
    icon: '⚛️',
    options: [
      {
        key: 'enableReact',
        description: 'React 向けルール (eslint-plugin-react) を有効にする',
        type: 'boolean',
        defaultValue: false,
        recommended: ['React プロジェクト'],
      },
      {
        key: 'enableReactHooks',
        description: 'React Hooks のルール (eslint-plugin-react-hooks) を有効にする',
        type: 'boolean',
        defaultValue: false,
        recommended: ['React Hooks 使用時は有効推奨'],
      },
    ],
  },
  {
    id: 'quality',
    label: 'コード品質',
    icon: '✅',
    options: [
      {
        key: 'preferConst',
        description: 'let の代わりに const を強制する (prefer-const)',
        type: 'enum',
        defaultValue: 'error',
        choices: ['error', 'warn', 'off'],
        recommended: ['推奨: error'],
      },
      {
        key: 'noConsole',
        description: 'console.log などの使用を警告または禁止する (no-console)',
        type: 'enum',
        defaultValue: 'warn',
        choices: ['error', 'warn', 'off'],
        recommended: ['推奨: warn（開発中に残さないよう警告）'],
      },
      {
        key: 'eqeqeq',
        description: '== / != の代わりに === / !== を強制する (eqeqeq)',
        type: 'enum',
        defaultValue: 'error',
        choices: ['error', 'warn', 'off'],
        recommended: ['推奨: error'],
      },
      {
        key: 'noUnusedVars',
        description: '未使用の変数をエラーまたは警告にする (no-unused-vars)',
        type: 'enum',
        defaultValue: 'error',
        choices: ['error', 'warn', 'off'],
        recommended: ['TypeScript 使用時は @typescript-eslint/no-unused-vars に委譲'],
      },
      {
        key: 'noDebugger',
        description: 'debugger 文の使用を禁止する (no-debugger)',
        type: 'enum',
        defaultValue: 'error',
        choices: ['error', 'warn', 'off'],
        recommended: ['推奨: error'],
      },
      {
        key: 'noUndef',
        description: '未定義の変数の使用を禁止する (no-undef)',
        type: 'enum',
        defaultValue: 'error',
        choices: ['error', 'warn', 'off'],
      },
    ],
  },
  {
    id: 'style',
    label: 'スタイル',
    icon: '🎨',
    options: [
      {
        key: 'enableStyleRules',
        description:
          'ESLint でスタイルルール（セミコロン・引用符・インデント）を設定する。Prettier を使う場合は無効を推奨',
        type: 'boolean',
        defaultValue: false,
        recommended: ['Prettier 未使用時のみ有効推奨'],
      },
      {
        key: 'semi',
        description: '文末セミコロンの有無 (semi)',
        type: 'enum',
        defaultValue: 'always',
        choices: ['always', 'never'],
      },
      {
        key: 'quotes',
        description: '文字列の引用符スタイル (quotes)',
        type: 'enum',
        defaultValue: 'single',
        choices: ['single', 'double', 'backtick'],
      },
      {
        key: 'indent',
        description: 'インデントのスペース数またはタブ (indent)',
        type: 'enum',
        defaultValue: '2',
        choices: ['2', '4', 'tab'],
      },
    ],
  },
];

/** プリセット一覧 */
export const ESLINT_PRESETS: EslintPreset[] = [
  {
    id: 'vanilla-js',
    label: 'JavaScript',
    description: 'シンプルな JavaScript プロジェクト向け',
    values: {
      configFormat: 'flat',
      target: 'browser',
      ecmaVersion: '2022',
      sourceType: 'module',
      enableTypeScript: false,
      tsStrictLevel: 'recommended',
      enableReact: false,
      enableReactHooks: false,
      preferConst: 'error',
      noConsole: 'warn',
      eqeqeq: 'error',
      noUnusedVars: 'error',
      noDebugger: 'error',
      noUndef: 'error',
      enableStyleRules: false,
      semi: 'always',
      quotes: 'single',
      indent: '2',
    },
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    description: 'TypeScript プロジェクト向け',
    values: {
      configFormat: 'flat',
      target: 'browser',
      ecmaVersion: '2022',
      sourceType: 'module',
      enableTypeScript: true,
      tsStrictLevel: 'recommended',
      enableReact: false,
      enableReactHooks: false,
      preferConst: 'error',
      noConsole: 'warn',
      eqeqeq: 'error',
      noUnusedVars: 'error',
      noDebugger: 'error',
      noUndef: 'off',
      enableStyleRules: false,
      semi: 'always',
      quotes: 'single',
      indent: '2',
    },
  },
  {
    id: 'react-ts',
    label: 'React + TypeScript',
    description: 'React + TypeScript プロジェクト向け',
    values: {
      configFormat: 'flat',
      target: 'browser',
      ecmaVersion: '2022',
      sourceType: 'module',
      enableTypeScript: true,
      tsStrictLevel: 'recommended',
      enableReact: true,
      enableReactHooks: true,
      preferConst: 'error',
      noConsole: 'warn',
      eqeqeq: 'error',
      noUnusedVars: 'error',
      noDebugger: 'error',
      noUndef: 'off',
      enableStyleRules: false,
      semi: 'always',
      quotes: 'single',
      indent: '2',
    },
  },
  {
    id: 'node-ts',
    label: 'Node.js + TypeScript',
    description: 'Node.js + TypeScript バックエンド向け',
    values: {
      configFormat: 'flat',
      target: 'node',
      ecmaVersion: '2022',
      sourceType: 'module',
      enableTypeScript: true,
      tsStrictLevel: 'strict',
      enableReact: false,
      enableReactHooks: false,
      preferConst: 'error',
      noConsole: 'off',
      eqeqeq: 'error',
      noUnusedVars: 'error',
      noDebugger: 'error',
      noUndef: 'off',
      enableStyleRules: false,
      semi: 'always',
      quotes: 'single',
      indent: '2',
    },
  },
  {
    id: 'legacy-ts',
    label: '.eslintrc（レガシー）',
    description: 'ESLint 8 以前の .eslintrc.json 形式',
    values: {
      configFormat: 'legacy',
      target: 'browser',
      ecmaVersion: '2022',
      sourceType: 'module',
      enableTypeScript: true,
      tsStrictLevel: 'recommended',
      enableReact: false,
      enableReactHooks: false,
      preferConst: 'error',
      noConsole: 'warn',
      eqeqeq: 'error',
      noUnusedVars: 'error',
      noDebugger: 'error',
      noUndef: 'off',
      enableStyleRules: false,
      semi: 'always',
      quotes: 'single',
      indent: '2',
    },
  },
];

/**
 * ESLint flat config (eslint.config.js) を生成する
 * @param values - 設定値のマップ
 * @returns eslint.config.js の文字列
 */
function generateFlatConfig(values: Record<string, boolean | string>): string {
  const enableTS = values['enableTypeScript'] === true;
  const enableReact = values['enableReact'] === true;
  const enableReactHooks = values['enableReactHooks'] === true;
  const tsLevel = values['tsStrictLevel'] as string;
  const target = values['target'] as string;
  const ecmaVersion = values['ecmaVersion'] as string;
  const sourceType = values['sourceType'] as string;
  const enableStyle = values['enableStyleRules'] === true;

  const lines: string[] = [];

  // imports
  lines.push('import js from "@eslint/js";');
  if (enableTS) {
    lines.push('import tseslint from "typescript-eslint";');
  }
  if (enableReact) {
    lines.push('import reactPlugin from "eslint-plugin-react";');
  }
  if (enableReactHooks) {
    lines.push('import reactHooksPlugin from "eslint-plugin-react-hooks";');
  }
  lines.push('');

  // globals import for target
  if (target !== 'both' && (target === 'browser' || target === 'node')) {
    lines.push('import globals from "globals";');
    lines.push('');
  } else if (target === 'both') {
    lines.push('import globals from "globals";');
    lines.push('');
  }

  // export default
  if (enableTS) {
    lines.push('export default tseslint.config(');
  } else {
    lines.push('export default [');
  }

  const indent = enableTS ? '  ' : '  ';

  lines.push(`${indent}{ ignores: ["dist", "node_modules"] },`);
  lines.push(`${indent}js.configs.recommended,`);

  if (enableTS) {
    if (tsLevel === 'recommended') {
      lines.push(`${indent}...tseslint.configs.recommended,`);
    } else if (tsLevel === 'strict') {
      lines.push(`${indent}...tseslint.configs.strict,`);
    } else if (tsLevel === 'strictTypeChecked') {
      lines.push(`${indent}...tseslint.configs.strictTypeChecked,`);
    }
  }

  // main config object
  const filePatterns = enableTS ? '["**/*.{js,jsx,ts,tsx}"]' : '["**/*.{js,jsx}"]';
  lines.push(`${indent}{`);
  lines.push(`${indent}  files: ${filePatterns},`);

  // plugins
  const plugins: string[] = [];
  if (enableReact) plugins.push('react: reactPlugin');
  if (enableReactHooks) plugins.push('"react-hooks": reactHooksPlugin');
  if (plugins.length > 0) {
    lines.push(`${indent}  plugins: {`);
    for (const p of plugins) {
      lines.push(`${indent}    ${p},`);
    }
    lines.push(`${indent}  },`);
  }

  // languageOptions
  lines.push(`${indent}  languageOptions: {`);
  lines.push(`${indent}    ecmaVersion: ${ecmaVersion === 'latest' ? '"latest"' : ecmaVersion},`);
  lines.push(`${indent}    sourceType: "${sourceType}",`);

  // globals
  const globalsEntries: string[] = [];
  if (target === 'browser') globalsEntries.push('...globals.browser');
  else if (target === 'node') globalsEntries.push('...globals.node');
  else if (target === 'both') {
    globalsEntries.push('...globals.browser');
    globalsEntries.push('...globals.node');
  }

  if (globalsEntries.length > 0) {
    lines.push(`${indent}    globals: {`);
    for (const g of globalsEntries) {
      lines.push(`${indent}      ${g},`);
    }
    lines.push(`${indent}    },`);
  }

  if (enableTS && tsLevel === 'strictTypeChecked') {
    lines.push(`${indent}    parserOptions: {`);
    lines.push(`${indent}      project: true,`);
    lines.push(`${indent}      tsconfigRootDir: import.meta.dirname,`);
    lines.push(`${indent}    },`);
  }

  lines.push(`${indent}  },`);

  // rules
  lines.push(`${indent}  rules: {`);

  if (enableReact) {
    lines.push(`${indent}    ...reactPlugin.configs.recommended.rules,`);
  }
  if (enableReactHooks) {
    lines.push(`${indent}    ...reactHooksPlugin.configs.recommended.rules,`);
  }

  // quality rules
  const preferConst = values['preferConst'] as string;
  const noConsole = values['noConsole'] as string;
  const eqeqeq = values['eqeqeq'] as string;
  const noUnusedVars = values['noUnusedVars'] as string;
  const noDebugger = values['noDebugger'] as string;
  const noUndef = values['noUndef'] as string;

  if (preferConst !== 'off') lines.push(`${indent}    "prefer-const": "${preferConst}",`);
  if (noConsole !== 'off') lines.push(`${indent}    "no-console": "${noConsole}",`);
  if (eqeqeq !== 'off') lines.push(`${indent}    eqeqeq: "${eqeqeq}",`);
  if (noDebugger !== 'off') lines.push(`${indent}    "no-debugger": "${noDebugger}",`);
  if (noUndef !== 'off') lines.push(`${indent}    "no-undef": "${noUndef}",`);

  // unused vars: when TS is enabled, delegate to @typescript-eslint
  if (noUnusedVars !== 'off') {
    if (enableTS) {
      lines.push(`${indent}    "no-unused-vars": "off",`);
      lines.push(
        `${indent}    "@typescript-eslint/no-unused-vars": ["${noUnusedVars}", { argsIgnorePattern: "^_" }],`
      );
    } else {
      lines.push(
        `${indent}    "no-unused-vars": ["${noUnusedVars}", { argsIgnorePattern: "^_" }],`
      );
    }
  }

  // style rules
  if (enableStyle) {
    const semi = values['semi'] as string;
    const quotes = values['quotes'] as string;
    const indentVal = values['indent'] as string;
    lines.push(
      `${indent}    semi: ["error", "${semi}"],`
    );
    lines.push(
      `${indent}    quotes: ["error", "${quotes}"],`
    );
    const indentArg = indentVal === 'tab' ? '"tab"' : parseInt(indentVal);
    lines.push(`${indent}    indent: ["error", ${indentArg}],`);
  }

  lines.push(`${indent}  },`);
  lines.push(`${indent}},`);

  if (enableTS) {
    lines.push(');');
  } else {
    lines.push('];');
  }

  return lines.join('\n');
}

/**
 * ESLint legacy config (.eslintrc.json) を生成する
 * @param values - 設定値のマップ
 * @returns .eslintrc.json の文字列
 */
function generateLegacyConfig(values: Record<string, boolean | string>): string {
  const enableTS = values['enableTypeScript'] === true;
  const enableReact = values['enableReact'] === true;
  const enableReactHooks = values['enableReactHooks'] === true;
  const tsLevel = values['tsStrictLevel'] as string;
  const target = values['target'] as string;
  const ecmaVersion = values['ecmaVersion'] as string;
  const sourceType = values['sourceType'] as string;
  const enableStyle = values['enableStyleRules'] === true;

  // env
  const env: Record<string, boolean> = {};
  if (target === 'browser' || target === 'both') env['browser'] = true;
  if (target === 'node' || target === 'both') env['node'] = true;
  const ecmaKey = ecmaVersion === 'latest' ? 'es2024' : `es${ecmaVersion}`;
  env[ecmaKey] = true;

  // extends
  const extendsArr: string[] = ['eslint:recommended'];
  if (enableTS) {
    extendsArr.push(`plugin:@typescript-eslint/${tsLevel}`);
  }
  if (enableReact) {
    extendsArr.push('plugin:react/recommended');
  }
  if (enableReactHooks) {
    extendsArr.push('plugin:react-hooks/recommended');
  }

  // plugins
  const plugins: string[] = [];
  if (enableTS) plugins.push('@typescript-eslint');
  if (enableReact) plugins.push('react');
  if (enableReactHooks) plugins.push('react-hooks');

  // parserOptions
  const parserOptions: Record<string, string | Record<string, boolean>> = {
    ecmaVersion: ecmaVersion === 'latest' ? 'latest' : ecmaVersion,
    sourceType,
  };
  if (enableReact) {
    parserOptions['ecmaFeatures'] = { jsx: true };
  }

  // rules
  const rules: Record<string, string | unknown[]> = {};

  const preferConst = values['preferConst'] as string;
  const noConsole = values['noConsole'] as string;
  const eqeqeq = values['eqeqeq'] as string;
  const noUnusedVars = values['noUnusedVars'] as string;
  const noDebugger = values['noDebugger'] as string;
  const noUndef = values['noUndef'] as string;

  if (preferConst !== 'off') rules['prefer-const'] = preferConst;
  if (noConsole !== 'off') rules['no-console'] = noConsole;
  if (eqeqeq !== 'off') rules['eqeqeq'] = eqeqeq;
  if (noDebugger !== 'off') rules['no-debugger'] = noDebugger;
  if (noUndef !== 'off') rules['no-undef'] = noUndef;

  if (noUnusedVars !== 'off') {
    if (enableTS) {
      rules['no-unused-vars'] = 'off';
      rules['@typescript-eslint/no-unused-vars'] = [noUnusedVars, { argsIgnorePattern: '^_' }];
    } else {
      rules['no-unused-vars'] = [noUnusedVars, { argsIgnorePattern: '^_' }];
    }
  }

  if (enableStyle) {
    const semi = values['semi'] as string;
    const quotes = values['quotes'] as string;
    const indentVal = values['indent'] as string;
    rules['semi'] = ['error', semi];
    rules['quotes'] = ['error', quotes];
    rules['indent'] = ['error', indentVal === 'tab' ? 'tab' : parseInt(indentVal)];
  }

  // build config object
  const config: Record<string, unknown> = { env };
  if (extendsArr.length > 0) config['extends'] = extendsArr;
  if (enableTS) config['parser'] = '@typescript-eslint/parser';
  config['parserOptions'] = parserOptions;
  if (plugins.length > 0) config['plugins'] = plugins;
  if (Object.keys(rules).length > 0) config['rules'] = rules;

  return JSON.stringify(config, null, 2);
}

/**
 * ESLint 設定ファイルの文字列を生成する
 * @param values - 設定値のマップ
 * @returns 設定ファイルの文字列
 */
export function generateEslintConfig(values: Record<string, boolean | string>): string {
  if (values['configFormat'] === 'legacy') {
    return generateLegacyConfig(values);
  }
  return generateFlatConfig(values);
}

/**
 * 設定フォーマットに基づいたファイル名を返す
 * @param values - 設定値のマップ
 * @returns ファイル名
 */
export function getConfigFileName(values: Record<string, boolean | string>): string {
  return values['configFormat'] === 'legacy' ? '.eslintrc.json' : 'eslint.config.js';
}

/**
 * 必要なパッケージのインストールコマンドを生成する
 * @param values - 設定値のマップ
 * @returns npm install コマンド文字列
 */
export function generateInstallCommand(values: Record<string, boolean | string>): string {
  const packages: string[] = ['eslint'];
  const enableTS = values['enableTypeScript'] === true;
  const enableReact = values['enableReact'] === true;
  const enableReactHooks = values['enableReactHooks'] === true;
  const configFormat = values['configFormat'] as string;

  if (configFormat === 'flat') {
    packages.push('@eslint/js');
    packages.push('globals');
    if (enableTS) packages.push('typescript-eslint');
    if (enableReact) packages.push('eslint-plugin-react');
    if (enableReactHooks) packages.push('eslint-plugin-react-hooks');
  } else {
    if (enableTS) {
      packages.push('@typescript-eslint/parser');
      packages.push('@typescript-eslint/eslint-plugin');
    }
    if (enableReact) packages.push('eslint-plugin-react');
    if (enableReactHooks) packages.push('eslint-plugin-react-hooks');
  }

  return `npm install --save-dev ${packages.join(' ')}`;
}

/**
 * 全カテゴリのデフォルト値を収集して初期状態を返す
 * @returns 初期値マップ
 */
export function getDefaultValues(): Record<string, boolean | string> {
  const defaults: Record<string, boolean | string> = {};
  for (const category of ESLINT_CATEGORIES) {
    for (const option of category.options) {
      defaults[option.key] = option.defaultValue;
    }
  }
  return defaults;
}
